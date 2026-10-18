/**
 * Backward compatibility layer for v1.x API methods.
 * Bug-fixed, zero-dependency, and fully compatible with existing codebases.
 */

const {
  timeToMinutes,
  minutesToTime,
  formatDate,
  formatTime
} = require('./utils');
const { generateSlots, generateTimePoints } = require('./slots');

/**
 * Converts 24-hour railway time (e.g. "13:00") to 12-hour time (e.g. "01:00 PM").
 * @param {string|number|Date} time 
 * @returns {string}
 */
function railwayToNormalTimeConvert(time) {
  if (time === undefined || time === null) return '';
  return formatTime(time, '12h');
}

/**
 * Converts 12-hour time (e.g. "01:00 PM") to 24-hour railway time (e.g. "13:00").
 * @param {string|number|Date} timeStr 
 * @returns {string}
 */
function normalToRailwayTimeConvert(timeStr) {
  if (timeStr === undefined || timeStr === null) return '';
  return formatTime(timeStr, '24h');
}

/**
 * Alias for normalToRailwayTimeConvert (retained for backward compatibility with v1.x typo).
 * @param {string|number|Date} timeStr 
 * @returns {string}
 */
function normalToRalwayTimeConvert(timeStr) {
  return normalToRailwayTimeConvert(timeStr);
}

/**
 * Converts any time string with AM/PM into 24-hour format (e.g. "13:00").
 * @param {string} timeStr 
 * @returns {string}
 */
function formatTimeIn24Hour(timeStr) {
  if (!timeStr) return '';
  try {
    return formatTime(timeStr, '24h');
  } catch (err) {
    console.error('formatTimeIn24Hour error:', err.message);
    return '';
  }
}

/**
 * Legacy v1.x function to generate time slots array.
 * @param {Object} [x={}]
 * @returns {string[]}
 */
function timeSlot(x = {}) {
  const startingTime = x.starting_time || x.startTime || x.start;
  const endingTime = x.ending_time || x.endTime || x.end;

  if (!startingTime || !endingTime) {
    return [];
  }

  const duration = Number(x.duration) > 0 ? Number(x.duration) : 15;
  // In v1, isNotRailwayTime: true generated 24h, false generated 12h
  const format = x.format || (x.isNotRailwayTime ? '24h' : '12h');

  return generateTimePoints({
    start: startingTime,
    end: endingTime,
    interval: duration,
    format,
    date: x.date,
    filterPassedToday: Boolean(x.isCurrent),
    blocked: x.blockSchedule || []
  });
}

/**
 * Legacy v1.x function to generate slot pairs with options.
 *
 * @param {string} opentimes 
 * @param {string} closetimes 
 * @param {Object} [data={}] 
 * @returns {Array<Object>}
 */
function startToEndTimeSlot(opentimes, closetimes, data = {}) {
  if (!opentimes || !closetimes) {
    console.error('startToEndTimeSlot: opentimes and closetimes are required');
    return [];
  }

  const duration = Number(data.duration) > 0 ? Number(data.duration) : 15;
  const is12Hour = Boolean(data.isNotRailwayTime);
  const format = data.format || (is12Hour ? '12h' : '24h');
  const withDate = Boolean(data.withDate);
  const dateValue = data.date ? formatDate(data.date) : formatDate(new Date());

  const slots = generateSlots({
    start: opentimes,
    end: closetimes,
    interval: duration,
    format,
    date: data.date,
    filterPassedToday: Boolean(data.isCurrent),
    blocked: data.blockSchedule || []
  });

  return slots.map(s => {
    if (data.startToEndObj) {
      const item = { start: s.start, end: s.end };
      if (withDate) item.date = dateValue;
      return item;
    }

    const item = { slot: `${s.start} - ${s.end}` };
    if (withDate) item.date = dateValue;
    return item;
  });
}

module.exports = {
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert,
  normalToRalwayTimeConvert,
  formatTimeIn24Hour,
  timeSlot,
  startToEndTimeSlot
};
