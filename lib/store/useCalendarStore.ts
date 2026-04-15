'use client'

import { create } from 'zustand'
import { format } from 'date-fns'
import type { CalendarView, PanelTarget } from '@/lib/types'

interface CalendarStore {
  view: CalendarView
  anchorDate: string // 'YYYY-MM-DD'
  panel: PanelTarget

  setView: (view: CalendarView) => void
  setAnchorDate: (date: string) => void
  goToToday: () => void
  openPanel: (target: PanelTarget) => void
  closePanel: () => void
}

export const useCalendarStore = create<CalendarStore>()((set) => ({
  view: 'week',
  anchorDate: format(new Date(), 'yyyy-MM-dd'),
  panel: null,

  setView: (view) => set({ view }),
  setAnchorDate: (date) => set({ anchorDate: date }),
  goToToday: () => set({ anchorDate: format(new Date(), 'yyyy-MM-dd') }),
  openPanel: (target) => set({ panel: target }),
  closePanel: () => set({ panel: null }),
}))
