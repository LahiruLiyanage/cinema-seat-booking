import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import Booking from '@/models/Booking';
import { releaseSeatsFromSeatMap } from '@/lib/seating-algorithm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Booking already cancelled' }, { status: 400 });
    }

    // Release seats in session
    const session = await Session.findById(booking.sessionId);
    if (session) {
      const plainSeatMap = session.seatMap.map((s: any) =>
        typeof s.toObject === 'function' ? s.toObject() : { ...s }
      );
      const updatedSeatMap = releaseSeatsFromSeatMap(plainSeatMap, booking.seats);
      session.seatMap = updatedSeatMap as any;
      session.bookedSeats = Math.max(0, session.bookedSeats - booking.seats.length);
      await session.save();
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    return NextResponse.json({
      success: true,
      data: { message: 'Booking cancelled', releasedSeats: booking.seats },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
