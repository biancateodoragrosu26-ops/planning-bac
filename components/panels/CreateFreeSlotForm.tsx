'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/utils/dateUtils'
import { Button } from '@/components/ui/Button'

interface Props {
  startTime?: string   // optional — FAB creates without drag times
  endTime?: string
  onClose: () => void
}

function defaultStart(provided?: string): string {
  if (provided) return toDateTimeLocalValue(provided)
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return toDateTimeLocalValue(d)
}

function defaultEnd(provided?: string, start?: string): string {
  if (provided) return toDateTimeLocalValue(provided)
  const base = start ? new Date(start) : new Date()
  if (!start) { base.setMinutes(0, 0, 0); base.setHours(base.getHours() + 3) }
  else base.setTime(base.getTime() + 2 * 60 * 60 * 1000)
  return toDateTimeLocalValue(base)
}

export function CreateFreeSlotForm({ startTime, endTime, onClose }: Props) {
  const addFreeSlot = useAppStore((s) => s.addFreeSlot)

  const [label, setLabel] = useState('')
  const [start, setStart] = useState(() => defaultStart(startTime))
  const [end,   setEnd]   = useState(() => defaultEnd(endTime, startTime))

  function handleCreate() {
    const s = new Date(start)
    const e = new Date(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return

    addFreeSlot({
      id:        generateId(),
      startTime: fromDateTimeLocalValue(start),
      endTime:   fromDateTimeLocalValue(end),
      label:     label.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
          Nom (optionnel)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex: Après l'école, Samedi matin…"
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Début</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Fin</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="primary" className="flex-1" onClick={handleCreate}>
          Créer le créneau
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
