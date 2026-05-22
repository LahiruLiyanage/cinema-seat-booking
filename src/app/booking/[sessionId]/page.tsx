'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SeatMap from '@/components/SeatMap';
import BookingPanel from '@/components/BookingPanel';

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
  movieId: {
    title: string;
    genre: string;
    duration: number;
    rating: string;
  };
  date: string;
  time: string;
  seatMap: SeatData[];
  totalSeats: number;
  bookedSeats: number;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [suggestedSeats, setSuggestedSeats] = useState<string[]>([]);
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scatteredCount, setScatteredCount] = useState(0);
  const [suggestion, setSuggestion] = useState<{
    reasoning: string;
    scatterScore: number;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        // Count initial scattered seats
        countScattered(data.data.seatMap);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  const countScattered = (seatMap: SeatData[]) => {
    // Simple client-side count of isolated available seats
    const ROW_DEFINITIONS: Record<string, number[]> = {
      A: [1,2,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,27,28],
      B: [1,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,26,27,28],
      C: [1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26,27,28],
      D: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
      E: [1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26,27,28],
      F: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
      G: [1,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,26,27,28],
      H: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
      I: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
      J: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,27,28],
      K: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
      L: [7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,26,27,28],
      M: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],
      N: [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
      O: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,20],
    };

    const lookup = new Map(seatMap.map(s => [s.id, s]));
    let count = 0;

    for (const [row, cols] of Object.entries(ROW_DEFINITIONS)) {
      for (let i = 0; i < cols.length; i++) {
        const seat = lookup.get(`${row}-${cols[i]}`);
        if (!seat || seat.status !== 'available') continue;

        const leftSeat = i > 0 ? lookup.get(`${row}-${cols[i-1]}`) : null;
        const rightSeat = i < cols.length - 1 ? lookup.get(`${row}-${cols[i+1]}`) : null;
        const leftBlocked = !leftSeat || leftSeat.status === 'booked' || leftSeat.status === 'broken';
        const rightBlocked = !rightSeat || rightSeat.status === 'booked' || rightSeat.status === 'broken';
        if (leftBlocked && rightBlocked) count++;
      }
    }
    setScatteredCount(count);
  };

  const handleSeatClick = useCallback((seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= 7 && !isAdminOverride) {
        return prev;
      }
      return [...prev, seatId];
    });
  }, [isAdminOverride]);

  const handleSuggestSeats = async (groupSize: number, preference: string) => {
    setIsLoading(true);
    setSuggestion(null);
    setSuggestedSeats([]);
    setSelectedSeats([]);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/suggest-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupSize, preference, isAdminOverride }),
      });
      const data = await res.json();

      if (data.success) {
        setSuggestedSeats(data.data.seats);
        setSuggestion({
          reasoning: data.data.reasoning,
          scatterScore: data.data.scatterScore,
        });
        if (data.scatteredSingleSeats !== undefined) {
          setScatteredCount(data.scatteredSingleSeats);
        }
      } else {
        setNotification({ type: 'error', message: data.error });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to get suggestions' });
      setTimeout(() => setNotification(null), 4000);
    }
    setIsLoading(false);
  };

  const handleAcceptSuggestion = () => {
    setSelectedSeats([...suggestedSeats]);
    setSuggestedSeats([]);
  };

  const handleClearSelection = () => {
    setSelectedSeats([]);
    setSuggestedSeats([]);
    setSuggestion(null);
  };

  const handleBook = async (customerName: string, customerEmail: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          groupSize: selectedSeats.length,
          customerName,
          customerEmail,
          isAdminOverride,
          selectedSeats: isAdminOverride ? selectedSeats : undefined,
          seatPreference: 'any',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: 'success',
          message: `Booking confirmed! Seats: ${data.data.seats.join(', ')} — Total: £${data.data.totalPrice}`,
        });
        setSelectedSeats([]);
        setSuggestedSeats([]);
        setSuggestion(null);
        // Refresh session data
        await fetchSession();
      } else {
        setNotification({ type: 'error', message: data.error });
      }
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create booking' });
      setTimeout(() => setNotification(null), 4000);
    }
    setIsLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const movie = session.movieId;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl transition-all animate-slide-in ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition-colors">
            ← Back to Movies
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">{movie.title}</h1>
            <p className="text-xs text-gray-400">
              {session.date} at {session.time} • {movie.genre} • {movie.duration}min • {movie.rating}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            Session ID: {sessionId.slice(-6)}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Seat Map */}
          <div className="flex-1 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
            <SeatMap
              seatMap={session.seatMap}
              selectedSeats={selectedSeats}
              suggestedSeats={suggestedSeats}
              onSeatClick={handleSeatClick}
              isAdminOverride={isAdminOverride}
            />
          </div>

          {/* Booking Panel */}
          <div className="lg:w-80">
            <BookingPanel
              sessionId={sessionId}
              selectedSeats={selectedSeats}
              suggestedSeats={suggestedSeats}
              onSuggestSeats={handleSuggestSeats}
              onAcceptSuggestion={handleAcceptSuggestion}
              onClearSelection={handleClearSelection}
              onBook={handleBook}
              isAdminOverride={isAdminOverride}
              onToggleAdmin={() => setIsAdminOverride(!isAdminOverride)}
              scatteredCount={scatteredCount}
              totalSeats={session.totalSeats}
              bookedSeats={session.bookedSeats}
              suggestion={suggestion}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
