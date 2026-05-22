import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { findOptimalSeats, findOptimalSoloSeat, countScatteredSingleSeats } from '@/lib/seating-algorithm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { groupSize, preference = 'any', isAdminOverride = false } = body;

    if (!groupSize || groupSize < 1 || groupSize > 7) {
      return NextResponse.json(
        { success: false, error: 'groupSize must be between 1 and 7' },
        { status: 400 }
      );
    }

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const suggestion = groupSize === 1
      ? findOptimalSoloSeat(session.seatMap as any, preference)
      : findOptimalSeats(session.seatMap as any, groupSize, preference, isAdminOverride);

    if (!suggestion) {
      return NextResponse.json({
        success: false,
        error: `Cannot find ${groupSize} contiguous seats. The cinema may be too full.`,
        scatteredSingleSeats: countScatteredSingleSeats(session.seatMap as any),
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      data: suggestion,
      scatteredSingleSeats: countScatteredSingleSeats(session.seatMap as any),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
