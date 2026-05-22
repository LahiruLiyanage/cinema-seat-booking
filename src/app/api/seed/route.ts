import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import Session from '@/models/Session';
import { createSessionSeatMap } from '@/lib/session-initializer';

const SAMPLE_MOVIES = [
  {
    title: 'The Dark Knight Returns',
    genre: 'Action',
    duration: 152,
    posterUrl: '/posters/dark-knight.jpg',
    rating: 'PG-13',
    releaseYear: 2025,
    description: 'The legendary hero rises once more in this epic conclusion to the trilogy.',
  },
  {
    title: 'Stellar Odyssey',
    genre: 'Sci-Fi',
    duration: 138,
    posterUrl: '/posters/stellar-odyssey.jpg',
    rating: 'PG-13',
    releaseYear: 2026,
    description: 'A breathtaking journey through the cosmos that challenges the boundaries of human exploration.',
  },
  {
    title: 'Whispers in the Rain',
    genre: 'Drama',
    duration: 118,
    posterUrl: '/posters/whispers-rain.jpg',
    rating: 'R',
    releaseYear: 2026,
    description: 'An intimate story of love, loss, and redemption set against the backdrop of a rainy coastal town.',
  },
  {
    title: 'Laugh Factory',
    genre: 'Comedy',
    duration: 105,
    posterUrl: '/posters/laugh-factory.jpg',
    rating: 'PG',
    releaseYear: 2026,
    description: 'A hilarious ensemble comedy about the chaotic lives of struggling stand-up comedians.',
  },
  {
    title: 'Shadow Protocol',
    genre: 'Thriller',
    duration: 130,
    posterUrl: '/posters/shadow-protocol.jpg',
    rating: 'R',
    releaseYear: 2025,
    description: 'A covert agent must unravel a global conspiracy before time runs out.',
  },
];

export async function POST() {
  try {
    await dbConnect();

    // Clear existing data
    await Movie.deleteMany({});
    await Session.deleteMany({});

    // Create movies
    const movies = await Movie.insertMany(SAMPLE_MOVIES);

    // Create sessions for each movie (today, tomorrow, day after)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0],
      dayAfter.toISOString().split('T')[0],
    ];
    const times = ['10:00', '13:30', '16:00', '19:00', '21:30'];

    const sessions = [];
    for (const movie of movies) {
      for (const date of dates) {
        // Pick 2-3 random times per date
        const shuffledTimes = [...times].sort(() => Math.random() - 0.5);
        const selectedTimes = shuffledTimes.slice(0, Math.floor(Math.random() * 2) + 2);

        for (const time of selectedTimes) {
          const { seatMap, disabilitySeats, brokenSeats, totalSeats } = createSessionSeatMap();
          sessions.push({
            movieId: movie._id,
            date,
            time,
            seatMap,
            totalSeats,
            bookedSeats: 0,
            brokenSeats,
            disabilitySeats,
          });
        }
      }
    }

    await Session.insertMany(sessions);

    return NextResponse.json({
      success: true,
      data: {
        moviesCreated: movies.length,
        sessionsCreated: sessions.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
