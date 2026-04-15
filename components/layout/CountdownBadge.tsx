'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { daysUntil } from '@/lib/utils/dateUtils'

export function CountdownBadge() {
  const bacDate = useAppStore((state) => state.settings.bacDate)
  const days = useMemo(() => daysUntil(bacDate), [bacDate])

  const tone =
    days <= 7
      ? 'bg-[var(--critical-soft)] text-[var(--critical-strong)] border-[var(--critical-soft)]'
      : days <= 30
      ? 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber-strong)] border-[var(--accent-amber-soft)]'
      : 'bg-[var(--accent-sage-soft)] text-[var(--accent-sage-strong)] border-[var(--accent-sage-soft)]'

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${tone}`}>
      <span>{days > 0 ? `J-${days}` : days === 0 ? "Aujourd'hui" : 'Passe'}</span>
      <span className="opacity-70">avant bac</span>
    </div>
  )
}
