'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ProgramChapter, PhiloNotion, ProgramState } from '@/lib/types'
import { generateId } from '@/lib/utils/idUtils'

const STORAGE_KEY = 'planning-bac-programme-v1'

function loadState(): ProgramState {
  if (typeof window === 'undefined') return { chapters: [], philoNotions: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { chapters: [], philoNotions: [] }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      chapters: Array.isArray(parsed.chapters)
        ? (parsed.chapters as ProgramChapter[])
        : [],
      philoNotions: Array.isArray(parsed.philoNotions)
        ? (parsed.philoNotions as PhiloNotion[])
        : [],
    }
  } catch {
    return { chapters: [], philoNotions: [] }
  }
}

function persist(state: ProgramState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chapters: state.chapters, philoNotions: state.philoNotions })
    )
  } catch {
    /* ignore */
  }
}

interface ProgramActions {
  hydrate: () => void

  addChapter: (ch: Omit<ProgramChapter, 'id'>) => void
  updateChapter: (id: string, patch: Partial<ProgramChapter>) => void
  deleteChapter: (id: string) => void

  addPhiloNotion: (n: Omit<PhiloNotion, 'id'>) => void
  updatePhiloNotion: (id: string, patch: Partial<PhiloNotion>) => void
  deletePhiloNotion: (id: string) => void
}

type ProgramStore = ProgramState & ProgramActions & { _hydrated: boolean }

export const useProgramStore = create<ProgramStore>()(
  subscribeWithSelector((set, get) => ({
    chapters: [],
    philoNotions: [],
    _hydrated: false,

    hydrate() {
      const saved = loadState()
      set({ ...saved, _hydrated: true })
    },

    addChapter(ch) {
      const chapter: ProgramChapter = { ...ch, id: generateId() }
      set((s) => ({ chapters: [...s.chapters, chapter] }))
      persist(get())
    },
    updateChapter(id, patch) {
      set((s) => ({
        chapters: s.chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }))
      persist(get())
    },
    deleteChapter(id) {
      set((s) => ({ chapters: s.chapters.filter((c) => c.id !== id) }))
      persist(get())
    },

    addPhiloNotion(n) {
      const notion: PhiloNotion = { ...n, id: generateId() }
      set((s) => ({ philoNotions: [...s.philoNotions, notion] }))
      persist(get())
    },
    updatePhiloNotion(id, patch) {
      set((s) => ({
        philoNotions: s.philoNotions.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }))
      persist(get())
    },
    deletePhiloNotion(id) {
      set((s) => ({ philoNotions: s.philoNotions.filter((n) => n.id !== id) }))
      persist(get())
    },
  }))
)
