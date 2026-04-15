'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { parseISO, isSameWeek } from 'date-fns'
import { formatDate } from '@/lib/utils/dateUtils'
import { availableMinutes, slotDurationMinutes } from '@/lib/utils/slotUtils'

export default function CreneauxLibresPage() {
  const freeSlots = useAppStore((s) => s.freeSlots)
  const workBlocks = useAppStore((s) => s.workBlocks)

  const now = useMemo(() => new Date(), [])

  const upcoming = useMemo(
    () =>
      freeSlots
        .filter((fs) => parseISO(fs.endTime) > now)
        .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()),
    [freeSlots, now]
  )

  const thisWeekSlots = upcoming.filter((fs) =>
    isSameWeek(parseISO(fs.startTime), now, { weekStartsOn: 1 })
  )

  const totalThisWeek = thisWeekSlots.reduce(
    (sum, fs) => sum + slotDurationMinutes(fs),
    0
  )
  const usedThisWeek = thisWeekSlots.reduce(
    (sum, fs) => sum + (slotDurationMinutes(fs) - availableMinutes(fs, workBlocks)),
    0
  )
  const fillRate = totalThisWeek > 0 ? (usedThisWeek / totalThisWeek) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Créneaux libres</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Blocs de temps disponibles pour réviser
        </p>
      </div>

      {/* This week summary */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
          Cette semaine
        </p>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {(totalThisWeek / 60).toFixed(1)}
              <span className="text-sm font-normal text-[var(--text-muted)] ml-1">h</span>
            </p>
            <p className="text-xs text-[var(--text-faint)]">disponibles</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {fillRate.toFixed(0)}
              <span className="text-sm font-normal text-[var(--text-muted)] ml-1">%</span>
            </p>
            <p className="text-xs text-[var(--text-faint)]">remplis</p>
          </div>
        </div>
        {totalThisWeek > 0 && (
          <div className="mt-3 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(100, fillRate)}%` }}
            />
          </div>
        )}
      </div>

      {/* Slot list */}
      {upcoming.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-faint)] py-8">
          Aucun créneau libre à venir.
          <br />
          Crée-en depuis le calendrier (vue semaine ou jour).
        </p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((slot) => {
            const avail = availableMinutes(slot, workBlocks)
            const total = slotDurationMinutes(slot)
            const pct = total > 0 ? ((total - avail) / total) * 100 : 0

            return (
              <div
                key={slot.id}
                className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">
                      {slot.label || 'Créneau libre'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDate(slot.startTime, 'EEE d MMM, HH:mm')} →{' '}
                      {formatDate(slot.endTime, 'HH:mm')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {(avail / 60).toFixed(1)}h libre
                    </p>
                    <p className="text-xs text-[var(--text-faint)]">
                      sur {(total / 60).toFixed(1)}h
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
