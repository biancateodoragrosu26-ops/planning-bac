'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import type { SubjectId } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import {
  formatBlockCount,
  formatHourCount,
  minutesToEquivalentBlocks,
  minutesToHours,
} from '@/lib/utils/strategyUtils'

export default function ChargePage() {
  const subjects = useAppStore((state) => state.subjects)
  const settings = useAppStore((state) => state.settings)
  const updateSubject = useAppStore((state) => state.updateSubject)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const [editing, setEditing] = useState<SubjectId | null>(null)
  const [draftHours, setDraftHours] = useState('')
  const [settingsDraft, setSettingsDraft] = useState({
    smallBlockMaxMinutes: String(settings.smallBlockMaxMinutes),
    intermediateBlockMaxMinutes: String(settings.intermediateBlockMaxMinutes),
    equivalentIntermediateBlockMinutes: String(settings.equivalentIntermediateBlockMinutes),
  })

  const totals = useMemo(() => {
    const totalMinutes = subjects.reduce((sum, subject) => sum + subject.estimatedMinutesRemaining, 0)
    return {
      totalMinutes,
      totalHours: minutesToHours(totalMinutes),
      totalBlocks: minutesToEquivalentBlocks(totalMinutes, settings),
    }
  }, [settings, subjects])

  function startEdit(id: SubjectId, currentMinutes: number) {
    setEditing(id)
    setDraftHours(String(minutesToHours(currentMinutes)))
  }

  function commitEdit(id: SubjectId) {
    const hours = Number.parseFloat(draftHours)
    if (!Number.isNaN(hours) && hours >= 0) {
      updateSubject(id, {
        estimatedMinutesRemaining: Math.round(hours * 60),
        estimatedUpdatedAt: new Date().toISOString(),
      })
    }
    setEditing(null)
  }

  function handleSaveSettings() {
    const small = Number.parseInt(settingsDraft.smallBlockMaxMinutes, 10)
    const intermediate = Number.parseInt(settingsDraft.intermediateBlockMaxMinutes, 10)
    const equivalent = Number.parseInt(settingsDraft.equivalentIntermediateBlockMinutes, 10)

    if (
      Number.isNaN(small) ||
      Number.isNaN(intermediate) ||
      Number.isNaN(equivalent) ||
      small <= 0 ||
      intermediate <= small ||
      equivalent <= 0
    ) {
      return
    }

    updateSettings({
      smallBlockMaxMinutes: small,
      intermediateBlockMaxMinutes: intermediate,
      equivalentIntermediateBlockMinutes: equivalent,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Charge strategique
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-strong)]">
              Base de travail avant arbitrage
            </h1>
            <p className="text-sm md:text-base text-[var(--text-muted)] max-w-2xl">
              Les durees restent stockees en minutes, mais la lecture produit passe d&apos;abord en
              blocs intermediaires equivalents.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
              Total estime
            </p>
            <p className="mt-1 text-3xl font-semibold text-[var(--text-strong)]">
              {formatBlockCount(totals.totalBlocks)} blocs eq
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {formatHourCount(totals.totalHours)} h internes
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="space-y-4">
          {subjects.map((subject) => {
            const blockCount = minutesToEquivalentBlocks(subject.estimatedMinutesRemaining, settings)
            const hourCount = minutesToHours(subject.estimatedMinutesRemaining)
            const isEditing = editing === subject.id

            return (
              <article
                key={subject.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="mt-1 h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--text-strong)]">{subject.name}</h2>
                      <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                        maj {new Date(subject.estimatedUpdatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {!isEditing ? (
                      <div className="mt-4 flex flex-wrap gap-6">
                        <div>
                          <p className="text-3xl font-semibold text-[var(--text-strong)]">
                            {formatBlockCount(blockCount)}
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">blocs equivalents</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-[var(--text-strong)]">
                            {formatHourCount(hourCount)} h
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">lecture secondaire</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            Heures estimees restantes
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={draftHours}
                            onChange={(event) => setDraftHours(event.target.value)}
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-base outline-none transition focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
                            autoFocus
                          />
                        </div>
                        <Button variant="primary" onClick={() => commitEdit(subject.id)}>
                          Enregistrer
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(subject.id, subject.estimatedMinutesRemaining)}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Reglages strategiques
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  Petit bloc max (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="5"
                  value={settingsDraft.smallBlockMaxMinutes}
                  onChange={(event) =>
                    setSettingsDraft((draft) => ({
                      ...draft,
                      smallBlockMaxMinutes: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  Bloc intermediaire max (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  step="5"
                  value={settingsDraft.intermediateBlockMaxMinutes}
                  onChange={(event) =>
                    setSettingsDraft((draft) => ({
                      ...draft,
                      intermediateBlockMaxMinutes: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  1 bloc intermediaire equivalent (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  step="5"
                  value={settingsDraft.equivalentIntermediateBlockMinutes}
                  onChange={(event) =>
                    setSettingsDraft((draft) => ({
                      ...draft,
                      equivalentIntermediateBlockMinutes: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
                />
              </div>
              <Button variant="primary" className="w-full" onClick={handleSaveSettings}>
                Sauvegarder les reglages
              </Button>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Lecture actuelle
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
              <p>Petit bloc: jusqu&apos;a {settings.smallBlockMaxMinutes} min.</p>
              <p>
                Bloc intermediaire: plus de {settings.smallBlockMaxMinutes} min jusqu&apos;a{' '}
                {settings.intermediateBlockMaxMinutes} min.
              </p>
              <p>Grand bloc: au-dela de {settings.intermediateBlockMaxMinutes} min.</p>
              <p>
                Conversion produit: 1 bloc equivalent ={' '}
                {settings.equivalentIntermediateBlockMinutes} min.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
