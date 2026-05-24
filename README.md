# Cinema Seating Plan Optimisation System
### Assessment 3 — CP7CO32OA: Advanced Topics in Software Engineering
**University of West London | ANC Education**  
**MSc in Software Engineering**

---

## 🎓 Academic Profile
* **Student Name:** Lahiru Harshana Liyanage  
* **Student ID:** 34153629 | 00012110  
* **Module Code:** CP7CO32OA (Advanced Topics in Software Engineering)  
* **Module Leader:** Dr. Cain Kazimoglu  
* **Assessment Weight:** 40%  
* **Development Approach:** Plan-Driven Specification (Waterfall) & Test-Driven Development (TDD)

---

## 📽️ Project Overview
The **Cinema Seating Plan Optimisation System** is an end-to-end full-stack web application designed to solve the **Scattered Seat Problem**—the prevalence of isolated, single empty seats that remain unsold due to suboptimal booking allocations, causing massive revenue losses for cinema halls.

Using a custom **Scatter Score Seating Optimisation Algorithm**, the application dynamically analyses seating layouts, group sizes, and seat category constraints to place patrons in positions that minimize seat fragmentation.

### 🏛️ Seating Layout & Rules
The cinema is modelled as a high-capacity auditorium consisting of:
* **Rows:** 15 rows (labelled **A to O**).
* **Columns:** Up to 28 seats per row.
* **Physical Aisles:** Rows are separated by aisles into three distinct segments:
  * **Left Wing:** Columns 1–4
  * **Centre Wing:** Columns 5–24
  * **Right Wing:** Columns 25–28
* **Four Dedicated Seat Types:**
  1. 🟦 **Regular Seats:** Default seats available to all patrons.
  2. 🟪 **VIP Seats:** Premium seats fixed in the acoustic sweet-spot (**columns 12–15 for rows E–I**). Accessible only with a VIP preference.
  3. 🟩 **Disability Seats:** Adjacent pairs in the front rows (**N and O**) to ensure wheelchair users can always sit with a companion.
  4. 🟥 **Broken Seats:** Randomized dynamically per session (6–10 per session) with safety filters: *no two broken seats can be adjacent*, and *no row can have more than two broken seats*.

---

## 🧮 Seating Optimisation Algorithm
The algorithm is a **constraint-aware seating optimizer** combining segment-extraction, solo-gap-fill prioritization, contiguous placement strategies, and backtracking group-split fallbacks.

### 📊 The Scatter Score System
At the heart of the optimization is the **Scatter Score**, which evaluates every placement option based on the remaining seats it leaves behind:

| Scenario | Score Impact | Rationale |
| :--- | :--- | :--- |
| **Perfect Fit** | **`-5` Points** (Bonus) | The booked block exactly fills the segment. Zero gaps are left on either side. Most efficient outcome. |
| **Safe Remainder** | **`0` Points** (Neutral) | Leaving `2` or more contiguous seats on a side. This allows couples or larger groups to be accommodated in future bookings. |
| **Scattered Seat Gap** | **`+10` Points** (Penalty) | Placement leaves exactly `1` empty seat on either the left or right side of the block. Highly discouraged, as solo seats are hard to sell. |

The algorithm evaluates all possible options within the priority rows and selects the placement that yields the **lowest cumulative Scatter Score**.

### 🔄 Algorithm Decisions Hierarchy
1. **Solo Bookings (Group Size = 1):**
   * **Priority 1 (Gap Filling):** Scan priority rows for existing isolated `1`-seat gaps and place the solo customer there, effectively *healing* the layout fragmentation.
   * **Priority 2 (Edge Placement):** If no isolated gaps exist, place the customer at the extreme edge of the largest contiguous segment—never in the interior where they would fragment the block.
2. **Group Bookings (Group Size 2–7):**
   * **Priority 1 (Contiguous Single Row):** Attempt to place the group contiguously in the same row segment to ensure they sit together.
   * **Priority 2 (Group Splitting Backtracking):** If no row segment is wide enough, the system splits the group into two smaller sub-groups (e.g. 5 splits into 2 and 3) and recursively books them in optimal contiguous blocks.

---

## 💻 Visual Interface & Interactive States
The frontend provides a state-of-the-art interactive grid utilizing rich aesthetics, animations, and real-time state synchronization:

```
[Available (Blue)]   [VIP (Purple)]   [Disability (Teal)]   [Booked (Grey)]   [Broken (Red)]
                                    ▲
                         [Suggestions (Yellow Pulse)]
```

* **Interactive Seating Grid:** Displays the precise 15x28 layout. Dynamic hover states highlight exactly which seats will be occupied.
* **Suggested Seat Highlighting:** Optimized seats suggested by the algorithm pulse in a vibrant **Yellow** gradient.
* **Group Booking Controller:** Panels to select group size (1 to 7) and seat preferences (Regular or VIP).
* **Admin Override Mode:** Toggle switches that allow authorised users to bypass algorithm suggestions entirely and hand-select any seat combination directly from the grid (supports multiselect).
* **Real-time Cancellation Support:** Patrons can click on any booked seat to cancel it atomically, instantly releasing the seat to the available pool.
* **Stress Test Simulator:** A built-in testing engine that populates the cinema with randomized groups to target occupancies (e.g., 70%, 85%) to demonstrate the algorithm’s resistance to seating fragmentation.

---

## 🛠️ Technology Stack
* **Framework:** [Next.js 16.2](https://nextjs.org/) (App Router, Server-side API Endpoints)
* **Library:** [React 19](https://react.dev/) (Hooks, Client components)
* **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Compile-time Type Safety)
* **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose 9.6](https://mongoosejs.com/) (Atomic transactions, structured documents)
* **Styling:** [TailwindCSS 4](https://tailwindcss.com/) & Vanilla CSS (Dynamic animations, glassmorphism dashboard)
* **Testing:** [Vitest 4.1](https://vitest.dev/) (TypeScript-native test runner)

---

## 📦 Installation & Setup

### Prerequisites
* **Node.js** (v18.x or later recommended)
* **MongoDB Instance** (Local MongoDB Community Server or MongoDB Atlas cloud URI)

### 1. Clone & Install Dependencies
Navigate to the project root and install required packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the `cinema-seat-booking` directory:
```env
MONGODB_URI=mongodb://localhost:27017/cinema-seat-booking
```
*(Replace with your MongoDB Atlas connection string if running in the cloud.)*

### 3. Initialize & Seed the Database
Before running the application, populate the movies and active sessions by visiting:
* **Endpoint:** `http://localhost:3000/api/seed`  
*(Or use the automated "Seed Database" banner action on the homepage.)*

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Test-Driven Development (TDD) Suite
The core algorithm layer was built following strict TDD cycles with **Vitest**. The test suite resides at `src/lib/seating-algorithm.test.ts` and covers 6 key logical scenarios:

```bash
# Run Vitest test runner
npm run test
```

### 📋 Covered Test Cases (TC1 – TC6)
* **`TC1` (Isolated Gap Detection):** Asserts that the algorithm accurately counts scattered `1`-seat gaps in a given row config.
* **`TC2` (Perfect-Fit Bonus):** Verifies that a perfect-fit block placement is awarded the `-5` score bonus.
* **`TC3` (Scatter Penalty):** Verifies that a placement leaving a single empty seat receives the `+10` penalty score.
* **`TC4` (Solo Gap-Filling):** Verifies that a solo attendee is preferentially funneled into an existing isolated single gap.
* **`TC5` (Solo Edge-Placement):** Verifies that when no gaps exist, solo attendees are placed cleanly at the segment edge.
* **`TC6` (Group Splitting Backtracking):** Asserts that when a group of 4 cannot fit contiguously on any row, they are split cleanly and allocated optimal split configurations.

```
✓ src/lib/seating-algorithm.test.ts (6 tests) 8ms
Test Files  1 passed (1)
Tests       6 passed (6)
Duration    450ms
```

---

## 🪲 Bug Spotlight: Mongoose Subdocument Serialization
During development, a critical bug was encountered where seats booked on the grid were confirmed in the database but failed to turn grey (booked) on the frontend unless a hard refresh was performed.

### 🔍 Root Cause
Mongoose does not store subdocuments (like the items inside `seatMap`) as plain JS objects; they are wrapped in Mongoose Subdocument instances. The code initially used the ES6 spread operator (`...`) to copy and modify these subdocuments:
```typescript
// ❌ BROKEN APPROACH
const updatedSeatMap = session.seatMap.map((seat) => {
  if (seatIds.includes(seat.id)) {
    return { ...seat, status: "booked" }; // Loses Mongoose change-tracking symbols
  }
  return seat;
});
await Session.findByIdAndUpdate(sessionId, { seatMap: updatedSeatMap });
```
Because the spread operator strips out Mongoose's internal getters, setters, and change-tracking symbols, Mongoose failed to recognize that the deeply nested `seatMap` array had changed, bypassing database updates.

### 💡 Resolution
The fix converts subdocuments to plain objects prior to updates, applies modifications, assigns the plain array back to the session, and triggers an **atomic, change-tracked document save**:
```typescript
//  FIXED & IMPLEMENTED APPROACH
const plainSeatMap = session.seatMap.map((s: any) =>
  typeof s.toObject === "function" ? s.toObject() : { ...s }
);

const updatedSeatMap = applyBookingToSeatMap(
  plainSeatMap, 
  seatsToBook, 
  booking._id.toString()
);

session.seatMap = updatedSeatMap as any;
await session.save(); // Atomic, deeply tracked document write
```
This ensured 100% data integrity, eliminated race conditions, and made the frontend update instantly.

---

## 📂 Project Structure
```
cinema-seat-booking/
├── src/
│   ├── app/                      # Next.js App Router & API Routing
│   │   ├── api/                  # Backend Endpoints
│   │   │   ├── bookings/         # Booking confirmation & cancellation API
│   │   │   ├── seed/             # DB Initialization Endpoint
│   │   │   └── sessions/         # Fetch and update session maps
│   │   ├── booking/[sessionId]/  # Dynamic Interactive Booking Page
│   │   ├── stress-test/          # Live Seating Algorithm Stress Testing Panel
│   │   └── page.tsx              # Homepage / Session Selector
│   ├── components/               # Shared React Components (Interactive Grid)
│   ├── models/                   # Mongoose Models (Movie.ts, Session.ts, Booking.ts)
│   └── lib/                      # Core Logic & Utility Libraries
│       ├── broken-seats.ts       # Broken seat generator
│       ├── cinema-layout.ts      # Cinema specifications (VIP/Aisle layout)
│       ├── mongodb.ts            # MongoDB connection utility
│       ├── seating-algorithm.ts  # Core Seating Optimisation Algorithm (632 lines)
│       ├── seating-algorithm.test.ts # Vitest TDD Test Suite (6 tests)
│       └── types.ts              # TypeScript custom interface declarations
├── package.json                  # Next.js, Mongoose & Vitest configurations
├── tsconfig.json                 # TypeScript compiler configuration
└── .env.local                    # Database configuration (git-ignored)
```
