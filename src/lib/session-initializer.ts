import { generateBaseLayout, generateDisabilitySeats, getTotalSeatCount } from './cinema-layout';
import { generateBrokenSeats } from './broken-seats';
import { initializeSessionSeatMap } from './seating-algorithm';
import { ISeatState } from '@/models/Session';
import { CinemaSeat } from './types';

/**
 * Create a fresh seat map for a new cinema session.
 * This generates:
 * 1. Base layout with regular + VIP seats
 * 2. Random disability seat placement (6 seats in rows N, O)
 * 3. Random broken seat placement (6-10 seats)
 * 4. Combines everything into the final seat map
 */
export function createSessionSeatMap(): {
  seatMap: ISeatState[];
  disabilitySeats: string[];
  brokenSeats: string[];
  totalSeats: number;
} {
  // Step 1: Generate base layout
  const baseLayout: CinemaSeat[] = generateBaseLayout();

  // Step 2: Generate disability seats (6, always adjacent pairs in N/O)
  const disabilitySeats = generateDisabilitySeats();

  // Step 3: Generate broken seats (6-10, not VIP/disability, max 2/row, not adjacent)
  const brokenSeats = generateBrokenSeats(baseLayout, disabilitySeats);

  // Step 4: Convert to ISeatState format
  const baseSeatState: ISeatState[] = baseLayout.map((seat) => ({
    id: seat.id,
    row: seat.row,
    col: seat.col,
    type: seat.type,
    segment: seat.segment,
    status: 'available' as const,
  }));

  // Step 5: Apply disability and broken seats
  const finalSeatMap = initializeSessionSeatMap(baseSeatState, disabilitySeats, brokenSeats);

  // Step 6: Count usable seats (total minus broken)
  const totalSeats = finalSeatMap.filter((s) => s.status !== 'broken').length;

  return {
    seatMap: finalSeatMap,
    disabilitySeats,
    brokenSeats,
    totalSeats,
  };
}
