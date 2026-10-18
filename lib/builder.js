/**
 * Fluent builder class for expressive and chainable time slot generation.
 * Zero external dependencies.
 */

const { generateSlots, generateTimePoints } = require('./slots');

class TimeSlot {
  /**
   * Initializes a new TimeSlot builder instance.
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this._start = options.start;
    this._end = options.end;
    this._interval = options.interval ?? 15;
    this._buffer = options.buffer ?? 0;
    this._format = options.format ?? '24h';
    this._date = options.date ?? null;
    this._withDate = options.withDate ?? false;
    this._breaks = options.breaks ? [...options.breaks] : [];
    this._blocked = options.blocked ? [...options.blocked] : [];
    this._filterPassedToday = options.filterPassedToday ?? false;
  }

  /**
   * Factory method to start a new builder chain.
   * @param {Object} [options]
   * @returns {TimeSlot}
   */
  static create(options) {
    return new TimeSlot(options);
  }

  /**
   * Sets the start and end boundary times.
   * @param {string|number|Date} start 
   * @param {string|number|Date} end 
   * @returns {this}
   */
  between(start, end) {
    this._start = start;
    this._end = end;
    return this;
  }

  /**
   * Sets the interval (slot duration in minutes).
   * @param {number} minutes 
   * @returns {this}
   */
  every(minutes) {
    this._interval = minutes;
    return this;
  }

  /**
   * Sets buffer/gap time between slots in minutes.
   * @param {number} minutes 
   * @returns {this}
   */
  withBuffer(minutes) {
    this._buffer = minutes;
    return this;
  }

  /**
   * Sets output time format ('24h' or '12h').
   * @param {'24h'|'12h'|'HH:mm'|'hh:mm A'} fmt 
   * @returns {this}
   */
  format(fmt) {
    this._format = fmt;
    return this;
  }

  /**
   * Sets the target date.
   * @param {string|Date} date 
   * @returns {this}
   */
  onDate(date) {
    this._date = date;
    return this;
  }

  /**
   * Configures whether to attach the date to output objects.
   * @param {boolean} [include=true] 
   * @returns {this}
   */
  withDate(include = true) {
    this._withDate = include;
    return this;
  }

  /**
   * Adds a single break time to exclude.
   * @param {string|number|Date} start 
   * @param {string|number|Date} end 
   * @returns {this}
   */
  excludeBreak(start, end) {
    this._breaks.push({ start, end });
    return this;
  }

  /**
   * Adds multiple breaks to exclude.
   * @param {Array<Object>} breaks 
   * @returns {this}
   */
  excludeBreaks(breaks) {
    if (Array.isArray(breaks)) {
      this._breaks.push(...breaks);
    }
    return this;
  }

  /**
   * Adds blocked slots to exclude.
   * @param {Object|string|Array<Object|string>} itemOrArray 
   * @returns {this}
   */
  block(itemOrArray) {
    if (Array.isArray(itemOrArray)) {
      this._blocked.push(...itemOrArray);
    } else if (itemOrArray) {
      this._blocked.push(itemOrArray);
    }
    return this;
  }

  /**
   * Filters out slots that have already passed if the date is today.
   * @param {boolean} [filter=true] 
   * @returns {this}
   */
  filterPassedToday(filter = true) {
    this._filterPassedToday = filter;
    return this;
  }

  /**
   * Generates and returns slots as object pairs: [{ start, end, duration }].
   * @returns {Array<{ start: string, end: string, duration: number, date?: string }>}
   */
  toPairs() {
    return generateSlots({
      start: this._start,
      end: this._end,
      interval: this._interval,
      buffer: this._buffer,
      format: this._format,
      date: this._date,
      withDate: this._withDate,
      breaks: this._breaks,
      blocked: this._blocked,
      filterPassedToday: this._filterPassedToday,
      asString: false
    });
  }

  /**
   * Generates and returns slots as range strings: ["09:00 - 09:30", ...].
   * @returns {string[]}
   */
  toStrings() {
    return generateSlots({
      start: this._start,
      end: this._end,
      interval: this._interval,
      buffer: this._buffer,
      format: this._format,
      date: this._date,
      breaks: this._breaks,
      blocked: this._blocked,
      filterPassedToday: this._filterPassedToday,
      asString: true
    });
  }

  /**
   * Generates and returns individual time points: ["09:00", "09:30", ...].
   * @returns {string[]}
   */
  toPoints() {
    return generateTimePoints({
      start: this._start,
      end: this._end,
      interval: this._interval,
      format: this._format,
      date: this._date,
      breaks: this._breaks,
      blocked: this._blocked,
      filterPassedToday: this._filterPassedToday
    });
  }
}

module.exports = { TimeSlot };
