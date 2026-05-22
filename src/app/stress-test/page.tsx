'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatMap from '@/components/SeatMap';

interface StressTestResult {
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

export default function StressTestPage() {
  const router = useRouter();
  const [fillPercentage, setFillPercentage] = useState(70);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<StressTestResult | null>(null);

  const runStressTest = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillPercentage }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Stress test failed:', err);
    }
    setIsRunning(false);
  };

  // Group size distribution for the chart
  const groupSizeDistribution = result
    ? [1, 2, 3, 4, 5, 6, 7].map((size) => ({
        size,
        count: result.bookingLog.filter((b) => b.groupSize === size).length,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Movies
          </button>
          <h1 className="text-lg font-bold">
            📊 Algorithm Stress Test
          </h1>
          <div />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Test Configuration</h2>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Fill Percentage: <span className="text-blue-400 font-bold">{fillPercentage}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={fillPercentage}
                onChange={(e) => setFillPercentage(Number(e.target.value))}
                className="w-64 accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1 w-64">
                <span>10%</span>
                <span>50%</span>
                <span>95%</span>
              </div>
            </div>

            <button
              onClick={runStressTest}
              disabled={isRunning}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-lg"
            >
              {isRunning ? '⏳ Running Simulation...' : '🚀 Run Stress Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Simulates filling the cinema to {fillPercentage}% capacity using realistic group size distribution (1-7 people). Measures scattered single seats and algorithm efficiency.
          </p>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-3xl font-black text-blue-400">{result.occupancyRate}%</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Actual Occupancy</div>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-3xl font-black text-emerald-400">{result.algorithmEfficiency}%</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Algorithm Efficiency</div>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-3xl font-black text-red-400">{result.finalScatteredSingles}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Scattered Singles</div>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-3xl font-black text-purple-400">{result.totalBookings}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Total Bookings</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Usable Seats:</span>
                    <span className="text-white font-mono">{result.totalUsableSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats Booked:</span>
                    <span className="text-blue-400 font-mono">{result.totalBooked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats Remaining:</span>
                    <span className="text-emerald-400 font-mono">{result.totalAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scattered Before:</span>
                    <span className="text-gray-500 font-mono">{result.initialScatteredSingles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scattered After:</span>
                    <span className="text-red-400 font-mono">{result.finalScatteredSingles}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Group Size Distribution</h3>
                <div className="space-y-2">
                  {groupSizeDistribution.map(({ size, count }) => {
                    const maxCount = Math.max(...groupSizeDistribution.map((g) => g.count));
                    const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={size} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-12">Size {size}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                            style={{ width: `${width}%` }}
                          >
                            {count > 0 && (
                              <span className="text-[10px] text-white font-bold">{count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Final Seat Map Visualization */}
            <div className="bg-gray-900/40 rounded-2xl border border-gray-800 p-4">
              <h3 className="text-lg font-bold mb-4 text-center">
                Final Seat Map After Stress Test
              </h3>
              <SeatMap
                seatMap={result.finalSeatMap}
                selectedSeats={[]}
                suggestedSeats={[]}
                onSeatClick={() => {}}
                isAdminOverride={false}
                disabled={true}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
