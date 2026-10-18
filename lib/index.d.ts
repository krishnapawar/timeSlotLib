/**
 * TypeScript definitions for @krishnapawar/date-time-slots
 */

export type TimeFormat = '24h' | '12h' | 'HH:mm' | 'hh:mm A' | string;

export interface SlotRange {
  start: string;
  end: string;
}

export interface SlotItem {
  start: string;
  end: string;
  duration: number;
  date?: string;
}

export interface GenerateSlotsOptions {
  /** Start time (e.g. "09:00", "09:00 AM", or Date) */
  start: string | number | Date;
  /** End time (e.g. "17:00", "05:00 PM", or Date) */
  end: string | number | Date;
  /** Duration of each slot in minutes (default: 15) */
  interval?: number;
  /** Buffer / cleanup gap between slots in minutes (default: 0) */
  buffer?: number;
  /** Output format: '24h' or '12h' (default: '24h') */
  format?: TimeFormat;
  /** Optional date associated with the slots */
  date?: string | Date | null;
  /** Whether to include date in output items (default: false) */
  withDate?: boolean;
  /** Break times to exclude (e.g. lunch breaks) */
  breaks?: Array<SlotRange | string>;
  /** Booked or blocked slots to exclude */
  blocked?: Array<SlotRange | { slot: string } | string>;
  /** If true, excludes slots that have already passed if the date is today */
  filterPassedToday?: boolean;
  /** If true, returns string format: "09:00 - 09:30" */
  asString?: boolean;
}

export interface GenerateTimePointsOptions {
  start: string | number | Date;
  end: string | number | Date;
  interval?: number;
  format?: TimeFormat;
  breaks?: Array<SlotRange | string>;
  blocked?: Array<SlotRange | { slot: string } | string>;
  filterPassedToday?: boolean;
  date?: string | Date | null;
  includeEnd?: boolean;
}

export interface FindFreeSlotsOptions {
  /** Working hours boundary */
  workHours: {
    start: string | number | Date;
    end: string | number | Date;
  };
  /** Currently booked or busy appointments */
  busySlots?: Array<SlotRange | { slot: string } | string>;
  /** Minimum required duration in minutes for an available gap (default: 15) */
  minDuration?: number;
  /** If specified, chunks free periods into slots of this exact duration */
  slotDuration?: number;
  /** Buffer time between chunked slots */
  buffer?: number;
  /** Time format for output (default: '24h') */
  format?: TimeFormat;
}

export interface FindCommonFreeSlotsOptions extends Omit<FindFreeSlotsOptions, 'busySlots'> {
  /** Array of busy schedules (e.g. [userABusy, userBBusy]) */
  schedules: Array<Array<SlotRange | { slot: string } | string>>;
}

/**
 * Fluent builder class for generating time slots.
 */
export class TimeSlot {
  constructor(options?: Partial<GenerateSlotsOptions>);
  static create(options?: Partial<GenerateSlotsOptions>): TimeSlot;
  between(start: string | number | Date, end: string | number | Date): this;
  every(minutes: number): this;
  withBuffer(minutes: number): this;
  format(fmt: TimeFormat): this;
  onDate(date: string | Date): this;
  withDate(include?: boolean): this;
  excludeBreak(start: string | number | Date, end: string | number | Date): this;
  excludeBreaks(breaks: Array<SlotRange>): this;
  block(itemOrArray: SlotRange | string | Array<SlotRange | string>): this;
  filterPassedToday(filter?: boolean): this;
  toPairs(): SlotItem[];
  toStrings(): string[];
  toPoints(): string[];
}

// Modern API Functions
export function generateSlots(options: GenerateSlotsOptions & { asString: true }): string[];
export function generateSlots(options: GenerateSlotsOptions & { asString?: false }): SlotItem[];
export function generateSlots(options: GenerateSlotsOptions): SlotItem[] | string[];

export function generateTimePoints(options: GenerateTimePointsOptions): string[];

export function isOverlapping(
  slotA: SlotRange | { slot: string } | string,
  slotB: SlotRange | { slot: string } | string
): boolean;

export function hasConflict(
  requestedSlot: SlotRange | { slot: string } | string,
  busySlots: Array<SlotRange | { slot: string } | string>
): boolean;

export function mergeSlots(
  slots: Array<SlotRange | { slot: string } | string>,
  options?: { format?: TimeFormat }
): SlotItem[];

export function findFreeSlots(options: FindFreeSlotsOptions): SlotItem[];
export function findCommonFreeSlots(options: FindCommonFreeSlotsOptions): SlotItem[];

// Utilities
export function timeToMinutes(input: string | number | Date): number;
export function minutesToTime(totalMinutes: number, format?: TimeFormat | ((min: number) => string)): string;
export function formatTime(timeInput: string | number | Date, format?: TimeFormat): string;
export function formatDate(dateInput: string | Date): string;

// Legacy API (v1.x Compatibility)
export function railwayToNormalTimeConvert(time: string | number | Date): string;
export function normalToRailwayTimeConvert(timeStr: string | number | Date): string;
export function normalToRalwayTimeConvert(timeStr: string | number | Date): string;
export function formatTimeIn24Hour(timeStr: string): string;

export interface LegacyTimeSlotOptions {
  starting_time?: string;
  startTime?: string;
  start?: string;
  ending_time?: string;
  endTime?: string;
  end?: string;
  duration?: number;
  date?: string | Date;
  isCurrent?: boolean;
  isNotRailwayTime?: boolean;
  format?: TimeFormat;
  blockSchedule?: Array<string | SlotRange>;
}

export function timeSlot(options?: LegacyTimeSlotOptions): string[];

export interface LegacyStartToEndOptions {
  duration?: number;
  isNotRailwayTime?: boolean;
  format?: TimeFormat;
  withDate?: boolean;
  date?: string | Date;
  isCurrent?: boolean;
  startToEndObj?: boolean;
  blockSchedule?: Array<{ slot?: string; start?: string; end?: string }>;
}

export function startToEndTimeSlot(
  opentimes: string,
  closetimes: string,
  data?: LegacyStartToEndOptions
): Array<{ slot?: string; start?: string; end?: string; date?: string }>;

declare const _default: {
  generateSlots: typeof generateSlots;
  generateTimePoints: typeof generateTimePoints;
  findFreeSlots: typeof findFreeSlots;
  findCommonFreeSlots: typeof findCommonFreeSlots;
  isOverlapping: typeof isOverlapping;
  hasConflict: typeof hasConflict;
  mergeSlots: typeof mergeSlots;
  TimeSlot: typeof TimeSlot;
  timeToMinutes: typeof timeToMinutes;
  minutesToTime: typeof minutesToTime;
  formatTime: typeof formatTime;
  railwayToNormalTimeConvert: typeof railwayToNormalTimeConvert;
  normalToRailwayTimeConvert: typeof normalToRailwayTimeConvert;
  timeSlot: typeof timeSlot;
  startToEndTimeSlot: typeof startToEndTimeSlot;
};

export default _default;
