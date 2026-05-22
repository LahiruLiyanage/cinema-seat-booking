'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Movie {
  _id: string;
  title: string;
  genre: string;
  duration: number;
  posterUrl: string;
  rating: string;
  releaseYear: number;
  description: string;
}

interface Session {
  _id: string;
  movieId: Movie;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}

const GENRE_COLORS: Record<string, string> = {
  Action: 'from-red-600 to-orange-600',
  'Sci-Fi': 'from-blue-600 to-purple-600',
  Drama: 'from-amber-600 to-yellow-600',
  Comedy: 'from-green-600 to-emerald-600',
  Thriller: 'from-gray-600 to-slate-600',
  Horror: 'from-red-800 to-rose-900',
};

const GENRE_ICONS: Record<string, string> = {
  Action: '💥',
  'Sci-Fi': '🚀',
  Drama: '🎭',
  Comedy: '😂',
  Thriller: '🔍',
  Horror: '👻',
};

export default function HomePage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchMovies();
    fetchSessions();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (data.success) setMovies(data.data);
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      setIsLoaded(true);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.success) setSessions(data.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchMovies();
        await fetchSessions();
      }
    } catch (err) {
      console.error('Failed to seed:', err);
    }
    setIsSeeding(false);
  };

  // Get unique dates from sessions
  const dates = [...new Set(sessions.map((s) => s.date))].sort();

  // Filter sessions by selected movie and date
  const filteredSessions = sessions.filter((s) => {
    const movieMatch = !selectedMovie || (s.movieId as any)?._id === selectedMovie;
    const dateMatch = !selectedDate || s.date === selectedDate;
    return movieMatch && dateMatch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-950 to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                CineSeat
              </span>
            </h1>
            <p className="mt-3 text-gray-400 text-lg">
              Intelligent Cinema Seat Booking System
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {movies.length === 0 && isLoaded && (
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {isSeeding ? '⏳ Seeding Database...' : '🎬 Initialize Demo Data'}
                </button>
              )}
              <button
                onClick={() => router.push('/stress-test')}
                className="px-6 py-2.5 bg-gray-800 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
              >
                📊 Stress Test
              </button>
              {movies.length > 0 && (
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-4 py-2.5 bg-gray-800 text-gray-400 font-semibold rounded-lg hover:bg-gray-700 transition-all border border-gray-700 text-sm"
                >
                  {isSeeding ? '⏳...' : '🔄 Re-seed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {/* Movies Grid */}
        {movies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-xl">🎬</span> Now Showing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {movies.map((movie) => {
                const gradient = GENRE_COLORS[movie.genre] || 'from-gray-600 to-gray-700';
                const icon = GENRE_ICONS[movie.genre] || '🎬';
                const isSelected = selectedMovie === movie._id;

                return (
                  <button
                    key={movie._id}
                    onClick={() =>
                      setSelectedMovie(isSelected ? null : movie._id)
                    }
                    className={`group relative rounded-xl overflow-hidden transition-all duration-300 text-left ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 scale-[1.02] shadow-xl shadow-cyan-500/10'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                    }`}
                  >
                    <div
                      className={`bg-gradient-to-br ${gradient} p-5 h-48 flex flex-col justify-between`}
                    >
                      <div>
                        <span className="text-3xl">{icon}</span>
                        <h3 className="mt-2 font-bold text-lg leading-tight text-white/95">
                          {movie.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>{movie.genre}</span>
                        <span>{movie.duration}min</span>
                      </div>
                    </div>
                    <div className="bg-gray-900 px-4 py-3 border-t border-gray-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{movie.rating}</span>
                        <span className="text-gray-500">{movie.releaseYear}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {movie.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Date Filter */}
        {dates.length > 0 && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400 font-semibold">📅 Date:</span>
            <button
              onClick={() => setSelectedDate('')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                !selectedDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(selectedDate === date ? '' : date)}
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </button>
            ))}
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-lg">🕐</span> Available Sessions
              <span className="text-sm text-gray-500 font-normal">
                ({filteredSessions.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSessions.map((session) => {
                const movie = session.movieId as any;
                const occupancy =
                  session.totalSeats > 0
                    ? (session.bookedSeats / session.totalSeats) * 100
                    : 0;
                const occupancyColor =
                  occupancy >= 80
                    ? 'text-red-400'
                    : occupancy >= 50
                    ? 'text-amber-400'
                    : 'text-emerald-400';

                return (
                  <button
                    key={session._id}
                    onClick={() => router.push(`/booking/${session._id}`)}
                    className="bg-gray-900/60 hover:bg-gray-800/60 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm group-hover:text-cyan-400 transition-colors">
                        {movie?.title || 'Movie'}
                      </h3>
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                        {movie?.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>
                        📅{' '}
                        {new Date(session.date + 'T00:00:00').toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                      <span>🕐 {session.time}</span>
                      <span className={occupancyColor}>
                        {session.availableSeats} seats left
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          occupancy >= 80
                            ? 'bg-red-500'
                            : occupancy >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {movies.length === 0 && isLoaded && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No Movies Yet</h2>
            <p className="text-gray-500">
              Click &quot;Initialize Demo Data&quot; to seed the database with sample
              movies and sessions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
