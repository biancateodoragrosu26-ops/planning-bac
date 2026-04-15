'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { formatDate, durationMinutes } from '@/lib/utils/dateUtils'
import { isBlockContained } from '@/lib/utils/slotUtils'
import { Button } from '@/components/ui/Button'
import type { WorkBlock, WorkBlockStatus, SubjectId } from '@/lib/types'

interface Props {
  block: WorkBlock
  onClose: () => void
}

export function WorkBlockDetail({ block, onClose }: Props) {
  const updateWorkBlock = useAppStore((s) => s.updateWorkBlock)
  const deleteWorkBlock = useAppStore((s) => s.deleteWorkBlock)
  const subjects = useAppStore((s) => s.subjects)
  const freeSlots = useAppStore((s) => s.freeSlots)

  const subject = subjects.find((s) => s.id === block.subjectId)
  const dur = durationMinutes(block.startTime, block.endTime)

  const [editing, setEditing] = useState(false)
  const [subjectId, setSubjectId] = useState<SubjectId>(block.subjectId)
  const [start, setStart] = useState(block.startTime.slice(0, 16))
  const [end, setEnd] = useState(block.endTime.slice(0, 16))
  const [notes, setNotes] = useState(block.notes ?? '')
  const [status, setStatus] = useState<WorkBlockStatus>(block.status)
  const [error, setError] = useState('')

  const STATUS_LABELS: Record<WorkBlockStatus, string> = {
    planned: 'Planifié',
    done: 'Fait ✓',
    skipped: 'Sauté',
  }

  function handleSave() {
    setError('')
    const s = new Date(start)
    const e = new Date(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
      setError('Dates invalides.')
      return
    }
    const slot = freeSlots.find((fs) => fs.id === block.freeSlotId)
    const updatedBlock = {
      ...block,
      subjectId,
      startTime: s.toISOString(),
      endTime: e.toISOString(),
      status,
      notes: notes.trim() || undefined,
    }
    if (slot && !isBlockContained(updatedBlock, slot)) {
      setError('Le bloc doit être entièrement dans le créneau libre.')
      return
    }
    updateWorkBlock(block.id, {
      subjectId,
      startTime: s.toISOString(),
      endTime: e.toISOString(),
      status,
      notes: notes.trim() || undefined,
    })
    setEditing(false)
  }

  function handleDelete() {
    deleteWorkBlock(block.id)
    onClose()
  }

  function quickStatus(s: WorkBlockStatus) {
    updateWorkBlock(block.id, { status: s })
    setStatus(s)
  }

  return (
    <div className="p-5 space-y-5">
      {/* Summary */}
      <div
        className="rounded-xl p-4 space-y-1"
        style={{ backgroundColor: (subject?.color ?? '#6b7280') + '15' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: subject?.color }}
          />
          <p className="text-sm font-semibold">{subject?.name}</p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {formatDate(block.startTime, 'EEE d MMM, HH:mm')} →{' '}
          {formatDate(block.endTime, 'HH:mm')}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {Math.floor(dur / 60)}h{dur % 60 > 0 ? `${dur % 60}min` : ''}
        </p>
        {block.notes && (
          <p className="text-xs text-[var(--text-muted)] mt-1 italic">{block.notes}</p>
        )}
      </div>

      {/* Quick status */}
      {!editing && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Statut
          </p>
          <div className="flex gap-2">
            {(['planned', 'done', 'skipped'] as WorkBlockStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => quickStatus(s)}
                className={[
                  'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                  block.status === s
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSubjectId(sub.id)}
                className={[
                  'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left',
                  subjectId === sub.id
                    ? 'border-[var(--foreground)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <span className="truncate">{sub.name}</span>
              </button>
            ))}
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
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
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
