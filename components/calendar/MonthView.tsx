'use client'

import { useMemo, useRef, useState } from 'react'
import { format, isSameMonth, isToday, parseISO } from 'date-fns'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import {
  endOfLocalDayISO,
  getMonthDays,
  intervalsOverlap,
  isDayWithinRange,
  startOfLocalDayISO,
} from '@/lib/utils/dateUtils'
import { generateId } from '@/lib/utils/idUtils'
import { Sheet } from '@/components/ui/Sheet'
import { PeriodForm, createEmptyPeriodDraft } from '@/components/periods/PeriodForm'
import type { Subject } from '@/lib/types'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const LONG_PRESS_MS = 320

export function MonthView() {
  const anchorDate = useCalendarStore((state) => state.anchorDate)
  const setAnchorDate = useCalendarStore((state) => state.setAnchorDate)
  const setView = useCalendarStore((state) => state.setView)
  const weekStartsOn = useAppStore((state) => state.settings.weekStartsOn)
  const freeSlots = useAppStore((state) => state.freeSlots)
  const workBlocks = useAppStore((state) => state.workBlocks)
  const subjects = useAppStore((state) => state.subjects)
  const periods = useAppStore((state) => state.periods)
  const addPeriod = useAppStore((state) => state.addPeriod)

  const [draftRange, setDraftRange] = useState<{ startIndex: number; endIndex: number } | null>(
    null
  )
  const [periodDraft, setPeriodDraft] = useState<{ startDate: string; endDate: string } | null>(
    null
  )

  const gridRef = useRef<HTMLDivElement>(null)
  const holdTimerRef = useRef<number | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const selectionStartIndexRef = useRef<number | null>(null)
  const isSelectingRef = useRef(false)
  const suppressClickRef = useRef(false)
  const pressOriginRef = useRef({ x: 0, y: 0 })

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])) as Record<string, Subject>,
    [subjects]
  )

  const days = useMemo(() => getMonthDays(anchorDate, weekStartsOn), [anchorDate, weekStartsOn])
  const anchor = parseISO(anchorDate)
  const rows = Math.ceil(days.length / 7)

  function handleDayClick(date: Date) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setAnchorDate(format(date, 'yyyy-MM-dd'))
    setView('day')
  }

  function getDayDots(date: Date) {
    const dayStart = startOfLocalDayISO(date)
    const dayEnd = endOfLocalDayISO(date)

    const blocks = workBlocks.filter((workBlock) =>
      intervalsOverlap(workBlock.startTime, workBlock.endTime, dayStart, dayEnd)
    )
    const subjectIds = [...new Set(blocks.map((block) => block.subjectId))]
    return subjectIds.map((id) => subjectMap[id]?.color).filter(Boolean)
  }

  function getDayPeriod(date: Date) {
    return periods.find((period) => isDayWithinRange(date, period.startDate, period.endDate))
  }

  function hasFreeSlot(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return freeSlots.some((slot) => slot.startTime.startsWith(dateStr))
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  function clearSelection() {
    clearHoldTimer()
    pointerIdRef.current = null
    selectionStartIndexRef.current = null
    isSelectingRef.current = false
  }

  function getIndexFromPoint(clientX: number, clientY: number) {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null

    const colWidth = rect.width / 7
    const rowHeight = rect.height / rows
    const col = Math.max(0, Math.min(6, Math.floor((clientX - rect.left) / colWidth)))
    const row = Math.max(0, Math.min(rows - 1, Math.floor((clientY - rect.top) / rowHeight)))
    const index = row * 7 + col

    if (index < 0 || index >= days.length) return null
    return index
  }

  function openPeriodDraftFromRange(startIndex: number, endIndex: number) {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    setPeriodDraft({
      startDate: format(days[start], 'yyyy-MM-dd'),
      endDate: format(days[end], 'yyyy-MM-dd'),
    })
  }

  function handleCellPointerDown(index: number, event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === 'mouse') return

    pointerIdRef.current = event.pointerId
    selectionStartIndexRef.current = index
    pressOriginRef.current = { x: event.clientX, y: event.clientY }
    clearHoldTimer()

    holdTimerRef.current = window.setTimeout(() => {
      isSelectingRef.current = true
      suppressClickRef.current = true
      setDraftRange({ startIndex: index, endIndex: index })
      gridRef.current?.setPointerCapture(pointerIdRef.current ?? event.pointerId)
    }, LONG_PRESS_MS)
  }

  function handleGridPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isSelectingRef.current && holdTimerRef.current) {
      const movedX = Math.abs(event.clientX - pressOriginRef.current.x)
      const movedY = Math.abs(event.clientY - pressOriginRef.current.y)
      if (movedX > 8 || movedY > 8) {
        clearHoldTimer()
        selectionStartIndexRef.current = null
        pointerIdRef.current = null
      }
      return
    }

    if (!isSelectingRef.current) return
    const index = getIndexFromPoint(event.clientX, event.clientY)
    const startIndex = selectionStartIndexRef.current
    if (index === null || startIndex === null) return
    setDraftRange({ startIndex, endIndex: index })
  }

  function handleGridPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    clearHoldTimer()

    if (!isSelectingRef.current) {
      clearSelection()
      return
    }

    const index =
      getIndexFromPoint(event.clientX, event.clientY) ?? selectionStartIndexRef.current ?? 0
    const startIndex = selectionStartIndexRef.current ?? index
    openPeriodDraftFromRange(startIndex, index)
    clearSelection()
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
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

        <div className="flex-1 overflow-y-auto">
          <div
            ref={gridRef}
            className="grid h-full grid-cols-7"
            style={{ minHeight: '480px' }}
            onPointerMove={handleGridPointerMove}
            onPointerUp={handleGridPointerUp}
            onPointerCancel={() => {
              clearSelection()
              setDraftRange(null)
            }}
          >
            {days.map((day, index) => {
              const inMonth = isSameMonth(day, anchor)
              const today = isToday(day)
              const dots = getDayDots(day)
              const period = getDayPeriod(day)
              const freeSlot = hasFreeSlot(day)
              const inDraftRange =
                draftRange &&
                index >= Math.min(draftRange.startIndex, draftRange.endIndex) &&
                index <= Math.max(draftRange.startIndex, draftRange.endIndex)

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  onPointerDown={(event) => handleCellPointerDown(index, event)}
                  className={[
                    'relative flex min-h-[70px] flex-col border-b border-r border-[var(--border)] p-1.5 text-left transition-colors',
                    'hover:bg-[var(--surface-2)]',
                    !inMonth && 'opacity-30',
                    inDraftRange ? 'bg-[var(--accent-amber-soft)]/70' : '',
                  ].join(' ')}
                  style={period ? { backgroundColor: `${period.color}18` } : undefined}
                >
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      today ? 'bg-blue-500 text-white' : 'text-[var(--foreground)]',
                    ].join(' ')}
                  >
                    {format(day, 'd')}
                  </span>

                  {period && (
                    <span
                      className="mt-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ color: period.color, backgroundColor: `${period.color}22` }}
                    >
                      {period.name}
                    </span>
                  )}

                  {freeSlot && (
                    <div className="mt-1 h-1 w-full rounded-full bg-emerald-300 opacity-70" />
                  )}

                  {dots.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dots.slice(0, 4).map((color, dotIndex) => (
                        <span
                          key={dotIndex}
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Sheet
        open={periodDraft !== null}
        onClose={() => {
          setPeriodDraft(null)
          setDraftRange(null)
        }}
        title="Nouvelle periode"
      >
        {periodDraft && (
          <div className="p-5">
            <PeriodForm
              initialValue={createEmptyPeriodDraft(periodDraft.startDate, periodDraft.endDate)}
              submitLabel="Creer la periode"
              onSubmit={(value) => {
                addPeriod({ id: generateId(), ...value })
                setPeriodDraft(null)
                setDraftRange(null)
              }}
              onCancel={() => {
                setPeriodDraft(null)
                setDraftRange(null)
              }}
            />
          </div>
        )}
      </Sheet>
    </>
  )
}
