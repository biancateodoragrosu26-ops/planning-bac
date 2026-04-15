'use client'

import { useMemo } from 'react'
import { parseISO } from 'date-fns'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { TimeGrid } from './TimeGrid'

export function DayView() {
  const anchorDate = useCalendarStore((s) => s.anchorDate)
  const days = useMemo(() => [parseISO(anchorDate)], [anchorDate])
  return <TimeGrid days={days} />
}
