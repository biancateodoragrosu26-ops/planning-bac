'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import {
  computeStrategicSummary,
  formatBlockCount,
  formatHourCount,
  minutesToHours,
} from '@/lib/utils/strategyUtils'

export default function RetardPage() {
  const subjects = useAppStore((state) => state.subjects)
  const workBlocks = useAppStore((state) => state.workBlocks)
  const freeSlots = useAppStore((state) => state.freeSlots)
  const schoolItems = useAppStore((state) => state.schoolItems)
  const settings = useAppStore((state) => state.settings)

  const summary = useMemo(
    () => computeStrategicSummary(subjects, workBlocks, freeSlots, schoolItems, settings),
    [freeSlots, schoolItems, settings, subjects, workBlocks]
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Retard et analyse
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-strong)]">
            La verite du plan avant le bac
          </h1>
          <p className="max-w-3xl text-sm md:text-base text-[var(--text-muted)]">
            Cette page regarde la charge restante en blocs intermediaires equivalents, la compare
            a la capacite reellement exploitable, puis montre ou la tension se concentre.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
              Travail restant
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
              {formatBlockCount(summary.remainingWorkEquivalentBlocks)}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              blocs eq · {formatHourCount(minutesToHours(summary.remainingWorkMinutes))} h
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
              Capacite ideale
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
              {formatBlockCount(summary.idealRemainingCapacityEquivalentBlocks)}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              blocs eq · {formatHourCount(minutesToHours(summary.idealRemainingCapacityMinutes))} h
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
              Capacite realiste
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
              {formatBlockCount(summary.realisticRemainingCapacityEquivalentBlocks)}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              blocs eq · {formatHourCount(minutesToHours(summary.realisticRemainingCapacityMinutes))} h
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">Gap</p>
            <p
              className={`mt-2 text-3xl font-semibold ${
                summary.gapEquivalentBlocks >= 0
                  ? 'text-[var(--accent-sage-strong)]'
                  : 'text-[var(--critical-strong)]'
              }`}
            >
              {summary.gapEquivalentBlocks >= 0 ? '+' : ''}
              {formatBlockCount(summary.gapEquivalentBlocks)}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              blocs eq · {summary.gapMinutes >= 0 ? '+' : ''}
              {formatHourCount(minutesToHours(summary.gapMinutes))} h
            </p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Cadence requise
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Par jour</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  {formatBlockCount(summary.requiredEquivalentBlocksPerDay)} bloc eq
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatHourCount(summary.requiredHoursPerDay)} h / jour
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Matiere la plus a risque</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  {summary.mostTenseSubject?.name ?? 'Aucune'}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {summary.mostTenseSubject
                    ? `${formatBlockCount(summary.mostTenseSubject.requiredEquivalentBlocksPerDay)} bloc eq / jour`
                    : 'Pas de tension dominante'}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
              <div className="grid grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] bg-[var(--surface-3)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span>Matiere</span>
                <span>Restant</span>
                <span>Pace/jour</span>
                <span>Planifie</span>
                <span>Fait</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {summary.subjects.map((subject) => (
                  <div
                    key={subject.subjectId}
                    className="grid grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] items-center gap-3 px-4 py-4 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="truncate font-medium text-[var(--text-strong)]">
                        {subject.name}
                      </span>
                    </div>
                    <span className="text-[var(--text-strong)]">
                      {formatBlockCount(subject.remainingEquivalentBlocks)}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {formatBlockCount(subject.requiredEquivalentBlocksPerDay)}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {formatHourCount(minutesToHours(subject.plannedMinutes))} h
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {formatHourCount(minutesToHours(subject.doneMinutes))} h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Sensibilite du plan
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Perdre une journee</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  -{formatBlockCount(summary.impactOfLosingDayEquivalentBlocks)} blocs eq
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  environ {formatHourCount(minutesToHours(summary.impactOfLosingDayMinutes))} h perdues
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Perdre un creneau libre</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  -{formatBlockCount(summary.impactOfLosingSlotEquivalentBlocks)} blocs eq
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  environ {formatHourCount(minutesToHours(summary.impactOfLosingSlotMinutes))} h utiles
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text-muted)]">Sauter un bloc</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  -{formatBlockCount(summary.impactOfSkippingOneBlockEquivalentBlocks)} blocs eq
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  environ {formatHourCount(minutesToHours(summary.impactOfSkippingOneBlockMinutes))} h decalees
                </p>
              </div>

              {summary.includedSchoolMinutes > 0 && (
                <div className="rounded-[1.25rem] border border-dashed border-[var(--accent-amber-strong)] bg-[var(--accent-amber-soft)]/45 p-4">
                  <p className="text-sm font-medium text-[var(--text-strong)]">
                    Items scolaires inclus dans les stats
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {formatHourCount(minutesToHours(summary.includedSchoolMinutes))} h sont
                    volontairement reintegrees dans la charge bac.
                  </p>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
