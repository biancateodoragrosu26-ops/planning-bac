'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { formatDate, fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/utils/dateUtils'
import { Button } from '@/components/ui/Button'
import type { CalendarEvent } from '@/lib/types'

interface Props {
  event: CalendarEvent
  onClose: () => void
}

export function EventDetail({ event, onClose }: Props) {
  const updateEvent = useAppStore((s) => s.updateEvent)
  const deleteEvent = useAppStore((s) => s.deleteEvent)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [start, setStart] = useState(() => toDateTimeLocalValue(event.startTime))
  const [end, setEnd] = useState(() => toDateTimeLocalValue(event.endTime))

  function handleSave() {
    const s = new Date(start)
    const e = new Date(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s || !title.trim()) return
    updateEvent(event.id, {
      title: title.trim(),
      startTime: fromDateTimeLocalValue(start),
      endTime: fromDateTimeLocalValue(end),
    })
    setEditing(false)
  }

  function handleDelete() {
    deleteEvent(event.id)
    onClose()
  }

  return (
    <div className="p-5 space-y-5">
      {!editing ? (
        <>
          <div className="bg-[var(--surface-2)] rounded-xl p-4 space-y-1">
            <p className="font-semibold text-sm">{event.title}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {formatDate(event.startTime, 'EEE d MMM, HH:mm')} →{' '}
              {formatDate(event.endTime, 'HH:mm')}
            </p>
            <p className="text-xs text-[var(--text-faint)] capitalize">{event.type}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>
              Modifier
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
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
          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
