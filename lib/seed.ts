import type { AppState } from '@/lib/types'

export const BAC_DATE = '2026-06-15'

export function createSeedState(): AppState {
  const now = new Date().toISOString()

  return {
    settings: {
      bacDate: BAC_DATE,
      studentName: undefined,
      weekStartsOn: 1,
      workdayStartHour: 8,
      workdayEndHour: 22,
      smallBlockMaxMinutes: 60,
      intermediateBlockMaxMinutes: 180,
      equivalentIntermediateBlockMinutes: 120,
    },

    subjects: [
      {
        id: 'maths',
        name: 'Mathematiques',
        color: '#9a6b57',
        estimatedMinutesRemaining: 40 * 60,
        estimatedUpdatedAt: now,
      },
      {
        id: 'physique-chimie',
        name: 'Physique-Chimie',
        color: '#7b9377',
        estimatedMinutesRemaining: 35 * 60,
        estimatedUpdatedAt: now,
      },
      {
        id: 'philosophie',
        name: 'Philosophie',
        color: '#c58366',
        estimatedMinutesRemaining: 20 * 60,
        estimatedUpdatedAt: now,
      },
      {
        id: 'grand-oral',
        name: 'Grand oral',
        color: '#d2a85a',
        estimatedMinutesRemaining: 15 * 60,
        estimatedUpdatedAt: now,
      },
    ],

    periods: [],
    freeSlots: [],
    workBlocks: [],
    events: [],
    todos: [],
    notes: [],
    schoolItems: [],
    reminders: [],

    examWeek: {
      entries: [],
      notes: '',
    },
  }
}
