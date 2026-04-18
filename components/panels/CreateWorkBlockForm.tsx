'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'
import { isBlockContained } from '@/lib/utils/slotUtils'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/utils/dateUtils'
import { Button } from '@/components/ui/Button'
import type { SubjectId } from '@/lib/types'

interface Props {
  freeSlotId: string
  startTime: string
  endTime: string
  onClose: () => void
}

export function CreateWorkBlockForm({ freeSlotId, startTime, endTime, onClose }: Props) {
  const addWorkBlock = useAppStore((s) => s.addWorkBlock)
  const subjects = useAppStore((s) => s.subjects)
  const freeSlots = useAppStore((s) => s.freeSlots)

  const [subjectId, setSubjectId] = useState<SubjectId>(subjects[0]?.id ?? 'maths')
  const [start, setStart] = useState(() => toDateTimeLocalValue(startTime))
  const [end, setEnd] = useState(() => toDateTimeLocalValue(endTime))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function handleCreate() {
    const s = new Date(start)
    const e = new Date(end)
    setError('')

    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
      setError('Dates invalides.')
      return
    }

    const slot = freeSlots.find((fs) => fs.id === freeSlotId)
    if (!slot) {
      setError('Créneau parent introuvable.')
      return
    }

    const block = {
      id: generateId(),
      subjectId,
      freeSlotId,
      startTime: fromDateTimeLocalValue(start),
      endTime: fromDateTimeLocalValue(end),
      status: 'planned' as const,
      notes: notes.trim() || undefined,
    }

    if (!isBlockContained(block, slot)) {
      setError('Le bloc doit être entièrement dans le créneau libre.')
      return
    }

    addWorkBlock(block)
    onClose()
  }

  return (
    <div className="p-5 space-y-4">
      {/* Subject picker */}
      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-2">
          Matière
        </label>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSubjectId(sub.id)}
              className={[
                'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left',
                subjectId === sub.id
                  ? 'border-[var(--foreground)] bg-[var(--surface-2)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-2)]',
              ].join(' ')}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: sub.color }}
              />
              <span className="truncate text-xs">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
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

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Révision chapitre 4, exercices 12-15…"
          rows={2}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="flex-1" onClick={handleCreate}>
          Créer le bloc
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
