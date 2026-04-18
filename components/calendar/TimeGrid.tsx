'use client'

import React, { useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import {
  endOfLocalDayISO,
  intervalsOverlap,
  isDayWithinRange,
  minutesToISO,
  snapToGrid,
  startOfLocalDayISO,
  toMinutesFromMidnight,
} from '@/lib/utils/dateUtils'
import { FreeSlotBlock } from './FreeSlotBlock'
import type { CalendarEvent, Period } from '@/lib/types'

const HOUR_HEIGHT  = 64
const TOTAL_HOURS  = 24
const GRID_HEIGHT  = HOUR_HEIGHT * TOTAL_HOURS
const SNAP_MINUTES = 5
const MIN_DURATION = 5

function minutesToPx(min: number) { return (min / 60) * HOUR_HEIGHT }
function pxToMinutes(px: number)  { return (px / HOUR_HEIGHT) * 60 }

// ── Period band row ───────────────────────────────────────────────────────────

function PeriodBandRow({ days, periods }: { days: Date[]; periods: Period[] }) {
  const hasAnyPeriod = days.some((day) => {
    return periods.some((period) => isDayWithinRange(day, period.startDate, period.endDate))
  })

  if (!hasAnyPeriod) return null

  return (
    <div className="flex shrink-0 border-b border-[var(--border)]">
      {/* Gutter */}
      <div className="w-[var(--time-col-width)] shrink-0" />
      {days.map((day, i) => {
        const period = periods.find((entry) =>
          isDayWithinRange(day, entry.startDate, entry.endDate)
        )
        return (
          <div
            key={i}
            className="flex-1 border-r border-[var(--border)] overflow-hidden"
            style={{ height: 20 }}
          >
            {period && (
              <div
                className="h-full flex items-center justify-center px-1"
                style={{
                  backgroundColor: period.color + '20',
                  borderTop: `2px solid ${period.color}70`,
                }}
              >
                <span
                  className="text-[9px] font-semibold truncate"
                  style={{ color: period.color }}
                >
                  {period.name}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Current time line ─────────────────────────────────────────────────────────

function CurrentTimeLine() {
  const now     = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
      style={{ top: minutesToPx(minutes) - 1 }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
      <div className="flex-1 h-px bg-red-500" />
    </div>
  )
}

// ── Event block ───────────────────────────────────────────────────────────────

function EventBlock({ event }: { event: CalendarEvent }) {
  const openPanel = useCalendarStore((s) => s.openPanel)
  const startMin  = toMinutesFromMidnight(event.startTime)
  const endMin    = toMinutesFromMidnight(event.endTime)
  const top    = minutesToPx(startMin)
  const height = Math.max(minutesToPx(endMin - startMin), 20)

  return (
    <div
      className="absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer"
      style={{
        top,
        height,
        backgroundColor: (event.color ?? '#6b7280') + '22',
        border: `1.5px solid ${event.color ?? '#6b7280'}50`,
        zIndex: 1,
      }}
      onClick={(e) => {
        e.stopPropagation()
        openPanel({ type: 'event', id: event.id })
      }}
    >
      {height > 16 && (
        <div className="px-1.5 pt-0.5">
          <p className="text-[10px] font-medium truncate" style={{ color: event.color ?? '#374151' }}>
            {event.title}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Day column ────────────────────────────────────────────────────────────────

interface DayColumnProps {
  date: Date
  isToday: boolean
  freeSlots: ReturnType<typeof useAppStore.getState>['freeSlots']
  events: CalendarEvent[]
  workBlocks: ReturnType<typeof useAppStore.getState>['workBlocks']
  subjects: ReturnType<typeof useAppStore.getState>['subjects']
  onDragCreateSlot: (startISO: string, endISO: string) => void
  scrollHostRef: React.RefObject<HTMLDivElement | null>
}

function DayColumn({
  date,
  isToday,
  freeSlots,
  events,
  workBlocks,
  subjects,
  onDragCreateSlot,
  scrollHostRef,
}: DayColumnProps) {
  const colRef       = useRef<HTMLDivElement>(null)
  const previewRef   = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const pendingPress = useRef(false)
  const dragStartMin = useRef(0)
  const pressTimer = useRef<number | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const latestPointerY = useRef(0)
  const pressOrigin = useRef({ x: 0, y: 0 })
  const autoScrollRaf = useRef<number | null>(null)

  function getMinutesFromClientY(clientY: number): number {
    const rect     = colRef.current!.getBoundingClientRect()
    const relY     = clientY - rect.top
    const rawMin   = pxToMinutes(relY)
    return Math.min(Math.max(snapToGrid(rawMin, SNAP_MINUTES), 0), 24 * 60 - SNAP_MINUTES)
  }

  function showPreview(startMin: number, endMin: number) {
    if (!previewRef.current) return
    const s = Math.min(startMin, endMin)
    const e = Math.max(startMin, endMin)
    previewRef.current.style.display = 'block'
    previewRef.current.style.top    = `${minutesToPx(s)}px`
    previewRef.current.style.height = `${Math.max(minutesToPx(e - s), minutesToPx(MIN_DURATION))}px`
  }

  function hidePreview() {
    if (previewRef.current) previewRef.current.style.display = 'none'
  }

  function clearPressTimer() {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  function stopAutoScroll() {
    if (autoScrollRaf.current) {
      cancelAnimationFrame(autoScrollRaf.current)
      autoScrollRaf.current = null
    }
  }

  function runAutoScroll() {
    if (!isDragging.current) {
      stopAutoScroll()
      return
    }

    const scrollHost = scrollHostRef.current
    if (scrollHost) {
      const rect = scrollHost.getBoundingClientRect()
      const threshold = 88
      const topGap = latestPointerY.current - rect.top
      const bottomGap = rect.bottom - latestPointerY.current
      let delta = 0

      if (topGap < threshold) {
        delta = -Math.ceil((threshold - topGap) / 5)
      } else if (bottomGap < threshold) {
        delta = Math.ceil((threshold - bottomGap) / 5)
      }

      if (delta !== 0) {
        scrollHost.scrollTop += delta
        showPreview(dragStartMin.current, getMinutesFromClientY(latestPointerY.current))
      }
    }

    autoScrollRaf.current = requestAnimationFrame(runAutoScroll)
  }

  function cancelPendingPress() {
    pendingPress.current = false
    pointerIdRef.current = null
    clearPressTimer()
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    // Only fire on direct column background — not on slots/blocks/handles
    const t = e.target as HTMLElement
    if (t !== colRef.current && !t.classList.contains('col-bg')) return

    const currentTarget = e.currentTarget
    pointerIdRef.current = e.pointerId
    latestPointerY.current = e.clientY
    pressOrigin.current = { x: e.clientX, y: e.clientY }
    pendingPress.current = true
    clearPressTimer()

    pressTimer.current = window.setTimeout(() => {
      pendingPress.current = false
      isDragging.current = true
      dragStartMin.current = getMinutesFromClientY(latestPointerY.current)
      if (pointerIdRef.current !== null) {
        currentTarget.setPointerCapture(pointerIdRef.current)
      }
      showPreview(dragStartMin.current, dragStartMin.current + 60)
      runAutoScroll()
    }, e.pointerType === 'mouse' ? 160 : 320)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    latestPointerY.current = e.clientY

    if (pendingPress.current) {
      const movedX = Math.abs(e.clientX - pressOrigin.current.x)
      const movedY = Math.abs(e.clientY - pressOrigin.current.y)
      if (movedX > 8 || movedY > 8) {
        cancelPendingPress()
      }
      return
    }

    if (!isDragging.current) return
    showPreview(dragStartMin.current, getMinutesFromClientY(e.clientY))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    clearPressTimer()
    stopAutoScroll()

    if (pendingPress.current) {
      cancelPendingPress()
      hidePreview()
      return
    }

    if (!isDragging.current) return
    isDragging.current = false
    pointerIdRef.current = null
    hidePreview()

    const endMin   = getMinutesFromClientY(e.clientY)
    const startMin = Math.min(dragStartMin.current, endMin)
    const finishMin = Math.max(dragStartMin.current, endMin)

    if (finishMin - startMin >= MIN_DURATION) {
      onDragCreateSlot(
        minutesToISO(date, startMin),
        minutesToISO(date, finishMin),
      )
    }
  }

  return (
    <div
      ref={colRef}
      className="relative flex-1 border-r border-[var(--border)] select-none col-bg"
      style={{ height: GRID_HEIGHT, touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        cancelPendingPress()
        isDragging.current = false
        stopAutoScroll()
        hidePreview()
      }}
    >
      {/* Drag-create preview */}
      <div
        ref={previewRef}
        className="absolute left-1 right-1 rounded-lg pointer-events-none z-30"
        style={{ display: 'none', backgroundColor: '#3b82f618', border: '2px dashed #3b82f660' }}
      />

      {/* Hour lines */}
      {Array.from({ length: TOTAL_HOURS }, (_, h) => (
        <div key={h}
          className="absolute left-0 right-0 border-t border-[var(--border)] pointer-events-none col-bg"
          style={{ top: minutesToPx(h * 60) }}
        />
      ))}
      {/* Half-hour lines */}
      {Array.from({ length: TOTAL_HOURS }, (_, h) => (
        <div key={`h${h}`}
          className="absolute left-0 right-0 border-t border-[var(--border)] opacity-40 pointer-events-none col-bg"
          style={{ top: minutesToPx(h * 60 + 30) }}
        />
      ))}

      {/* Free slots */}
      {freeSlots.map((slot) => (
        <FreeSlotBlock
          key={slot.id}
          slot={slot}
          workBlocks={workBlocks}
          subjects={subjects}
          date={date}
        />
      ))}

      {/* Events */}
      {events.map((ev) => (
        <EventBlock key={ev.id} event={ev} />
      ))}

      {/* Current time */}
      {isToday && <CurrentTimeLine />}
    </div>
  )
}

// ── Main TimeGrid ─────────────────────────────────────────────────────────────

interface TimeGridProps {
  days: Date[]
}

export function TimeGrid({ days }: TimeGridProps) {
  const openPanel  = useCalendarStore((s) => s.openPanel)
  const freeSlots  = useAppStore((s) => s.freeSlots)
  const workBlocks = useAppStore((s) => s.workBlocks)
  const events     = useAppStore((s) => s.events)
  const subjects   = useAppStore((s) => s.subjects)
  const periods    = useAppStore((s) => s.periods)
  const today      = new Date()

  // Auto-scroll to current time on mount
  const didScroll = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node
    if (node && !didScroll.current) {
      didScroll.current = true
      const now     = new Date()
      const scrollTo = minutesToPx(now.getHours() * 60 + now.getMinutes()) - 120
      node.scrollTop = Math.max(0, scrollTo)
    }
  }, [])

  // Filter slots/events for a given day — uses interval overlap so multi-day slots will show
  function getSlotsForDay(date: Date) {
    const dayStart = startOfLocalDayISO(date)
    const dayEnd = endOfLocalDayISO(date)
    return freeSlots.filter((fs) => intervalsOverlap(fs.startTime, fs.endTime, dayStart, dayEnd))
  }

  function getEventsForDay(date: Date) {
    const dayStart = startOfLocalDayISO(date)
    const dayEnd = endOfLocalDayISO(date)
    return events.filter((ev) => intervalsOverlap(ev.startTime, ev.endTime, dayStart, dayEnd))
  }

  function handleDragCreateSlot(startISO: string, endISO: string) {
    openPanel({ type: 'createFreeSlot', startTime: startISO, endTime: endISO })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="w-[var(--time-col-width)] shrink-0" />
        {days.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString()
          return (
            <div
              key={i}
              className={[
                'flex-1 py-2 text-center border-r border-[var(--border)]',
                isToday ? 'bg-blue-50' : '',
              ].join(' ')}
            >
              <p className="text-xs text-[var(--text-muted)] capitalize">
                {format(day, 'EEE', { locale: fr })}
              </p>
              <p className={[
                'text-sm font-semibold mt-0.5',
                isToday ? 'text-blue-600' : 'text-[var(--foreground)]',
              ].join(' ')}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Period band row — only rendered when periods exist in view */}
      <PeriodBandRow days={days} periods={periods} />

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: GRID_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-[var(--time-col-width)] shrink-0 relative" style={{ height: GRID_HEIGHT }}>
            {Array.from({ length: TOTAL_HOURS }, (_, h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-[var(--text-faint)]"
                style={{ top: minutesToPx(h * 60) - 7 }}
              >
                {h.toString().padStart(2, '0')}h
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => (
            <DayColumn
              key={i}
              date={day}
              isToday={day.toDateString() === today.toDateString()}
              freeSlots={getSlotsForDay(day)}
              events={getEventsForDay(day)}
              workBlocks={workBlocks}
              subjects={subjects}
              onDragCreateSlot={handleDragCreateSlot}
              scrollHostRef={scrollContainerRef}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
