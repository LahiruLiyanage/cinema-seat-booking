import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import Booking from '@/models/Booking';
import { findOptimalSeats, findOptimalSoloSeat, applyBookingToSeatMap, countScatteredSingleSeats } from '@/lib/seating-algorithm';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const filter: any = {};
    if (sessionId) filter.sessionId = sessionId;

    const bookings = await Booking.find(filter).sort({ bookedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      sessionId,
      groupSize,
      customerName,
      customerEmail,
      seatPreference = 'any',
      isAdminOverride = false,
      selectedSeats,
    } = body;

    if (!sessionId || !groupSize || !customerName || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'sessionId, groupSize, customerName, and customerEmail are required' },
        { status: 400 }
      );
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    let seatsToBook: string[];

    if (isAdminOverride && selectedSeats && selectedSeats.length > 0) {
      // Admin override: use manually selected seats
      const unavailable = selectedSeats.filter((seatId: string) => {
        const seat = session.seatMap.find((s: any) => s.id === seatId);
        return !seat || seat.status !== 'available';
      });
      if (unavailable.length > 0) {
        return NextResponse.json(
          { success: false, error: `Seats not available: ${unavailable.join(', ')}` },
          { status: 409 }
        );
      }
      seatsToBook = selectedSeats;
    } else {
      // Use algorithm to find best seats
      const suggestion = groupSize === 1
        ? findOptimalSoloSeat(session.seatMap as any, seatPreference)
        : findOptimalSeats(session.seatMap as any, groupSize, seatPreference, false);

      if (!suggestion || suggestion.seats.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No suitable seats available for the requested group size.' },
          { status: 409 }
        );
      }
      seatsToBook = suggestion.seats;
    }

    // Calculate price
    const pricePerSeat: Record<string, number> = { regular: 10, vip: 18, disability: 8, broken: 0 };
    let totalPrice = 0;
    for (const seatId of seatsToBook) {
      const seat = session.seatMap.find((s: any) => s.id === seatId);
      if (seat) totalPrice += pricePerSeat[seat.type] || 10;
    }

    // Create booking
    const booking = await Booking.create({
      sessionId,
      seats: seatsToBook,
      groupSize: seatsToBook.length,
      customerName,
      customerEmail,
      isAdminOverride,
      totalPrice,
    });

    // Update session seat map
    const updatedSeatMap = applyBookingToSeatMap(
      session.seatMap as any,
      seatsToBook,
      booking._id.toString()
    );

    await Session.findByIdAndUpdate(sessionId, {
      seatMap: updatedSeatMap,
      bookedSeats: session.bookedSeats + seatsToBook.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking._id,
        seats: seatsToBook,
        totalPrice,
        scatteredSingleSeats: countScatteredSingleSeats(updatedSeatMap),
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
