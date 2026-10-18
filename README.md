# @krishnapawar/date-time-slots ⚡

> **High-performance, zero-dependency time slot generator, availability engine, and conflict resolver for JavaScript & TypeScript.**

[![npm version](https://img.shields.io/npm/v/@krishnapawar/date-time-slots.svg)](https://www.npmjs.com/package/@krishnapawar/date-time-slots)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@krishnapawar/date-time-slots)
[![TypeScript Included](https://img.shields.io/badge/TypeScript-Included-blue.svg)](./lib/index.d.ts)
[![Tests Passing](https://img.shields.io/badge/tests-27%20passing-brightgreen.svg)](./test/slots.test.js)

---

## 🚀 Why `@krishnapawar/date-time-slots` v2.0?

* ⚡ **Zero External Dependencies** — Completely native minute arithmetic (< 3KB bundle size). Replaced heavy, deprecated dependencies like `moment.js`.
* ⏱️ **Buffer & Cleanup Time** — Built-in support for break/cleanup gaps between appointments (e.g. 10-minute buffer).
* ☕ **Break Schedules** — Easily exclude lunch breaks or split-shift pauses (e.g. `13:00 - 14:00`).
* 📅 **Availability & Free-Slot Engine** — Pass your busy appointments and automatically compute all available free slots.
* 👥 **Multi-Calendar Common Free Time** — Find times when multiple people are all available for a meeting.
* 🛡️ **Conflict & Collision Detector** — Prevent double-bookings with instant overlap detection.
* 🌙 **Overnight & Shift Support** — Handles shifts spanning midnight (e.g. `22:00` to `06:00`).
* 🔗 **Fluent Chainable Builder** — `TimeSlot.create().between(...).every(30)...`
* 📦 **Dual ESM & CommonJS** — Works seamlessly with `import` and `require`.
* 📘 **First-Class TypeScript** — Full `.d.ts` types and autocompletion included.
* 🔄 **100% Backward Compatible** — Existing v1.x code continues to work seamlessly with bug-free implementations.

---

## 📦 Installation

```bash
npm install @krishnapawar/date-time-slots
```

or with yarn / pnpm:

```bash
yarn add @krishnapawar/date-time-slots
pnpm add @krishnapawar/date-time-slots
```

---

## ⚡ Quick Start

### ES Module (import)
```javascript
import { generateSlots, TimeSlot } from '@krishnapawar/date-time-slots';

// Generate 30-minute appointment slots between 09:00 and 12:00
const slots = generateSlots({
  start: '09:00',
  end: '12:00',
  interval: 30
});

console.log(slots);
// [
//   { start: '09:00', end: '09:30', duration: 30 },
//   { start: '09:30', end: '10:00', duration: 30 },
//   { start: '10:00', end: '10:30', duration: 30 },
//   ...
// ]
```

### CommonJS (require)
```javascript
const { generateSlots, TimeSlot } = require('@krishnapawar/date-time-slots');
```

---

## 📖 Feature Guide & Examples

### 1. Slot Generation (`generateSlots`)

#### Basic Generation (12-hour or 24-hour)
```javascript
import { generateSlots } from '@krishnapawar/date-time-slots';

const slots = generateSlots({
  start: '09:00 AM',
  end: '01:00 PM',
  interval: 45,       // 45-minute slots
  format: '12h'       // '12h' ("09:00 AM") or '24h' ("09:00")
});
```

#### With Buffers Between Slots (e.g., 10-minute break between appointments)
```javascript
const slots = generateSlots({
  start: '09:00',
  end: '12:00',
  interval: 30,
  buffer: 10          // 10 min break after each slot
});
// 09:00 - 09:30
// 09:40 - 10:10
// 10:20 - 10:50
```

#### Exclude Lunch Breaks & Blocked Appointments
```javascript
const slots = generateSlots({
  start: '09:00 AM',
  end: '05:00 PM',
  interval: 30,
  format: '12h',
  breaks: [
    { start: '01:00 PM', end: '02:00 PM' }  // Exclude lunch break
  ],
  blocked: [
    { start: '10:00 AM', end: '10:30 AM' }  // Booked appointment
  ]
});
```

#### Overnight Shift (Crossing Midnight)
```javascript
const nightSlots = generateSlots({
  start: '22:00',
  end: '04:00',
  interval: 60
});
// 22:00-23:00, 23:00-00:00, 00:00-01:00, 01:00-02:00, 02:00-03:00, 03:00-04:00
```

#### Return as Formatted Strings
```javascript
const stringSlots = generateSlots({
  start: '09:00',
  end: '11:00',
  interval: 30,
  asString: true
});
// ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00']
```

---

### 2. Fluent Builder API (`TimeSlot`)

For clean, chainable and readable code:

```javascript
import { TimeSlot } from '@krishnapawar/date-time-slots';

const slots = TimeSlot.create()
  .between('09:00 AM', '05:00 PM')
  .every(30)                              // 30 min duration
  .withBuffer(10)                         // 10 min break
  .format('12h')                          // 12-hour AM/PM format
  .excludeBreak('01:00 PM', '02:00 PM')   // Lunch break
  .block({ start: '10:00 AM', end: '10:30 AM' })
  .filterPassedToday()                    // Skip past slots if date is today
  .toPairs();                             // returns [{ start, end, duration }]

// Or get formatted strings:
const strings = TimeSlot.create().between('09:00', '11:00').every(30).toStrings();
// ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00']

// Or get discrete time points:
const points = TimeSlot.create().between('09:00', '11:00').every(30).toPoints();
// ['09:00', '09:30', '10:00', '10:30', '11:00']
```

---

### 3. Availability Engine: Find Free Slots (`findFreeSlots`)

Automatically calculate available open slots by subtracting busy appointments from work hours:

```javascript
import { findFreeSlots } from '@krishnapawar/date-time-slots';

const busyAppointments = [
  { start: '10:00', end: '11:00' },
  { start: '14:00', end: '15:30' }
];

// 1. Get continuous free periods
const freeGaps = findFreeSlots({
  workHours: { start: '09:00', end: '18:00' },
  busySlots: busyAppointments,
  minDuration: 30 // Minimum 30 mins
});
// [
//   { start: '09:00', end: '10:00', duration: 60 },
//   { start: '11:00', end: '14:00', duration: 180 },
//   { start: '15:30', end: '18:00', duration: 150 }
// ]

// 2. Or chunk free periods into 30-min bookable slots
const bookableSlots = findFreeSlots({
  workHours: { start: '09:00', end: '18:00' },
  busySlots: busyAppointments,
  slotDuration: 30
});
```

---

### 4. Multi-Person Meeting Finder (`findCommonFreeSlots`)

Find meeting times when all participants are free:

```javascript
import { findCommonFreeSlots } from '@krishnapawar/date-time-slots';

const doctorSchedule = [{ start: '09:00', end: '10:30' }, { start: '13:00', end: '14:00' }];
const patientSchedule = [{ start: '11:30', end: '13:00' }];

const mutualSlots = findCommonFreeSlots({
  schedules: [doctorSchedule, patientSchedule],
  workHours: { start: '09:00', end: '17:00' },
  slotDuration: 30
});
```

---

### 5. Conflict & Overlap Detection

```javascript
import { isOverlapping, hasConflict, mergeSlots } from '@krishnapawar/date-time-slots';

// Check if two slots overlap
isOverlapping(
  { start: '10:00', end: '11:00' },
  { start: '10:30', end: '11:30' }
); // true

// Check if a requested booking conflicts with existing bookings
const bookedAppointments = [
  { start: '09:00', end: '10:00' },
  { start: '14:00', end: '15:00' }
];

const newBooking = { start: '09:30', end: '10:30' };
if (hasConflict(newBooking, bookedAppointments)) {
  console.log('Slot is already booked!');
}

// Merge overlapping or adjacent slots
const merged = mergeSlots([
  { start: '09:00', end: '10:00' },
  { start: '09:30', end: '10:30' },
  { start: '10:30', end: '11:00' }
]);
// [{ start: '09:00', end: '11:00', duration: 120 }]
```

---

### 6. Time Conversion Utilities

Zero-dependency utilities for converting time strings:

```javascript
import {
  timeToMinutes,
  minutesToTime,
  formatTime,
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert
} from '@krishnapawar/date-time-slots';

timeToMinutes('09:30');          // 570
timeToMinutes('09:30 AM');       // 570
timeToMinutes('12:00 AM');       // 0 (midnight)
timeToMinutes('12:00 PM');       // 720 (noon)

minutesToTime(570, '24h');       // '09:30'
minutesToTime(570, '12h');       // '09:30 AM'

formatTime('13:00', '12h');      // '01:00 PM'
formatTime('01:00 PM', '24h');   // '13:00'
```

---

## 🔄 Backward Compatibility (v1.x Support)

Existing v1 code continues to work seamlessly with bug fixes:

```javascript
const {
  startToEndTimeSlot,
  timeSlot,
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert
} = require('@krishnapawar/date-time-slots');

// Legacy slot generation
let data = startToEndTimeSlot('11:00 AM', '01:00 PM', {
  duration: 30,
  startToEndObj: true
});

// Legacy time points
let points = timeSlot({
  starting_time: '12:00',
  ending_time: '17:00',
  duration: 15
});
```

---

## 🛠️ TypeScript Support

Full TypeScript definitions are included out of the box:

```typescript
import {
  generateSlots,
  TimeSlot,
  SlotItem,
  GenerateSlotsOptions
} from '@krishnapawar/date-time-slots';

const options: GenerateSlotsOptions = {
  start: '09:00 AM',
  end: '05:00 PM',
  interval: 30,
  format: '12h'
};

const slots: SlotItem[] = generateSlots(options);
```

---

## 🧪 Testing

The library includes an extensive test suite using Node.js's native test runner:

```bash
npm test
```

---

## 📄 License

MIT © [Krishna Pawar](https://github.com/krishnapawar)