'use client'

import { useMemo, useRef, useState } from 'react'
import { addDays, parseISO } from 'date-fns'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import {
  minutesToISO,
  snapToGrid,
  toDateString,
  toMinutesFromMidnight,
} from '@/lib/utils/dateUtils'
import { getBlocksForSlot } from '@/lib/utils/slotUtils'
import { WorkBlockEl } from './WorkBlockEl'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import type { FreeSlot, Subject, WorkBlock } from '@/lib/types'

const HOUR_HEIGHT = 64
const SNAP_MINUTES = 5
const MIN_DURATION = 5
const DRAG_THRESHOLD_PX = 8
const TOUCH_HOLD_MS = 360

function minutesToPx(minutes: number) {
  return (minutes / 60) * HOUR_HEIGHT
}

function pxToMinutes(px: number) {
  return (px / HOUR_HEIGHT) * 60
}

interface FreeSlotBlockProps {
  slot: FreeSlot
  workBlocks: WorkBlock[]
  subjects: Subject[]
  date: Date
}

export function FreeSlotBlock({ slot, workBlocks, subjects, date }: FreeSlotBlockProps) {
  const openPanel = useCalendarStore((state) => state.openPanel)
  const updateFreeSlot = useAppStore((state) => state.updateFreeSlot)
  const copyFreeSlotToDate = useAppStore((state) => state.copyFreeSlotToDate)
  const moveFreeSlotToDate = useAppStore((state) => state.moveFreeSlotToDate)
  const deleteFreeSlot = useAppStore((state) => state.deleteFreeSlot)

  const slotStartMin = toMinutesFromMidnight(slot.startTime)
  const slotEndMin = toMinutesFromMidnight(slot.endTime)
  const slotHeight = Math.max(minutesToPx(slotEndMin - slotStartMin), 16)

  const slotBlocks = useMemo(() => getBlocksForSlot(slot.id, workBlocks), [slot.id, workBlocks])
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  )

  const [sheetMode, setSheetMode] = useState<null | 'menu' | 'copy' | 'move'>(null)
  const [targetDate, setTargetDate] = useState(() =>
    toDateString(addDays(parseISO(slot.startTime), 1))
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const blockPreviewRef = useRef<HTMLDivElement>(null)

  const isCreateDrag = useRef(false)
  const dragStartY = useRef(0)
  const dragStartMin = useRef(0)
  const slotRectCache = useRef<DOMRect | null>(null)

  const isResizing = useRef(false)
  const resizeStartY = useRef(0)
  const origEndMin = useRef(slotEndMin)

  const touchHoldTimer = useRef<number | null>(null)
  const touchOrigin = useRef({ x: 0, y: 0 })
  const didOpenContext = useRef(false)

  function clientYToAbsMin(clientY: number): number {
    const rect = slotRectCache.current ?? containerRef.current!.getBoundingClientRect()
    const relativeY = clientY - rect.top
    const rawMinutes = slotStartMin + pxToMinutes(relativeY)
    return Math.min(Math.max(snapToGrid(rawMinutes, SNAP_MINUTES), slotStartMin), slotEndMin)
  }

  function showBlockPreview(startAbsMin: number, endAbsMin: number) {
    if (!blockPreviewRef.current) return
    const start = Math.min(startAbsMin, endAbsMin)
    const end = Math.max(startAbsMin, endAbsMin)
    blockPreviewRef.current.style.display = 'block'
    blockPreviewRef.current.style.top = `${minutesToPx(start - slotStartMin)}px`
    blockPreviewRef.current.style.height = `${Math.max(
      minutesToPx(end - start),
      minutesToPx(MIN_DURATION)
    )}px`
  }

  function hideBlockPreview() {
    if (blockPreviewRef.current) blockPreviewRef.current.style.display = 'none'
  }

  function clearTouchHoldTimer() {
    if (touchHoldTimer.current) {
      window.clearTimeout(touchHoldTimer.current)
      touchHoldTimer.current = null
    }
  }

  function openActionMenu() {
    setTargetDate(toDateString(addDays(parseISO(slot.startTime), 1)))
    setSheetMode('menu')
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('[data-role="work-block"]')) return
    if (target.closest('[data-role="resize-handle"]')) return

    event.stopPropagation()

    if (event.pointerType !== 'mouse') {
      didOpenContext.current = false
      touchOrigin.current = { x: event.clientX, y: event.clientY }
      clearTouchHoldTimer()
      touchHoldTimer.current = window.setTimeout(() => {
        didOpenContext.current = true
        openActionMenu()
      }, TOUCH_HOLD_MS)
      return
    }

    containerRef.current?.setPointerCapture(event.pointerId)
    isCreateDrag.current = false
    dragStartY.current = event.clientY
    slotRectCache.current = containerRef.current?.getBoundingClientRect() ?? null
    dragStartMin.current = clientYToAbsMin(event.clientY)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') {
      const movedX = Math.abs(event.clientX - touchOrigin.current.x)
      const movedY = Math.abs(event.clientY - touchOrigin.current.y)
      if (movedX > DRAG_THRESHOLD_PX || movedY > DRAG_THRESHOLD_PX) {
        clearTouchHoldTimer()
      }
      return
    }

    if (!containerRef.current?.hasPointerCapture(event.pointerId)) return
    if (isResizing.current) return

    const delta = event.clientY - dragStartY.current
    if (Math.abs(delta) < DRAG_THRESHOLD_PX) return

    isCreateDrag.current = true
    const currentMin = clientYToAbsMin(event.clientY)
    showBlockPreview(dragStartMin.current, currentMin)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') {
      clearTouchHoldTimer()
      if (didOpenContext.current) {
        didOpenContext.current = false
        return
      }
      openPanel({ type: 'freeSlot', id: slot.id })
      return
    }

    if (!containerRef.current?.hasPointerCapture(event.pointerId)) return
    if (isResizing.current) return

    hideBlockPreview()

    const didDrag = isCreateDrag.current
    isCreateDrag.current = false
    slotRectCache.current = null

    if (!didDrag) {
      openPanel({ type: 'freeSlot', id: slot.id })
      return
    }

    const endMin = clientYToAbsMin(event.clientY)
    const startMin = Math.min(dragStartMin.current, endMin)
    const finishMin = Math.max(dragStartMin.current, endMin)
    const duration = finishMin - startMin

    if (duration < MIN_DURATION) {
      openPanel({ type: 'freeSlot', id: slot.id })
      return
    }

    openPanel({
      type: 'createWorkBlock',
      freeSlotId: slot.id,
      startTime: minutesToISO(date, startMin),
      endTime: minutesToISO(date, finishMin),
    })
  }

  function handlePointerCancel() {
    clearTouchHoldTimer()
    isCreateDrag.current = false
    hideBlockPreview()
  }

  function handleResizeDown(event: React.PointerEvent) {
    event.stopPropagation()
    event.preventDefault()
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    isResizing.current = true
    resizeStartY.current = event.clientY
    origEndMin.current = toMinutesFromMidnight(slot.endTime)
  }

  function handleResizeMove(event: React.PointerEvent) {
    if (!isResizing.current) return
    const deltaMin = pxToMinutes(event.clientY - resizeStartY.current)
    const newEnd = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped = Math.max(slotStartMin + MIN_DURATION, Math.min(newEnd, 24 * 60))
    if (containerRef.current) {
      containerRef.current.style.height = `${minutesToPx(clamped - slotStartMin)}px`
    }
  }

  function handleResizeUp(event: React.PointerEvent) {
    if (!isResizing.current) return
    isResizing.current = false
    const deltaMin = pxToMinutes(event.clientY - resizeStartY.current)
    const newEnd = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped = Math.max(slotStartMin + MIN_DURATION, Math.min(newEnd, 24 * 60))
    if (containerRef.current) containerRef.current.style.height = ''
    updateFreeSlot(slot.id, { endTime: minutesToISO(date, clamped) })
  }

  return (
    <>
      <div
        ref={containerRef}
        data-role="free-slot"
        className="absolute left-1 right-1 rounded-lg select-none"
        style={{
          top: minutesToPx(slotStartMin),
          height: slotHeight,
          backgroundColor: '#10b98114',
          border: '1.5px solid #10b98140',
          zIndex: 1,
          touchAction: 'manipulation',
          overflow: 'visible',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(event) => {
          event.preventDefault()
          openActionMenu()
        }}
      >
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" />

        {slotHeight > 22 && (
          <div className="absolute inset-x-2 top-0.5 pointer-events-none">
            <span className="block truncate text-[10px] font-medium text-emerald-700">
              {slot.label || 'Creneau libre'}
            </span>
          </div>
        )}

        <div
          ref={blockPreviewRef}
          className="absolute left-0 right-0 rounded-md pointer-events-none"
          style={{
            display: 'none',
            backgroundColor: '#1f293780',
            border: '1.5px dashed #94a3b8',
            zIndex: 3,
          }}
        />

        {slotBlocks.map((workBlock) => (
          <WorkBlockEl
            key={workBlock.id}
            block={workBlock}
            subject={subjectMap[workBlock.subjectId] as Subject | undefined}
            slotStartMin={slotStartMin}
            slotEndMin={slotEndMin}
            date={date}
          />
        ))}

        <div
          data-role="resize-handle"
          className="absolute left-0 right-0 flex items-center justify-center rounded-b-lg"
          style={{
            bottom: -4,
            height: 10,
            cursor: 'ns-resize',
            touchAction: 'none',
            zIndex: 4,
            backgroundColor: '#10b98130',
          }}
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="h-0.5 w-8 rounded-full bg-emerald-500/50" />
        </div>
      </div>

      <Sheet open={sheetMode !== null} onClose={() => setSheetMode(null)} title="Creneau libre">
        {sheetMode === 'menu' && (
          <div className="space-y-3 p-5">
            <Button variant="secondary" className="w-full" onClick={() => setSheetMode('copy')}>
              Copier
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setSheetMode('move')}>
              Deplacer
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                deleteFreeSlot(slot.id)
                setSheetMode(null)
              }}
            >
              Supprimer
            </Button>
          </div>
        )}

        {(sheetMode === 'copy' || sheetMode === 'move') && (
          <div className="space-y-4 p-5">
            <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
              {sheetMode === 'copy'
                ? 'Le nouveau creneau gardera les memes horaires.'
                : 'Le creneau et les blocs deja poses bougeront ensemble.'}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Date cible
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  if (!targetDate) return
                  if (sheetMode === 'copy') {
                    copyFreeSlotToDate(slot.id, targetDate)
                  } else {
                    moveFreeSlotToDate(slot.id, targetDate)
                  }
                  setSheetMode(null)
                }}
              >
                {sheetMode === 'copy' ? 'Copier ce creneau' : 'Deplacer ce creneau'}
              </Button>
              <Button variant="ghost" onClick={() => setSheetMode('menu')}>
                Retour
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}
