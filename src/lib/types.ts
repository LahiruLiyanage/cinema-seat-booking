// Seat types
export type SeatType = 'regular' | 'vip' | 'disability' | 'broken';
export type SeatStatus = 'available' | 'booked' | 'selected' | 'broken' | 'blocked';
export type SeatSegment = 'left' | 'center' | 'right';

export interface CinemaSeat {
  id: string;        // e.g., "E-12"
  row: string;       // e.g., "E"
  col: number;       // e.g., 12
  type: SeatType;
  segment: SeatSegment;
  exists: boolean;
}

export interface SeatState {
  id: string;
  row: string;
  col: number;
  type: SeatType;
  segment: SeatSegment;
  exists: boolean;
  status: SeatStatus;
  bookingId?: string;
}

export interface BookingRequest {
  sessionId: string;
  groupSize: number;
  customerName: string;
  customerEmail: string;
  seatPreference?: 'any' | 'vip' | 'back' | 'front' | 'center';
  isAdminOverride?: boolean;
  selectedSeats?: string[]; // For manual selection or admin override
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  seats?: string[];
  message: string;
  scatterScore?: number;
}

export interface AlgorithmSuggestion {
  seats: string[];
  scatterScore: number;
  reasoning: string;
}

export interface StressTestConfig {
  fillPercentage: number;
  groupSizeDistribution: { size: number; weight: number }[];
  includesSoloBookings: boolean;
}

export interface StressTestResult {
  totalBookings: number;
  totalSeatsBooked: number;
  scatteredSingleSeats: number;
  occupancyRate: number;
  algorithmEfficiency: number; // 0-100 score
  bookingLog: { groupSize: number; seats: string[]; scatterScore: number }[];
}
