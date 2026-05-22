import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  sessionId: mongoose.Types.ObjectId;
  seats: string[]; // Array of seat IDs like ['E-12', 'E-13']
  groupSize: number;
  customerName: string;
  customerEmail: string;
  status: 'confirmed' | 'cancelled';
  isAdminOverride: boolean;
  totalPrice: number;
  bookedAt: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    seats: { type: [String], required: true },
    groupSize: { type: Number, required: true, min: 1, max: 7 },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    isAdminOverride: { type: Boolean, default: false },
    totalPrice: { type: Number, default: 0 },
    bookedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
