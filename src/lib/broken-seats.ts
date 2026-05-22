import { CinemaSeat } from './types';
import { getSeatId, areColumnsAdjacent } from './cinema-layout';

/**
 * Generate 6-10 randomly broken seats for a session.
 * Constraints:
 * - Max 2 broken seats per row
 * - Broken seats cannot be adjacent in the same row
 * - Broken seats cannot be VIP or disability seats
 */
export function generateBrokenSeats(
  layout: CinemaSeat[],
  disabilitySeats: string[]
): string[] {
  const brokenCount = Math.floor(Math.random() * 5) + 6; // 6 to 10
  const brokenSeats: string[] = [];
  const brokenPerRow: Record<string, number> = {};
  const brokenColsPerRow: Record<string, number[]> = {};

  // Get eligible seats (not VIP, not disability)
  const eligible = layout.filter(
    (seat) =>
      seat.exists &&
      seat.type !== 'vip' &&
      !disabilitySeats.includes(seat.id)
  );

  // Shuffle eligible seats
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);

  for (const seat of shuffled) {
    if (brokenSeats.length >= brokenCount) break;

    const rowCount = brokenPerRow[seat.row] || 0;
    if (rowCount >= 2) continue; // Max 2 per row

    // Check adjacency with existing broken seats in same row
    const existingCols = brokenColsPerRow[seat.row] || [];
    const isAdjacentToBroken = existingCols.some((col) =>
      areColumnsAdjacent(seat.row, seat.col, col)
    );
    if (isAdjacentToBroken) continue;

    brokenSeats.push(seat.id);
    brokenPerRow[seat.row] = rowCount + 1;
    brokenColsPerRow[seat.row] = [...existingCols, seat.col];
  }

  return brokenSeats;
}
