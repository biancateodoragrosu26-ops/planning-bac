'use client'

import { useRef, useMemo } from 'react'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import {
  toMinutesFromMidnight,
  snapToGrid,
  minutesToISO,
} from '@/lib/utils/dateUtils'
import { getBlocksForSlot } from '@/lib/utils/slotUtils'
import { WorkBlockEl } from './WorkBlockEl'
import type { FreeSlot, WorkBlock, Subject } from '@/lib/types'

const HOUR_HEIGHT  = 64
const SNAP_MINUTES = 5
const MIN_DURATION = 5
const DRAG_THRESHOLD_PX = 8  // pixels before we commit to drag mode

function minutesToPx(min: number)  { return (min / 60) * HOUR_HEIGHT }
function pxToMinutes(px: number)   { return (px / HOUR_HEIGHT) * 60 }

interface FreeSlotBlockProps {
  slot: FreeSlot
  workBlocks: WorkBlock[]
  subjects: Subject[]
  date: Date
}

export function FreeSlotBlock({ slot, workBlocks, subjects, date }: FreeSlotBlockProps) {
  const openPanel      = useCalendarStore((s) => s.openPanel)
  const updateFreeSlot = useAppStore((s) => s.updateFreeSlot)

  const slotStartMin = toMinutesFromMidnight(slot.startTime)
  const slotEndMin   = toMinutesFromMidnight(slot.endTime)
  const slotHeight   = Math.max(minutesToPx(slotEndMin - slotStartMin), 16)

  const slotBlocks = useMemo(
    () => getBlocksForSlot(slot.id, workBlocks),
    [slot.id, workBlocks]
  )
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  )

  // ── Refs for all drag state — kept out of React state for perf ─────────────
  const containerRef    = useRef<HTMLDivElement>(null)
  const blockPreviewRef = useRef<HTMLDivElement>(null)

  // Drag-to-create-block
  const isCreateDrag   = useRef(false)
  const dragStartY     = useRef(0)
  const dragStartMin   = useRef(0)
  const slotRectCache  = useRef<DOMRect | null>(null)

  // Slot resize
  const isResizing    = useRef(false)
  const resizeStartY  = useRef(0)
  const origEndMin    = useRef(slotEndMin)

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clientYToAbsMin(clientY: number): number {
    const rect = slotRectCache.current ?? containerRef.current!.getBoundingClientRect()
    const relY  = clientY - rect.top
    const rawMin = slotStartMin + pxToMinutes(relY)
    return Math.min(Math.max(snapToGrid(rawMin, SNAP_MINUTES), slotStartMin), slotEndMin)
  }

  function showBlockPreview(startAbsMin: number, endAbsMin: number) {
    if (!blockPreviewRef.current) return
    const start = Math.min(startAbsMin, endAbsMin)
    const end   = Math.max(startAbsMin, endAbsMin)
    blockPreviewRef.current.style.display = 'block'
    blockPreviewRef.current.style.top    = `${minutesToPx(start - slotStartMin)}px`
    blockPreviewRef.current.style.height = `${Math.max(minutesToPx(end - start), minutesToPx(MIN_DURATION))}px`
  }

  function hideBlockPreview() {
    if (blockPreviewRef.current) blockPreviewRef.current.style.display = 'none'
  }

  // ── Main slot pointer events (drag-to-create-block + click-to-open) ────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Ignore if on a work block or resize handle
    const t = e.target as HTMLElement
    if (t.closest('[data-role="work-block"]')) return
    if (t.closest('[data-role="resize-handle"]')) return

    e.stopPropagation()
    containerRef.current!.setPointerCapture(e.pointerId)
    isCreateDrag.current  = false
    dragStartY.current    = e.clientY
    slotRectCache.current = containerRef.current!.getBoundingClientRect()
    dragStartMin.current  = clientYToAbsMin(e.clientY)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current?.hasPointerCapture(e.pointerId)) return
    if (isResizing.current) return

    const delta = e.clientY - dragStartY.current
    if (Math.abs(delta) < DRAG_THRESHOLD_PX) return

    isCreateDrag.current = true
    const currentMin = clientYToAbsMin(e.clientY)
    showBlockPreview(dragStartMin.current, currentMin)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current?.hasPointerCapture(e.pointerId)) return
    if (isResizing.current) return

    hideBlockPreview()

    const didDrag = isCreateDrag.current
    isCreateDrag.current  = false
    slotRectCache.current = null

    if (!didDrag) {
      // Tap — open slot detail
      openPanel({ type: 'freeSlot', id: slot.id })
      return
    }

    const endMin      = clientYToAbsMin(e.clientY)
    const startMin    = Math.min(dragStartMin.current, endMin)
    const finishMin   = Math.max(dragStartMin.current, endMin)
    const duration    = finishMin - startMin

    if (duration < MIN_DURATION) {
      // Drag too short — treat as click
      openPanel({ type: 'freeSlot', id: slot.id })
      return
    }

    openPanel({
      type: 'createWorkBlock',
      freeSlotId: slot.id,
      startTime: minutesToISO(date, startMin),
      endTime:   minutesToISO(date, finishMin),
    })
  }

  function handlePointerCancel() {
    isCreateDrag.current = false
    hideBlockPreview()
  }

  // ── Slot resize (bottom handle) ────────────────────────────────────────────

  function handleResizeDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const handle = e.currentTarget as HTMLElement
    handle.setPointerCapture(e.pointerId)
    isResizing.current   = true
    resizeStartY.current = e.clientY
    origEndMin.current   = toMinutesFromMidnight(slot.endTime)
  }

  function handleResizeMove(e: React.PointerEvent) {
    if (!isResizing.current) return
    const deltaMin = pxToMinutes(e.clientY - resizeStartY.current)
    const newEnd   = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped  = Math.max(slotStartMin + MIN_DURATION, Math.min(newEnd, 24 * 60))
    if (containerRef.current) {
      containerRef.current.style.height = `${minutesToPx(clamped - slotStartMin)}px`
    }
  }

  function handleResizeUp(e: React.PointerEvent) {
    if (!isResizing.current) return
    isResizing.current = false
    const deltaMin = pxToMinutes(e.clientY - resizeStartY.current)
    const newEnd   = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped  = Math.max(slotStartMin + MIN_DURATION, Math.min(newEnd, 24 * 60))
    if (containerRef.current) containerRef.current.style.height = ''
    updateFreeSlot(slot.id, { endTime: minutesToISO(date, clamped) })
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-1 right-1 rounded-lg select-none"
      style={{
        top: minutesToPx(slotStartMin),
        height: slotHeight,
        backgroundColor: '#10b98114',
        border: '1.5px solid #10b98140',
        zIndex: 1,
        touchAction: 'none',
        overflow: 'visible',   // allow resize handle to extend below
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Clip mask for interior content (blocks + label) */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" />

      {/* Label */}
      {slotHeight > 22 && (
        <div className="absolute inset-x-2 top-0.5 pointer-events-none">
          <span className="text-[10px] font-medium text-emerald-700 truncate block">
            {slot.label || 'Créneau libre'}
          </span>
        </div>
      )}

      {/* Block creation preview */}
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

      {/* Work blocks */}
      {slotBlocks.map((wb) => (
        <WorkBlockEl
          key={wb.id}
          block={wb}
          subject={subjectMap[wb.subjectId] as Subject | undefined}
          slotStartMin={slotStartMin}
          slotEndMin={slotEndMin}
          date={date}
        />
      ))}

      {/* Slot bottom resize handle */}
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-0.5 rounded-full bg-emerald-500/50" />
      </div>
    </div>
  )
}
