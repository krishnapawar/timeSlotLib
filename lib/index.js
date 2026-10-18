/**
 * @krishnapawar/date-time-slots (v2.0)
 *
 * High-performance, zero-dependency time slot generator, availability engine,
 * and conflict resolver for JavaScript & TypeScript.
 */

const {
  timeToMinutes,
  minutesToTime,
  formatTime,
  formatDate
} = require('./utils');

const {
  generateSlots,
  generateTimePoints,
  findFreeSlots,
  findCommonFreeSlots,
  isOverlapping,
  hasConflict,
  mergeSlots
} = require('./slots');

const { TimeSlot } = require('./builder');

const {
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert,
  normalToRalwayTimeConvert,
  formatTimeIn24Hour,
  timeSlot,
  startToEndTimeSlot
} = require('./legacy');

module.exports = {
  // Modern Primary API
  generateSlots,
  generateTimePoints,
  findFreeSlots,
  findCommonFreeSlots,
  isOverlapping,
  hasConflict,
  mergeSlots,
  TimeSlot,

  // Time & Math Utilities
  timeToMinutes,
  minutesToTime,
  formatTime,
  formatDate,

  // Legacy v1.x Compatibility
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert,
  normalToRalwayTimeConvert,
  formatTimeIn24Hour,
  timeSlot,
  startToEndTimeSlot,

  // Default export alias
  default: {
    generateSlots,
    generateTimePoints,
    findFreeSlots,
    findCommonFreeSlots,
    isOverlapping,
    hasConflict,
    mergeSlots,
    TimeSlot,
    timeToMinutes,
    minutesToTime,
    formatTime,
    railwayToNormalTimeConvert,
    normalToRailwayTimeConvert,
    timeSlot,
    startToEndTimeSlot
  }
};