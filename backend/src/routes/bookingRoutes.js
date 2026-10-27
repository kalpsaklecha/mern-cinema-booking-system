import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { io } from '../../server.js';

const router = Router();

// POST /api/bookings - create a booking (logged-in user)
router.post('/', protect, async (req, res, next) => {
  let lockedShow = null;
  let selectedSeats = [];
  try {
    const { showId, seats } = req.body;
    if (!mongoose.isValidObjectId(showId) || !Array.isArray(seats) || !seats.length || seats.length > 10 ||
        seats.some(s => typeof s !== 'string') || new Set(seats).size !== seats.length)
      return res.status(400).json({ message: 'Provide a showId and 1–10 unique seat codes' });

    // Atomic conditional update prevents double booking race conditions
    const show = await Show.findOneAndUpdate(
      { _id: showId, startsAt: { $gt: new Date() }, seats: { $all: seats.map(code => ({ $elemMatch: { code, status: 'available' } })) } },
      { $set: Object.fromEntries(seats.map(code => [`seats.$[seat${seats.indexOf(code)}].status`, 'booked'])) },
      { new: true, arrayFilters: seats.map((code, i) => ({ [`seat${i}.code`]: code, [`seat${i}.status`]: 'available' })) }
    );
    if (!show) return res.status(409).json({ message: 'Show unavailable or one or more seats are already booked' });
    lockedShow = show;
    selectedSeats = seats;
    const populated = await show.populate('movie', 'title');
    const booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      movieTitle: populated.movie?.title || 'Movie',
      theatreName: show.theatreName,
      showStartsAt: show.startsAt,
      seats,
      totalAmount: show.price * seats.length,
      paymentStatus: 'simulated-paid',
      status: 'confirmed'
    });

    // Real-time broadcast to all viewers in this show's room
    io.to(`show:${show._id}`).emit('seats-updated', { showId: String(show._id), seats: show.seats });
    res.status(201).json({ booking, note: 'Demo payment simulated; no money was charged.' });
  } catch (e) {
    // Rollback seat status if booking document creation fails
    if (lockedShow && selectedSeats.length) {
      await Show.updateOne({ _id: lockedShow._id }, { $set: Object.fromEntries(selectedSeats.map(code => [`seats.$[seat${selectedSeats.indexOf(code)}].status`, 'available'])) },
        { arrayFilters: selectedSeats.map((code, i) => ({ [`seat${i}.code`]: code, [`seat${i}.status`]: 'booked' })) }).catch(() => {});
    }
    next(e);
  }
});

// GET /api/bookings/my - list current user's bookings
router.get('/my', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json(bookings);
  } catch (e) { next(e); }
});

// GET /api/bookings/all - list all bookings and analytics (admin only)
router.get('/all', protect, adminOnly, async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);

    res.json({
      bookings,
      stats: {
        totalBookings: bookings.length,
        confirmedCount: confirmedBookings.length,
        cancelledCount: cancelledBookings.length,
        totalRevenue,
        totalTicketsSold
      }
    });
  } catch (e) { next(e); }
});

// PATCH /api/bookings/:id/cancel - cancel booking & release seats
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    // Admins can cancel any booking; normal users can only cancel their own
    const query = { _id: req.params.id, status: 'confirmed' };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }
    const booking = await Booking.findOne(query);
    if (!booking) return res.status(404).json({ message: 'Confirmed booking not found' });
    if (booking.showStartsAt <= new Date()) return res.status(400).json({ message: 'Past shows cannot be cancelled' });

    const show = await Show.findById(booking.show);
    if (show) {
      await Show.updateOne(
        { _id: show._id },
        { $set: Object.fromEntries(booking.seats.map(code => [`seats.$[seat${booking.seats.indexOf(code)}].status`, 'available'])) },
        { arrayFilters: booking.seats.map((code, i) => ({ [`seat${i}.code`]: code, [`seat${i}.status`]: 'booked' })) }
      );
      // Real-time broadcast updated seats to all connected viewers
      const updatedShow = await Show.findById(show._id);
      io.to(`show:${show._id}`).emit('seats-updated', { showId: String(show._id), seats: updatedShow?.seats });
    }
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded-demo';
    await booking.save();
    res.json({ booking, message: 'Booking cancelled successfully; simulated refund processed.' });
  } catch (e) { next(e); }
});

export default router;
