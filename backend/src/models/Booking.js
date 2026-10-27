import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  movieTitle: { type: String, required: true },
  theatreName: { type: String, required: true },
  showStartsAt: { type: Date, required: true },
  seats: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['simulated-paid', 'refunded-demo'], default: 'simulated-paid' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });
bookingSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Booking', bookingSchema);
