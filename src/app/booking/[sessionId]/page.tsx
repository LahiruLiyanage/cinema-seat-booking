'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface SeatData {
  id: string;
  row: string;
  col: number;
  type: 'regular' | 'vip' | 'disability' | 'broken';
  segment: 'left' | 'center' | 'right';
  status: 'available' | 'booked' | 'broken' | 'blocked';
  bookingId?: string;
}

interface SessionData {
  _id: string;
  movieId: { title: string; genre: string; duration: number; rating: string };
  date: string;
  time: string;
  seatMap: SeatData[];
  totalSeats: number;
  bookedSeats: number;
}

const ROW_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
const ALL_COLS = Array.from({ length: 28 }, (_, i) => i + 1);

function getSeatColor(seat: SeatData, isSelected: boolean, isSuggested: boolean): string {
  if (isSelected) return 'bg-green-500 ring-2 ring-green-300';
  if (isSuggested) return 'bg-yellow-400 ring-2 ring-yellow-300 animate-pulse';
  if (seat.status === 'booked') return 'bg-gray-600 opacity-60';
  if (seat.status === 'broken') return 'bg-red-700 opacity-60';
  if (seat.type === 'vip') return 'bg-purple-600 hover:bg-purple-500';
  if (seat.type === 'disability') return 'bg-cyan-600 hover:bg-cyan-500';
  return 'bg-blue-600 hover:bg-blue-500';
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [suggestedSeats, setSuggestedSeats] = useState<string[]>([]);
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ reasoning: string; scatterScore: number } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Booking form
  const [groupSize, setGroupSize] = useState(2);
  const [preference, setPreference] = useState('any');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    if (sessionId) fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) setSession(data.data);
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }

  // ─── Seat click (only in admin mode) ───
  function handleSeatClick(seat: SeatData) {
    if (!isAdminOverride) return; // Only allow manual selection in admin mode
    if (seat.status === 'broken') return;
    if (seat.status === 'booked') return;

    setSelectedSeats(prev =>
      prev.includes(seat.id)
        ? prev.filter(id => id !== seat.id)
        : [...prev, seat.id]
    );
  }

  // ─── Suggest seats (algorithm) ───
  async function handleSuggest() {
    setLoading(true);
    setSuggestedSeats([]);
    setSelectedSeats([]);
    setSuggestion(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/suggest-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupSize, preference }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestedSeats(data.data.seats);
        setSuggestion({ reasoning: data.data.reasoning, scatterScore: data.data.scatterScore });
      } else {
        showNotification('error', data.error);
      }
    } catch (e) {
      showNotification('error', 'Failed to get suggestions');
    }
    setLoading(false);
  }

  // ─── Accept suggestion ───
  function handleAccept() {
    setSelectedSeats([...suggestedSeats]);
    setSuggestedSeats([]);
  }

  // ─── Clear ───
  function handleClear() {
    setSelectedSeats([]);
    setSuggestedSeats([]);
    setSuggestion(null);
  }

  // ─── Book seats ───
  async function handleBook() {
    if (!customerName.trim() || !customerEmail.trim()) {
      showNotification('error', 'Please enter your name and email');
      return;
    }
    if (selectedSeats.length === 0) {
      showNotification('error', 'No seats selected');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          groupSize: selectedSeats.length,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          selectedSeats,
          isAdminOverride,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showNotification('success', `✅ Booked! Seats: ${data.data.seats.join(', ')} — Total: £${data.data.totalPrice}`);
        setSelectedSeats([]);
        setSuggestedSeats([]);
        setSuggestion(null);
        setCustomerName('');
        setCustomerEmail('');
        await fetchSession(); // Refresh seat map
      } else {
        showNotification('error', data.error);
      }
    } catch (e) {
      showNotification('error', 'Booking failed');
    }
    setLoading(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const movie = session.movieId;
  const seatLookup = new Map(session.seatMap.map(s => [s.id, s]));
  const available = session.totalSeats - session.bookedSeats;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl max-w-md ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">{movie.title}</h1>
            <p className="text-xs text-gray-400">
              {session.date} at {session.time} • {movie.genre} • {movie.duration}min
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {available} seats available
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ═══ LEFT: Seat Map ═══ */}
          <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 p-3 overflow-x-auto">
            <div className="min-w-[680px]">
              {/* Seat grid */}
              {ROW_ORDER.map(row => (
                <div key={row} className="flex items-center justify-center gap-[1px] mb-[2px]">
                  <span className="w-6 text-right text-xs font-bold text-gray-400 mr-1">{row}</span>
                  {ALL_COLS.map(col => {
                    const seat = seatLookup.get(`${row}-${col}`);
                    // Aisle gaps
                    const isLeftAisle = col === 5;
                    const isRightAisle = col === 25;

                    if (!seat) {
                      return (
                        <span key={col}>
                          {isLeftAisle && <span className="inline-block w-3" />}
                          <span className="inline-block w-6 h-6 sm:w-7 sm:h-7" />
                          {isRightAisle && <span className="inline-block w-3" />}
                        </span>
                      );
                    }

                    const isSelected = selectedSeats.includes(seat.id);
                    const isSuggested = suggestedSeats.includes(seat.id);
                    const color = getSeatColor(seat, isSelected, isSuggested);
                    const clickable = isAdminOverride
                      ? seat.status === 'available'
                      : false;

                    return (
                      <span key={col}>
                        {isLeftAisle && <span className="inline-block w-3" />}
                        <button
                          onClick={() => handleSeatClick(seat)}
                          disabled={!clickable && !isSelected}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-t-md text-[8px] sm:text-[9px] font-bold text-white transition-all ${color} ${
                            clickable || isSelected ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          title={`${seat.id} (${seat.type}) - ${seat.status}`}
                        >
                          {col}
                        </button>
                        {isRightAisle && <span className="inline-block w-3" />}
                      </span>
                    );
                  })}
                  <span className="w-6 text-left text-xs font-bold text-gray-400 ml-1">{row}</span>
                </div>
              ))}

              {/* Screen */}
              <div className="mt-6 max-w-xs mx-auto">
                <div className="h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
                <p className="text-center text-cyan-400 text-xs mt-1 font-bold tracking-widest">SCREEN</p>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px]">
                {[
                  ['bg-blue-600', 'Regular £10'],
                  ['bg-purple-600', 'VIP £18'],
                  ['bg-cyan-600', 'Disability £8'],
                  ['bg-red-700', 'Broken'],
                  ['bg-gray-600', 'Booked'],
                  ['bg-green-500', 'Selected'],
                  ['bg-yellow-400', 'Suggested'],
                ].map(([c, label]) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded-sm ${c}`} />
                    <span className="text-gray-400">{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT: Controls ═══ */}
          <div className="lg:w-72 space-y-3">

            {/* Admin Toggle */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Admin Override</p>
                  <p className="text-[10px] text-gray-500">Click seats manually</p>
                </div>
                <button
                  onClick={() => { setIsAdminOverride(!isAdminOverride); handleClear(); }}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isAdminOverride ? 'bg-red-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isAdminOverride ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            {/* Algorithm Suggestion (only when NOT admin) */}
            {!isAdminOverride && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <h3 className="text-sm font-semibold mb-2">🎯 Find Best Seats</h3>

                <label className="text-xs text-gray-400">Group Size</label>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5,6,7].map(n => (
                    <button
                      key={n}
                      onClick={() => setGroupSize(n)}
                      className={`flex-1 py-1 rounded text-xs font-bold ${
                        groupSize === n ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <label className="text-xs text-gray-400">Preference</label>
                <select
                  value={preference}
                  onChange={e => setPreference(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1 text-xs mb-2 border border-gray-600"
                >
                  <option value="any">Any</option>
                  <option value="back">Back Rows</option>
                  <option value="center">Center</option>
                  <option value="front">Front</option>
                  <option value="vip">VIP</option>
                </select>

                <button
                  onClick={handleSuggest}
                  disabled={loading}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg disabled:opacity-50 text-sm"
                >
                  {loading ? '⏳ Finding...' : '🎯 Suggest Seats'}
                </button>

                {/* Suggestion result */}
                {suggestion && suggestedSeats.length > 0 && (
                  <div className="mt-2 bg-gray-800 rounded p-2 border border-amber-600/30">
                    <p className="text-[10px] text-amber-300 mb-1">{suggestion.reasoning}</p>
                    <p className="text-[10px] text-gray-500">Seats: {suggestedSeats.join(', ')}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleAccept} className="flex-1 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded">
                        ✓ Accept
                      </button>
                      <button onClick={handleClear} className="flex-1 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded">
                        ✗ Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Seats & Book */}
            {selectedSeats.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 border border-green-600/30">
                <h3 className="text-sm font-semibold text-green-400 mb-2">
                  ✅ {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} Selected
                </h3>
                <p className="text-[10px] text-gray-400 mb-2 font-mono">{selectedSeats.join(', ')}</p>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1.5 text-xs mb-1.5 border border-gray-600 focus:border-green-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 rounded px-2 py-1.5 text-xs mb-2 border border-gray-600 focus:border-green-500 focus:outline-none"
                />

                <button
                  onClick={handleBook}
                  disabled={loading || !customerName.trim() || !customerEmail.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg disabled:opacity-50 text-sm"
                >
                  {loading ? '⏳ Booking...' : '✓ Confirm Booking'}
                </button>

                <button onClick={handleClear} className="w-full mt-1 py-1 text-gray-500 hover:text-gray-400 text-xs">
                  Cancel
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-lg font-bold text-blue-400">{available}</p>
                  <p className="text-[9px] text-gray-500">Available</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-lg font-bold text-amber-400">
                    {session.totalSeats > 0 ? ((session.bookedSeats / session.totalSeats) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[9px] text-gray-500">Occupancy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
