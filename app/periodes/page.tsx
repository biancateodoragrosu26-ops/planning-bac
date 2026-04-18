'use client'

import { useMemo, useState } from 'react'
import { PeriodForm, createEmptyPeriodDraft } from '@/components/periods/PeriodForm'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'

export default function PeriodesPage() {
  const periods = useAppStore((state) => state.periods)
  const addPeriod = useAppStore((state) => state.addPeriod)
  const updatePeriod = useAppStore((state) => state.updatePeriod)
  const deletePeriod = useAppStore((state) => state.deletePeriod)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingPeriod = useMemo(
    () => periods.find((period) => period.id === editingId) ?? null,
    [editingId, periods]
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Periodes
              </p>
              <h1 className="text-2xl font-semibold text-[var(--text-strong)]">
                Tes grandes phases
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Definis une plage claire, ce que tu veux faire dedans et le signal qui dira
                que cette phase est terminee.
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowCreateForm((current) => !current)}>
              {showCreateForm ? 'Fermer' : 'Nouvelle periode'}
            </Button>
          </div>

          {showCreateForm && (
            <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <PeriodForm
                initialValue={createEmptyPeriodDraft()}
                submitLabel="Creer la periode"
                onSubmit={(value) => {
                  addPeriod({ id: generateId(), ...value })
                  setShowCreateForm(false)
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}
        </section>

        {periods.length === 0 && !showCreateForm && (
          <section className="rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
            Aucune periode pour le moment. Tu peux en creer ici ou directement depuis la vue
            mois du calendrier.
          </section>
        )}

        <section className="grid gap-4">
          {periods.map((period) => {
            const isEditing = editingPeriod?.id === period.id
            return (
              <article
                key={period.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="mt-1 h-4 w-4 rounded-full" style={{ backgroundColor: period.color }} />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-strong)]">
                        {period.name}
                      </h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {period.startDate} au {period.endDate}
                      </p>
                    </div>

                    {!isEditing && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {period.objective && (
                          <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Objectif
                            </p>
                            <p className="mt-2 text-sm text-[var(--text-strong)]">{period.objective}</p>
                          </div>
                        )}
                        {period.plan && (
                          <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Pendant cette periode
                            </p>
                            <p className="mt-2 text-sm text-[var(--text-strong)]">{period.plan}</p>
                          </div>
                        )}
                        {period.exitCondition && (
                          <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Condition de fin
                            </p>
                            <p className="mt-2 text-sm text-[var(--text-strong)]">
                              {period.exitCondition}
                            </p>
                          </div>
                        )}
                        {(period.description || period.notes) && (
                          <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                              Notes
                            </p>
                            <p className="mt-2 text-sm text-[var(--text-strong)]">
                              {period.description || period.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                        <PeriodForm
                          initialValue={{
                            name: period.name,
                            startDate: period.startDate,
                            endDate: period.endDate,
                            color: period.color,
                            description: period.description ?? '',
                            objective: period.objective ?? '',
                            exitCondition: period.exitCondition ?? '',
                            plan: period.plan ?? '',
                            notes: period.notes ?? '',
                          }}
                          submitLabel="Enregistrer"
                          onSubmit={(value) => {
                            updatePeriod(period.id, value)
                            setEditingId(null)
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingId((current) => (current === period.id ? null : period.id))}
                    >
                      {isEditing ? 'Fermer' : 'Modifier'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deletePeriod(period.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
