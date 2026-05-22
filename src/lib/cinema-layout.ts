import { CinemaSeat, SeatType, SeatSegment } from './types';

// Row definitions: which column numbers have seats in each row
// Rows are ordered back-to-front: A (back) to O (front/screen)
const ROW_DEFINITIONS: Record<string, number[]> = {
  A: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28],
  B: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28],
  C: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28],
  D: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  E: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28],
  F: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  G: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28],
  H: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  I: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  J: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28],
  K: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  L: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28],
  M: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  N: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  O: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20],
};

// All row letters in order (back to front)
export const ROW_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

// Row priority for algorithm (preferred rows first - middle/back)
export const ROW_PRIORITY = ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'L', 'C', 'M', 'B', 'N', 'A', 'O'];

// VIP seats: rows E-I, columns 12-15
const VIP_ROWS = ['E', 'F', 'G', 'H', 'I'];
const VIP_COLS = [12, 13, 14, 15];

// Disability seats: front 2 rows (N, O), 6 seats total, always adjacent pairs
// These are randomly placed each session but always in N or O and always adjacent
const DISABILITY_ROWS = ['N', 'O'];
const DISABILITY_COUNT = 6;

function getSegment(col: number): SeatSegment {
  if (col <= 4) return 'left';
  if (col >= 25) return 'right';
  return 'center';
}

function getSeatType(row: string, col: number): SeatType {
  if (VIP_ROWS.includes(row) && VIP_COLS.includes(col)) return 'vip';
  return 'regular';
}

export function getSeatId(row: string, col: number): string {
  return `${row}-${col}`;
}

export function parseSeatId(seatId: string): { row: string; col: number } {
  const [row, colStr] = seatId.split('-');
  return { row, col: parseInt(colStr) };
}

/**
 * Generate the base cinema layout (without disability or broken seats assigned)
 */
export function generateBaseLayout(): CinemaSeat[] {
  const seats: CinemaSeat[] = [];
  for (const row of ROW_ORDER) {
    const cols = ROW_DEFINITIONS[row];
    for (const col of cols) {
      seats.push({
        id: getSeatId(row, col),
        row,
        col,
        type: getSeatType(row, col),
        segment: getSegment(col),
        exists: true,
      });
    }
  }
  return seats;
}

/**
 * Generate disability seat positions (6 seats in rows N, O, always adjacent pairs)
 * Returns array of seat IDs that should be marked as disability
 */
export function generateDisabilitySeats(): string[] {
  const disabilitySeats: string[] = [];
  const availableRows = [...DISABILITY_ROWS];
  let remaining = DISABILITY_COUNT;

  // Distribute as adjacent pairs across N and O
  while (remaining > 0 && availableRows.length > 0) {
    const rowIndex = Math.floor(Math.random() * availableRows.length);
    const row = availableRows[rowIndex];
    const cols = ROW_DEFINITIONS[row];

    // Find possible starting positions for an adjacent pair
    const possibleStarts: number[] = [];
    for (let i = 0; i < cols.length - 1; i++) {
      if (cols[i + 1] - cols[i] === 1) { // Adjacent columns
        const id1 = getSeatId(row, cols[i]);
        const id2 = getSeatId(row, cols[i + 1]);
        if (!disabilitySeats.includes(id1) && !disabilitySeats.includes(id2)) {
          possibleStarts.push(i);
        }
      }
    }

    if (possibleStarts.length === 0) {
      availableRows.splice(rowIndex, 1);
      continue;
    }

    const startIdx = possibleStarts[Math.floor(Math.random() * possibleStarts.length)];
    disabilitySeats.push(getSeatId(row, cols[startIdx]));
    disabilitySeats.push(getSeatId(row, cols[startIdx + 1]));
    remaining -= 2;
  }

  return disabilitySeats;
}

/**
 * Get all seats for a specific row
 */
export function getRowSeats(layout: CinemaSeat[], row: string): CinemaSeat[] {
  return layout.filter(s => s.row === row).sort((a, b) => a.col - b.col);
}

/**
 * Get seats in a specific segment of a row
 */
export function getSegmentSeats(layout: CinemaSeat[], row: string, segment: SeatSegment): CinemaSeat[] {
  return layout.filter(s => s.row === row && s.segment === segment).sort((a, b) => a.col - b.col);
}

/**
 * Get total seat count
 */
export function getTotalSeatCount(): number {
  return Object.values(ROW_DEFINITIONS).reduce((sum, cols) => sum + cols.length, 0);
}

/**
 * Check if two columns are adjacent in a given row
 */
export function areColumnsAdjacent(row: string, col1: number, col2: number): boolean {
  const cols = ROW_DEFINITIONS[row];
  const idx1 = cols.indexOf(col1);
  const idx2 = cols.indexOf(col2);
  return Math.abs(idx1 - idx2) === 1;
}

export { ROW_DEFINITIONS, DISABILITY_ROWS, DISABILITY_COUNT };
