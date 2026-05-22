import { NextRequest, NextResponse } from 'next/server';
import { createSessionSeatMap } from '@/lib/session-initializer';
import { runStressTest, countScatteredSingleSeats } from '@/lib/seating-algorithm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fillPercentage = 50 } = body;

    // Create a fresh seat map for the stress test
    const { seatMap: freshMap } = createSessionSeatMap();

    const initialScattered = countScatteredSingleSeats(freshMap as any);

    const result = runStressTest(freshMap as any, fillPercentage);

    const finalScattered = countScatteredSingleSeats(result.finalSeatMap);
    const totalUsableSeats = result.finalSeatMap.filter(
      (s) => s.type !== 'broken' && s.status !== 'broken'
    ).length;
    const occupancyRate = (result.totalBooked / totalUsableSeats) * 100;

    // Calculate efficiency: lower scattered seats = higher efficiency
    const maxPossibleScattered = Math.floor(totalUsableSeats * 0.3);
    const efficiency = Math.max(
      0,
      Math.min(100, ((maxPossibleScattered - finalScattered) / maxPossibleScattered) * 100)
    );

    return NextResponse.json({
      success: true,
      data: {
        fillPercentage,
        totalUsableSeats,
        totalBooked: result.totalBooked,
        totalAvailable: result.totalAvailable,
        initialScatteredSingles: initialScattered,
        finalScatteredSingles: finalScattered,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        algorithmEfficiency: Math.round(efficiency * 100) / 100,
        totalBookings: result.bookingLog.length,
        bookingLog: result.bookingLog,
        finalSeatMap: result.finalSeatMap,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
