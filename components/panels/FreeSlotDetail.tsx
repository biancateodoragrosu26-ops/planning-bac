'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { formatDate, durationMinutes, fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/utils/dateUtils'
import { availableMinutes } from '@/lib/utils/slotUtils'
import { Button } from '@/components/ui/Button'
import type { FreeSlot } from '@/lib/types'

interface Props {
  slot: FreeSlot
  onClose: () => void
}

export function FreeSlotDetail({ slot, onClose }: Props) {
  const updateFreeSlot = useAppStore((s) => s.updateFreeSlot)
  const deleteFreeSlot = useAppStore((s) => s.deleteFreeSlot)
  const workBlocks = useAppStore((s) => s.workBlocks)
  const subjects = useAppStore((s) => s.subjects)
  const openPanel = useCalendarStore((s) => s.openPanel)

  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(slot.label ?? '')
  const [start, setStart] = useState(() => toDateTimeLocalValue(slot.startTime))
  const [end, setEnd] = useState(() => toDateTimeLocalValue(slot.endTime))

  const totalMin = durationMinutes(slot.startTime, slot.endTime)
  const availMin = availableMinutes(slot, workBlocks)
  const slotBlocks = workBlocks.filter((wb) => wb.freeSlotId === slot.id)

  function handleSave() {
    const s = new Date(start)
    const e = new Date(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return
    updateFreeSlot(slot.id, {
      label: label.trim() || undefined,
      startTime: fromDateTimeLocalValue(start),
      endTime: fromDateTimeLocalValue(end),
    })
    setEditing(false)
  }

  function handleDelete() {
    deleteFreeSlot(slot.id)
    onClose()
  }

  function handleAddBlock() {
    // Open create-work-block panel pre-filled with this slot's free time
    const firstFreeStart = slot.startTime
    const defaultEnd = new Date(new Date(slot.startTime).getTime() + 60 * 60 * 1000).toISOString()
    openPanel({
      type: 'createWorkBlock',
      freeSlotId: slot.id,
      startTime: firstFreeStart,
      endTime: defaultEnd,
    })
  }

  return (
    <div className="p-5 space-y-5">
      {/* Summary */}
      <div className="bg-[var(--surface-2)] rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold">{slot.label || 'Créneau libre'}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {formatDate(slot.startTime, 'EEE d MMM, HH:mm')} →{' '}
          {formatDate(slot.endTime, 'HH:mm')}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {Math.floor(totalMin / 60)}h{totalMin % 60 > 0 ? `${totalMin % 60}min` : ''} total ·{' '}
          <span className="text-emerald-600 font-medium">
            {Math.floor(availMin / 60)}h{availMin % 60 > 0 ? `${availMin % 60}min` : ''} libre
          </span>
        </p>
      </div>

      {/* Work blocks inside */}
      {slotBlocks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Blocs de travail
          </p>
          <div className="space-y-1.5">
            {slotBlocks.map((wb) => {
              const subject = subjects.find((s) => s.id === wb.subjectId)
              const dur = durationMinutes(wb.startTime, wb.endTime)
              return (
                <div
                  key={wb.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                  onClick={() => openPanel({ type: 'workBlock', id: wb.id })}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject?.color }}
                  />
                  <p className="text-sm flex-1 truncate">{subject?.name}</p>
                  <p className="text-xs text-[var(--text-muted)] shrink-0">
                    {Math.floor(dur / 60)}h{dur % 60 > 0 ? `${dur % 60}min` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add work block button */}
      {availMin >= MIN_DURATION && (
        <Button variant="secondary" className="w-full" onClick={handleAddBlock}>
          + Ajouter un bloc de travail
        </Button>
      )}

      {/* Edit form */}
      {editing ? (
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nom</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Début</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Fin</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 border-t border-[var(--border)] pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>
            Modifier
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      )}
    </div>
  )
}

const MIN_DURATION = 5
