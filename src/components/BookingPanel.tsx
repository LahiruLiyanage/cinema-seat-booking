'use client';

import { useState } from 'react';

interface BookingPanelProps {
  sessionId: string;
  selectedSeats: string[];
  suggestedSeats: string[];
  onSuggestSeats: (groupSize: number, preference: string) => void;
  onAcceptSuggestion: () => void;
  onClearSelection: () => void;
  onBook: (customerName: string, customerEmail: string) => void;
  isAdminOverride: boolean;
  onToggleAdmin: () => void;
  scatteredCount: number;
  totalSeats: number;
  bookedSeats: number;
  suggestion: { reasoning: string; scatterScore: number } | null;
  isLoading: boolean;
}

export default function BookingPanel({
  sessionId,
  selectedSeats,
  suggestedSeats,
  onSuggestSeats,
  onAcceptSuggestion,
  onClearSelection,
  onBook,
  isAdminOverride,
  onToggleAdmin,
  scatteredCount,
  totalSeats,
  bookedSeats,
  suggestion,
  isLoading,
}: BookingPanelProps) {
  const [groupSize, setGroupSize] = useState(2);
  const [preference, setPreference] = useState('any');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const occupancy = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : '0';
  const availableSeats = totalSeats - bookedSeats;

  const handleSuggest = () => {
    onSuggestSeats(groupSize, preference);
  };

  const handleBook = () => {
    if (!customerName.trim() || !customerEmail.trim()) return;
    onBook(customerName, customerEmail);
    setCustomerName('');
    setCustomerEmail('');
    setShowBookingForm(false);
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Stats */}
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Session Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{availableSeats}</div>
            <div className="text-[10px] text-gray-500 uppercase">Available</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{occupancy}%</div>
            <div className="text-[10px] text-gray-500 uppercase">Occupancy</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{scatteredCount}</div>
            <div className="text-[10px] text-gray-500 uppercase">Scattered</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {selectedSeats.length}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Selected</div>
          </div>
        </div>
      </div>

      {/* Admin Override */}
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-300">Admin Override</div>
            <div className="text-[10px] text-gray-500">Bypass all seating rules</div>
          </div>
          <button
            onClick={onToggleAdmin}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              isAdminOverride ? 'bg-red-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                isAdminOverride ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Seat Suggestion */}
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Find Seats
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Group Size</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setGroupSize(n)}
                  className={`flex-1 py-1.5 rounded text-sm font-bold transition-all ${
                    groupSize === n
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Preference</label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="any">Any Available</option>
              <option value="back">Back Rows (Premium View)</option>
              <option value="center">Center Rows</option>
              <option value="front">Front Rows</option>
              <option value="vip">VIP Section</option>
            </select>
          </div>

          <button
            onClick={handleSuggest}
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {isLoading ? '⏳ Finding...' : '🎯 Suggest Best Seats'}
          </button>
        </div>

        {/* Suggestion result */}
        {suggestion && (
          <div className="mt-3 bg-gray-900/50 rounded-lg p-3 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-semibold mb-1">
              Algorithm Suggestion
            </div>
            <div className="text-xs text-gray-400">{suggestion.reasoning}</div>
            <div className="text-xs text-gray-500 mt-1">
              Scatter Score: {suggestion.scatterScore}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onAcceptSuggestion}
                className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-500 transition-colors"
              >
                ✓ Accept
              </button>
              <button
                onClick={onClearSelection}
                className="flex-1 py-1.5 bg-gray-600 text-white text-xs font-bold rounded hover:bg-gray-500 transition-colors"
              >
                ✗ Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form */}
      {selectedSeats.length > 0 && (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Book Seats
          </h3>
          <div className="text-xs text-gray-400 mb-2">
            Selected:{' '}
            <span className="text-emerald-300 font-mono">{selectedSeats.join(', ')}</span>
          </div>

          {!showBookingForm ? (
            <button
              onClick={() => setShowBookingForm(true)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              Proceed to Book ({selectedSeats.length} seats)
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleBook}
                disabled={!customerName.trim() || !customerEmail.trim() || isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? '⏳ Booking...' : `✓ Confirm Booking`}
              </button>
              <button
                onClick={() => setShowBookingForm(false)}
                className="w-full py-1.5 text-gray-400 text-xs hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
