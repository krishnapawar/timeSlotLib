# Package Improvement Plan: `@krishnapawar/date-time-slots` (v2.0)

A comprehensive roadmap and architecture proposal to transform this package into an **advanced**, **high-performance**, **zero-dependency**, and **developer-friendly** time slot engine for JavaScript & TypeScript ecosystems.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current Codebase Audit (Bugs & Bottlenecks)](#2-current-codebase-audit-bugs--bottlenecks)
3. [Key Improvement Pillars](#3-key-improvement-pillars)
4. [Proposed Modern API Design (Easy to Use & Intuitive)](#4-proposed-modern-api-design-easy-to-use--intuitive)
   - [4.1 Simple Functional API](#41-simple-functional-api)
   - [4.2 Fluent Builder API](#42-fluent-builder-api)
   - [4.3 Advanced Availability & Conflict Engine](#43-advanced-availability--conflict-engine)
5. [New Advanced Features Needed](#5-new-advanced-features-needed)
6. [Zero-Dependency Architecture (Eliminating Moment.js)](#6-zero-dependency-architecture-eliminating-momentjs)
7. [TypeScript Support & Developer Experience](#7-typescript-support--developer-experience)
8. [Before vs. After Comparison](#8-before-vs-after-comparison)
9. [Reference Implementation (Clean Architecture Prototype)](#9-reference-implementation-clean-architecture-prototype)
10. [Step-by-Step Implementation Roadmap](#10-step-by-step-implementation-roadmap)

---

## 1. Executive Summary

The current `@krishnapawar/date-time-slots` package provides a valuable core concept: generating and manipulating time slots for booking, appointments, and calendar applications. However, the current implementation suffers from:
- **Severe logic bugs and inverted flags** (e.g. `isNotRailwayTime`, hardcoded evaluations, memory mutation during iteration).
- **Heavy deprecated dependency** (`moment.js`, adding 4.5MB+ of disk bloat and 70KB+ bundle size for basic time math).
- **Confusing Developer Experience (DX)** with inconsistent parameter naming, lack of TypeScript types, and silent failures (`console.error` returning `undefined`).
- **Missing essential real-world features** such as slot buffers/gaps, break times (e.g. lunch hour), conflict detection, slot merging, and finding free availability between multiple schedules.

By redesigning this package for **v2.0**, we can make it:
- ⚡ **Zero-dependency** (100% native JavaScript Date & minute arithmetic; < 3KB bundle size).
- 🧠 **Intuitive & Predictable** (Self-explanatory options, clean return types, strict input validation).
- 🚀 **Advanced & Production-Ready** (Conflict detection, buffers, breaks, multi-user scheduling).
- 🛡️ **Type-Safe & Modern** (First-class TypeScript support, Dual ESM/CommonJS exports, 100% test coverage).

---

## 2. Current Codebase Audit (Bugs & Bottlenecks)

A deep review of [`lib/index.js`](./lib/index.js) and [`package.json`](./package.json) revealed several critical issues that need immediate overhaul:

### 2.1 Critical Logic Bugs
1. **Always-True 24-Hour Detection:**
   ```javascript
   let is12Hour = ["AM", "PM"];
   let isHour = opentimes.split(" ");
   let is24Hour = isHour.length > 0 && is12Hour.includes(is12Hour[1]) ? true : false;
   ```
   - `is12Hour[1]` is `"PM"`. `is12Hour.includes("PM")` is **always true**.
   - `isHour.length > 0` is **always true**.
   - Therefore, `is24Hour` evaluates to `true` on every single string, regardless of what the user passes!
   - Furthermore, the logic is named `is24Hour`, but it checks for `"AM"/"PM"` (which denotes 12-hour format).

2. **Closing Time Bug in `startToEndTimeSlot`:**
   ```javascript
   if (closetimes == "12:00 AM") {
     var closetime_s = "12:00";
   } else {
     var closetime_s = is24Hour ? moment(closetimes, "h:mm A").format("HH:mm") : moment(opentimes, "H:mm").format("HH:mm");
   }
   ```
   - If `closetimes == "12:00 AM"`, it converts it to `"12:00"` (which is 12:00 PM / noon instead of 00:00 midnight).
   - In the `else` false branch, it formats `opentimes` instead of `closetimes`!

3. **Inverted and Confusing Flag (`isNotRailwayTime`):**
   - The flag name contains a double negative (`isNot...`).
   - Line 98: `let stime = isNotRailwayTime ? startTime.format("HH:mm") : startTime.format("hh:mm A");`
   - When `isNotRailwayTime` is `true`, it actually outputs 24-hour military time (`HH:mm`), which IS railway time!

4. **Inverted `withDate` Property Behavior:**
   - In `startToEndTimeSlot`:
     ```javascript
     let tsl = isEmpty(data.startToEndObj, withDate ? { slot } : { slot, date }, withDate ? { start, end } : { start, end, date });
     ```
     - When `withDate: true`, it omits `date`!
     - When `withDate: false`, it includes `date`!

5. **In-place Array Mutation During Iteration:**
   - In `startToEndTimeSlot`:
     ```javascript
     for (const item of blockSchedule) {
       for (const iterator of Slots) {
         if (item.slot == iterator.slot) {
           Slots.splice(Slots.indexOf(iterator), 1);
         }
       }
     }
     ```
     - Using `splice` while iterating over `Slots` skips adjacent items due to shifted indices.
     - When `startToEndObj: true`, the slot objects have `{ start, end }` and NO `.slot` property. `item.slot == iterator.slot` evaluates to `undefined == undefined` (`true`), causing slots to be incorrectly wiped out.

6. **Infinite Loop Risk:**
   - If `x.duration <= 0` or NaN is provided, `startTime.add(x.duration, "minutes")` never advances, creating an infinite `while` loop that freezes the Node process.

7. **Silent Failures:**
   - `if (isEmpty(opentimes) || isEmpty(closetimes))` calls `console.error` and returns `undefined`. If calling code attempts `.map()`, `.forEach()`, or `.length`, it throws an uncaught `TypeError`.

8. **Corrupted Package Metadata:**
   - `package.json` line 4 contains raw terminal ANSI control characters (`\u001b[D...`), making the description messy and corrupt on npmjs.com.
   - Missing test suite (`"test": "echo \"Error: no test specified\" && exit 1"`).
   - Typo in exported helper: `normalToRalwayTimeConvert` ("Ralway" misspelled).

---

## 3. Key Improvement Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TRANSFORMATION TO v2.0                                │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Zero           │ 2. Developer      │ 3. Enterprise                  │
│    Dependencies   │    Experience     │    Features                    │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Remove Moment   │ • Intuitive API   │ • Buffers & Breaks             │
│ • Pure JS math    │ • Full TypeScript │ • Conflict & Overlap Checker   │
│ • < 3KB minified  │ • Dual ESM + CJS  │ • Free Slot / Availability     │
│ • 10x-50x faster  │ • Strict errors   │ • Multi-calendar Intersection  │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 4. Proposed Modern API Design (Easy to Use & Intuitive)

### 4.1 Simple Functional API

Instead of passing obscure flags like `isNotRailwayTime: true` and `startToEndObj: true`, developers can use clean, self-documenting function calls.

```javascript
import { generateSlots, getAvailableSlots, isOverlapping } from '@krishnapawar/date-time-slots';

// 1. Generate 30-minute slots between 09:00 and 17:00
const slots = generateSlots({
  start: '09:00',
  end: '17:00',
  interval: 30,             // Slot duration in minutes (default: 15)
  buffer: 10,               // Optional: 10 min break/cleanup between slots
  format: '12h',            // '12h' (default: "09:00 AM") or '24h' ("09:00")
  includeCurrentFilter: true // Filter out slots that have already passed today
});

// Returns clean pairs:
// [
//   { start: '09:00 AM', end: '09:30 AM', duration: 30 },
//   { start: '09:40 AM', end: '10:10 AM', duration: 30 },
//   ...
// ]
```

### 4.2 Fluent Builder API (For Clean, Expressive Code)

For complex scheduling scenarios, provide a chainable builder:

```javascript
import { TimeSlot } from '@krishnapawar/date-time-slots';

const availableSlots = TimeSlot.create()
  .between('09:00 AM', '05:00 PM')
  .every(30)                              // 30 min duration
  .withBuffer(10)                         // 10 min gap between slots
  .excludeBreak('13:00', '14:00')         // Exclude lunch break
  .block([                                // Block booked slots
    { start: '10:00 AM', end: '10:30 AM' },
    { start: '02:30 PM', end: '03:15 PM' }
  ])
  .filterPassedToday()                    // Skip slots earlier than now
  .toPairs();                             // Format: [{ start, end }]
```

### 4.3 Advanced Availability & Conflict Engine

```javascript
import { findFreeSlots, hasConflict, mergeSlots } from '@krishnapawar/date-time-slots';

// Check if a requested booking conflicts with existing bookings
const bookedAppointments = [
  { start: '10:00', end: '11:00' },
  { start: '14:00', end: '15:30' }
];

const newBooking = { start: '10:45', end: '11:15' };

if (hasConflict(newBooking, bookedAppointments)) {
  console.log("Requested slot is already taken!");
}

// Automatically calculate all free slots in a workday
const freeSlots = findFreeSlots({
  workHours: { start: '09:00', end: '18:00' },
  busySlots: bookedAppointments,
  minDuration: 30 // Only return slots that are at least 30 minutes long
});
```

---

## 5. New Advanced Features Needed

| Feature | Problem Solved | Real-World Use Case |
|---|---|---|
| **Buffer / Gap Time** | Appointments rarely happen back-to-back without setup time. | Doctors, salons, and consultants need 5-15 mins between clients. |
| **Break Times / Split Shifts** | Businesses close for lunch or have split hours. | Clinic open 09:00 - 13:00 and 15:00 - 20:00. |
| **Availability Calculation (`findFreeSlots`)** | Finding available time from a busy Google/Outlook calendar. | Booking apps (Calendly, Cal.com clones). |
| **Slot Overlap & Collision Checker** | Prevents double bookings. | Backend validation when saving an appointment. |
| **Multi-User Common Free Time** | Finding a meeting slot that works for both User A and User B. | Team scheduling, pair-programming, interviews. |
| **Overnight & Shift Support** | Shifts that cross midnight (e.g., 22:00 to 06:00). | Hospital night shifts, security guards, overnight transport. |
| **Timezone-Aware Generation** | Scheduling across different time zones. | Remote teams, international client calls. |
| **Flexible Output Formats** | Output as strings (`"09:00 - 09:30"`), objects (`{ start, end }`), or native `Date` / ISO objects. | Seamless integration with frontend components & databases. |

---

## 6. Zero-Dependency Architecture (Eliminating Moment.js)

### Why Drop `moment.js`?
- `moment.js` is declared **legacy/deprecated** by its creators.
- It weighs **4.5 MB+** installed and adds **70 KB+** minified.
- Time calculations for hours and minutes can be performed using straightforward **minute-based integer arithmetic**:
  - `09:30` = `9 * 60 + 30` = `570 minutes`.
  - Adding 30 minutes = `570 + 30 = 600 minutes`.
  - Converting back: `Math.floor(600 / 60) = 10`, `600 % 60 = 0` ➔ `10:00`.
- Integer math is **100x faster**, immune to date-shift bugs, and requires **0 external dependencies**.

---

## 7. TypeScript Support & Developer Experience

### Full Type Safety (`index.d.ts`)
Provide complete TypeScript interfaces so developers get instant autocomplete and type validation:

```typescript
export type TimeFormat = '12h' | '24h' | 'HH:mm' | 'hh:mm A';

export interface TimeSlotOptions {
  start: string | Date;
  end: string | Date;
  interval?: number;
  buffer?: number;
  format?: TimeFormat;
  date?: string | Date;
  includeCurrentFilter?: boolean;
  breaks?: Array<{ start: string; end: string }>;
  blocked?: Array<{ start: string; end: string } | string>;
}

export interface TimeSlotResult {
  start: string;
  end: string;
  duration: number;
  date?: string;
}

export function generateSlots(options: TimeSlotOptions): TimeSlotResult[];
export function generateTimePoints(options: Omit<TimeSlotOptions, 'buffer'>): string[];
export function hasConflict(slot: { start: string; end: string }, busy: Array<{ start: string; end: string }>): boolean;
export function findFreeSlots(options: {
  workHours: { start: string; end: string };
  busySlots: Array<{ start: string; end: string }>;
  minDuration?: number;
}): Array<{ start: string; end: string; duration: number }>;
```

---

## 8. Before vs. After Comparison

### Generating 30-Minute Slots with Exclusions

#### ❌ Before (v1.0 - Fragile & Confusing):
```javascript
// Hard to read, unclear options, double negative flags
const { startToEndTimeSlot } = require("@krishnapawar/date-time-slots");

let data = startToEndTimeSlot("09:00 AM", "05:00 PM", {
  duration: 30,
  date: "2026-10-19",
  isCurrent: true,
  isNotRailwayTime: false,   // What does this do?
  withDate: true,            // Inverted logic bug in v1
  startToEndObj: true,       // Cryptic option name
  blockSchedule: [
    { slot: "01:00 PM - 02:00 PM" } // Buggy matching when startToEndObj is true
  ]
});
```

#### ✅ After (v2.0 - Clean, Readable, and Robust):
```javascript
import { generateSlots } from "@krishnapawar/date-time-slots";

const slots = generateSlots({
  start: "09:00 AM",
  end: "05:00 PM",
  interval: 30,
  buffer: 10,                 // 10 min break between appointments
  format: "12h",              // Clear format selection
  filterPassedToday: true,
  breaks: [
    { start: "01:00 PM", end: "02:00 PM" } // Lunch break
  ],
  blocked: [
    { start: "10:00 AM", end: "10:30 AM" } // Booked appointment
  ]
});
```

---

## 9. Reference Implementation (Clean Architecture Prototype)

Here is how the zero-dependency core can be implemented cleanly:

```javascript
/**
 * Converts a time string ("09:30", "9:30 AM", "09:30:00") into minutes from midnight (0 - 1439).
 */
export function timeToMinutes(timeStr) {
  if (typeof timeStr !== 'string') throw new TypeError('Time must be a string (e.g., "09:30" or "02:00 PM")');
  
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) throw new Error(`Invalid time format: "${timeStr}". Expected HH:mm or hh:mm AM/PM.`);

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period) {
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight back into a formatted time string.
 */
export function minutesToTime(totalMinutes, format = '24h') {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generates slot pairs with buffer, breaks, and blocked schedule support.
 */
export function generateSlots({
  start,
  end,
  interval = 15,
  buffer = 0,
  format = '24h',
  breaks = [],
  blocked = [],
  filterPassedToday = false
}) {
  if (interval <= 0) throw new Error('Interval must be greater than 0');

  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin < startMin) endMin += 1440; // Spans midnight (e.g. 22:00 to 06:00)

  const parsedBreaks = breaks.map(b => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end)
  }));

  const parsedBlocked = blocked.map(b => {
    if (typeof b === 'string') {
      const min = timeToMinutes(b);
      return { start: min, end: min + interval };
    }
    return { start: timeToMinutes(b.start), end: timeToMinutes(b.end) };
  });

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const slots = [];
  let current = startMin;

  while (current + interval <= endMin) {
    const slotStart = current;
    const slotEnd = current + interval;

    // Check if slot falls in break time
    const inBreak = parsedBreaks.some(brk => slotStart < brk.end && slotEnd > brk.start);
    // Check if slot is blocked
    const isBlocked = parsedBlocked.some(blk => slotStart < blk.end && slotEnd > blk.start);
    // Check if slot has already passed today
    const hasPassed = filterPassedToday && slotStart <= nowMinutes;

    if (!inBreak && !isBlocked && !hasPassed) {
      slots.push({
        start: minutesToTime(slotStart, format),
        end: minutesToTime(slotEnd, format),
        duration: interval
      });
    }

    current += interval + buffer;
  }

  return slots;
}
```

---

## 10. Step-by-Step Implementation Roadmap

```
Step 1: Fix package.json & Setup Tooling
  ├── Fix corrupt ANSI characters in package.json description
  ├── Setup Vitest / Jest for fast, automated unit testing
  ├── Configure Dual ESM/CJS exports in package.json
  └── Add Prettier / ESLint

Step 2: Build Zero-Dependency Core Engine
  ├── Pure minute-arithmetic parser & formatter (timeToMinutes / minutesToTime)
  ├── Robust validator for time strings & intervals
  └── Backward-compatibility adapter for v1.x functions

Step 3: Implement Advanced Features
  ├── Buffer / gap time between slots
  ├── Break schedules (split-shift / lunch breaks)
  ├── Conflict & overlap detection (hasConflict, isOverlapping)
  ├── Availability engine (findFreeSlots from busy calendar)
  └── Fluent TimeSlot builder API

Step 4: TypeScript Definitions & Documentation
  ├── Add comprehensive index.d.ts with full JSDoc comments
  ├── Rewrite README.md with clear examples, badges, and recipes
  └── Add interactive RunKit / StackBlitz example links

Step 5: Publish & Release
  ├── Verify 100% test coverage
  ├── Bump version (v2.0.0) following SemVer
  └── Publish clean bundle to npm
```

---

*This document was generated to outline the complete architectural blueprint for `@krishnapawar/date-time-slots` v2.0.*
