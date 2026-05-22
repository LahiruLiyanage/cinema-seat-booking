import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISeatState {
  id: string;
  row: string;
  col: number;
  type: 'regular' | 'vip' | 'disability' | 'broken';
  segment: 'left' | 'center' | 'right';
  status: 'available' | 'booked' | 'broken' | 'blocked';
  bookingId?: string;
}

export interface ISession extends Document {
  movieId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  seatMap: ISeatState[];
  totalSeats: number;
  bookedSeats: number;
  brokenSeats: string[]; // array of seat IDs
  disabilitySeats: string[]; // array of seat IDs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeatStateSchema = new Schema<ISeatState>(
  {
    id: { type: String, required: true },
    row: { type: String, required: true },
    col: { type: Number, required: true },
    type: { type: String, enum: ['regular', 'vip', 'disability', 'broken'], required: true },
    segment: { type: String, enum: ['left', 'center', 'right'], required: true },
    status: { type: String, enum: ['available', 'booked', 'broken', 'blocked'], default: 'available' },
    bookingId: { type: String },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    seatMap: { type: [SeatStateSchema], required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, default: 0 },
    brokenSeats: { type: [String], default: [] },
    disabilitySeats: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default Session;
