import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';

export async function GET() {
  try {
    await dbConnect();
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: movies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const movie = await Movie.create(body);
    return NextResponse.json({ success: true, data: movie }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
