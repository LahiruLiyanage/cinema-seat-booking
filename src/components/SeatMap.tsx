'use client';

import { useState, useCallback } from 'react';

interface SeatData {
  id: string;
  row: string;
  col: number;
  type: 'regular' | 'vip' | 'disability' | 'broken';
  segment: 'left' | 'center' | 'right';
  status: 'available' | 'booked' | 'broken' | 'blocked';
  bookingId?: string;
}

interface SeatMapProps {
  seatMap: SeatData[];
  selectedSeats: string[];
  suggestedSeats: string[];
  onSeatClick: (seatId: string) => void;
  isAdminOverride: boolean;
  disabled?: boolean;
}

const ROW_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

function getSeatColor(seat: SeatData, isSelected: boolean, isSuggested: boolean): string {
  if (isSelected) return 'bg-emerald-500 ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/30';
  if (isSuggested) return 'bg-amber-400 ring-2 ring-amber-300 animate-pulse';

  switch (seat.status) {
    case 'booked':
      return 'bg-gray-600 cursor-not-allowed opacity-60';
    case 'broken':
      return 'bg-red-600 cursor-not-allowed opacity-70';
  }

  switch (seat.type) {
    case 'vip':
      return 'bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/30';
    case 'disability':
      return 'bg-cyan-500 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30';
    default:
      return 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30';
  }
}

export default function SeatMap({
  seatMap,
  selectedSeats,
  suggestedSeats,
  onSeatClick,
  isAdminOverride,
  disabled,
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Create a map for quick lookup
  const seatLookup = new Map<string, SeatData>();
  seatMap.forEach((s) => seatLookup.set(s.id, s));

  const handleSeatClick = useCallback(
    (seat: SeatData) => {
      if (disabled) return;
      if (seat.status === 'broken') return;
      if (seat.status === 'booked' && !isAdminOverride) return;
      onSeatClick(seat.id);
    },
    [disabled, isAdminOverride, onSeatClick]
  );

  const renderSeat = (row: string, col: number) => {
    const seatId = `${row}-${col}`;
    const seat = seatLookup.get(seatId);

    if (!seat) {
      // No seat at this position - render empty space
      return <div key={seatId} className="w-7 h-7 sm:w-8 sm:h-8" />;
    }

    const isSelected = selectedSeats.includes(seatId);
    const isSuggested = suggestedSeats.includes(seatId);
    const colorClass = getSeatColor(seat, isSelected, isSuggested);
    const isClickable =
      seat.status === 'available' || (isAdminOverride && seat.status === 'booked');

    return (
      <div key={seatId} className="relative">
        <button
          onClick={() => handleSeatClick(seat)}
          onMouseEnter={() => setHoveredSeat(seatId)}
          onMouseLeave={() => setHoveredSeat(null)}
          disabled={!isClickable && !isSelected}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-[9px] sm:text-[10px] font-bold text-white transition-all duration-200 ${colorClass} ${
            isClickable || isSelected ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
          title={`${seatId} (${seat.type}) - ${seat.status}`}
        >
          {col}
        </button>
        {/* Tooltip */}
        {hoveredSeat === seatId && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap shadow-xl pointer-events-none">
            <div className="font-bold">{seatId}</div>
            <div className="capitalize">
              {seat.type} • {seat.status}
            </div>
            {seat.type === 'vip' && <div className="text-purple-300">£18</div>}
            {seat.type === 'regular' && <div className="text-blue-300">£10</div>}
            {seat.type === 'disability' && <div className="text-cyan-300">£8</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px] mx-auto px-2 py-4">
        {/* Column numbers */}
        <div className="flex items-center justify-center mb-2 gap-[2px]">
          <div className="w-8 flex-shrink-0" />
          {/* Left wing 1-4 */}
          {[1, 2, 3, 4].map((col) => (
            <div
              key={col}
              className="w-7 sm:w-8 text-center text-[10px] text-gray-400 font-mono"
            >
              {col}
            </div>
          ))}
          {/* Aisle */}
          <div className="w-4 sm:w-5" />
          {/* Center 5-24 */}
          {Array.from({ length: 20 }, (_, i) => i + 5).map((col) => (
            <div
              key={col}
              className="w-7 sm:w-8 text-center text-[10px] text-gray-400 font-mono"
            >
              {col}
            </div>
          ))}
          {/* Aisle */}
          <div className="w-4 sm:w-5" />
          {/* Right wing 25-28 */}
          {[25, 26, 27, 28].map((col) => (
            <div
              key={col}
              className="w-7 sm:w-8 text-center text-[10px] text-gray-400 font-mono"
            >
              {col}
            </div>
          ))}
          <div className="w-8 flex-shrink-0" />
        </div>

        {/* Seat rows */}
        {ROW_ORDER.map((row) => (
          <div key={row} className="flex items-center justify-center gap-[2px] mb-[3px]">
            {/* Row label left */}
            <div className="w-8 text-right pr-2 text-sm font-bold text-gray-300 flex-shrink-0">
              {row}
            </div>

            {/* Left wing (1-4) */}
            {[1, 2, 3, 4].map((col) => renderSeat(row, col))}

            {/* Left aisle gap */}
            <div className="w-4 sm:w-5 flex items-center justify-center">
              {row === 'H' && <div className="w-px h-8 bg-gray-700" />}
            </div>

            {/* Center (5-24) */}
            {Array.from({ length: 20 }, (_, i) => i + 5).map((col) =>
              renderSeat(row, col)
            )}

            {/* Right aisle gap */}
            <div className="w-4 sm:w-5 flex items-center justify-center">
              {row === 'H' && <div className="w-px h-8 bg-gray-700" />}
            </div>

            {/* Right wing (25-28) */}
            {[25, 26, 27, 28].map((col) => renderSeat(row, col))}

            {/* Row label right */}
            <div className="w-8 text-left pl-2 text-sm font-bold text-gray-300 flex-shrink-0">
              {row}
            </div>
          </div>
        ))}

        {/* Screen */}
        <div className="mt-8 mx-auto max-w-md">
          <div className="relative">
            <div className="h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
            <div className="text-center mt-2 text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm">
              Screen
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-blue-600" />
            <span className="text-gray-300">Regular (£10)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-purple-600" />
            <span className="text-gray-300">VIP (£18)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-cyan-500" />
            <span className="text-gray-300">Disability (£8)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-red-600" />
            <span className="text-gray-300">Broken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-gray-600" />
            <span className="text-gray-300">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-emerald-500 ring-1 ring-emerald-300" />
            <span className="text-gray-300">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-t-md bg-amber-400 animate-pulse" />
            <span className="text-gray-300">Suggested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
