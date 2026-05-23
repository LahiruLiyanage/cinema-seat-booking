'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Movie {
  _id: string;
  title: string;
  genre: string;
  duration: number;
  rating: string;
  description: string;
}

interface SessionItem {
  _id: string;
  movieId: Movie;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}

export default function HomePage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [moviesRes, sessionsRes] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/sessions'),
      ]);
      const moviesData = await moviesRes.json();
      const sessionsData = await sessionsRes.json();
      if (moviesData.success) setMovies(moviesData.data);
      if (sessionsData.success) setSessions(sessionsData.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoaded(true);
  }

  async function handleSeed() {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error('Seed failed:', e);
    }
    setIsSeeding(false);
  }

  // Filter sessions by selected movie
  const filteredSessions = selectedMovie
    ? sessions.filter((s: any) => s.movieId?._id === selectedMovie)
    : sessions;

  // Group sessions by date
  const sessionsByDate: Record<string, SessionItem[]> = {};
  for (const s of filteredSessions) {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎬 CineSeat
          </h1>
          <p className="text-gray-400 mt-1">Cinema Seat Booking System</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSeeding ? '⏳ Seeding...' : '🎬 Initialize Demo Data'}
            </button>
            <button
              onClick={() => router.push('/stress-test')}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg border border-gray-700 transition-colors"
            >
              📊 Stress Test
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Empty state */}
        {loaded && movies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🎬</p>
            <h2 className="text-2xl font-bold text-gray-400">No Movies Yet</h2>
            <p className="text-gray-500 mt-2">Click &quot;Initialize Demo Data&quot; to get started.</p>
          </div>
        )}

        {/* Movie Cards */}
        {movies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">🎬 Now Showing</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {movies.map((movie) => (
                <button
                  key={movie._id}
                  onClick={() => setSelectedMovie(selectedMovie === movie._id ? null : movie._id)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    selectedMovie === movie._id
                      ? 'bg-blue-900/40 border-blue-500'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <h3 className="font-bold text-sm">{movie.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{movie.genre} • {movie.duration}min</p>
                  <p className="text-xs text-gray-500">{movie.rating}</p>
                </button>
              ))}
            </div>
            {selectedMovie && (
              <button
                onClick={() => setSelectedMovie(null)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                ✕ Clear filter
              </button>
            )}
          </section>
        )}

        {/* Sessions */}
        {Object.keys(sessionsByDate).length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">🕐 Sessions</h2>
            {Object.entries(sessionsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateSessions]) => (
                <div key={date} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dateSessions
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((session) => {
                        const movie = session.movieId as any;
                        const pct = session.totalSeats > 0 ? (session.bookedSeats / session.totalSeats) * 100 : 0;
                        return (
                          <button
                            key={session._id}
                            onClick={() => router.push(`/booking/${session._id}`)}
                            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-3 border border-gray-800 hover:border-gray-600 transition-all text-left"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-sm">{movie?.title}</span>
                              <span className="text-xs text-gray-500">{session.time}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-400">{movie?.genre}</span>
                              <span className={`text-xs font-semibold ${pct > 80 ? 'text-red-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {session.availableSeats} seats left
                              </span>
                            </div>
                            <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
          </section>
        )}
      </main>
    </div>
  );
}
