import { Router } from 'express';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import { protect, adminOnly } from '../middleware/auth.js';
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const filter = {};
    if (req.query.genre) filter.genre = req.query.genre;
    if (req.query.language) filter.language = req.query.language;
    if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
    const [movies, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Movie.countDocuments(filter)
    ]);
    res.json({ movies, page, pages: Math.ceil(total / limit), total });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid movie id' });
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (e) { next(e); }
});
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { title, durationMinutes } = req.body;
    if (!title?.trim() || !Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) < 1)
      return res.status(400).json({ message: 'Title and positive durationMinutes are required' });
    res.status(201).json(await Movie.create({ ...req.body, title: title.trim(), durationMinutes: Number(durationMinutes) }));
  } catch (e) { next(e); }
});
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid movie id' });
    const allowed = ['title','description','genre','language','durationMinutes','rating','posterUrl','releaseDate'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const movie = await Movie.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (e) { next(e); }
});
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (e) { next(e); }
});
export default router;
