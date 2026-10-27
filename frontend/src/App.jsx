import { useEffect, useState, useMemo } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { api } from './api.js';
import { logout, setAuth } from './store.js';

/* -------------------------------------------------------------------------- */
/* Navbar Component                                                           */
/* -------------------------------------------------------------------------- */
function Navbar() {
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top px-3 py-2">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span style={{ fontSize: '1.6rem' }}>🎬</span>
          <span>i<span className="brand-accent">Movies</span></span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Browse Movies</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/bookings">My Tickets</NavLink>
              </li>
            )}
            {user?.role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link text-warning fw-semibold" to="/admin">
                  🛡️ Admin Dashboard
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="text-end d-none d-md-block">
                  <div className="fw-semibold small text-light">{user.name}</div>
                  <span className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{ fontSize: '0.65rem' }}>
                    {user.role?.toUpperCase()}
                  </span>
                </div>
                <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <NavLink className="btn btn-outline-light btn-sm rounded-pill px-3" to="/login">
                  Login
                </NavLink>
                <NavLink className="btn btn-gold btn-sm rounded-pill px-3" to="/register">
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Home (Movie Catalog & Discovery)                                          */
/* -------------------------------------------------------------------------- */
function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [loading, setLoading] = useState(true);

  const genres = ['All', 'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Animation', 'Thriller', 'Biography'];
  const languages = ['All', 'English', 'Hindi'];

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/movies')
      .then(r => {
        if (active) setMovies(r.data.movies || []);
      })
      .catch(() => toast.error('Could not connect to API. Please ensure backend is running.'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchSearch = (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(search.toLowerCase());
      const matchGenre = selectedGenre === 'All' || (m.genre && m.genre.includes(selectedGenre));
      const matchLang = selectedLanguage === 'All' || m.language?.toLowerCase() === selectedLanguage.toLowerCase();
      return matchSearch && matchGenre && matchLang;
    });
  }, [movies, search, selectedGenre, selectedLanguage]);

  return (
    <main className="container py-4">
      {/* Hero Banner */}
      <section className="hero-banner mb-5">
        <span className="hero-badge mb-3">CINEMA EXPERIENCE REIMAGINED</span>
        <h1 className="display-5 fw-bold text-white mb-2">Blockbusters on the Big Screen</h1>
        <p className="text-secondary lead mb-4" style={{ maxWidth: '620px' }}>
          Discover the latest releases, pick your favourite seats with live real-time sync, and book tickets in seconds.
        </p>

        {/* Search Bar */}
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-7">
            <input
              type="text"
              className="form-control form-control-dark py-2 px-3"
              placeholder="🔍 Search movie title or synopsis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-dark py-2"
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>Language: {lang}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Genre Filter Pills */}
      <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
        <span className="text-secondary small fw-semibold me-2">Genre:</span>
        {genres.map(g => (
          <button
            key={g}
            className={`filter-pill ${selectedGenre === g ? 'active' : ''}`}
            onClick={() => setSelectedGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Movie Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-white mb-0">Now Showing</h3>
        <span className="text-secondary small">{filteredMovies.length} movies available</span>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-secondary mt-3">Loading movies catalog...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="card-dark p-5 text-center my-4">
          <h4>No movies found</h4>
          <p className="text-secondary">Try adjusting your search query or genre filter.</p>
          {movies.length === 0 && (
            <div className="alert alert-info d-inline-block mt-3 text-dark">
              💡 <strong>Tip:</strong> Run <code>npm run seed</code> in backend or use Admin Dashboard to add movies!
            </div>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {filteredMovies.map(movie => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={movie._id}>
              <article className="movie-card">
                <div className="movie-poster-wrap">
                  {movie.posterUrl ? (
                    <img className="movie-poster" src={movie.posterUrl} alt={movie.title} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 fs-1">🎬</div>
                  )}
                  {movie.rating > 0 && (
                    <div className="movie-rating-badge">★ {movie.rating.toFixed(1)}</div>
                  )}
                </div>
                <div className="card-content">
                  <h5 className="movie-title">{movie.title}</h5>
                  <div className="movie-meta">
                    {movie.language} • {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m
                  </div>
                  <div className="mb-2">
                    {movie.genre?.slice(0, 2).map((g, idx) => (
                      <span className="badge-genre" key={idx}>{g}</span>
                    ))}
                  </div>
                  <p className="movie-synopsis">{movie.description}</p>
                  <Link className="btn btn-gold w-100 mt-auto" to={`/movies/${movie._id}`}>
                    Book Tickets 🎟️
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Movie Details & Showtimes                                                  */
/* -------------------------------------------------------------------------- */
function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [cityFilter, setCityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/movies/${id}`),
      api.get('/shows', { params: { movieId: id } })
    ])
      .then(([mRes, sRes]) => {
        setMovie(mRes.data);
        setShows(sRes.data || []);
      })
      .catch(err => toast.error(err.response?.data?.message || 'Could not load movie showtimes'))
      .finally(() => setLoading(false));
  }, [id]);

  const cities = useMemo(() => {
    const list = new Set(shows.map(s => s.city));
    return ['All', ...Array.from(list)];
  }, [shows]);

  const filteredShows = useMemo(() => {
    if (cityFilter === 'All') return shows;
    return shows.filter(s => s.city?.toLowerCase() === cityFilter.toLowerCase());
  }, [shows, cityFilter]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status"></div>
        <p className="text-secondary mt-3">Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container py-5 text-center">
        <h3>Movie not found</h3>
        <Link className="btn btn-gold mt-3" to="/">Back to Movies</Link>
      </div>
    );
  }

  return (
    <main className="container py-4">
      {/* Movie Header Card */}
      <div className="card-dark p-4 p-md-5 mb-5">
        <div className="row g-4">
          <div className="col-12 col-md-4 col-lg-3 text-center">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="img-fluid rounded-4 shadow"
                style={{ maxHeight: '380px', objectFit: 'cover' }}
              />
            ) : (
              <div className="rounded-4 bg-dark py-5 fs-1">🎬</div>
            )}
          </div>
          <div className="col-12 col-md-8 col-lg-9 d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
              <h1 className="fw-bold text-white mb-0">{movie.title}</h1>
              {movie.rating > 0 && (
                <span className="badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill">
                  ★ {movie.rating.toFixed(1)} / 10
                </span>
              )}
            </div>
            <p className="text-secondary mb-3">
              {movie.language} • {Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m •{' '}
              {movie.genre?.join(', ')}
            </p>
            <p className="lead text-light mb-4" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
              {movie.description}
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge bg-dark border border-secondary px-3 py-2">HD Sound & Projection</span>
              <span className="badge bg-dark border border-secondary px-3 py-2">Dolby Atmos Available</span>
              <span className="badge bg-dark border border-secondary px-3 py-2">Subtitles Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shows Selection Section */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-white mb-1">Available Showtimes</h3>
          <p className="text-secondary small mb-0">Select a cinema and showtime to choose your seats</p>
        </div>
        {cities.length > 1 && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small">Filter City:</span>
            <select
              className="form-select form-select-dark form-select-sm"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
            >
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {filteredShows.length === 0 ? (
        <div className="card-dark p-5 text-center">
          <h5>No scheduled showtimes found for this movie.</h5>
          <p className="text-secondary">Please check back later or check another city.</p>
          <Link className="btn btn-outline-light btn-sm mt-2" to="/">Browse other movies</Link>
        </div>
      ) : (
        <div className="row g-3">
          {filteredShows.map(show => {
            const showDate = new Date(show.startsAt);
            return (
              <div className="col-12 col-md-6" key={show._id}>
                <div className="card-dark p-4 h-100 d-flex justify-content-between align-items-center flex-row">
                  <div>
                    <h5 className="text-white fw-bold mb-1">{show.theatreName}</h5>
                    <div className="text-secondary small mb-2">
                      📍 {show.city} • Screen {show.seats?.length || 48} Seats
                    </div>
                    <div className="text-warning fw-semibold">
                      🗓️ {showDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                      {showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-end ms-3">
                    <div className="fw-bold text-white fs-5 mb-2">₹{show.price}</div>
                    <Link className="btn btn-gold btn-sm px-3" to={`/shows/${show._id}`}>
                      Select Seats 🪑
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Real-Time Interactive Seat Picker with Socket.IO                           */
/* -------------------------------------------------------------------------- */
function SeatPicker() {
  const { id } = useParams();
  const user = useSelector(s => s.auth.user);
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Load seats from server
  const loadSeats = () => {
    return api.get(`/shows/${id}/seats`)
      .then(res => {
        setShow(res.data);
      })
      .catch(() => toast.error('Could not load seats for this show.'));
  };

  useEffect(() => {
    setLoading(true);
    loadSeats().finally(() => setLoading(false));

    // Connect real-time Socket.IO for live seat synchronization
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.emit('join-show', id);

    socket.on('seats-updated', data => {
      if (data.showId === id) {
        toast.info('Seat availability updated in real-time!', { autoClose: 2000 });
        if (data.seats) {
          setShow(prev => prev ? { ...prev, seats: data.seats } : prev);
        } else {
          loadSeats();
        }
      }
    });

    return () => {
      socket.emit('leave-show', id);
      socket.disconnect();
    };
  }, [id]);

  // Group seats by row letter (e.g. A, B, C...)
  const seatsByRow = useMemo(() => {
    if (!show?.seats) return {};
    const grouped = {};
    for (const seat of show.seats) {
      const row = seat.code.charAt(0);
      if (!grouped[row]) grouped[row] = [];
      grouped[row].push(seat);
    }
    return grouped;
  }, [show]);

  const toggleSeat = code => {
    setSelectedSeats(prev => {
      if (prev.includes(code)) {
        return prev.filter(s => s !== code);
      }
      if (prev.length >= 8) {
        toast.warning('Maximum 8 seats allowed per booking.');
        return prev;
      }
      return [...prev, code];
    });
  };

  const proceedToCheckout = () => {
    if (!user) {
      toast.info('Please log in to complete your booking.');
      navigate('/login');
      return;
    }
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat.');
      return;
    }
    setIsModalOpen(true);
  };

  const confirmBooking = async () => {
    setBookingInProgress(true);
    try {
      const { data } = await api.post('/bookings', {
        showId: id,
        seats: selectedSeats
      });
      toast.success(`Booking Confirmed! Seats: ${data.booking.seats.join(', ')}`);
      setIsModalOpen(false);
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. One or more seats were already taken.');
      loadSeats();
      setIsModalOpen(false);
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status"></div>
        <p className="text-secondary mt-3">Loading seat arrangement...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container py-5 text-center">
        <h3>Show not found</h3>
        <Link className="btn btn-gold mt-3" to="/">Back to Movies</Link>
      </div>
    );
  }

  const basePrice = selectedSeats.length * show.price;
  const convenienceFee = selectedSeats.length > 0 ? 30 : 0;
  const totalPrice = basePrice + convenienceFee;

  return (
    <main className="container py-4 seat-view-container">
      {/* Show Info Header */}
      <div className="card-dark p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold text-white mb-1">{show.movie?.title || 'Movie'}</h4>
            <div className="text-secondary small">
              📍 {show.theatreName}, {show.city} • 🗓️ {new Date(show.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
          <div className="badge bg-dark border border-secondary px-3 py-2 text-warning fs-6">
            ₹{show.price} / ticket
          </div>
        </div>
      </div>

      {/* Screen Curved Display */}
      <div className="cinema-screen">
        CINEMA SCREEN THIS WAY
      </div>

      {/* Seat Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#1e3a2f', border: '1px solid #059669' }}></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: 'var(--accent-gold)' }}></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#371d24', border: '1px solid #7f1d1d' }}></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Matrix Grid */}
      <div className="seat-grid-container">
        {Object.entries(seatsByRow).map(([rowLetter, seats]) => (
          <div className="seat-row" key={rowLetter}>
            <span className="row-label">{rowLetter}</span>
            {seats.map(seat => {
              const isBooked = seat.status === 'booked';
              const isSelected = selectedSeats.includes(seat.code);
              return (
                <button
                  key={seat.code}
                  disabled={isBooked}
                  onClick={() => toggleSeat(seat.code)}
                  title={`${seat.code} (${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'})`}
                  className={`seat-button ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                >
                  {seat.code.replace(rowLetter, '')}
                </button>
              );
            })}
            <span className="row-label">{rowLetter}</span>
          </div>
        ))}
      </div>

      {/* Sticky Checkout Bar */}
      <div className="floating-checkout-bar">
        <div>
          <div className="fw-bold text-white">
            {selectedSeats.length > 0 ? `${selectedSeats.length} Seat(s) Selected` : 'No seats selected'}
          </div>
          <div className="text-secondary small">
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Click seats above to choose'}
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          {selectedSeats.length > 0 && (
            <div className="text-end d-none d-sm-block">
              <div className="fw-bold text-warning fs-5">₹{totalPrice}</div>
              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>Incl. ₹30 booking fee</div>
            </div>
          )}
          <button
            className="btn btn-gold px-4"
            disabled={selectedSeats.length === 0}
            onClick={proceedToCheckout}
          >
            Confirm & Pay ₹{totalPrice} 💳
          </button>
        </div>
      </div>

      {/* Simulated Checkout Modal */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-dark p-4 shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="modal-title fw-bold text-white">Checkout Simulation</h5>
                <button className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>

              <div className="p-3 bg-dark rounded-3 mb-3 border border-secondary">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Movie:</span>
                  <span className="fw-semibold text-white">{show.movie?.title}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Theatre:</span>
                  <span className="text-light">{show.theatreName}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Selected Seats:</span>
                  <span className="badge bg-warning text-dark">{selectedSeats.join(', ')}</span>
                </div>
                <hr className="my-2 border-secondary" />
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Tickets ({selectedSeats.length} × ₹{show.price}):</span>
                  <span>₹{basePrice}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Convenience Fee:</span>
                  <span>₹{convenienceFee}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold text-warning fs-5 mt-2">
                  <span>Grand Total:</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              <div className="alert alert-warning py-2 small mb-3">
                ℹ️ <strong>Demo Payment:</strong> No real bank charges will occur. Clicking Pay will record the confirmed ticket in the database.
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary w-50" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-gold w-50 fw-bold"
                  disabled={bookingInProgress}
                  onClick={confirmBooking}
                >
                  {bookingInProgress ? 'Processing...' : 'Pay & Confirm Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* My Bookings & E-Ticket Modal                                               */
/* -------------------------------------------------------------------------- */
function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    api.get('/bookings/my')
      .then(res => setBookings(res.data || []))
      .catch(() => toast.error('Please log in to view your tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async id => {
    if (!window.confirm('Are you sure you want to cancel this booking? A demo refund will be issued.')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully.');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-white mb-1">My Movie Tickets</h2>
          <p className="text-secondary small mb-0">View your confirmed e-tickets and booking history</p>
        </div>
        <Link className="btn btn-gold btn-sm" to="/">+ Book More Tickets</Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-secondary mt-3">Loading your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card-dark p-5 text-center my-4">
          <h4>No bookings yet</h4>
          <p className="text-secondary">You haven't booked any movie tickets yet.</p>
          <Link className="btn btn-gold mt-2" to="/">Browse Movies Now</Link>
        </div>
      ) : (
        <div className="row g-4">
          {bookings.map(b => {
            const isConfirmed = b.status === 'confirmed';
            return (
              <div className="col-12 col-md-6" key={b._id}>
                <div className="ticket-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h4 className="fw-bold text-white mb-0">{b.movieTitle}</h4>
                      <span className={`badge ${isConfirmed ? 'bg-success' : 'bg-danger'}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-secondary small mb-2">
                      📍 {b.theatreName}
                    </div>
                    <div className="text-light small mb-3">
                      🗓️ {new Date(b.showStartsAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                    </div>
                    <div className="mb-3">
                      <span className="text-secondary small me-2">Seats:</span>
                      {b.seats?.map(seat => (
                        <span className="badge bg-warning text-dark me-1" key={seat}>{seat}</span>
                      ))}
                    </div>
                    <div className="text-warning fw-bold fs-5 mb-3">
                      Total Paid: ₹{b.totalAmount}
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-2 pt-3 border-top border-secondary">
                    <button
                      className="btn btn-outline-light btn-sm flex-grow-1"
                      onClick={() => setActiveTicket(b)}
                    >
                      🎟️ View E-Ticket
                    </button>
                    {isConfirmed && new Date(b.showStartsAt) > new Date() && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleCancelBooking(b._id)}
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable E-Ticket Modal */}
      {activeTicket && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-dark p-4 printable-ticket">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="modal-title fw-bold text-warning">🎬 iMovies Official E-Ticket</h5>
                <button className="btn-close btn-close-white" onClick={() => setActiveTicket(null)}></button>
              </div>

              <div className="bg-dark p-4 rounded-3 border border-secondary mb-3">
                <h3 className="fw-bold text-white">{activeTicket.movieTitle}</h3>
                <p className="text-secondary mb-1">🏛️ {activeTicket.theatreName}</p>
                <p className="text-light mb-3">
                  ⏰ {new Date(activeTicket.showStartsAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                </p>

                <div className="row g-2 mb-3 text-center">
                  <div className="col-6 bg-secondary bg-opacity-25 p-2 rounded">
                    <div className="small text-secondary">SEATS</div>
                    <div className="fw-bold text-warning fs-5">{activeTicket.seats?.join(', ')}</div>
                  </div>
                  <div className="col-6 bg-secondary bg-opacity-25 p-2 rounded">
                    <div className="small text-secondary">ADMIT</div>
                    <div className="fw-bold text-light fs-5">{activeTicket.seats?.length} Person(s)</div>
                  </div>
                </div>

                <div className="text-center my-3">
                  <div className="ticket-barcode">
                    ||||| ||| |||| || ||||||| {activeTicket._id?.slice(-6).toUpperCase()}
                  </div>
                  <div className="small text-secondary mt-1">Booking Ref: #{activeTicket._id}</div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary w-50" onClick={() => setActiveTicket(null)}>
                  Close
                </button>
                <button className="btn btn-gold w-50" onClick={() => window.print()}>
                  🖨️ Print Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Complete Admin Dashboard (Movies, Shows, Bookings)                         */
/* -------------------------------------------------------------------------- */
function AdminPage() {
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookingsData, setBookingsData] = useState({ bookings: [], stats: {} });

  // Movie Form State
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    language: 'English',
    durationMinutes: 140,
    genre: 'Action, Sci-Fi',
    rating: 8.5,
    posterUrl: ''
  });

  // Show Form State
  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreName: 'PVR ICON Cinemas, Screen 1',
    city: 'Mumbai',
    startsAt: '',
    price: 350,
    rows: 6,
    seatsPerRow: 8
  });

  const loadData = () => {
    api.get('/movies').then(r => setMovies(r.data.movies || [])).catch(() => {});
    api.get('/shows?all=true').then(r => setShows(r.data || [])).catch(() => {});
    api.get('/bookings/all').then(r => setBookingsData(r.data || { bookings: [], stats: {} })).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Movie Handlers
  const handleCreateMovie = async e => {
    e.preventDefault();
    try {
      await api.post('/movies', {
        ...movieForm,
        genre: movieForm.genre.split(',').map(s => s.trim()).filter(Boolean),
        durationMinutes: Number(movieForm.durationMinutes),
        rating: Number(movieForm.rating)
      });
      toast.success('Movie created successfully!');
      setMovieForm({
        title: '',
        description: '',
        language: 'English',
        durationMinutes: 140,
        genre: 'Action, Sci-Fi',
        rating: 8.5,
        posterUrl: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create movie.');
    }
  };

  const handleDeleteMovie = async id => {
    if (!window.confirm('Delete this movie? All attached shows will also be affected.')) return;
    try {
      await api.delete(`/movies/${id}`);
      toast.success('Movie deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete movie.');
    }
  };

  // Show Handlers
  const handleCreateShow = async e => {
    e.preventDefault();
    if (!showForm.movieId) {
      toast.warning('Please select a movie for the show.');
      return;
    }
    try {
      await api.post('/shows', {
        movie: showForm.movieId,
        theatreName: showForm.theatreName,
        city: showForm.city,
        startsAt: new Date(showForm.startsAt).toISOString(),
        price: Number(showForm.price),
        rows: Number(showForm.rows),
        seatsPerRow: Number(showForm.seatsPerRow)
      });
      toast.success('Show scheduled successfully with auto-generated seat matrix!');
      setShowForm(prev => ({ ...prev, startsAt: '' }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show.');
    }
  };

  const handleDeleteShow = async id => {
    if (!window.confirm('Delete this show?')) return;
    try {
      await api.delete(`/shows/${id}`);
      toast.success('Show deleted successfully.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete show.');
    }
  };

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-white mb-0">🛡️ Cinema Management Dashboard</h2>
          <p className="text-secondary small mb-0">Manage movie catalogue, schedule shows, and track live bookings</p>
        </div>
      </div>

      {/* Admin Tabs */}
      <ul className="nav nav-pills gap-2 mb-4">
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'movies' ? 'btn-gold' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('movies')}
          >
            🎬 Movies Catalogue ({movies.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'shows' ? 'btn-gold' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('shows')}
          >
            🎟️ Shows & Schedules ({shows.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'analytics' ? 'btn-gold' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Bookings & Analytics ({bookingsData.bookings?.length || 0})
          </button>
        </li>
      </ul>

      {/* TAB 1: MOVIES */}
      {activeTab === 'movies' && (
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card-dark p-4">
              <h4 className="fw-bold text-white mb-3">+ Add New Movie</h4>
              <form onSubmit={handleCreateMovie}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Movie Title *</label>
                  <input
                    className="form-control form-control-dark"
                    required
                    placeholder="e.g. Gladiator II"
                    value={movieForm.title}
                    onChange={e => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-secondary">Language</label>
                    <input
                      className="form-control form-control-dark"
                      placeholder="English / Hindi"
                      value={movieForm.language}
                      onChange={e => setMovieForm({ ...movieForm, language: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary">Duration (Mins) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="form-control form-control-dark"
                      value={movieForm.durationMinutes}
                      onChange={e => setMovieForm({ ...movieForm, durationMinutes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-secondary">Genres (comma separated)</label>
                    <input
                      className="form-control form-control-dark"
                      placeholder="Action, Sci-Fi"
                      value={movieForm.genre}
                      onChange={e => setMovieForm({ ...movieForm, genre: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary">Rating (0 - 10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="form-control form-control-dark"
                      value={movieForm.rating}
                      onChange={e => setMovieForm({ ...movieForm, rating: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Poster Image URL</label>
                  <input
                    className="form-control form-control-dark"
                    placeholder="https://images.unsplash.com/..."
                    value={movieForm.posterUrl}
                    onChange={e => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Description / Synopsis</label>
                  <textarea
                    rows="3"
                    className="form-control form-control-dark"
                    placeholder="Enter movie plot synopsis..."
                    value={movieForm.description}
                    onChange={e => setMovieForm({ ...movieForm, description: e.target.value })}
                  />
                </div>
                <button className="btn btn-gold w-100 fw-bold">Publish Movie</button>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card-dark p-4">
              <h4 className="fw-bold text-white mb-3">Active Movies</h4>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Runtime</th>
                      <th>Language</th>
                      <th>Rating</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map(m => (
                      <tr key={m._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {m.posterUrl && (
                              <img src={m.posterUrl} alt="" width="36" height="48" style={{ objectFit: 'cover', borderRadius: '4px' }} />
                            )}
                            <span className="fw-semibold text-white">{m.title}</span>
                          </div>
                        </td>
                        <td>{m.durationMinutes} min</td>
                        <td>{m.language}</td>
                        <td>⭐ {m.rating || 'N/A'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteMovie(m._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOWS */}
      {activeTab === 'shows' && (
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card-dark p-4">
              <h4 className="fw-bold text-white mb-3">+ Schedule New Show</h4>
              <form onSubmit={handleCreateShow}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Select Movie *</label>
                  <select
                    className="form-select form-select-dark"
                    required
                    value={showForm.movieId}
                    onChange={e => setShowForm({ ...showForm, movieId: e.target.value })}
                  >
                    <option value="">-- Choose a movie --</option>
                    {movies.map(m => (
                      <option key={m._id} value={m._id}>{m.title} ({m.language})</option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label small text-secondary">Cinema Theatre Name *</label>
                    <input
                      className="form-control form-control-dark"
                      required
                      placeholder="e.g. INOX Megaplex Laser IMAX"
                      value={showForm.theatreName}
                      onChange={e => setShowForm({ ...showForm, theatreName: e.target.value })}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label small text-secondary">City *</label>
                    <input
                      className="form-control form-control-dark"
                      required
                      placeholder="e.g. Mumbai"
                      value={showForm.city}
                      onChange={e => setShowForm({ ...showForm, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label small text-secondary">Show Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control form-control-dark"
                      value={showForm.startsAt}
                      onChange={e => setShowForm({ ...showForm, startsAt: e.target.value })}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label small text-secondary">Ticket Price (₹) *</label>
                    <input
                      type="number"
                      min="50"
                      required
                      className="form-control form-control-dark"
                      value={showForm.price}
                      onChange={e => setShowForm({ ...showForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-secondary">Rows (A - F)</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      className="form-control form-control-dark"
                      value={showForm.rows}
                      onChange={e => setShowForm({ ...showForm, rows: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary">Seats Per Row</label>
                    <input
                      type="number"
                      min="4"
                      max="12"
                      className="form-control form-control-dark"
                      value={showForm.seatsPerRow}
                      onChange={e => setShowForm({ ...showForm, seatsPerRow: e.target.value })}
                    />
                  </div>
                </div>
                <div className="alert alert-secondary py-2 small mb-3">
                  ✨ Will automatically generate {showForm.rows * showForm.seatsPerRow} seats for this show hall.
                </div>
                <button className="btn btn-gold w-100 fw-bold">Schedule Show</button>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card-dark p-4">
              <h4 className="fw-bold text-white mb-3">Scheduled Shows</h4>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Movie / Theatre</th>
                      <th>Showtime</th>
                      <th>Price</th>
                      <th>Booked</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.map(s => {
                      const bookedCount = s.seats?.filter(st => st.status === 'booked').length || 0;
                      const totalSeats = s.seats?.length || 0;
                      return (
                        <tr key={s._id}>
                          <td>
                            <div className="fw-semibold text-white">{s.movie?.title || 'Unknown'}</div>
                            <div className="small text-secondary">{s.theatreName} ({s.city})</div>
                          </td>
                          <td className="small">
                            {new Date(s.startsAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>₹{s.price}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {bookedCount} / {totalSeats}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteShow(s._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-md-3">
              <div className="stat-card">
                <div className="text-secondary small fw-semibold">TOTAL REVENUE</div>
                <div className="stat-value">₹{bookingsData.stats?.totalRevenue || 0}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="stat-card">
                <div className="text-secondary small fw-semibold">TICKETS SOLD</div>
                <div className="stat-value">{bookingsData.stats?.totalTicketsSold || 0}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="stat-card">
                <div className="text-secondary small fw-semibold">CONFIRMED BOOKINGS</div>
                <div className="stat-value text-success">{bookingsData.stats?.confirmedCount || 0}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="stat-card">
                <div className="text-secondary small fw-semibold">ACTIVE MOVIES / SHOWS</div>
                <div className="stat-value text-info">{movies.length} / {shows.length}</div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="card-dark p-4">
            <h4 className="fw-bold text-white mb-3">All Customer Bookings</h4>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Movie</th>
                    <th>Showtime</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(bookingsData.bookings || []).map(b => (
                    <tr key={b._id}>
                      <td>
                        <div className="fw-semibold text-white">{b.user?.name || 'Customer'}</div>
                        <div className="small text-secondary">{b.user?.email}</div>
                      </td>
                      <td>{b.movieTitle}</td>
                      <td className="small">
                        {new Date(b.showStartsAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        {b.seats?.map(seat => (
                          <span className="badge bg-warning text-dark me-1" key={seat}>{seat}</span>
                        ))}
                      </td>
                      <td className="fw-bold text-warning">₹{b.totalAmount}</td>
                      <td>
                        <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-danger'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication Page (Login / Register + Quick Demo Buttons)                 */
/* -------------------------------------------------------------------------- */
function AuthPage({ mode }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      dispatch(setAuth(data));
      toast.success(`Welcome ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setAuth(data));
      toast.success(`Logged in as ${data.user.name} (${data.user.role})!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demo login failed. Make sure database is seeded!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container d-flex justify-content-center align-items-center py-5">
      <div className="card-dark p-4 p-md-5 shadow-lg w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <span style={{ fontSize: '2.5rem' }}>🎬</span>
          <h2 className="fw-bold text-white mt-2">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-secondary small">
            {mode === 'login' ? 'Login to view and reserve your movie seats' : 'Sign up to unlock instant bookings'}
          </p>
        </div>

        {/* Quick Demo Login Helper for Evaluators */}
        {mode === 'login' && (
          <div className="p-3 bg-dark rounded-3 border border-secondary mb-4">
            <div className="small text-secondary fw-semibold mb-2">⚡ QUICK DEMO LOGIN:</div>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm fw-bold"
                onClick={() => loginAsDemo('admin@imovies.com', 'Admin@12345')}
                disabled={loading}
              >
                🛡️ Demo Admin (admin@imovies.com)
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => loginAsDemo('user@imovies.com', 'User@12345')}
                disabled={loading}
              >
                🍿 Demo Customer (user@imovies.com)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="mb-3">
              <label className="form-label small text-secondary">Full Name</label>
              <input
                className="form-control form-control-dark"
                placeholder="Jane Doe"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label small text-secondary">Email Address</label>
            <input
              type="email"
              className="form-control form-control-dark"
              placeholder="name@example.com"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small text-secondary">Password (8+ chars)</label>
            <input
              type="password"
              minLength="8"
              className="form-control form-control-dark"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-gold w-100 fw-bold py-2 mt-2" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="small text-secondary mb-0">
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <Link to={mode === 'login' ? '/register' : '/login'} className="text-warning text-decoration-none fw-semibold">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Not Found Page                                                             */
/* -------------------------------------------------------------------------- */
function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1 className="display-4 fw-bold text-warning">404</h1>
      <h3 className="text-white">Page Not Found</h3>
      <p className="text-secondary">The page you are looking for does not exist.</p>
      <Link className="btn btn-gold mt-3" to="/">Return to Movies</Link>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Main App Component                                                         */
/* -------------------------------------------------------------------------- */
export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/shows/:id" element={<SeatPicker />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <footer className="app-footer py-4 text-center mt-5">
        <div className="container">
          <p className="mb-1 text-light">🎬 <strong>iMovies Cinema Network</strong> — Complete Full Stack MERN Project</p>
          <p className="text-secondary small mb-0">
            Powered by React 18, Vite, Express, MongoDB, Redux Toolkit & Socket.IO real-time synchronization.
          </p>
        </div>
      </footer>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
