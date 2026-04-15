'use client'

import { useMemo } from 'react'
import { addDays, startOfWeek } from 'date-fns'
import { parseISO } from 'date-fns'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { useVisibleDayCount } from '@/lib/hooks/useVisibleDayCount'
import { TimeGrid } from './TimeGrid'

export function WeekView() {
  const anchorDate   = useCalendarStore((s) => s.anchorDate)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  const visibleDays  = useVisibleDayCount()

  const days = useMemo(() => {
    const anchor     = parseISO(anchorDate)
    const weekStart  = startOfWeek(anchor, { weekStartsOn })

    if (visibleDays === 7) {
      // Full week Mon–Sun
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }

    if (visibleDays === 5) {
      // Mon–Fri — always start from Monday regardless of anchor
      const mon = startOfWeek(anchor, { weekStartsOn: 1 })
      return Array.from({ length: 5 }, (_, i) => addDays(mon, i))
    }

    // 3 days: yesterday, today, tomorrow — centered on anchor
    return Array.from({ length: 3 }, (_, i) => addDays(anchor, i - 1))
  }, [anchorDate, weekStartsOn, visibleDays])

  return <TimeGrid days={days} />
}
