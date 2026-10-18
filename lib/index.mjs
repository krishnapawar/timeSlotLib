/**
 * @krishnapawar/date-time-slots (v2.0) - ESM Entry Point
 */

import cjsModule from './index.js';

export const {
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
  formatDate,
  railwayToNormalTimeConvert,
  normalToRailwayTimeConvert,
  normalToRalwayTimeConvert,
  formatTimeIn24Hour,
  timeSlot,
  startToEndTimeSlot
} = cjsModule;

export default cjsModule;
