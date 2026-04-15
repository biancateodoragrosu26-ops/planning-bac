'use client'

import { useState, useMemo } from 'react'
import { parseISO, startOfWeek, endOfWeek, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { navigateDate } from '@/lib/utils/dateUtils'
import { CountdownBadge } from '@/components/layout/CountdownBadge'
import type { CalendarView } from '@/lib/types'

export function CalendarHeader() {
  const view         = useCalendarStore((s) => s.view)
  const anchorDate   = useCalendarStore((s) => s.anchorDate)
  const setView      = useCalendarStore((s) => s.setView)
  const setAnchorDate = useCalendarStore((s) => s.setAnchorDate)
  const goToToday    = useCalendarStore((s) => s.goToToday)
  const openPanel    = useCalendarStore((s) => s.openPanel)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)

  const [showCreateMenu, setShowCreateMenu] = useState(false)

  const title = useMemo(() => {
    const d = parseISO(anchorDate)
    if (view === 'month') return format(d, 'MMMM yyyy', { locale: fr })
    if (view === 'week') {
      const wStart = startOfWeek(d, { weekStartsOn })
      const wEnd   = endOfWeek(d,   { weekStartsOn })
      if (wStart.getMonth() === wEnd.getMonth()) {
        return format(wStart, 'd', { locale: fr }) + '–' + format(wEnd, 'd MMMM yyyy', { locale: fr })
      }
      return format(wStart, 'd MMM', { locale: fr }) + ' – ' + format(wEnd, 'd MMM yyyy', { locale: fr })
    }
    return format(d, 'EEEE d MMMM yyyy', { locale: fr })
  }, [anchorDate, view, weekStartsOn])

  function navigate(dir: 'prev' | 'next') {
    setAnchorDate(navigateDate(anchorDate, dir, view))
  }

  const VIEWS: { id: CalendarView; label: string }[] = [
    { id: 'month', label: 'Mois' },
    { id: 'week',  label: 'Semaine' },
    { id: 'day',   label: 'Jour' },
  ]

  function handleCreateSlot() {
    setShowCreateMenu(false)
    openPanel({ type: 'createFreeSlot' })
  }

  function handleCreateEvent() {
    setShowCreateMenu(false)
    openPanel({ type: 'createEvent' })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 relative flex-wrap">
      {/* Nav arrows + today */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('prev')}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)] text-lg"
          aria-label="Précédent"
        >
          ‹
        </button>
        <button
          onClick={goToToday}
          className="px-3 h-9 rounded-lg text-xs font-medium hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]"
        >
          Aujourd&apos;hui
        </button>
        <button
          onClick={() => navigate('next')}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)] text-lg"
          aria-label="Suivant"
        >
          ›
        </button>
      </div>

      {/* Title */}
      <h2 className="font-semibold text-sm capitalize flex-1 min-w-0 truncate">{title}</h2>

      {/* View switcher */}
      <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-0.5 gap-0.5">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={[
              'px-3 py-1 rounded-md text-xs font-medium transition-colors min-h-[32px]',
              view === id
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Countdown */}
      <div className="hidden sm:block">
        <CountdownBadge />
      </div>

      {/* FAB — add créneau or event */}
      <div className="relative">
        <button
          onClick={() => setShowCreateMenu((v) => !v)}
          className={[
            'w-9 h-9 flex items-center justify-center rounded-full text-lg font-medium transition-colors',
            'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
            'shadow-md',
          ].join(' ')}
          aria-label="Ajouter"
        >
          +
        </button>

        {/* Quick-create dropdown */}
        {showCreateMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowCreateMenu(false)}
            />
            <div
              className={[
                'absolute right-0 top-11 z-50 w-52',
                'bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1',
              ].join(' ')}
            >
              <button
                onClick={handleCreateSlot}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <span className="text-base">🟢</span>
                <div>
                  <p className="font-medium">Créneau libre</p>
                  <p className="text-xs text-[var(--text-muted)]">Temps disponible pour réviser</p>
                </div>
              </button>
              <button
                onClick={handleCreateEvent}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <span className="text-base">📌</span>
                <div>
                  <p className="font-medium">Événement fixe</p>
                  <p className="text-xs text-[var(--text-muted)]">Cours, examen, rendez-vous…</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
