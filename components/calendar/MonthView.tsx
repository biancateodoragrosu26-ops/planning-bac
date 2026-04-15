'use client'

import { useMemo } from 'react'
import { parseISO, isSameMonth, isToday } from 'date-fns'
import { format } from 'date-fns'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { getMonthDays } from '@/lib/utils/dateUtils'
import { intervalsOverlap } from '@/lib/utils/dateUtils'
import type { Subject } from '@/lib/types'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function MonthView() {
  const anchorDate = useCalendarStore((s) => s.anchorDate)
  const setAnchorDate = useCalendarStore((s) => s.setAnchorDate)
  const setView = useCalendarStore((s) => s.setView)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  const freeSlots = useAppStore((s) => s.freeSlots)
  const workBlocks = useAppStore((s) => s.workBlocks)
  const subjects = useAppStore((s) => s.subjects)
  const periods = useAppStore((s) => s.periods)

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])) as Record<string, Subject>,
    [subjects]
  )

  const days = useMemo(
    () => getMonthDays(anchorDate, weekStartsOn),
    [anchorDate, weekStartsOn]
  )

  const anchor = parseISO(anchorDate)

  function handleDayClick(date: Date) {
    setAnchorDate(format(date, 'yyyy-MM-dd'))
    setView('day')
  }

  function getDayDots(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayStart = dateStr + 'T00:00:00.000Z'
    const dayEnd = dateStr + 'T23:59:59.999Z'

    // Find work blocks on this day
    const blocks = workBlocks.filter((wb) =>
      intervalsOverlap(wb.startTime, wb.endTime, dayStart, dayEnd)
    )
    // Get unique subjects
    const subjectIds = [...new Set(blocks.map((b) => b.subjectId))]
    return subjectIds.map((id) => subjectMap[id]?.color).filter(Boolean)
  }

  function getDayPeriod(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return periods.find((p) => p.startDate <= dateStr && p.endDate >= dateStr)
  }

  function hasFreeSlot(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return freeSlots.some((fs) => fs.startTime.startsWith(dateStr))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-[var(--border)] shrink-0">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium text-[var(--text-muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 h-full" style={{ minHeight: '480px' }}>
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, anchor)
            const today = isToday(day)
            const dots = getDayDots(day)
            const period = getDayPeriod(day)
            const freeSlot = hasFreeSlot(day)

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={[
                  'relative flex flex-col p-1.5 border-b border-r border-[var(--border)]',
                  'text-left transition-colors hover:bg-[var(--surface-2)] min-h-[70px]',
                  !inMonth && 'opacity-30',
                ].join(' ')}
                style={
                  period
                    ? { backgroundColor: period.color + '18' }
                    : undefined
                }
              >
                {/* Day number */}
                <span
                  className={[
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    today
                      ? 'bg-blue-500 text-white'
                      : 'text-[var(--foreground)]',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </span>

                {/* Free slot indicator */}
                {freeSlot && (
                  <div className="mt-0.5 w-full h-1 rounded-full bg-emerald-300 opacity-70" />
                )}

                {/* Subject dots */}
                {dots.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {dots.slice(0, 4).map((color, di) => (
                      <span
                        key={di}
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
