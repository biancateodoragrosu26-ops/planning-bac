import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  differenceInCalendarDays,
  differenceInMinutes,
  isSameDay,
  isWithinInterval,
  setHours,
  setMinutes,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export const LOCALE = fr

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, pattern: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: fr })
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toISOLocal(date: Date): string {
  return date.toISOString()
}

// ── Week days ─────────────────────────────────────────────────────────────────

export function getWeekDays(anchorDate: string, weekStartsOn: 0 | 1 = 1): Date[] {
  const anchor = parseISO(anchorDate)
  const start = startOfWeek(anchor, { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getMonthDays(anchorDate: string, weekStartsOn: 0 | 1 = 1): Date[] {
  const anchor = parseISO(anchorDate)
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn })

  const days: Date[] = []
  let cur = gridStart
  while (cur <= gridEnd) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

// ── Navigation ────────────────────────────────────────────────────────────────

export function navigateDate(
  anchorDate: string,
  direction: 'prev' | 'next',
  view: 'month' | 'week' | 'day'
): string {
  const d = parseISO(anchorDate)
  if (view === 'month') {
    return toDateString(direction === 'next' ? addMonths(d, 1) : subMonths(d, 1))
  }
  if (view === 'week') {
    return toDateString(direction === 'next' ? addWeeks(d, 1) : subWeeks(d, 1))
  }
  return toDateString(direction === 'next' ? addDays(d, 1) : subDays(d, 1))
}

// ── Countdown ────────────────────────────────────────────────────────────────

export function daysUntil(targetDate: string): number {
  return differenceInCalendarDays(parseISO(targetDate), new Date())
}

// ── Time grid helpers ─────────────────────────────────────────────────────────

/** Convert an ISO datetime string to minutes from midnight */
export function toMinutesFromMidnight(isoStr: string): number {
  const d = parseISO(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}

/** Snap a minute value to the nearest N-minute interval */
export function snapToGrid(minutes: number, gridMinutes = 5): number {
  return Math.round(minutes / gridMinutes) * gridMinutes
}

/** Given a date and minutes-from-midnight, return an ISO string */
export function minutesToISO(date: Date, minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const d = setMinutes(setHours(new Date(date), h), m)
  return d.toISOString()
}

/** Duration in minutes between two ISO strings */
export function durationMinutes(startISO: string, endISO: string): number {
  return differenceInMinutes(parseISO(endISO), parseISO(startISO))
}

/** Check if two [start, end] intervals overlap */
export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const as = parseISO(aStart).getTime()
  const ae = parseISO(aEnd).getTime()
  const bs = parseISO(bStart).getTime()
  const be = parseISO(bEnd).getTime()
  return as < be && ae > bs
}

export { parseISO, isSameDay, isWithinInterval, differenceInCalendarDays, format }
