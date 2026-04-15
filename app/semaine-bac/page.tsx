'use client'

import { useAppStore } from '@/lib/store/useAppStore'
import { daysUntil, formatDate } from '@/lib/utils/dateUtils'

export default function SemaineBacPage() {
  const subjects = useAppStore((state) => state.subjects)
  const examWeek = useAppStore((state) => state.examWeek)
  const bacDate = useAppStore((state) => state.settings.bacDate)
  const days = daysUntil(bacDate)

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Semaine avant le bac</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Planning urgent et calendrier des epreuves</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tabular-nums">{Math.max(0, days)}</span>
          <span className="text-lg text-[var(--text-muted)]">jours</span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">avant le {formatDate(bacDate, 'd MMMM yyyy')}</p>
      </div>

      {examWeek.entries.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
          <p className="text-sm text-[var(--text-muted)]">Aucune epreuve configuree.</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">Ajout du calendrier des epreuves disponible en Phase 3.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {examWeek.entries.map((entry, index) => {
            const subject = subjects.find((item) => item.id === entry.subjectId)
            return (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                {subject && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />}
                <div>
                  <p className="text-sm font-medium">{subject?.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(entry.examDate, 'EEEE d MMMM')} a {entry.examTime} - {entry.durationMinutes} min
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
