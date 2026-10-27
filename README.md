# 🎬 iMovies — Complete Full-Stack MERN Cinema Booking System

A complete, feature-rich, full-stack **MERN (MongoDB, Express, React, Node.js)** cinema ticketing application featuring **real-time seat synchronization with Socket.IO**, role-based authentication (Customer & Admin), interactive seat maps, simulated checkout, printable e-tickets, and a full administration dashboard.

---

## 🌟 Key Features

### 👤 Customer Experience
- **Movie Catalog & Live Search:** Instant search by title or synopsis, genre filter pills (Action, Sci-Fi, Drama, etc.), and language filters.
- **Movie Details & Showtimes:** High-resolution posters, movie metadata (duration, rating, genres, description), and show schedules filtered by city.
- **Interactive Cinema Seat Map:**
  - Curved glowing screen view with realistic cinema layout.
  - Interactive multi-seat selection (up to 8 seats).
  - Seat tiers and live color states: 🟩 Available, 🟨 Selected, 🟥 Booked.
- **Real-Time Seat Synchronization (Socket.IO):**
  - When another user reserves or cancels seats, the seat map updates **instantly in real-time without reloading the page**.
  - Prevents double-booking using atomic conditional MongoDB updates.
- **Checkout & Simulated Payment:**
  - Dynamic price calculation with tickets breakdown and convenience fee.
  - Interactive simulated payment modal.
- **My Bookings & E-Tickets:**
  - History of all past and upcoming reservations.
  - **Printable E-Ticket** modal with barcode, booking reference ID, screen details, and 1-click print (`window.print()`).
  - Booking cancellation with automatic seat release and refund simulation.

### 🛡️ Admin Management Dashboard
- **Movies Catalog Manager:** Add, view, edit, and delete movies with poster URLs, ratings, languages, and genres.
- **Show Scheduler:** Schedule shows by selecting a movie, cinema hall, city, showtime, ticket price, and customizable seat layout (auto-generates seat matrices like 48, 64, or 80 seats).
- **Live Analytics & Revenue Tracker:**
  - Total revenue (₹) counter
  - Total tickets sold
  - Confirmed and cancelled bookings tally
  - Full table of all customer reservations

### ⚡ Developer Experience & Demo Login
- **One-Click Demo Logins:** Pre-configured buttons on the login page to sign in immediately as **Admin** or **Customer** without typing!
- **Database Seeder (`npm run seed`):** Seeds realistic blockbuster movies, multiple upcoming shows across cities, seats, demo users, and sample bookings.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Redux Toolkit, React Router v6, Bootstrap 5, Socket.IO Client, React Toastify |
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose, JWT (JSON Web Tokens), Bcrypt.js, Helmet, CORS, Express Rate Limit |
| **Database** | MongoDB (Local or MongoDB Atlas) |

---

## 🔑 Demo Credentials

Once the database is seeded (`npm run seed`), you can log in with:

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@imovies.com` | `Admin@12345` | Full access: Add/delete movies, schedule shows, view revenue & all bookings |
| **Customer** | `user@imovies.com` | `User@12345` | Browse movies, select seats in real-time, simulate booking, print tickets |

*(Or click the Quick Demo Login buttons directly on the `/login` page)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/imovies`) OR a free cloud connection string from [MongoDB Atlas](https://www.mongodb.com/atlas).

### 2. Environment Setup
The backend configuration file is pre-configured at `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=imovies_super_secret_jwt_key_2026_cinema_booking_app
CLIENT_URL=http://localhost:5173
```
*(If you are using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string).*

---

### 3. Install Dependencies

You can install dependencies for both frontend and backend from the root directory:

```bash
# In the project root directory
npm install
npm run install:all
```

Or install individually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 4. Seed the Database

Populate the database with sample movies, upcoming shows, seats, demo users, and bookings:

```bash
# From the root directory:
npm run seed

# Or inside backend:
cd backend
npm run seed
```

---

### 5. Run the Application

Start both the backend API and frontend dev server:

#### Option A: Run concurrently from root
```bash
npm run dev
```

#### Option B: Run in separate terminals

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server will run at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# App will open at http://localhost:5173
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get profile of currently authenticated user

### Movies (`/api/movies`)
- `GET /api/movies` — List movies (supports `?q=`, `?genre=`, `?language=`, `?page=`, `?limit=`)
- `GET /api/movies/:id` — Get movie details
- `POST /api/movies` — *(Admin)* Create a new movie
- `PUT /api/movies/:id` — *(Admin)* Update movie details
- `DELETE /api/movies/:id` — *(Admin)* Delete a movie

### Shows & Seats (`/api/shows`)
- `GET /api/shows` — List shows (supports `?movieId=`, `?city=`, `?all=true`)
- `GET /api/shows/:id/seats` — Get seat map and prices for a show
- `POST /api/shows` — *(Admin)* Schedule a new show (auto-generates seat matrix)
- `DELETE /api/shows/:id` — *(Admin)* Delete a show

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Book seats (atomic lock, demo payment simulation)
- `GET /api/bookings/my` — Get authenticated user's booking history
- `GET /api/bookings/all` — *(Admin)* View all customer bookings and revenue metrics
- `PATCH /api/bookings/:id/cancel` — Cancel a confirmed booking and release seats

---

## 🔄 Real-Time Architecture (Socket.IO)

```
[ Client Browser A ] <------\
                             |--- (Socket.IO Event: 'seats-updated') <--- [ Express Backend ]
[ Client Browser B ] <------/                                                    ^
                                                                                 | (Atomic update)
                                                                           [ MongoDB ]
```

1. Clients join a show room upon entering the seat picker: `socket.emit('join-show', showId)`.
2. When any client completes a booking or cancels tickets, the server executes an atomic database update and emits:
   ```javascript
   io.to(`show:${showId}`).emit('seats-updated', { showId, seats });
   ```
3. All clients viewing that show receive the updated seat statuses in real time.

---

## 🔒 Concurrency & Double-Booking Prevention

To eliminate race conditions when two users attempt to pick the same seat at the exact same millisecond, the backend uses **atomic array filter updates**:
```javascript
Show.findOneAndUpdate(
  {
    _id: showId,
    startsAt: { $gt: new Date() },
    seats: { $all: seats.map(code => ({ $elemMatch: { code, status: 'available' } })) }
  },
  {
    $set: Object.fromEntries(seats.map(code => [`seats.$[seat${seats.indexOf(code)}].status`, 'booked']))
  },
  {
    new: true,
    arrayFilters: seats.map((code, i) => ({ [`seat${i}.code`]: code, [`seat${i}.status`]: 'available' }))
  }
)
```
If another customer already reserved any of the requested seats, the filter matches 0 documents and the transaction safely returns `409 Conflict`.

---

## 📁 Project Structure

```
imovies-mern-project/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication & admin verification
│   │   ├── models/
│   │   │   ├── Booking.js          # Booking schema
│   │   │   ├── Movie.js            # Movie catalog schema with text index
│   │   │   ├── Show.js             # Show schedule & seat array schema
│   │   │   └── User.js             # User credentials & role schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # Register, login, profile routes
│   │   │   ├── bookingRoutes.js    # Concurrency-safe booking & cancellation
│   │   │   ├── movieRoutes.js      # Movie CRUD endpoints
│   │   │   └── showRoutes.js       # Show creation & seat query endpoints
│   │   └── seed.js                 # Database populator script
│   ├── .env                        # Server environment variables
│   ├── package.json                # Backend dependencies & scripts
│   └── server.js                   # Express app & Socket.IO server entry
├── frontend/
│   ├── src/
│   │   ├── api.js                  # Axios instance with auth interceptor
│   │   ├── App.jsx                 # Main React router, views & dashboard
│   │   ├── main.jsx                # React DOM entry with Redux Provider
│   │   ├── store.js                # Redux Toolkit authentication store
│   │   └── style.css               # Modern cinema dark UI styling
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies & scripts
│   └── vite.config.js              # Vite React configuration
├── package.json                    # Root project orchestrator
└── README.md                       # Documentation & full stack guide
```
