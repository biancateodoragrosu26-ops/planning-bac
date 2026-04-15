'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'
import { Button } from '@/components/ui/Button'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
]

export default function PeriodesPage() {
  const periods = useAppStore((s) => s.periods)
  const addPeriod = useAppStore((s) => s.addPeriod)
  const deletePeriod = useAppStore((s) => s.deletePeriod)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    color: PRESET_COLORS[0],
    description: '',
  })

  function handleAdd() {
    if (!form.name || !form.startDate || !form.endDate) return
    addPeriod({ id: generateId(), ...form })
    setForm({ name: '', startDate: '', endDate: '', color: PRESET_COLORS[0], description: '' })
    setShowForm(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Périodes</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Phases de révision visibles dans le calendrier
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Annuler' : '+ Nouvelle'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 space-y-3">
          <input
            type="text"
            placeholder="Nom de la période (ex: Sprint Maths)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Début</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={[
                    'w-7 h-7 rounded-full border-2 transition-all',
                    form.color === c ? 'border-[var(--foreground)] scale-110' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            Créer la période
          </Button>
        </div>
      )}

      {periods.length === 0 && !showForm && (
        <p className="text-center text-sm text-[var(--text-faint)] py-8">
          Aucune période créée. Les périodes apparaissent comme des bandeaux dans le calendrier.
        </p>
      )}

      <div className="space-y-2">
        {periods.map((period) => (
          <div
            key={period.id}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-3"
          >
            <div
              className="w-4 h-4 rounded shrink-0"
              style={{ backgroundColor: period.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{period.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {period.startDate} → {period.endDate}
              </p>
            </div>
            <button
              onClick={() => deletePeriod(period.id)}
              className="text-[var(--text-faint)] hover:text-red-500 transition-colors text-sm"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
