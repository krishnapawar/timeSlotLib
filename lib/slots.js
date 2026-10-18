/**
 * Core time slot generation, manipulation, conflict checking, and availability algorithms.
 * Zero external dependencies.
 */

const {
  timeToMinutes,
  minutesToTime,
  formatDate,
  getCurrentMinutes,
  isDateToday
} = require('./utils');

/**
 * Normalizes any slot-like input into minute numbers { start: number, end: number }.
 * Supports:
 * - { start: "09:00", end: "10:00" }
 * - { slot: "09:00 - 10:00" }
 * - "09:00 - 10:00"
 * - "09:00" (single point, default duration applied if given)
 *
 * @param {Object|string} slot 
 * @param {number} [defaultDuration=15]
 * @returns {{ start: number, end: number }}
 */
function normalizeSlotRange(slot, defaultDuration = 15) {
  if (!slot) {
    throw new TypeError('Invalid slot: cannot be null or undefined');
  }

  // Object with start and end
  if (typeof slot === 'object' && slot.start !== undefined && slot.end !== undefined) {
    let startMin = timeToMinutes(slot.start);
    let endMin = timeToMinutes(slot.end);
    if (endMin < startMin) endMin += 1440;
    return { start: startMin, end: endMin };
  }

  // Object with 'slot' string: e.g. { slot: "09:00 - 10:00" }
  let str = '';
  if (typeof slot === 'object' && typeof slot.slot === 'string') {
    str = slot.slot;
  } else if (typeof slot === 'string') {
    str = slot;
  }

  if (str) {
    if (str.includes('-')) {
      const parts = str.split('-');
      let startMin = timeToMinutes(parts[0].trim());
      let endMin = timeToMinutes(parts[1].trim());
      if (endMin < startMin) endMin += 1440;
      return { start: startMin, end: endMin };
    }
    // Single time string
    const startMin = timeToMinutes(str.trim());
    return { start: startMin, end: startMin + defaultDuration };
  }

  throw new TypeError(`Unsupported slot format: ${JSON.stringify(slot)}`);
}

/**
 * Checks if two time intervals overlap.
 *
 * @param {Object|string} slotA 
 * @param {Object|string} slotB 
 * @returns {boolean}
 */
function isOverlapping(slotA, slotB) {
  const a = normalizeSlotRange(slotA);
  const b = normalizeSlotRange(slotB);
  return a.start < b.end && a.end > b.start;
}

/**
 * Checks whether a requested slot conflicts with any busy slots in a list.
 *
 * @param {Object|string} requestedSlot 
 * @param {Array<Object|string>} busySlots 
 * @returns {boolean}
 */
function hasConflict(requestedSlot, busySlots = []) {
  if (!Array.isArray(busySlots) || busySlots.length === 0) return false;
  const target = normalizeSlotRange(requestedSlot);

  for (const busy of busySlots) {
    const range = normalizeSlotRange(busy);
    if (target.start < range.end && target.end > range.start) {
      return true;
    }
  }

  return false;
}

/**
 * Merges overlapping or contiguous time slots.
 *
 * @param {Array<Object|string>} slots 
 * @param {Object} [options]
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} [options.format='24h']
 * @returns {Array<{ start: string, end: string, duration: number }>}
 */
function mergeSlots(slots, options = {}) {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  const format = options.format || '24h';
  const ranges = slots
    .map(s => normalizeSlotRange(s))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  let current = { ...ranges[0] };

  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    if (next.start <= current.end) {
      // Overlapping or contiguous: extend the end
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged.map(range => ({
    start: minutesToTime(range.start, format),
    end: minutesToTime(range.end, format),
    duration: range.end - range.start
  }));
}

/**
 * Generates an array of time slot pairs with support for intervals, buffers,
 * break schedules, blocked slots, and current-time filtering.
 *
 * @param {Object} options
 * @param {string|number|Date} options.start - Starting time (e.g. "09:00" or "09:00 AM")
 * @param {string|number|Date} options.end - Ending time (e.g. "17:00" or "05:00 PM")
 * @param {number} [options.interval=15] - Slot duration in minutes
 * @param {number} [options.buffer=0] - Buffer/break time between slots in minutes
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} [options.format='24h'] - Output time format
 * @param {string|Date} [options.date] - Optional date to attach to results
 * @param {boolean} [options.withDate=false] - Whether to include date in result objects
 * @param {Array<Object|string>} [options.breaks=[]] - List of break times to exclude (e.g. lunch)
 * @param {Array<Object|string>} [options.blocked=[]] - List of booked/blocked slots to exclude
 * @param {boolean} [options.filterPassedToday=false] - Filter out slots that have already passed today
 * @param {boolean} [options.asString=false] - Return as strings (e.g. "09:00 - 09:30")
 * @returns {Array<Object|string>}
 */
function generateSlots(options = {}) {
  const {
    start,
    end,
    interval = 15,
    buffer = 0,
    format = '24h',
    date = null,
    withDate = false,
    breaks = [],
    blocked = [],
    filterPassedToday = false,
    asString = false
  } = options;

  if (start === undefined || start === null) {
    throw new TypeError('generateSlots requires a "start" time');
  }
  if (end === undefined || end === null) {
    throw new TypeError('generateSlots requires an "end" time');
  }
  if (typeof interval !== 'number' || interval <= 0) {
    throw new RangeError(`Interval must be a positive number, got ${interval}`);
  }
  if (typeof buffer !== 'number' || buffer < 0) {
    throw new RangeError(`Buffer must be a non-negative number, got ${buffer}`);
  }

  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);

  // If end is less than start, it represents an overnight shift (e.g. 22:00 to 06:00)
  if (endMin <= startMin) {
    endMin += 1440;
  }

  // Pre-normalize breaks
  const parsedBreaks = Array.isArray(breaks)
    ? breaks.map(b => normalizeSlotRange(b, interval))
    : [];

  // Pre-normalize blocked schedules
  const parsedBlocked = Array.isArray(blocked)
    ? blocked.map(b => normalizeSlotRange(b, interval))
    : [];

  const shouldFilterPassed = Boolean(filterPassedToday && isDateToday(date));
  const currentMinutes = shouldFilterPassed ? getCurrentMinutes() : 0;

  const results = [];
  let current = startMin;

  while (current + interval <= endMin) {
    const slotStart = current;
    const slotEnd = current + interval;

    // Check collision with any break
    const isInBreak = parsedBreaks.some(brk => slotStart < brk.end && slotEnd > brk.start);

    // Check collision with any blocked slot
    const isBlocked = parsedBlocked.some(blk => slotStart < blk.end && slotEnd > blk.start);

    // Check if slot has already passed today
    const hasPassed = shouldFilterPassed && slotStart <= currentMinutes;

    if (!isInBreak && !isBlocked && !hasPassed) {
      const startFormatted = minutesToTime(slotStart, format);
      const endFormatted = minutesToTime(slotEnd, format);

      if (asString) {
        results.push(`${startFormatted} - ${endFormatted}`);
      } else {
        const item = {
          start: startFormatted,
          end: endFormatted,
          duration: interval
        };
        if (withDate) {
          item.date = date ? formatDate(date) : formatDate(new Date());
        }
        results.push(item);
      }
    }

    current += interval + buffer;
  }

  return results;
}

/**
 * Generates an array of individual time points (e.g. ["09:00", "09:15", "09:30"]).
 *
 * @param {Object} options
 * @param {string|number|Date} options.start
 * @param {string|number|Date} options.end
 * @param {number} [options.interval=15]
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} [options.format='24h']
 * @param {Array<Object|string>} [options.breaks=[]]
 * @param {Array<Object|string>} [options.blocked=[]]
 * @param {boolean} [options.filterPassedToday=false]
 * @param {string|Date} [options.date]
 * @param {boolean} [options.includeEnd=true] - Whether to include the final boundary point
 * @returns {string[]}
 */
function generateTimePoints(options = {}) {
  const {
    start,
    end,
    interval = 15,
    format = '24h',
    breaks = [],
    blocked = [],
    filterPassedToday = false,
    date = null,
    includeEnd = true
  } = options;

  if (start === undefined || start === null) throw new TypeError('requires a "start" time');
  if (end === undefined || end === null) throw new TypeError('requires an "end" time');
  if (typeof interval !== 'number' || interval <= 0) {
    throw new RangeError(`Interval must be a positive number, got ${interval}`);
  }

  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin <= startMin) endMin += 1440;

  const parsedBreaks = Array.isArray(breaks) ? breaks.map(b => normalizeSlotRange(b, interval)) : [];
  const parsedBlocked = Array.isArray(blocked) ? blocked.map(b => normalizeSlotRange(b, interval)) : [];

  const shouldFilterPassed = Boolean(filterPassedToday && isDateToday(date));
  const currentMinutes = shouldFilterPassed ? getCurrentMinutes() : 0;

  const points = [];
  let current = startMin;

  while (includeEnd ? current <= endMin : current < endMin) {
    const pointMin = current;

    // Check if point falls strictly inside any break or blocked slot
    const inBreak = parsedBreaks.some(brk => pointMin >= brk.start && pointMin < brk.end);
    const inBlocked = parsedBlocked.some(blk => pointMin >= blk.start && pointMin < blk.end);
    const hasPassed = shouldFilterPassed && pointMin <= currentMinutes;

    if (!inBreak && !inBlocked && !hasPassed) {
      points.push(minutesToTime(pointMin, format));
    }

    current += interval;
  }

  return points;
}

/**
 * Calculates all available free slots in a workday given a list of busy/booked appointments.
 *
 * @param {Object} options
 * @param {{ start: string|number|Date, end: string|number|Date }} options.workHours - Working hours
 * @param {Array<Object|string>} [options.busySlots=[]] - List of currently booked slots
 * @param {number} [options.minDuration=15] - Minimum required duration for an available slot
 * @param {number} [options.slotDuration] - If provided, chunks free periods into slots of this duration
 * @param {number} [options.buffer=0] - Buffer time between slots when slotDuration is specified
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} [options.format='24h']
 * @returns {Array<{ start: string, end: string, duration: number }>}
 */
function findFreeSlots(options = {}) {
  const {
    workHours,
    busySlots = [],
    minDuration = 15,
    slotDuration,
    buffer = 0,
    format = '24h'
  } = options;

  if (!workHours || !workHours.start || !workHours.end) {
    throw new TypeError('findFreeSlots requires "workHours" with { start, end }');
  }

  let workStart = timeToMinutes(workHours.start);
  let workEnd = timeToMinutes(workHours.end);
  if (workEnd <= workStart) workEnd += 1440;

  // Filter and normalize busy slots within work hours
  const normalizedBusy = busySlots
    .map(s => normalizeSlotRange(s))
    .map(s => ({
      start: Math.max(workStart, s.start),
      end: Math.min(workEnd, s.end)
    }))
    .filter(s => s.start < s.end)
    .sort((a, b) => a.start - b.start);

  // Merge overlapping busy slots
  const mergedBusy = [];
  if (normalizedBusy.length > 0) {
    let cur = { ...normalizedBusy[0] };
    for (let i = 1; i < normalizedBusy.length; i++) {
      const next = normalizedBusy[i];
      if (next.start <= cur.end) {
        cur.end = Math.max(cur.end, next.end);
      } else {
        mergedBusy.push(cur);
        cur = { ...next };
      }
    }
    mergedBusy.push(cur);
  }

  // Find gaps
  const freeGaps = [];
  let pointer = workStart;

  for (const busy of mergedBusy) {
    if (busy.start > pointer) {
      freeGaps.push({ start: pointer, end: busy.start });
    }
    pointer = Math.max(pointer, busy.end);
  }

  if (pointer < workEnd) {
    freeGaps.push({ start: pointer, end: workEnd });
  }

  // If slotDuration is specified, chunk the free gaps into discrete slots
  if (slotDuration && slotDuration > 0) {
    const chunked = [];
    for (const gap of freeGaps) {
      let curSlot = gap.start;
      while (curSlot + slotDuration <= gap.end) {
        chunked.push({
          start: minutesToTime(curSlot, format),
          end: minutesToTime(curSlot + slotDuration, format),
          duration: slotDuration
        });
        curSlot += slotDuration + buffer;
      }
    }
    return chunked;
  }

  // Otherwise, return free continuous intervals that meet minDuration
  return freeGaps
    .filter(gap => (gap.end - gap.start) >= minDuration)
    .map(gap => ({
      start: minutesToTime(gap.start, format),
      end: minutesToTime(gap.end, format),
      duration: gap.end - gap.start
    }));
}

/**
 * Finds common free slots across multiple calendars/schedules (e.g. for team meetings).
 *
 * @param {Object} options
 * @param {Array<Array<Object|string>>} options.schedules - Array of busy schedules (e.g. [userABusy, userBBusy])
 * @param {{ start: string, end: string }} options.workHours
 * @param {number} [options.minDuration=15]
 * @param {number} [options.slotDuration]
 * @param {number} [options.buffer=0]
 * @param {'24h'|'12h'} [options.format='24h']
 * @returns {Array<{ start: string, end: string, duration: number }>}
 */
function findCommonFreeSlots(options = {}) {
  const { schedules = [], ...rest } = options;
  if (!Array.isArray(schedules)) {
    throw new TypeError('"schedules" must be an array of schedule arrays');
  }

  // Flatten all users' busy slots into a single combined list
  const combinedBusy = schedules.flat();

  return findFreeSlots({
    ...rest,
    busySlots: combinedBusy
  });
}

module.exports = {
  normalizeSlotRange,
  isOverlapping,
  hasConflict,
  mergeSlots,
  generateSlots,
  generateTimePoints,
  findFreeSlots,
  findCommonFreeSlots
};
