'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store/useAppStore'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { formatDate } from '@/lib/utils/dateUtils'
import {
  REALISTIC_CAPACITY_FACTOR,
  computeStrategicSummary,
  formatBlockCount,
  formatHourCount,
  minutesToEquivalentBlocks,
  minutesToHours,
} from '@/lib/utils/strategyUtils'
import type { StrategicStatus } from '@/lib/utils/strategyUtils'

const STATUS_COPY: Record<StrategicStatus, { label: string; sentence: string; tone: string }> = {
  'under-control': {
    label: 'Sous controle',
    sentence: 'Tu as encore de la marge si tu gardes le rythme.',
    tone: 'text-[var(--accent-sage-strong)]',
  },
  tense: {
    label: 'Tendu',
    sentence: 'Ca passe encore, mais il ne faut plus trop glisser.',
    tone: 'text-[var(--accent-amber-strong)]',
  },
  critical: {
    label: 'Critique',
    sentence: 'La marge est trop fine. Chaque jour compte vraiment.',
    tone: 'text-[var(--critical-strong)]',
  },
}

function blockLabel(value: number) {
  return `${formatBlockCount(value)} blocs`
}

export default function AccueilPage() {
  const router = useRouter()
  const subjects = useAppStore((state) => state.subjects)
  const workBlocks = useAppStore((state) => state.workBlocks)
  const freeSlots = useAppStore((state) => state.freeSlots)
  const schoolItems = useAppStore((state) => state.schoolItems)
  const todos = useAppStore((state) => state.todos)
  const settings = useAppStore((state) => state.settings)
  const setView = useCalendarStore((state) => state.setView)
  const goToToday = useCalendarStore((state) => state.goToToday)

  const summary = useMemo(
    () => computeStrategicSummary(subjects, workBlocks, freeSlots, schoolItems, settings),
    [freeSlots, schoolItems, settings, subjects, workBlocks]
  )

  const activeTodos = todos.filter((todo) => todo.status !== 'done')
  const statusCopy = STATUS_COPY[summary.status]
  const skipTodayRealisticMinutes = Math.max(
    0,
    (summary.idealRemainingCapacityMinutes - summary.todayCapacityMinutes) * REALISTIC_CAPACITY_FACTOR
  )
  const skipTodayGapBlocks = minutesToEquivalentBlocks(
    skipTodayRealisticMinutes - summary.remainingWorkMinutes,
    settings
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-soft)] md:px-8 md:py-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(194,142,112,0.16),_transparent_38%),radial-gradient(circle_at_left,_rgba(126,154,121,0.14),_transparent_32%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Accueil
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-semibold ${statusCopy.tone}`}>
                    {statusCopy.label}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    Bac le {formatDate(settings.bacDate, 'd MMMM yyyy')}
                  </span>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-strong)] md:text-6xl">
                  {summary.daysUntilBac > 0 ? `${summary.daysUntilBac} jours` : "C'est aujourd'hui"}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg">
                  {statusCopy.sentence}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setView('day')
                    goToToday()
                    router.push('/calendrier')
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent-terracotta-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:translate-y-[-1px] hover:bg-[var(--accent-terracotta-deep)]"
                >
                  Aujourd&apos;hui
                </button>
                <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  {summary.todayCapacityMinutes > 0
                    ? `${blockLabel(summary.todayCapacityEquivalentBlocks)} libres aujourd'hui`
                    : "Aucun creneau libre aujourd'hui"}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  Travail restant
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.remainingWorkEquivalentBlocks)}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatHourCount(minutesToHours(summary.remainingWorkMinutes))} h au total
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  Marge reelle
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.realisticRemainingCapacityEquivalentBlocks)}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {summary.gapEquivalentBlocks >= 0 ? '+' : ''}
                  {blockLabel(summary.gapEquivalentBlocks)} d&apos;avance
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  Matiere la plus tendue
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-strong)]">
                  {summary.mostTenseSubject?.name ?? 'Aucune'}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {summary.mostTenseSubject
                    ? `${formatBlockCount(summary.mostTenseSubject.requiredEquivalentBlocksPerDay)} bloc par jour`
                    : 'Rien a signaler'}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  Taches bac
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
                  {activeTodos.length}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {activeTodos.length > 0 ? 'Encore a faire' : 'Tout est vide'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              En bref
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--text-muted)]">Statut</span>
                <span className={`text-lg font-semibold ${statusCopy.tone}`}>{statusCopy.label}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--text-muted)]">Rythme a tenir</span>
                <span className="text-lg font-semibold text-[var(--text-strong)]">
                  {formatBlockCount(summary.requiredEquivalentBlocksPerDay)} bloc par jour
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--text-muted)]">Capacite ideale</span>
                <span className="text-lg font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.idealRemainingCapacityEquivalentBlocks)}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Si tu rates aujourd&apos;hui
            </p>
            <div className="mt-4 space-y-3">
              <p className="text-3xl font-semibold text-[var(--text-strong)]">
                -{blockLabel(summary.todayCapacityEquivalentBlocks * REALISTIC_CAPACITY_FACTOR)}
              </p>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Tu perds environ {formatHourCount(minutesToHours(summary.todayCapacityMinutes * REALISTIC_CAPACITY_FACTOR))} h de marge utile.
              </p>
              <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
                Nouveau solde: {skipTodayGapBlocks >= 0 ? '+' : ''}
                {blockLabel(skipTodayGapBlocks)}
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Cout d&apos;un trou
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--text-muted)]">Perdre une journee</span>
                <span className="text-sm font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.impactOfLosingDayEquivalentBlocks)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--text-muted)]">Perdre le prochain creneau</span>
                <span className="text-sm font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.impactOfLosingSlotEquivalentBlocks)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--text-muted)]">Sauter un bloc</span>
                <span className="text-sm font-semibold text-[var(--text-strong)]">
                  {blockLabel(summary.impactOfSkippingOneBlockEquivalentBlocks)}
                </span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
