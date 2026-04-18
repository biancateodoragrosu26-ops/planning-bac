'use client'

import { useMemo, useState } from 'react'
import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { navigateDate } from '@/lib/utils/dateUtils'
import { CountdownBadge } from '@/components/layout/CountdownBadge'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import type { CalendarView } from '@/lib/types'

type CopyMode = 'day' | 'week' | null

export function CalendarHeader() {
  const view = useCalendarStore((state) => state.view)
  const anchorDate = useCalendarStore((state) => state.anchorDate)
  const setView = useCalendarStore((state) => state.setView)
  const setAnchorDate = useCalendarStore((state) => state.setAnchorDate)
  const goToToday = useCalendarStore((state) => state.goToToday)
  const openPanel = useCalendarStore((state) => state.openPanel)
  const weekStartsOn = useAppStore((state) => state.settings.weekStartsOn)
  const copyDayFreeSlots = useAppStore((state) => state.copyDayFreeSlots)
  const copyWeekFreeSlots = useAppStore((state) => state.copyWeekFreeSlots)

  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const [copyMode, setCopyMode] = useState<CopyMode>(null)
  const [targetDate, setTargetDate] = useState(() => anchorDate)

  const title = useMemo(() => {
    const date = parseISO(anchorDate)
    if (view === 'month') return format(date, 'MMMM yyyy', { locale: fr })
    if (view === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn })
      const weekEnd = endOfWeek(date, { weekStartsOn })
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'd', { locale: fr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`
      }
      return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
    }
    return format(date, 'EEEE d MMMM yyyy', { locale: fr })
  }, [anchorDate, view, weekStartsOn])

  const views: { id: CalendarView; label: string }[] = [
    { id: 'month', label: 'Mois' },
    { id: 'week', label: 'Semaine' },
    { id: 'day', label: 'Jour' },
  ]

  function navigate(direction: 'prev' | 'next') {
    setAnchorDate(navigateDate(anchorDate, direction, view))
  }

  function handleCreateSlot() {
    setShowCreateMenu(false)
    openPanel({ type: 'createFreeSlot' })
  }

  function handleCreateEvent() {
    setShowCreateMenu(false)
    openPanel({ type: 'createEvent' })
  }

  function openCopySheet(mode: Exclude<CopyMode, null>) {
    const currentDate = parseISO(anchorDate)
    if (mode === 'week') {
      const currentWeekStart = startOfWeek(currentDate, { weekStartsOn })
      setTargetDate(format(addDays(currentWeekStart, 7), 'yyyy-MM-dd'))
    } else {
      setTargetDate(format(addDays(currentDate, 1), 'yyyy-MM-dd'))
    }
    setShowCopyMenu(false)
    setCopyMode(mode)
  }

  function confirmCopy() {
    if (!targetDate || !copyMode) return

    if (copyMode === 'day') {
      copyDayFreeSlots(anchorDate, targetDate)
    } else {
      const sourceWeekStart = format(startOfWeek(parseISO(anchorDate), { weekStartsOn }), 'yyyy-MM-dd')
      const targetWeekStart = format(startOfWeek(parseISO(targetDate), { weekStartsOn }), 'yyyy-MM-dd')
      copyWeekFreeSlots(sourceWeekStart, targetWeekStart)
    }

    setCopyMode(null)
  }

  return (
    <>
      <div className="relative flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('prev')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
            aria-label="Precedent"
          >
            ‹
          </button>
          <button
            onClick={goToToday}
            className="h-9 rounded-lg px-3 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => navigate('next')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
            aria-label="Suivant"
          >
            ›
          </button>
        </div>

        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">{title}</h2>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-[var(--surface-2)] p-0.5">
            {views.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={[
                  'min-h-[32px] rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  view === id
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {(view === 'day' || view === 'week') && (
            <div className="relative">
              <button
                onClick={() => setShowCopyMenu((current) => !current)}
                className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Copier
              </button>

              {showCopyMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCopyMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                    <button
                      onClick={() => openCopySheet('day')}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
                    >
                      Copier le jour
                    </button>
                    {view === 'week' && (
                      <button
                        onClick={() => openCopySheet('week')}
                        className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
                      >
                        Copier la semaine
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="hidden sm:block">
            <CountdownBadge />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCreateMenu((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-lg font-medium text-white shadow-md transition-colors hover:bg-blue-600 active:bg-blue-700"
              aria-label="Ajouter"
            >
              +
            </button>

            {showCreateMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                  <button
                    onClick={handleCreateSlot}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Creneau libre
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Evenement fixe
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Sheet
        open={copyMode !== null}
        onClose={() => setCopyMode(null)}
        title={copyMode === 'week' ? 'Copier la semaine' : 'Copier le jour'}
      >
        <div className="space-y-4 p-5">
          <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
            {copyMode === 'week'
              ? 'Les creneaux libres seront recopies sur la semaine choisie, jour par jour.'
              : 'Les creneaux libres du jour affiche seront recopies sur la date choisie.'}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {copyMode === 'week' ? 'Semaine cible' : 'Date cible'}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={confirmCopy}>
              Lancer la copie
            </Button>
            <Button variant="ghost" onClick={() => setCopyMode(null)}>
              Annuler
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  )
}
