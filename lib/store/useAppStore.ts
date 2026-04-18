'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  AppSettings,
  AppState,
  CalendarEvent,
  ExamWeekSettings,
  FreeSlot,
  Period,
  PersonalReminder,
  QuickNote,
  SchoolItem,
  Subject,
  SubjectId,
  SubjectTodo,
  WorkBlock,
} from '@/lib/types'
import { localAdapter } from '@/lib/persistence/localAdapter'
import { createSeedState } from '@/lib/seed'
import { generateId } from '@/lib/utils/idUtils'
import { shiftISOToDate, toDateString } from '@/lib/utils/dateUtils'

interface AppActions {
  hydrate: () => void
  reset: () => void
  replaceState: (nextState: AppState) => void

  updateSettings: (patch: Partial<AppSettings>) => void

  updateSubject: (id: SubjectId, patch: Partial<Subject>) => void

  addPeriod: (period: Period) => void
  updatePeriod: (id: string, patch: Partial<Period>) => void
  deletePeriod: (id: string) => void

  addFreeSlot: (slot: FreeSlot) => void
  updateFreeSlot: (id: string, patch: Partial<FreeSlot>) => void
  deleteFreeSlot: (id: string) => void
  copyFreeSlotToDate: (id: string, targetDate: string) => void
  moveFreeSlotToDate: (id: string, targetDate: string) => void
  copyDayFreeSlots: (sourceDate: string, targetDate: string) => void
  copyWeekFreeSlots: (sourceWeekStart: string, targetWeekStart: string) => void

  addWorkBlock: (block: WorkBlock) => void
  updateWorkBlock: (id: string, patch: Partial<WorkBlock>) => void
  deleteWorkBlock: (id: string) => void

  addEvent: (event: CalendarEvent) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  addTodo: (todo: SubjectTodo) => void
  updateTodo: (id: string, patch: Partial<SubjectTodo>) => void
  deleteTodo: (id: string) => void

  addNote: (note: QuickNote) => void
  updateNote: (id: string, patch: Partial<QuickNote>) => void
  deleteNote: (id: string) => void

  addSchoolItem: (item: SchoolItem) => void
  updateSchoolItem: (id: string, patch: Partial<SchoolItem>) => void
  deleteSchoolItem: (id: string) => void

  addReminder: (reminder: PersonalReminder) => void
  updateReminder: (id: string, patch: Partial<PersonalReminder>) => void
  deleteReminder: (id: string) => void

  updateExamWeek: (patch: Partial<ExamWeekSettings>) => void
}

type Store = AppState & AppActions & { _hydrated: boolean }

function saveState(state: Store) {
  localAdapter.save({
    subjects: state.subjects,
    periods: state.periods,
    freeSlots: state.freeSlots,
    workBlocks: state.workBlocks,
    events: state.events,
    todos: state.todos,
    notes: state.notes,
    schoolItems: state.schoolItems,
    reminders: state.reminders,
    examWeek: state.examWeek,
    settings: state.settings,
  })
}

function withSave(get: () => Store, mutate: () => void) {
  mutate()
  saveState(get())
}

export const useAppStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    ...createSeedState(),
    _hydrated: false,

    hydrate() {
      const saved = localAdapter.load()
      if (saved) {
        set({ ...saved, _hydrated: true })
      } else {
        const seed = createSeedState()
        localAdapter.save(seed)
        set({ ...seed, _hydrated: true })
      }
    },

    reset() {
      const seed = createSeedState()
      localAdapter.save(seed)
      set({ ...seed, _hydrated: true })
    },

    replaceState(nextState) {
      localAdapter.save(nextState)
      set({ ...nextState, _hydrated: true })
    },

    updateSettings(patch) {
      withSave(get, () => set((state) => ({ settings: { ...state.settings, ...patch } })))
    },

    updateSubject(id, patch) {
      withSave(get, () =>
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id ? { ...subject, ...patch } : subject
          ),
        }))
      )
    },

    addPeriod(period) {
      withSave(get, () => set((state) => ({ periods: [...state.periods, period] })))
    },
    updatePeriod(id, patch) {
      withSave(get, () =>
        set((state) => ({
          periods: state.periods.map((period) =>
            period.id === id ? { ...period, ...patch } : period
          ),
        }))
      )
    },
    deletePeriod(id) {
      withSave(get, () =>
        set((state) => ({ periods: state.periods.filter((period) => period.id !== id) }))
      )
    },

    addFreeSlot(slot) {
      withSave(get, () => set((state) => ({ freeSlots: [...state.freeSlots, slot] })))
    },
    updateFreeSlot(id, patch) {
      withSave(get, () =>
        set((state) => ({
          freeSlots: state.freeSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
        }))
      )
    },
    deleteFreeSlot(id) {
      withSave(get, () =>
        set((state) => ({
          freeSlots: state.freeSlots.filter((slot) => slot.id !== id),
          workBlocks: state.workBlocks.filter((block) => block.freeSlotId !== id),
        }))
      )
    },
    copyFreeSlotToDate(id, targetDate) {
      withSave(get, () =>
        set((state) => {
          const slot = state.freeSlots.find((entry) => entry.id === id)
          if (!slot) return state

          const target = parseISO(targetDate)
          return {
            freeSlots: [
              ...state.freeSlots,
              {
                ...slot,
                id: generateId(),
                startTime: shiftISOToDate(slot.startTime, target),
                endTime: shiftISOToDate(slot.endTime, target),
              },
            ],
          }
        })
      )
    },
    moveFreeSlotToDate(id, targetDate) {
      withSave(get, () =>
        set((state) => {
          const slot = state.freeSlots.find((entry) => entry.id === id)
          if (!slot) return state

          const target = parseISO(targetDate)
          return {
            freeSlots: state.freeSlots.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    startTime: shiftISOToDate(entry.startTime, target),
                    endTime: shiftISOToDate(entry.endTime, target),
                  }
                : entry
            ),
            workBlocks: state.workBlocks.map((block) =>
              block.freeSlotId === id
                ? {
                    ...block,
                    startTime: shiftISOToDate(block.startTime, target),
                    endTime: shiftISOToDate(block.endTime, target),
                  }
                : block
            ),
          }
        })
      )
    },
    copyDayFreeSlots(sourceDate, targetDate) {
      withSave(get, () =>
        set((state) => {
          const target = parseISO(targetDate)
          const clones = state.freeSlots
            .filter((slot) => toDateString(parseISO(slot.startTime)) === sourceDate)
            .map((slot) => ({
              ...slot,
              id: generateId(),
              startTime: shiftISOToDate(slot.startTime, target),
              endTime: shiftISOToDate(slot.endTime, target),
            }))

          if (clones.length === 0) return state
          return { freeSlots: [...state.freeSlots, ...clones] }
        })
      )
    },
    copyWeekFreeSlots(sourceWeekStart, targetWeekStart) {
      withSave(get, () =>
        set((state) => {
          const sourceStart = parseISO(sourceWeekStart)
          const targetStart = parseISO(targetWeekStart)
          const clones = state.freeSlots
            .filter((slot) => {
              const slotDay = parseISO(slot.startTime)
              const offset = differenceInCalendarDays(slotDay, sourceStart)
              return offset >= 0 && offset <= 6
            })
            .map((slot) => {
              const slotDay = parseISO(slot.startTime)
              const offset = differenceInCalendarDays(slotDay, sourceStart)
              const targetDay = addDays(targetStart, offset)
              return {
                ...slot,
                id: generateId(),
                startTime: shiftISOToDate(slot.startTime, targetDay),
                endTime: shiftISOToDate(slot.endTime, targetDay),
              }
            })

          if (clones.length === 0) return state
          return { freeSlots: [...state.freeSlots, ...clones] }
        })
      )
    },

    addWorkBlock(block) {
      withSave(get, () => set((state) => ({ workBlocks: [...state.workBlocks, block] })))
    },
    updateWorkBlock(id, patch) {
      withSave(get, () =>
        set((state) => ({
          workBlocks: state.workBlocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
        }))
      )
    },
    deleteWorkBlock(id) {
      withSave(get, () =>
        set((state) => ({ workBlocks: state.workBlocks.filter((block) => block.id !== id) }))
      )
    },

    addEvent(event) {
      withSave(get, () => set((state) => ({ events: [...state.events, event] })))
    },
    updateEvent(id, patch) {
      withSave(get, () =>
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, ...patch } : event)),
        }))
      )
    },
    deleteEvent(id) {
      withSave(get, () =>
        set((state) => ({ events: state.events.filter((event) => event.id !== id) }))
      )
    },

    addTodo(todo) {
      withSave(get, () => set((state) => ({ todos: [...state.todos, todo] })))
    },
    updateTodo(id, patch) {
      withSave(get, () =>
        set((state) => ({
          todos: state.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
        }))
      )
    },
    deleteTodo(id) {
      withSave(get, () => set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) })))
    },

    addNote(note) {
      withSave(get, () => set((state) => ({ notes: [note, ...state.notes] })))
    },
    updateNote(id, patch) {
      withSave(get, () =>
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, ...patch } : note)),
        }))
      )
    },
    deleteNote(id) {
      withSave(get, () => set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })))
    },

    addSchoolItem(item) {
      withSave(get, () => set((state) => ({ schoolItems: [item, ...state.schoolItems] })))
    },
    updateSchoolItem(id, patch) {
      withSave(get, () =>
        set((state) => ({
          schoolItems: state.schoolItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }))
      )
    },
    deleteSchoolItem(id) {
      withSave(get, () =>
        set((state) => ({ schoolItems: state.schoolItems.filter((item) => item.id !== id) }))
      )
    },

    addReminder(reminder) {
      withSave(get, () => set((state) => ({ reminders: [...state.reminders, reminder] })))
    },
    updateReminder(id, patch) {
      withSave(get, () =>
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...patch } : reminder
          ),
        }))
      )
    },
    deleteReminder(id) {
      withSave(get, () =>
        set((state) => ({ reminders: state.reminders.filter((reminder) => reminder.id !== id) }))
      )
    },

    updateExamWeek(patch) {
      withSave(get, () => set((state) => ({ examWeek: { ...state.examWeek, ...patch } })))
    },
  }))
)
