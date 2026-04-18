'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Period } from '@/lib/types'

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

type PeriodDraft = Omit<Period, 'id'>

interface PeriodFormProps {
  initialValue: PeriodDraft
  submitLabel: string
  onSubmit: (value: PeriodDraft) => void
  onCancel?: () => void
}

export function createEmptyPeriodDraft(
  startDate = '',
  endDate = '',
  color = PRESET_COLORS[0]
): PeriodDraft {
  return {
    name: '',
    startDate,
    endDate,
    color,
    description: '',
    objective: '',
    exitCondition: '',
    plan: '',
    notes: '',
  }
}

export function PeriodForm({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
}: PeriodFormProps) {
  const [form, setForm] = useState<PeriodDraft>(initialValue)

  function handleSubmit() {
    if (!form.name.trim() || !form.startDate || !form.endDate) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      objective: form.objective?.trim() || undefined,
      exitCondition: form.exitCondition?.trim() || undefined,
      plan: form.plan?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Nom</label>
        <input
          type="text"
          placeholder="Ex: Sprint maths"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Debut</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, startDate: event.target.value }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Fin</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, endDate: event.target.value }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm((current) => ({ ...current, color }))}
              className={[
                'h-8 w-8 rounded-full border-2 transition-transform',
                form.color === color ? 'scale-110 border-[var(--text-strong)]' : 'border-transparent',
              ].join(' ')}
              style={{ backgroundColor: color }}
              aria-label={`Choisir ${color}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Objectif</label>
        <textarea
          value={form.objective ?? ''}
          onChange={(event) =>
            setForm((current) => ({ ...current, objective: event.target.value }))
          }
          rows={2}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
          Ce que je fais pendant cette periode
        </label>
        <textarea
          value={form.plan ?? ''}
          onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value }))}
          rows={3}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
          Condition de fin
        </label>
        <textarea
          value={form.exitCondition ?? ''}
          onChange={(event) =>
            setForm((current) => ({ ...current, exitCondition: event.target.value }))
          }
          rows={2}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Resume</label>
        <textarea
          value={form.description ?? ''}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          rows={2}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Notes</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          rows={2}
          className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="flex-1" onClick={handleSubmit}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  )
}
