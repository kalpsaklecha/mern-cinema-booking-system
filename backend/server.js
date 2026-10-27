import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from './src/routes/authRoutes.js';
import movieRoutes from './src/routes/movieRoutes.js';
import showRoutes from './src/routes/showRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration allowing any localhost port (5173, 5174, 5175, etc.) and CLIENT_URL
const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
    return callback(null, true);
  }
  return callback(null, true); // Permissive for local development
};

export const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: corsOriginCheck,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiter for API
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false
}));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'iMovies Cinema API',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 Handler
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Real-time socket connections for live seat synchronization
io.on('connection', socket => {
  socket.on('join-show', showId => {
    socket.join(`show:${showId}`);
  });
  socket.on('leave-show', showId => {
    socket.leave(`show:${showId}`);
  });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    server.listen(port, () => console.log(`🚀 iMovies Backend running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:');
    console.error(err.message);
    console.log('\n💡 Tip: Make sure MongoDB is running locally or check MONGO_URI in backend/.env\n');
    process.exit(1);
  });
