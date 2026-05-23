'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TestResult {
  fillPercentage: number;
  totalUsableSeats: number;
  totalBooked: number;
  totalAvailable: number;
  initialScatteredSingles: number;
  finalScatteredSingles: number;
  occupancyRate: number;
  algorithmEfficiency: number;
  totalBookings: number;
  bookingLog: { groupSize: number; seats: string[]; scatterScore: number }[];
  finalSeatMap: any[];
}

const ROW_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
const ALL_COLS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function StressTestPage() {
  const router = useRouter();
  const [fillPct, setFillPct] = useState(70);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function runTest() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillPercentage: fillPct }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch (e) {
      console.error('Stress test failed:', e);
    }
    setRunning(false);
  }

  // Group size counts
  const groupCounts = result
    ? [1,2,3,4,5,6,7].map(size => ({
        size,
        count: result.bookingLog.filter(b => b.groupSize === size).length,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-lg font-bold">📊 Algorithm Stress Test</h1>
          <div />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm text-gray-400">
                Fill: <span className="text-blue-400 font-bold">{fillPct}%</span>
              </label>
              <input type="range" min="10" max="95" step="5" value={fillPct}
                onChange={e => setFillPct(Number(e.target.value))}
                className="w-60 block accent-blue-500"
              />
            </div>
            <button onClick={runTest} disabled={running}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50"
            >
              {running ? '⏳ Running...' : '🚀 Run Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Simulates random bookings (group sizes 1–7) until {fillPct}% full. Measures scattered single seats.
          </p>
        </div>

        {result && (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                [result.occupancyRate + '%', 'Occupancy', 'text-blue-400'],
                [result.algorithmEfficiency + '%', 'Efficiency', 'text-emerald-400'],
                [String(result.finalScatteredSingles), 'Scattered', 'text-red-400'],
                [String(result.totalBookings), 'Bookings', 'text-purple-400'],
              ].map(([val, label, color]) => (
                <div key={label} className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{val}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                </div>
              ))}
            </div>

            {/* Stats + Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Summary</h3>
                <div className="space-y-1 text-sm">
                  {[
                    ['Usable Seats', result.totalUsableSeats],
                    ['Booked', result.totalBooked],
                    ['Remaining', result.totalAvailable],
                    ['Scattered Before', result.initialScatteredSingles],
                    ['Scattered After', result.finalScatteredSingles],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between">
                      <span className="text-gray-400">{label}:</span>
                      <span className="font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Group Distribution</h3>
                {groupCounts.map(({ size, count }) => {
                  const max = Math.max(...groupCounts.map(g => g.count), 1);
                  return (
                    <div key={size} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-10">Size {size}</span>
                      <div className="flex-1 bg-gray-800 rounded h-3 overflow-hidden">
                        <div className="h-3 bg-blue-600 rounded" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Seat Map */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-3 overflow-x-auto">
              <h3 className="text-sm font-bold text-center mb-3">Final Seat Map</h3>
              <div className="min-w-[680px]">
                {ROW_ORDER.map(row => {
                  const lookup = new Map(result.finalSeatMap.filter((s: any) => s.row === row).map((s: any) => [s.id, s]));
                  return (
                    <div key={row} className="flex items-center justify-center gap-[1px] mb-[2px]">
                      <span className="w-6 text-right text-xs font-bold text-gray-400 mr-1">{row}</span>
                      {ALL_COLS.map(col => {
                        const seat = lookup.get(`${row}-${col}`) as any;
                        const isLeftAisle = col === 5;
                        const isRightAisle = col === 25;
                        if (!seat) {
                          return (
                            <span key={col}>
                              {isLeftAisle && <span className="inline-block w-3" />}
                              <span className="inline-block w-6 h-6" />
                              {isRightAisle && <span className="inline-block w-3" />}
                            </span>
                          );
                        }
                        const color = seat.status === 'booked' ? 'bg-gray-600' :
                          seat.status === 'broken' ? 'bg-red-700' :
                          seat.type === 'vip' ? 'bg-purple-600' :
                          seat.type === 'disability' ? 'bg-cyan-600' : 'bg-blue-600';
                        return (
                          <span key={col}>
                            {isLeftAisle && <span className="inline-block w-3" />}
                            <span className={`inline-block w-6 h-6 rounded-t-md ${color} opacity-80`} />
                            {isRightAisle && <span className="inline-block w-3" />}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
