import { Router } from 'express';
import mongoose from 'mongoose';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/shows - list shows (filters: movieId, city, all=true)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.movieId && mongoose.isValidObjectId(req.query.movieId)) filter.movie = req.query.movieId;
    if (req.query.city) filter.city = new RegExp(`^${String(req.query.city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (!req.query.all) {
      filter.startsAt = { $gte: new Date() };
    }
    const shows = await Show.find(filter)
      .populate('movie', 'title posterUrl language durationMinutes genre rating')
      .sort({ startsAt: 1 })
      .limit(100);
    res.json(shows);
  } catch (e) { next(e); }
});

// GET /api/shows/:id/seats - seat status for a show
router.get('/:id/seats', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid show id' });
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title posterUrl language durationMinutes rating')
      .select('seats price startsAt theatreName city movie');
    if (!show) return res.status(404).json({ message: 'Show not found' });
    res.json(show);
  } catch (e) { next(e); }
});

// POST /api/shows - create a new show (admin only)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    let { movie, theatreName, city, startsAt, price, seatCodes, rows = 6, seatsPerRow = 8 } = req.body;
    if (!mongoose.isValidObjectId(movie) || !await Movie.exists({ _id: movie }) || !theatreName?.trim() || !city?.trim() ||
        !startsAt || !Number.isFinite(new Date(startsAt).getTime()) || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Please provide valid movie, theatre, city, date/time and price' });
    }

    // Auto-generate seat codes if not manually specified
    if (!seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const rCount = Math.min(rowLetters.length, Math.max(1, Number(rows) || 6));
      const cCount = Math.min(12, Math.max(1, Number(seatsPerRow) || 8));
      seatCodes = [];
      for (let r = 0; r < rCount; r++) {
        for (let c = 1; c <= cCount; c++) {
          seatCodes.push(`${rowLetters[r]}${c}`);
        }
      }
    }

    if (seatCodes.length < 1 || seatCodes.length > 300 ||
        seatCodes.some(s => typeof s !== 'string' || !/^[A-Z]{1,2}[0-9]{1,2}$/.test(s)) ||
        new Set(seatCodes).size !== seatCodes.length) {
      return res.status(400).json({ message: 'Invalid seat layout configuration' });
    }

    const show = await Show.create({
      movie,
      theatreName: theatreName.trim(),
      city: city.trim(),
      startsAt: new Date(startsAt),
      price: Number(price),
      seats: seatCodes.map(code => ({ code, status: 'available' }))
    });
    const populated = await show.populate('movie', 'title posterUrl');
    res.status(201).json(populated);
  } catch (e) { next(e); }
});

// DELETE /api/shows/:id - delete a show (admin only)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid show id' });
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: 'Show not found' });
    res.json({ message: 'Show deleted successfully' });
  } catch (e) { next(e); }
});

export default router;
