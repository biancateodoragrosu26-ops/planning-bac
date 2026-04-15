'use client'

import { useRef } from 'react'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { toMinutesFromMidnight, snapToGrid, minutesToISO } from '@/lib/utils/dateUtils'
import type { WorkBlock, Subject } from '@/lib/types'

const HOUR_HEIGHT = 64
const SNAP_MINUTES = 5
const MIN_DURATION = 5

function minutesToPx(min: number) { return (min / 60) * HOUR_HEIGHT }
function pxToMinutes(px: number) { return (px / HOUR_HEIGHT) * 60 }

interface WorkBlockElProps {
  block: WorkBlock
  subject: Subject | undefined
  slotStartMin: number  // absolute minutes — upper bound for top handle
  slotEndMin: number    // absolute minutes — upper bound for resize
  date: Date
}

export function WorkBlockEl({ block, subject, slotStartMin, slotEndMin, date }: WorkBlockElProps) {
  const openPanel = useCalendarStore((s) => s.openPanel)
  const updateWorkBlock = useAppStore((s) => s.updateWorkBlock)

  const blockStartMin = toMinutesFromMidnight(block.startTime)
  const blockEndMin   = toMinutesFromMidnight(block.endTime)
  const top    = minutesToPx(blockStartMin - slotStartMin)
  const height = Math.max(minutesToPx(blockEndMin - blockStartMin), 16)

  // ── Resize state (refs — no React state during drag for perf) ──────────────
  const blockRef     = useRef<HTMLDivElement>(null)
  const isResizing   = useRef(false)
  const resizeStartY = useRef(0)
  const origEndMin   = useRef(blockEndMin)

  function handleResizeDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const handle = e.currentTarget as HTMLElement
    handle.setPointerCapture(e.pointerId)
    isResizing.current   = true
    resizeStartY.current = e.clientY
    origEndMin.current   = toMinutesFromMidnight(block.endTime)
  }

  function handleResizeMove(e: React.PointerEvent) {
    if (!isResizing.current) return
    const deltaMin = pxToMinutes(e.clientY - resizeStartY.current)
    const newEnd   = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped  = Math.max(blockStartMin + MIN_DURATION, Math.min(newEnd, slotEndMin))
    if (blockRef.current) {
      blockRef.current.style.height = `${minutesToPx(clamped - blockStartMin)}px`
    }
  }

  function handleResizeUp(e: React.PointerEvent) {
    if (!isResizing.current) return
    isResizing.current = false
    const deltaMin = pxToMinutes(e.clientY - resizeStartY.current)
    const newEnd   = snapToGrid(origEndMin.current + deltaMin, SNAP_MINUTES)
    const clamped  = Math.max(blockStartMin + MIN_DURATION, Math.min(newEnd, slotEndMin))
    // Reset inline style — React will set correct height on re-render
    if (blockRef.current) blockRef.current.style.height = ''
    updateWorkBlock(block.id, { endTime: minutesToISO(date, clamped) })
  }

  const color = subject?.color ?? '#3b82f6'
  const opacity = block.status === 'skipped' ? 0.35 : block.status === 'done' ? 0.65 : 1

  return (
    <div
      ref={blockRef}
      data-role="work-block"
      className="absolute left-0 right-0 rounded-md overflow-hidden cursor-pointer select-none"
      style={{ top, height, backgroundColor: color, opacity, zIndex: 2 }}
      onClick={(e) => {
        e.stopPropagation()
        openPanel({ type: 'workBlock', id: block.id })
      }}
    >
      {/* Label */}
      {height > 18 && (
        <div className="px-1.5 pt-0.5 pointer-events-none">
          <p className="text-[10px] font-semibold text-white truncate leading-tight">
            {subject?.name ?? block.subjectId}
          </p>
        </div>
      )}

      {/* Bottom resize handle */}
      <div
        data-role="resize-handle"
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
        style={{ height: 8, cursor: 'ns-resize', touchAction: 'none' }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-6 h-0.5 rounded-full bg-white/50" />
      </div>
    </div>
  )
}
