import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  genre: string;
  duration: number; // in minutes
  posterUrl: string;
  rating: string; // e.g., 'PG-13', 'R'
  releaseYear: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true },
    genre: { type: String, required: true },
    duration: { type: Number, required: true },
    posterUrl: { type: String, required: true },
    rating: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Movie: Model<IMovie> = mongoose.models.Movie || mongoose.model<IMovie>('Movie', MovieSchema);
export default Movie;
