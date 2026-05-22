import { SeatState, AlgorithmSuggestion } from './types';
import { ROW_PRIORITY, ROW_DEFINITIONS, parseSeatId } from './cinema-layout';
import { ISeatState } from '@/models/Session';

// ============================================================
// TYPES
// ============================================================

interface ContiguousSegment {
  seats: ISeatState[];
  row: string;
  startCol: number;
  endCol: number;
  length: number;
  segmentType: 'left' | 'center' | 'right';
}

interface PlacementOption {
  seats: string[];
  row: string;
  scatterScore: number;
  reasoning: string;
  segment: ContiguousSegment;
  position: 'left-edge' | 'right-edge' | 'perfect-fit' | 'center';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all available (bookable) seats from a seat map
 */
function getAvailableSeats(seatMap: ISeatState[]): ISeatState[] {
  return seatMap.filter(
    (s) => s.status === 'available' && s.type !== 'broken'
  );
}

/**
 * Get seats for a specific row, sorted by column
 */
function getRowSeatsSorted(seatMap: ISeatState[], row: string): ISeatState[] {
  return seatMap
    .filter((s) => s.row === row)
    .sort((a, b) => a.col - b.col);
}

/**
 * Find contiguous segments of available seats in a row.
 * A segment breaks at:
 *   - A booked seat
 *   - A broken seat
 *   - An aisle gap (non-consecutive column numbers in the row definition)
 */
function findContiguousSegments(
  seatMap: ISeatState[],
  row: string
): ContiguousSegment[] {
  const rowSeats = getRowSeatsSorted(seatMap, row);
  const rowCols = ROW_DEFINITIONS[row];
  if (!rowCols || rowCols.length === 0) return [];

  const segments: ContiguousSegment[] = [];
  let currentSegment: ISeatState[] = [];

  for (let i = 0; i < rowSeats.length; i++) {
    const seat = rowSeats[i];

    // Skip non-available seats (booked, broken)
    if (seat.status !== 'available') {
      // End current segment if it has seats
      if (currentSegment.length > 0) {
        segments.push(buildSegment(currentSegment, row));
        currentSegment = [];
      }
      continue;
    }

    // Check if this seat is consecutive with the previous one in the row definition
    if (currentSegment.length > 0) {
      const prevSeat = currentSegment[currentSegment.length - 1];
      const prevIdx = rowCols.indexOf(prevSeat.col);
      const currIdx = rowCols.indexOf(seat.col);

      // If not consecutive in the row definition, start a new segment
      if (currIdx !== prevIdx + 1) {
        segments.push(buildSegment(currentSegment, row));
        currentSegment = [];
      }
    }

    currentSegment.push(seat);
  }

  // Don't forget the last segment
  if (currentSegment.length > 0) {
    segments.push(buildSegment(currentSegment, row));
  }

  return segments;
}

/**
 * Build a ContiguousSegment from an array of consecutive seats
 */
function buildSegment(seats: ISeatState[], row: string): ContiguousSegment {
  return {
    seats,
    row,
    startCol: seats[0].col,
    endCol: seats[seats.length - 1].col,
    length: seats.length,
    segmentType: seats[0].segment as 'left' | 'center' | 'right',
  };
}

/**
 * Calculate how many isolated single seats would be created by placing
 * a group at a specific position within a segment.
 *
 * An isolated single seat = a gap of exactly 1 seat between the edge
 * of the placement and the segment boundary (or another booking).
 */
function calculateScatterScore(
  segment: ContiguousSegment,
  placementStartIdx: number,
  groupSize: number
): number {
  const remainingLeft = placementStartIdx;
  const remainingRight = segment.length - (placementStartIdx + groupSize);

  let score = 0;

  // A remaining gap of exactly 1 creates a scattered single seat
  if (remainingLeft === 1) score += 10;
  if (remainingRight === 1) score += 10;

  // Penalize gaps of exactly 1 less heavily than 0 (no waste) or 2+ (still usable)
  // Perfect fit bonus
  if (remainingLeft === 0 && remainingRight === 0) score -= 5;

  return score;
}

/**
 * Count total scattered single seats in the entire seat map.
 * A scattered single seat is an available seat where both neighbors
 * (in the row definition order) are either booked, broken, or non-existent.
 */
export function countScatteredSingleSeats(seatMap: ISeatState[]): number {
  let count = 0;
  const rows = [...new Set(seatMap.map((s) => s.row))];

  for (const row of rows) {
    const rowCols = ROW_DEFINITIONS[row];
    if (!rowCols) continue;

    const rowSeats = getRowSeatsSorted(seatMap, row);
    const seatByCols = new Map<number, ISeatState>();
    for (const s of rowSeats) seatByCols.set(s.col, s);

    for (let i = 0; i < rowCols.length; i++) {
      const col = rowCols[i];
      const seat = seatByCols.get(col);
      if (!seat || seat.status !== 'available') continue;

      // Check left neighbor
      const leftCol = i > 0 ? rowCols[i - 1] : null;
      const leftSeat = leftCol !== null ? seatByCols.get(leftCol) : null;
      const leftBlocked =
        !leftSeat || leftSeat.status === 'booked' || leftSeat.status === 'broken';

      // Check right neighbor
      const rightCol = i < rowCols.length - 1 ? rowCols[i + 1] : null;
      const rightSeat = rightCol !== null ? seatByCols.get(rightCol) : null;
      const rightBlocked =
        !rightSeat || rightSeat.status === 'booked' || rightSeat.status === 'broken';

      if (leftBlocked && rightBlocked) {
        count++;
      }
    }
  }

  return count;
}

// ============================================================
// CORE ALGORITHM
// ============================================================

/**
 * Find the optimal seats for a group of a given size.
 *
 * Algorithm Strategy:
 * 1. For each row (in priority order), find contiguous available segments
 * 2. For each segment that can fit the group, evaluate placement options:
 *    - Left edge placement
 *    - Right edge placement
 *    - Perfect fit (segment length === group size)
 * 3. Score each placement by scatter score (lower = better)
 * 4. Choose the placement with the lowest scatter score
 *
 * Key rules:
 * - NEVER leave a gap of 1 seat (creates a scattered single seat)
 * - Prefer edge placements that leave gaps of 0 or 2+
 * - Groups are always seated contiguously within a row
 * - Row priority: middle/back rows preferred (K, J, I, H, G, F, E...)
 */
export function findOptimalSeats(
  seatMap: ISeatState[],
  groupSize: number,
  preference: 'any' | 'vip' | 'back' | 'front' | 'center' = 'any',
  isAdminOverride: boolean = false
): AlgorithmSuggestion | null {
  // Admin override: no algorithm constraints, user picks manually
  if (isAdminOverride) {
    return {
      seats: [],
      scatterScore: 0,
      reasoning: 'Admin override active — select any available seats manually.',
    };
  }

  const allOptions: PlacementOption[] = [];

  // Determine row order based on preference
  const rowOrder = getRowOrder(preference);

  for (const row of rowOrder) {
    const segments = findContiguousSegments(seatMap, row);

    for (const segment of segments) {
      if (segment.length < groupSize) continue;

      // Generate placement options for this segment
      const options = generatePlacementOptions(segment, groupSize, row, preference);
      allOptions.push(...options);
    }
  }

  if (allOptions.length === 0) {
    // Try group splitting for groups > 1
    if (groupSize > 1) {
      return trySplitGroup(seatMap, groupSize, preference);
    }
    return null;
  }

  // Sort by scatter score (lowest first), then by row priority
  allOptions.sort((a, b) => {
    if (a.scatterScore !== b.scatterScore) return a.scatterScore - b.scatterScore;
    // Tie-break by row priority
    const aPriority = rowOrder.indexOf(a.row);
    const bPriority = rowOrder.indexOf(b.row);
    return aPriority - bPriority;
  });

  const best = allOptions[0];
  return {
    seats: best.seats,
    scatterScore: best.scatterScore,
    reasoning: best.reasoning,
  };
}

/**
 * Generate placement options for a group within a contiguous segment
 */
function generatePlacementOptions(
  segment: ContiguousSegment,
  groupSize: number,
  row: string,
  preference: string
): PlacementOption[] {
  const options: PlacementOption[] = [];

  if (segment.length === groupSize) {
    // Perfect fit — no waste at all
    options.push({
      seats: segment.seats.map((s) => s.id),
      row,
      scatterScore: -5, // Bonus for perfect fit
      reasoning: `Perfect fit: group of ${groupSize} fills row ${row} segment completely (cols ${segment.startCol}-${segment.endCol}).`,
      segment,
      position: 'perfect-fit',
    });
    return options;
  }

  // Left-edge placement (group at the start of the segment)
  const leftSeats = segment.seats.slice(0, groupSize);
  const leftRemaining = segment.length - groupSize;
  const leftScore = leftRemaining === 1 ? 10 : 0; // Penalize leaving 1 gap on right

  options.push({
    seats: leftSeats.map((s) => s.id),
    row,
    scatterScore: leftScore,
    reasoning: leftRemaining === 1
      ? `Warning: Left-edge placement in row ${row} leaves 1 isolated seat on the right.`
      : `Left-edge placement in row ${row}, segment cols ${segment.startCol}-${segment.endCol}. Leaves ${leftRemaining} seats on right (usable).`,
    segment,
    position: 'left-edge',
  });

  // Right-edge placement (group at the end of the segment)
  const rightSeats = segment.seats.slice(segment.length - groupSize);
  const rightRemaining = segment.length - groupSize;
  const rightScore = rightRemaining === 1 ? 10 : 0;

  options.push({
    seats: rightSeats.map((s) => s.id),
    row,
    scatterScore: rightScore,
    reasoning: rightRemaining === 1
      ? `Warning: Right-edge placement in row ${row} leaves 1 isolated seat on the left.`
      : `Right-edge placement in row ${row}, segment cols ${segment.startCol}-${segment.endCol}. Leaves ${rightRemaining} seats on left (usable).`,
    segment,
    position: 'right-edge',
  });

  // Center placement (if segment is large enough to leave 2+ on each side)
  if (segment.length >= groupSize + 4) {
    // Place in the middle of the segment
    const offset = Math.floor((segment.length - groupSize) / 2);
    const centerSeats = segment.seats.slice(offset, offset + groupSize);
    const leftGap = offset;
    const rightGap = segment.length - offset - groupSize;
    const centerScore = (leftGap === 1 ? 10 : 0) + (rightGap === 1 ? 10 : 0);

    if (centerScore === 0) {
      options.push({
        seats: centerSeats.map((s) => s.id),
        row,
        scatterScore: centerScore + 1, // Slight penalty vs edge (edge is preferred)
        reasoning: `Center placement in row ${row}. Leaves ${leftGap} on left and ${rightGap} on right.`,
        segment,
        position: 'center',
      });
    }
  }

  // If preference is VIP, boost score for VIP segments
  if (preference === 'vip' && segment.seats.some((s) => s.type === 'vip')) {
    options.forEach((opt) => {
      opt.scatterScore -= 3; // Bonus for matching preference
    });
  }

  return options;
}

/**
 * Find optimal placement for a solo attendee (group size 1).
 *
 * Solo rules:
 * - Place at the END of a row segment (adjacent to aisle/wall)
 * - Place NEXT TO an existing booking (extending a group)
 * - NEVER place between two separate groups (creates isolation)
 * - Prefer positions that don't fragment available blocks
 */
export function findOptimalSoloSeat(
  seatMap: ISeatState[],
  preference: 'any' | 'vip' | 'back' | 'front' | 'center' = 'any'
): AlgorithmSuggestion | null {
  const rowOrder = getRowOrder(preference);
  const bestOptions: { seat: ISeatState; score: number; reason: string }[] = [];

  for (const row of rowOrder) {
    const segments = findContiguousSegments(seatMap, row);

    for (const segment of segments) {
      if (segment.length === 0) continue;

      // Perfect fit: segment of exactly 1 — fill it (no waste)
      if (segment.length === 1) {
        bestOptions.push({
          seat: segment.seats[0],
          score: -10, // Best possible — fills a gap
          reason: `Fills an isolated single seat at ${segment.seats[0].id} — eliminates scattered seat.`,
        });
        continue;
      }

      // For larger segments, prefer edges to avoid fragmentation
      // Left edge of segment
      const leftSeat = segment.seats[0];
      const leftRemaining = segment.length - 1;
      bestOptions.push({
        seat: leftSeat,
        score: leftRemaining === 1 ? 8 : 2,
        reason: `Left edge of segment in row ${row}. Leaves ${leftRemaining} contiguous seats.`,
      });

      // Right edge of segment
      const rightSeat = segment.seats[segment.length - 1];
      const rightRemaining = segment.length - 1;
      bestOptions.push({
        seat: rightSeat,
        score: rightRemaining === 1 ? 8 : 2,
        reason: `Right edge of segment in row ${row}. Leaves ${rightRemaining} contiguous seats.`,
      });
    }
  }

  if (bestOptions.length === 0) return null;

  // Sort by score (lowest = best)
  bestOptions.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Tie-break: prefer seats next to booked seats (extending groups)
    return 0;
  });

  const best = bestOptions[0];
  return {
    seats: [best.seat.id],
    scatterScore: best.score,
    reasoning: best.reason,
  };
}

/**
 * Try to split a group across multiple rows when no single row can fit them.
 * Rules:
 * - Split into minimum number of sub-groups
 * - Each sub-group must be >= 2 (never leave a solo sub-group)
 * - Prefer adjacent rows
 */
function trySplitGroup(
  seatMap: ISeatState[],
  groupSize: number,
  preference: string
): AlgorithmSuggestion | null {
  // Try splitting into 2 groups
  for (let splitSize = Math.ceil(groupSize / 2); splitSize < groupSize; splitSize++) {
    const remainder = groupSize - splitSize;
    if (remainder < 2 && remainder !== 0) continue; // No solo sub-groups

    const first = findOptimalSeats(seatMap, splitSize, preference as any);
    if (!first) continue;

    // Temporarily mark first group's seats as booked to find second placement
    const tempMap = seatMap.map((s) => ({
      ...s,
      status: first.seats.includes(s.id) ? ('booked' as const) : s.status,
    }));

    const second = findOptimalSeats(tempMap, remainder, preference as any);
    if (!second) continue;

    return {
      seats: [...first.seats, ...second.seats],
      scatterScore: first.scatterScore + second.scatterScore + 5, // Penalty for splitting
      reasoning: `Group split: ${splitSize} seats (${first.seats.join(', ')}) + ${remainder} seats (${second.seats.join(', ')}). Splitting adds a penalty but keeps the group as close as possible.`,
    };
  }

  return null;
}

/**
 * Get row ordering based on seating preference
 */
function getRowOrder(preference: string): string[] {
  switch (preference) {
    case 'back':
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    case 'front':
      return ['O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
    case 'vip':
      return ['H', 'G', 'F', 'E', 'I', ...ROW_PRIORITY.filter((r) => !['H', 'G', 'F', 'E', 'I'].includes(r))];
    case 'center':
      return ROW_PRIORITY; // Middle rows first
    default:
      return ROW_PRIORITY; // Default: middle/back preferred
  }
}

// ============================================================
// SESSION INITIALIZATION
// ============================================================

/**
 * Initialize a full seat map for a new session.
 * Applies disability seats, broken seats, and marks everything.
 */
export function initializeSessionSeatMap(
  baseSeatMap: ISeatState[],
  disabilitySeats: string[],
  brokenSeats: string[]
): ISeatState[] {
  return baseSeatMap.map((seat) => {
    if (brokenSeats.includes(seat.id)) {
      return { ...seat, type: 'broken' as const, status: 'broken' as const };
    }
    if (disabilitySeats.includes(seat.id)) {
      return { ...seat, type: 'disability' as const, status: 'available' as const };
    }
    return { ...seat, status: 'available' as const };
  });
}

/**
 * Apply a booking to a seat map — marks seats as booked.
 */
export function applyBookingToSeatMap(
  seatMap: ISeatState[],
  seatIds: string[],
  bookingId: string
): ISeatState[] {
  return seatMap.map((seat) => {
    if (seatIds.includes(seat.id)) {
      return { ...seat, status: 'booked' as const, bookingId };
    }
    return seat;
  });
}

/**
 * Release seats from a cancelled booking.
 */
export function releaseSeatsFromSeatMap(
  seatMap: ISeatState[],
  seatIds: string[]
): ISeatState[] {
  return seatMap.map((seat) => {
    if (seatIds.includes(seat.id)) {
      return { ...seat, status: 'available' as const, bookingId: undefined };
    }
    return seat;
  });
}

// ============================================================
// STRESS TEST ENGINE
// ============================================================

/**
 * Run a stress test simulation on a seat map.
 * Fills the cinema to the target percentage using the algorithm.
 */
export function runStressTest(
  seatMap: ISeatState[],
  targetPercentage: number,
  groupDistribution: { size: number; weight: number }[] = [
    { size: 1, weight: 15 },
    { size: 2, weight: 30 },
    { size: 3, weight: 25 },
    { size: 4, weight: 15 },
    { size: 5, weight: 10 },
    { size: 6, weight: 3 },
    { size: 7, weight: 2 },
  ]
): {
  finalSeatMap: ISeatState[];
  bookingLog: { groupSize: number; seats: string[]; scatterScore: number }[];
  totalBooked: number;
  scatteredSingles: number;
  totalAvailable: number;
} {
  let currentMap = [...seatMap.map((s) => ({ ...s }))];
  const totalSeats = currentMap.filter(
    (s) => s.status !== 'broken' && s.type !== 'broken'
  ).length;
  const targetBooked = Math.floor(totalSeats * (targetPercentage / 100));
  let totalBooked = 0;
  const bookingLog: { groupSize: number; seats: string[]; scatterScore: number }[] = [];

  // Normalize weights
  const totalWeight = groupDistribution.reduce((sum, g) => sum + g.weight, 0);

  let attempts = 0;
  const maxAttempts = 500;

  while (totalBooked < targetBooked && attempts < maxAttempts) {
    attempts++;

    // Pick a random group size based on distribution
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let groupSize = 2; // default
    for (const g of groupDistribution) {
      cumulative += g.weight;
      if (rand <= cumulative) {
        groupSize = g.size;
        break;
      }
    }

    // Don't exceed target
    if (totalBooked + groupSize > targetBooked) {
      groupSize = targetBooked - totalBooked;
      if (groupSize <= 0) break;
    }

    // Find seats using the algorithm
    const suggestion =
      groupSize === 1
        ? findOptimalSoloSeat(currentMap)
        : findOptimalSeats(currentMap, groupSize);

    if (!suggestion || suggestion.seats.length === 0) {
      // Can't place this group — try a smaller one
      continue;
    }

    // Apply the booking
    const bookingId = `stress-${bookingLog.length + 1}`;
    currentMap = applyBookingToSeatMap(currentMap, suggestion.seats, bookingId);
    totalBooked += suggestion.seats.length;
    bookingLog.push({
      groupSize: suggestion.seats.length,
      seats: suggestion.seats,
      scatterScore: suggestion.scatterScore,
    });
  }

  const scatteredSingles = countScatteredSingleSeats(currentMap);
  const totalAvailable = currentMap.filter((s) => s.status === 'available').length;

  return {
    finalSeatMap: currentMap,
    bookingLog,
    totalBooked,
    scatteredSingles,
    totalAvailable,
  };
}
