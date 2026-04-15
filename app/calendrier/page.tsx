'use client'

import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { DetailPanel } from '@/components/panels/DetailPanel'

export default function CalendrierPage() {
  const view = useCalendarStore((s) => s.view)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--background)]">
      <CalendarHeader />

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'month' && <MonthView />}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
      </div>

      {/* Detail panel is portaled via Sheet, rendered here so it stays in the calendar context */}
      <DetailPanel />
    </div>
  )
}
