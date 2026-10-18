/**
 * Utility functions for time parsing, arithmetic, and formatting.
 * Zero external dependencies.
 */

/**
 * Pads a number with leading zeros.
 * @param {number} num 
 * @param {number} size 
 * @returns {string}
 */
function padZero(num, size = 2) {
  return String(num).padStart(size, '0');
}

/**
 * Extracts date portion formatted as YYYY-MM-DD.
 * @param {string|Date} dateInput 
 * @returns {string}
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

/**
 * Converts a time string or Date object into minutes from midnight (0 - 1439).
 * Supports:
 * - "HH:mm" / "H:mm" (24-hour, e.g. "09:00", "9:00", "14:30", "00:00")
 * - "hh:mm A" / "h:mm AM/PM" (12-hour, e.g. "09:00 AM", "9:00am", "12:00 PM", "12:00 AM")
 * - Date object or ISO string (extracts hours & minutes)
 * - Integer minutes (0 - 2880)
 *
 * @param {string|number|Date} input 
 * @returns {number} Minutes from midnight
 */
function timeToMinutes(input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) {
      throw new RangeError(`Invalid minutes number: ${input}. Must be non-negative.`);
    }
    return Math.floor(input);
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new TypeError('Invalid Date object provided to timeToMinutes');
    return input.getHours() * 60 + input.getMinutes();
  }

  if (typeof input !== 'string') {
    throw new TypeError(`Expected time to be string, number, or Date, got ${typeof input} (${input})`);
  }

  let str = input.trim();
  if (!str) throw new Error('Time string cannot be empty');

  // Handle ISO string or full datetime string containing "T" or date separators
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    if (timePart) str = timePart.substring(0, 8);
  } else if (/^\d{4}-\d{2}-\d{2}\s+/.test(str)) {
    str = str.replace(/^\d{4}-\d{2}-\d{2}\s+/, '');
  }

  // Check 12-hour or 24-hour format: "H:mm", "HH:mm", "H:mm:ss", "hh:mm AM", "h:mm a"
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?\s*(AM|PM)?$/i);
  if (!match) {
    throw new Error(`Invalid time format: "${input}". Expected formats: "HH:mm", "h:mm A", or ISO datetime.`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (minutes < 0 || minutes > 59) {
    throw new RangeError(`Minutes must be between 0 and 59, got ${minutes} in "${input}"`);
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      throw new RangeError(`Hours in 12-hour format must be between 1 and 12, got ${hours} in "${input}"`);
    }
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    if (hours < 0 || hours > 23) {
      throw new RangeError(`Hours in 24-hour format must be between 0 and 23, got ${hours} in "${input}"`);
    }
  }

  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into a formatted time string.
 *
 * @param {number} totalMinutes 
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'|Function} [format='24h']
 * @returns {string}
 */
function minutesToTime(totalMinutes, format = '24h') {
  if (typeof format === 'function') {
    return format(totalMinutes);
  }

  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  const is12Hour = format === '12h' || format === 'hh:mm A' || format === '12';

  if (is12Hour) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${padZero(displayHours)}:${padZero(minutes)} ${period}`;
  }

  return `${padZero(hours)}:${padZero(minutes)}`;
}

/**
 * Formats any valid time input into the specified format ('12h' or '24h').
 * @param {string|number|Date} timeInput 
 * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} [format='24h'] 
 * @returns {string}
 */
function formatTime(timeInput, format = '24h') {
  const minutes = timeToMinutes(timeInput);
  return minutesToTime(minutes, format);
}

/**
 * Gets the current time in minutes from midnight.
 * @returns {number}
 */
function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Checks whether a given date is today in local time.
 * @param {string|Date} dateInput 
 * @returns {boolean}
 */
function isDateToday(dateInput) {
  if (!dateInput) return true;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

module.exports = {
  padZero,
  formatDate,
  timeToMinutes,
  minutesToTime,
  formatTime,
  getCurrentMinutes,
  isDateToday
};
