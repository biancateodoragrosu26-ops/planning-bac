'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'
import { Button } from '@/components/ui/Button'
import type { CalendarEventType } from '@/lib/types'

interface Props {
  startTime?: string
  endTime?: string
  onClose: () => void
}

const EVENT_TYPES: { id: CalendarEventType; label: string; color: string }[] = [
  { id: 'school', label: 'Ecole', color: '#6b7280' },
  { id: 'exam', label: 'Examen', color: '#ef4444' },
  { id: 'personal', label: 'Personnel', color: '#8b5cf6' },
  { id: 'holiday', label: 'Vacances', color: '#f59e0b' },
  { id: 'constraint', label: 'Contrainte', color: '#bb785a' },
]

function defaultStart(provided?: string) {
  if (provided) return provided.slice(0, 16)
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date.toISOString().slice(0, 16)
}

function defaultEnd(provided?: string, startISO?: string) {
  if (provided) return provided.slice(0, 16)
  const date = startISO ? new Date(startISO) : new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 2)
  return date.toISOString().slice(0, 16)
}

export function CreateEventForm({ startTime, endTime, onClose }: Props) {
  const addEvent = useAppStore((state) => state.addEvent)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(() => defaultStart(startTime))
  const [end, setEnd] = useState(() => defaultEnd(endTime, startTime))
  const [type, setType] = useState<CalendarEventType>('school')
  const [error, setError] = useState('')

  function handleCreate() {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const selectedType = EVENT_TYPES.find((item) => item.id === type)

    setError('')
    if (!title.trim()) return setError('Le titre est requis.')
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return setError('Dates invalides.')
    }
    if (!selectedType) return

    addEvent({
      id: generateId(),
      title: title.trim(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      type,
      color: selectedType.color,
    })
    onClose()
  }

  return (
    <div className="space-y-4 p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Titre</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setType(item.id)}
              className={[
                'flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition',
                type === item.id
                  ? 'border-[var(--text-strong)] bg-[var(--surface-2)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-2)]',
              ].join(' ')}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Debut</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Fin</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      {error && <p className="rounded-lg bg-[var(--critical-soft)] px-3 py-2 text-xs text-[var(--critical-strong)]">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="flex-1" onClick={handleCreate}>
          Creer l&apos;evenement
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
