import { parseISO } from 'date-fns'
import type { FreeSlot, WorkBlock } from '@/lib/types'
import { durationMinutes } from './dateUtils'

/** Total minutes in a free slot */
export function slotDurationMinutes(slot: FreeSlot): number {
  return durationMinutes(slot.startTime, slot.endTime)
}

/** Minutes already assigned to work blocks within a slot */
export function usedMinutes(slot: FreeSlot, workBlocks: WorkBlock[]): number {
  return workBlocks
    .filter((wb) => wb.freeSlotId === slot.id)
    .reduce((sum, wb) => sum + durationMinutes(wb.startTime, wb.endTime), 0)
}

/** Remaining free minutes in a slot */
export function availableMinutes(slot: FreeSlot, workBlocks: WorkBlock[]): number {
  return Math.max(0, slotDurationMinutes(slot) - usedMinutes(slot, workBlocks))
}

/** Check that a work block's time range is contained within its parent free slot */
export function isBlockContained(block: WorkBlock, slot: FreeSlot): boolean {
  const slotStart = parseISO(slot.startTime).getTime()
  const slotEnd = parseISO(slot.endTime).getTime()
  const blockStart = parseISO(block.startTime).getTime()
  const blockEnd = parseISO(block.endTime).getTime()
  return blockStart >= slotStart && blockEnd <= slotEnd
}

/** Get work blocks for a specific slot, sorted by start time */
export function getBlocksForSlot(slotId: string, workBlocks: WorkBlock[]): WorkBlock[] {
  return workBlocks
    .filter((wb) => wb.freeSlotId === slotId)
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
}

/** Total free minutes across all slots in a list */
export function totalAvailableMinutes(slots: FreeSlot[], workBlocks: WorkBlock[]): number {
  return slots.reduce((sum, slot) => sum + availableMinutes(slot, workBlocks), 0)
}
