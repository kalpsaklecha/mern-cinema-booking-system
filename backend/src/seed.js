import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

const moviesData = [
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Biography', 'Drama', 'History'],
    language: 'English',
    durationMinutes: 180,
    rating: 8.9,
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2023-07-21')
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'English',
    durationMinutes: 166,
    rating: 8.6,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2024-03-01')
  },
  {
    title: 'Interstellar',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked with piloting a spacecraft along with a team of researchers.',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    language: 'English',
    durationMinutes: 169,
    rating: 8.7,
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2014-11-07')
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'English',
    durationMinutes: 148,
    rating: 8.8,
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2010-07-16')
  },
  {
    title: 'Jawan',
    description: 'A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society.',
    genre: ['Action', 'Thriller'],
    language: 'Hindi',
    durationMinutes: 169,
    rating: 8.1,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2023-09-07')
  },
  {
    title: 'RRR',
    description: 'A fearless revolutionary and an officer in the British force, who once were in deep friendship, decide to join forces to chart out a path towards freedom.',
    genre: ['Action', 'Drama'],
    language: 'Hindi',
    durationMinutes: 187,
    rating: 8.8,
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2022-03-25')
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    genre: ['Animation', 'Action', 'Adventure'],
    language: 'English',
    durationMinutes: 140,
    rating: 8.7,
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2023-06-02')
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.',
    genre: ['Action', 'Crime', 'Drama'],
    language: 'English',
    durationMinutes: 152,
    rating: 9.0,
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=80',
    releaseDate: new Date('2008-07-18')
  }
];

function generateSeatGrid(bookedCodes = []) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seats = [];
  for (const r of rows) {
    for (let c = 1; c <= 8; c++) {
      const code = `${r}${c}`;
      seats.push({
        code,
        status: bookedCodes.includes(code) ? 'booked' : 'available'
      });
    }
  }
  return seats;
}

async function seed() {
  try {
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    console.log('🧹 Cleaning existing data and indexes...');
    try {
      await Movie.collection.dropIndexes();
    } catch (_) {}
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({})
    ]);
    await Movie.syncIndexes();

    console.log('👤 Creating users...');
    const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);
    const userPasswordHash = await bcrypt.hash('User@12345', 12);

    const admin = await User.create({
      name: 'Admin Cinema Manager',
      email: 'admin@imovies.com',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'user@imovies.com',
      passwordHash: userPasswordHash,
      role: 'user'
    });

    console.log('🎬 Creating movies...');
    const createdMovies = await Movie.insertMany(moviesData);

    console.log('🎟️ Creating shows and seat layouts...');
    const now = new Date();
    const showsToInsert = [];

    const theatres = [
      { name: 'PVR ICON Cinemas, Audi 1', city: 'Mumbai', price: 350 },
      { name: 'INOX Megaplex Laser IMAX', city: 'Mumbai', price: 450 },
      { name: 'PVR Director\'s Cut', city: 'Delhi', price: 400 },
      { name: 'Cinepolis IMAX', city: 'Bengaluru', price: 380 }
    ];

    let showIndex = 0;
    for (const movie of createdMovies) {
      // 2 shows per movie with upcoming timings
      const theatre1 = theatres[showIndex % theatres.length];
      const theatre2 = theatres[(showIndex + 1) % theatres.length];
      showIndex++;

      const time1 = new Date(now.getTime() + (2 + (showIndex % 5) * 3) * 60 * 60 * 1000);
      const time2 = new Date(now.getTime() + (24 + (showIndex % 4) * 4) * 60 * 60 * 1000);

      showsToInsert.push({
        movie: movie._id,
        theatreName: theatre1.name,
        city: theatre1.city,
        startsAt: time1,
        price: theatre1.price,
        seats: generateSeatGrid(['B3', 'B4', 'C5'])
      });

      showsToInsert.push({
        movie: movie._id,
        theatreName: theatre2.name,
        city: theatre2.city,
        startsAt: time2,
        price: theatre2.price,
        seats: generateSeatGrid(['D4', 'D5', 'E2', 'E3'])
      });
    }

    const createdShows = await Show.insertMany(showsToInsert);

    console.log('🧾 Creating sample booking for John Doe...');
    const firstShow = createdShows[0];
    const firstMovie = createdMovies.find(m => m._id.toString() === firstShow.movie.toString());

    await Booking.create({
      user: customer._id,
      show: firstShow._id,
      movieTitle: firstMovie.title,
      theatreName: firstShow.theatreName,
      showStartsAt: firstShow.startsAt,
      seats: ['B3', 'B4'],
      totalAmount: firstShow.price * 2,
      paymentStatus: 'simulated-paid',
      status: 'confirmed'
    });

    console.log('\n======================================================');
    console.log('🎉 iMovies Database Seed Completed Successfully!');
    console.log('======================================================');
    console.log('Demo Credentials:');
    console.log('👉 ADMIN:');
    console.log('   Email:    admin@imovies.com');
    console.log('   Password: Admin@12345');
    console.log('👉 CUSTOMER:');
    console.log('   Email:    user@imovies.com');
    console.log('   Password: User@12345');
    console.log('======================================================');
    console.log(`Total Movies Created: ${createdMovies.length}`);
    console.log(`Total Shows Created:  ${createdShows.length}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
