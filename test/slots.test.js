const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  timeToMinutes,
  minutesToTime,
  formatTime,
  generateSlots,
  generateTimePoints,
  isOverlapping,
  hasConflict,
  mergeSlots,
  findFreeSlots,
  findCommonFreeSlots,
  TimeSlot,
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert,
  normalToRalwayTimeConvert,
  formatTimeIn24Hour,
  timeSlot,
  startToEndTimeSlot
} = require('../lib/index.js');

describe('Time Arithmetic & Parsing (timeToMinutes / minutesToTime)', () => {
  it('correctly converts 24-hour time to minutes', () => {
    assert.strictEqual(timeToMinutes('00:00'), 0);
    assert.strictEqual(timeToMinutes('09:30'), 570);
    assert.strictEqual(timeToMinutes('13:45'), 825);
    assert.strictEqual(timeToMinutes('23:59'), 1439);
  });

  it('correctly converts 12-hour AM/PM time to minutes', () => {
    assert.strictEqual(timeToMinutes('12:00 AM'), 0);     // Midnight
    assert.strictEqual(timeToMinutes('12:30 AM'), 30);
    assert.strictEqual(timeToMinutes('09:00 AM'), 540);
    assert.strictEqual(timeToMinutes('12:00 PM'), 720);    // Noon
    assert.strictEqual(timeToMinutes('12:30 PM'), 750);
    assert.strictEqual(timeToMinutes('01:00 PM'), 780);
    assert.strictEqual(timeToMinutes('11:59 PM'), 1439);
  });

  it('handles Date objects and ISO strings', () => {
    const d = new Date(2026, 9, 19, 14, 45);
    assert.strictEqual(timeToMinutes(d), 14 * 60 + 45);
    assert.strictEqual(timeToMinutes('2026-10-19T14:45:00.000Z'), 14 * 60 + 45);
  });

  it('throws on invalid time strings', () => {
    assert.throws(() => timeToMinutes('invalid'), /Invalid time format/);
    assert.throws(() => timeToMinutes('25:00'), /Hours in 24-hour format must be between 0 and 23/);
    assert.throws(() => timeToMinutes('10:65'), /Minutes must be between 0 and 59/);
  });

  it('converts minutes back to 24h and 12h strings', () => {
    assert.strictEqual(minutesToTime(0, '24h'), '00:00');
    assert.strictEqual(minutesToTime(0, '12h'), '12:00 AM');
    assert.strictEqual(minutesToTime(720, '24h'), '12:00');
    assert.strictEqual(minutesToTime(720, '12h'), '12:00 PM');
    assert.strictEqual(minutesToTime(780, '24h'), '13:00');
    assert.strictEqual(minutesToTime(780, '12h'), '01:00 PM');
  });

  it('formatTime converts between formats cleanly', () => {
    assert.strictEqual(formatTime('13:00', '12h'), '01:00 PM');
    assert.strictEqual(formatTime('01:00 PM', '24h'), '13:00');
  });
});

describe('Slot Generation (generateSlots / generateTimePoints)', () => {
  it('generates standard 30-minute slots in 24h format', () => {
    const slots = generateSlots({
      start: '09:00',
      end: '11:00',
      interval: 30
    });

    assert.strictEqual(slots.length, 4);
    assert.deepStrictEqual(slots[0], { start: '09:00', end: '09:30', duration: 30 });
    assert.deepStrictEqual(slots[3], { start: '10:30', end: '11:00', duration: 30 });
  });

  it('generates slots in 12h format', () => {
    const slots = generateSlots({
      start: '11:00 AM',
      end: '01:00 PM',
      interval: 60,
      format: '12h'
    });

    assert.strictEqual(slots.length, 2);
    assert.deepStrictEqual(slots[0], { start: '11:00 AM', end: '12:00 PM', duration: 60 });
    assert.deepStrictEqual(slots[1], { start: '12:00 PM', end: '01:00 PM', duration: 60 });
  });

  it('supports buffer time between slots', () => {
    const slots = generateSlots({
      start: '09:00',
      end: '11:00',
      interval: 30,
      buffer: 10 // 10 min break between slots
    });

    // 09:00-09:30, gap 09:30-09:40
    // 09:40-10:10, gap 10:10-10:20
    // 10:20-10:50, gap 10:50-11:00
    assert.strictEqual(slots.length, 3);
    assert.deepStrictEqual(slots[0], { start: '09:00', end: '09:30', duration: 30 });
    assert.deepStrictEqual(slots[1], { start: '09:40', end: '10:10', duration: 30 });
    assert.deepStrictEqual(slots[2], { start: '10:20', end: '10:50', duration: 30 });
  });

  it('excludes break times (e.g. lunch)', () => {
    const slots = generateSlots({
      start: '11:00',
      end: '15:00',
      interval: 60,
      breaks: [{ start: '12:00', end: '13:00' }]
    });

    // 11:00-12:00 (yes), 12:00-13:00 (break skipped), 13:00-14:00 (yes), 14:00-15:00 (yes)
    assert.strictEqual(slots.length, 3);
    assert.strictEqual(slots[0].start, '11:00');
    assert.strictEqual(slots[1].start, '13:00');
    assert.strictEqual(slots[2].start, '14:00');
  });

  it('excludes blocked/booked slots', () => {
    const slots = generateSlots({
      start: '09:00',
      end: '11:00',
      interval: 30,
      blocked: [{ start: '09:30', end: '10:00' }]
    });

    assert.strictEqual(slots.length, 3);
    assert.strictEqual(slots[0].start, '09:00');
    assert.strictEqual(slots[1].start, '10:00');
    assert.strictEqual(slots[2].start, '10:30');
  });

  it('handles overnight shifts spanning midnight', () => {
    const slots = generateSlots({
      start: '23:00',
      end: '02:00',
      interval: 60
    });

    assert.strictEqual(slots.length, 3);
    assert.deepStrictEqual(slots[0], { start: '23:00', end: '00:00', duration: 60 });
    assert.deepStrictEqual(slots[1], { start: '00:00', end: '01:00', duration: 60 });
    assert.deepStrictEqual(slots[2], { start: '01:00', end: '02:00', duration: 60 });
  });

  it('outputs as range strings with asString: true', () => {
    const strings = generateSlots({
      start: '09:00',
      end: '10:00',
      interval: 30,
      asString: true
    });

    assert.deepStrictEqual(strings, ['09:00 - 09:30', '09:30 - 10:00']);
  });

  it('generateTimePoints generates discrete time points', () => {
    const points = generateTimePoints({
      start: '09:00',
      end: '10:00',
      interval: 15
    });

    assert.deepStrictEqual(points, ['09:00', '09:15', '09:30', '09:45', '10:00']);
  });
});

describe('Overlap & Conflict Detection (isOverlapping / hasConflict / mergeSlots)', () => {
  it('accurately detects overlapping and non-overlapping slots', () => {
    // Overlapping
    assert.strictEqual(isOverlapping({ start: '10:00', end: '11:00' }, { start: '10:30', end: '11:30' }), true);
    assert.strictEqual(isOverlapping({ start: '10:00', end: '12:00' }, { start: '10:30', end: '11:00' }), true);

    // Contiguous (touching boundaries do not conflict)
    assert.strictEqual(isOverlapping({ start: '10:00', end: '11:00' }, { start: '11:00', end: '12:00' }), false);

    // Completely separate
    assert.strictEqual(isOverlapping({ start: '09:00', end: '10:00' }, { start: '14:00', end: '15:00' }), false);
  });

  it('hasConflict checks against an entire array of busy slots', () => {
    const busy = [
      { start: '09:00', end: '10:00' },
      { start: '14:00', end: '15:00' }
    ];

    assert.strictEqual(hasConflict({ start: '09:30', end: '10:30' }, busy), true);
    assert.strictEqual(hasConflict({ start: '10:00', end: '11:00' }, busy), false);
    assert.strictEqual(hasConflict({ start: '13:00', end: '14:00' }, busy), false);
  });

  it('merges overlapping and adjacent slots cleanly', () => {
    const merged = mergeSlots([
      { start: '09:00', end: '10:00' },
      { start: '09:30', end: '10:30' },
      { start: '10:30', end: '11:30' },
      { start: '14:00', end: '15:00' }
    ]);

    assert.strictEqual(merged.length, 2);
    assert.deepStrictEqual(merged[0], { start: '09:00', end: '11:30', duration: 150 });
    assert.deepStrictEqual(merged[1], { start: '14:00', end: '15:00', duration: 60 });
  });
});

describe('Availability Engine (findFreeSlots / findCommonFreeSlots)', () => {
  it('finds free continuous gaps in a workday', () => {
    const free = findFreeSlots({
      workHours: { start: '09:00', end: '17:00' },
      busySlots: [
        { start: '10:00', end: '11:00' },
        { start: '14:00', end: '15:00' }
      ]
    });

    assert.strictEqual(free.length, 3);
    assert.deepStrictEqual(free[0], { start: '09:00', end: '10:00', duration: 60 });
    assert.deepStrictEqual(free[1], { start: '11:00', end: '14:00', duration: 180 });
    assert.deepStrictEqual(free[2], { start: '15:00', end: '17:00', duration: 120 });
  });

  it('chunks free gaps into discrete slots of slotDuration', () => {
    const slots = findFreeSlots({
      workHours: { start: '09:00', end: '12:00' },
      busySlots: [{ start: '10:00', end: '11:00' }],
      slotDuration: 30
    });

    // 09:00-09:30, 09:30-10:00, 11:00-11:30, 11:30-12:00
    assert.strictEqual(slots.length, 4);
    assert.strictEqual(slots[0].start, '09:00');
    assert.strictEqual(slots[1].start, '09:30');
    assert.strictEqual(slots[2].start, '11:00');
    assert.strictEqual(slots[3].start, '11:30');
  });

  it('finds common free slots across multiple calendars', () => {
    const aliceBusy = [{ start: '09:00', end: '10:30' }];
    const bobBusy = [{ start: '11:30', end: '13:00' }];

    const common = findCommonFreeSlots({
      schedules: [aliceBusy, bobBusy],
      workHours: { start: '09:00', end: '14:00' },
      minDuration: 30
    });

    // Available: 10:30 to 11:30 (60 mins), 13:00 to 14:00 (60 mins)
    assert.strictEqual(common.length, 2);
    assert.deepStrictEqual(common[0], { start: '10:30', end: '11:30', duration: 60 });
    assert.deepStrictEqual(common[1], { start: '13:00', end: '14:00', duration: 60 });
  });
});

describe('Fluent Builder API (TimeSlot)', () => {
  it('chains methods smoothly to produce slot pairs', () => {
    const slots = TimeSlot.create()
      .between('09:00 AM', '12:00 PM')
      .every(30)
      .format('12h')
      .excludeBreak('10:00 AM', '10:30 AM')
      .toPairs();

    assert.strictEqual(slots.length, 5);
    assert.strictEqual(slots[0].start, '09:00 AM');
    assert.strictEqual(slots[1].start, '09:30 AM');
    assert.strictEqual(slots[2].start, '10:30 AM'); // Skipped 10:00 AM break
  });

  it('chains methods to produce strings and points', () => {
    const strList = TimeSlot.create()
      .between('09:00', '10:00')
      .every(30)
      .toStrings();

    assert.deepStrictEqual(strList, ['09:00 - 09:30', '09:30 - 10:00']);

    const points = TimeSlot.create()
      .between('09:00', '10:00')
      .every(30)
      .toPoints();

    assert.deepStrictEqual(points, ['09:00', '09:30', '10:00']);
  });
});

describe('Legacy Compatibility Layer (v1.x Functions)', () => {
  it('railwayToNormalTimeConvert converts 24h to 12h', () => {
    assert.strictEqual(railwayToNormalTimeConvert('13:00'), '01:00 PM');
    assert.strictEqual(railwayToNormalTimeConvert('00:00'), '12:00 AM');
  });

  it('normalToRailwayTimeConvert and alias convert 12h to 24h', () => {
    assert.strictEqual(normalToRailwayTimeConvert('01:00 PM'), '13:00');
    assert.strictEqual(normalToRalwayTimeConvert('01:00 PM'), '13:00');
  });

  it('formatTimeIn24Hour converts 12h to 24h', () => {
    assert.strictEqual(formatTimeIn24Hour('01:00 PM'), '13:00');
  });

  it('timeSlot produces array of strings', () => {
    const points = timeSlot({
      starting_time: '09:00',
      ending_time: '10:00',
      duration: 30,
      isNotRailwayTime: true
    });

    assert.deepStrictEqual(points, ['09:00', '09:30', '10:00']);
  });

  it('startToEndTimeSlot produces pairs of slots', () => {
    const slots = startToEndTimeSlot('09:00', '10:00', {
      duration: 30,
      startToEndObj: true
    });

    assert.strictEqual(slots.length, 2);
    assert.deepStrictEqual(slots[0], { start: '09:00', end: '09:30' });
    assert.deepStrictEqual(slots[1], { start: '09:30', end: '10:00' });
  });
});
