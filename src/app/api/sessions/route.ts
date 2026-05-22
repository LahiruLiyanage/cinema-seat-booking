import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { createSessionSeatMap } from '@/lib/session-initializer';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const date = searchParams.get('date');

    const filter: any = { isActive: true };
    if (movieId) filter.movieId = movieId;
    if (date) filter.date = date;

    const sessions = await Session.find(filter)
      .populate('movieId', 'title genre duration posterUrl rating')
      .sort({ date: 1, time: 1 })
      .lean();

    // Return sessions without the full seatMap for listing (too large)
    const sessionsLite = sessions.map((s: any) => ({
      ...s,
      seatMap: undefined,
      availableSeats: s.totalSeats - s.bookedSeats,
    }));

    return NextResponse.json({ success: true, data: sessionsLite });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { movieId, date, time } = body;

    if (!movieId || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'movieId, date, and time are required' },
        { status: 400 }
      );
    }

    // Generate fresh seat map with randomized broken/disability seats
    const { seatMap, disabilitySeats, brokenSeats, totalSeats } = createSessionSeatMap();

    const session = await Session.create({
      movieId,
      date,
      time,
      seatMap,
      totalSeats,
      bookedSeats: 0,
      brokenSeats,
      disabilitySeats,
    });

    return NextResponse.json({ success: true, data: { _id: session._id, totalSeats } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
