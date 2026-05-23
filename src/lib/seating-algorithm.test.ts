import { describe, it, expect } from 'vitest';
import {
  findContiguousSegments,
  countScatteredSingleSeats,
  findOptimalSeats,
  findOptimalSoloSeat,
  initializeSessionSeatMap
} from './seating-algorithm';
import { generateBaseLayout } from './cinema-layout';
import { ISeatState } from '@/models/Session';

// Helper to convert base seats to mock session seats
function getMockSeatMap(): ISeatState[] {
  const base = generateBaseLayout();
  return base.map((s) => ({
    id: s.id,
    row: s.row,
    col: s.col,
    type: s.type,
    segment: s.segment,
    status: 'available' as const,
  }));
}

// Helper to block out all rows except the one under test
function blockAllRowsExcept(seatMap: ISeatState[], allowedRow: string) {
  seatMap.forEach((s) => {
    if (s.row !== allowedRow) {
      s.status = 'booked';
    }
  });
}

describe('Cinema Seating Algorithm Tests', () => {
  describe('Contiguous Segments Extraction', () => {
    it('should identify scattered single seats correctly', () => {
      const seatMap = getMockSeatMap();
      blockAllRowsExcept(seatMap, 'H');
      
      // Row H has cols 5 to 24 (consecutive)
      // Let's create an isolated single seat at H-6 by booking H-5 and H-7
      const H5 = seatMap.find(s => s.id === 'H-5')!;
      const H6 = seatMap.find(s => s.id === 'H-6')!;
      const H7 = seatMap.find(s => s.id === 'H-7')!;
      
      H5.status = 'booked';
      H7.status = 'booked';
      
      // H-6 is now available, but col 5 is booked and col 7 is booked.
      // Let's count scattered seats:
      const scattered = countScatteredSingleSeats(seatMap);
      expect(scattered).toBe(1);
    });
  });

  describe('Group Seating Allocation (findOptimalSeats)', () => {
    it('should find a perfect fit segment for a group', () => {
      const seatMap = getMockSeatMap();
      blockAllRowsExcept(seatMap, 'H');
      
      // Row H cols: 5 to 24 (20 seats total)
      // Let's book H-5 to H-22, leaving exactly 2 seats available (H-23 and H-24)
      seatMap.forEach(s => {
        if (s.row === 'H' && s.col >= 5 && s.col <= 22) {
          s.status = 'booked';
        }
      });
      
      // Request 2 seats: should perfectly match H-23 and H-24
      const suggestion = findOptimalSeats(seatMap, 2);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.seats).toContain('H-23');
      expect(suggestion!.seats).toContain('H-24');
      expect(suggestion!.scatterScore).toBe(-5); // Perfect fit bonus
    });

    it('should avoid leaving a gap of exactly 1 seat', () => {
      const seatMap = getMockSeatMap();
      blockAllRowsExcept(seatMap, 'H');
      
      // Row H is cols 5 to 24 (20 seats).
      // Let's book H-9, which splits the row into two segments:
      // Segment 1: cols 5-8 (4 seats)
      // Segment 2: cols 10-24 (15 seats)
      seatMap.find(s => s.id === 'H-9')!.status = 'booked';
      
      // Request 3 seats.
      // If placed in Segment 1 (cols 5-8), we place 3 seats which leaves 1 seat empty (a scattered gap).
      // If placed in Segment 2 (cols 10-24), placing 3 seats leaves 12 seats empty (a usable chunk).
      // The algorithm should choose Segment 2 (H-10, H-11, H-12) to avoid creating a gap of 1.
      const suggestion = findOptimalSeats(seatMap, 3);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.seats).toEqual(['H-10', 'H-11', 'H-12']);
      expect(suggestion!.scatterScore).toBe(0); // Scatter score is 0
    });
  });

  describe('Solo Attendee Seating Allocation (findOptimalSoloSeat)', () => {
    it('should fill an isolated single seat gap first', () => {
      const seatMap = getMockSeatMap();
      blockAllRowsExcept(seatMap, 'H');
      
      // Let's create an isolated single seat at H-7 by booking H-5, H-6, and H-8
      seatMap.forEach(s => {
        if (s.row === 'H' && (s.col === 5 || s.col === 6 || s.col === 8)) {
          s.status = 'booked';
        }
      });
      
      // A solo attendee should be placed at H-7 to fill the gap and eliminate the scattered seat
      const suggestion = findOptimalSoloSeat(seatMap);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.seats).toEqual(['H-7']);
      expect(suggestion!.scatterScore).toBe(-10); // Fills isolated gap bonus
    });

    it('should place solo attendee at the edge of a large segment to avoid fragmentation', () => {
      const seatMap = getMockSeatMap();
      blockAllRowsExcept(seatMap, 'H');
      
      // Row H is fully empty (cols 5 to 24 - 20 seats)
      // Solo attendee should be placed at the edge of the row segment (H-5 or H-24) to keep the rest contiguous
      const suggestion = findOptimalSoloSeat(seatMap);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.seats[0] === 'H-5' || suggestion!.seats[0] === 'H-24').toBe(true);
    });
  });

  describe('Group Splitting Backtrack', () => {
    it('should split a group into sub-groups if no single row can fit them', () => {
      const seatMap = getMockSeatMap();
      
      // Book almost all seats in every row, leaving only small gaps of size 2 in different rows
      seatMap.forEach(s => {
        // Leave only H-19, H-20 and I-19, I-20 available
        if (s.id !== 'H-19' && s.id !== 'H-20' && s.id !== 'I-19' && s.id !== 'I-20') {
          s.status = 'booked';
        }
      });
      
      // Request 4 seats: no single row can fit 4 seats. The algorithm should split them into 2 + 2
      const suggestion = findOptimalSeats(seatMap, 4);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.seats).toContain('H-19');
      expect(suggestion!.seats).toContain('H-20');
      expect(suggestion!.seats).toContain('I-19');
      expect(suggestion!.seats).toContain('I-20');
    });
  });
});
