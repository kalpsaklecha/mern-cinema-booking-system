import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' },
  genre: [{ type: String, trim: true }],
  language: { type: String, default: 'Hindi' },
  durationMinutes: { type: Number, min: 1, required: true },
  rating: { type: Number, min: 0, max: 10, default: 0 },
  posterUrl: { type: String, default: '' },
  releaseDate: { type: Date }
}, { timestamps: true });

// language_override: 'none' prevents MongoDB text search from treating the movie's language field as a language stemmer
movieSchema.index({ title: 'text', description: 'text' }, { language_override: 'none' });
movieSchema.index({ genre: 1, language: 1 });

export default mongoose.model('Movie', movieSchema);
