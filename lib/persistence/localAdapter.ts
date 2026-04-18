import type {
  AppState,
  CalendarEvent,
  ExamWeekSettings,
  FreeSlot,
  PersonalReminder,
  Period,
  QuickNote,
  SchoolItem,
  Subject,
  SubjectTodo,
  WorkBlock,
} from '@/lib/types'
import type { PersistenceAdapter } from './adapter'
import { createSeedState } from '@/lib/seed'

const STORAGE_KEY = 'planning-bac-v1'
export const LOCAL_STORAGE_KEY = STORAGE_KEY

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function migrateSubjects(rawSubjects: unknown, fallback: Subject[]): Subject[] {
  if (!Array.isArray(rawSubjects)) return fallback

  const rawById = new Map<Subject['id'], Record<string, unknown>>()
  rawSubjects.forEach((raw, index) => {
    const base = fallback[index] ?? fallback[0]
    const record = raw as Record<string, unknown>
    const id = ((record.id as Subject['id']) ?? base.id) as Subject['id']
    rawById.set(id, record)
  })

  return fallback.map((base) => {
    const record = rawById.get(base.id) ?? {}
    const legacyHours = toNumber(
      record.estimatedHoursRemaining,
      base.estimatedMinutesRemaining / 60
    )

    return {
      id: base.id,
      name: toString(record.name, base.name),
      color: toString(record.color, base.color),
      estimatedMinutesRemaining:
        typeof record.estimatedMinutesRemaining === 'number'
          ? record.estimatedMinutesRemaining
          : legacyHours * 60,
      estimatedUpdatedAt: toString(record.estimatedUpdatedAt, base.estimatedUpdatedAt),
    }
  })
}

function migratePeriods(rawPeriods: unknown): Period[] {
  if (!Array.isArray(rawPeriods)) return []

  return rawPeriods.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      name: toString(record.name, 'Periode'),
      startDate: toString(record.startDate, ''),
      endDate: toString(record.endDate, ''),
      color: toString(record.color, '#3b82f6'),
      description: record.description as string | undefined,
      objective: record.objective as string | undefined,
      exitCondition: record.exitCondition as string | undefined,
      plan: record.plan as string | undefined,
      notes: record.notes as string | undefined,
    }
  }).filter((period) => period.startDate && period.endDate)
}

function migrateNotes(rawNotes: unknown): QuickNote[] {
  if (!Array.isArray(rawNotes)) return []

  return rawNotes.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      content: toString(record.content, ''),
      createdAt: toString(record.createdAt, new Date().toISOString()),
      linkedSubjectId: record.linkedSubjectId as QuickNote['linkedSubjectId'],
      status: (record.status as QuickNote['status']) ?? 'brute',
      routeTarget: record.routeTarget as QuickNote['routeTarget'],
      convertedEntityId: record.convertedEntityId as string | undefined,
      convertedEntityType: record.convertedEntityType as QuickNote['convertedEntityType'],
      schoolCategory: record.schoolCategory as QuickNote['schoolCategory'],
      includeInBacStats:
        typeof record.includeInBacStats === 'boolean' ? record.includeInBacStats : false,
    }
  })
}

function migrateTodos(rawTodos: unknown): SubjectTodo[] {
  if (!Array.isArray(rawTodos)) return []

  return rawTodos.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      subjectId: record.subjectId as SubjectTodo['subjectId'],
      title: toString(record.title, 'Tache'),
      estimatedMinutes: toNumber(record.estimatedMinutes, 120),
      priority: (record.priority as SubjectTodo['priority']) ?? 'medium',
      status: (record.status as SubjectTodo['status']) ?? 'todo',
      dueDate: record.dueDate as string | undefined,
      createdAt: toString(record.createdAt, new Date().toISOString()),
      originNoteId: record.originNoteId as string | undefined,
    }
  })
}

function migrateEvents(rawEvents: unknown): CalendarEvent[] {
  if (!Array.isArray(rawEvents)) return []

  return rawEvents.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      title: toString(record.title, 'Evenement'),
      startTime: toString(record.startTime, new Date().toISOString()),
      endTime: toString(record.endTime, new Date().toISOString()),
      type: (record.type as CalendarEvent['type']) ?? 'school',
      color: record.color as string | undefined,
    }
  })
}

function migrateSchoolItems(rawSchoolItems: unknown): SchoolItem[] {
  if (!Array.isArray(rawSchoolItems)) return []

  return rawSchoolItems.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      title: toString(record.title, 'Item scolaire'),
      category: (record.category as SchoolItem['category']) ?? 'autre',
      estimatedMinutes: toNumber(record.estimatedMinutes, 60),
      createdAt: toString(record.createdAt, new Date().toISOString()),
      notes: record.notes as string | undefined,
      includeInBacStats:
        typeof record.includeInBacStats === 'boolean' ? record.includeInBacStats : false,
      status: (record.status as SchoolItem['status']) ?? 'active',
      routeKind: (record.routeKind as SchoolItem['routeKind']) ?? 'todo',
      linkedNoteId: record.linkedNoteId as string | undefined,
      eventId: record.eventId as string | undefined,
    }
  })
}

function migrateFreeSlots(rawFreeSlots: unknown): FreeSlot[] {
  if (!Array.isArray(rawFreeSlots)) return []

  return rawFreeSlots.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      startTime: toString(record.startTime, ''),
      endTime: toString(record.endTime, ''),
      label: record.label as string | undefined,
    }
  }).filter((slot) => slot.startTime && slot.endTime)
}

function migrateWorkBlocks(rawWorkBlocks: unknown): WorkBlock[] {
  if (!Array.isArray(rawWorkBlocks)) return []

  return rawWorkBlocks.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      subjectId: record.subjectId as WorkBlock['subjectId'],
      freeSlotId: toString(record.freeSlotId, ''),
      startTime: toString(record.startTime, ''),
      endTime: toString(record.endTime, ''),
      status: (record.status as WorkBlock['status']) ?? 'planned',
      notes: record.notes as string | undefined,
    }
  }).filter((block) => block.freeSlotId && block.startTime && block.endTime)
}

function migrateReminders(rawReminders: unknown): PersonalReminder[] {
  if (!Array.isArray(rawReminders)) return []

  return rawReminders.map((raw) => {
    const record = raw as Record<string, unknown>
    return {
      id: toString(record.id, `${Date.now()}`),
      title: toString(record.title, 'Rappel'),
      dueDate: toString(record.dueDate, ''),
      done: typeof record.done === 'boolean' ? record.done : false,
      createdAt: toString(record.createdAt, new Date().toISOString()),
    }
  }).filter((reminder) => reminder.dueDate)
}

function migrateExamWeek(rawExamWeek: unknown, fallback: ExamWeekSettings): ExamWeekSettings {
  if (!rawExamWeek || typeof rawExamWeek !== 'object') return fallback

  const record = rawExamWeek as Record<string, unknown>
  const entries = Array.isArray(record.entries)
    ? record.entries.map((raw) => {
        const entry = raw as Record<string, unknown>
        return {
          subjectId: entry.subjectId as ExamWeekSettings['entries'][number]['subjectId'],
          examDate: toString(entry.examDate, ''),
          examTime: toString(entry.examTime, ''),
          durationMinutes: toNumber(entry.durationMinutes, 0),
        }
      }).filter((entry) => entry.examDate && entry.examTime && entry.durationMinutes > 0)
    : fallback.entries

  return {
    entries,
    notes: typeof record.notes === 'string' ? record.notes : fallback.notes,
  }
}

export function parseStoredState(rawState: unknown): AppState | null {
  if (!rawState || typeof rawState !== 'object') return null

  const seed = createSeedState()
  const record = rawState as Record<string, unknown>
  const settings = (record.settings ?? {}) as Record<string, unknown>

  return {
    settings: {
      ...seed.settings,
      bacDate: toString(settings.bacDate, seed.settings.bacDate),
      studentName: settings.studentName as string | undefined,
      weekStartsOn:
        settings.weekStartsOn === 0 || settings.weekStartsOn === 1
          ? settings.weekStartsOn
          : seed.settings.weekStartsOn,
      workdayStartHour: toNumber(settings.workdayStartHour, seed.settings.workdayStartHour),
      workdayEndHour: toNumber(settings.workdayEndHour, seed.settings.workdayEndHour),
      smallBlockMaxMinutes: toNumber(
        settings.smallBlockMaxMinutes,
        seed.settings.smallBlockMaxMinutes
      ),
      intermediateBlockMaxMinutes: toNumber(
        settings.intermediateBlockMaxMinutes,
        seed.settings.intermediateBlockMaxMinutes
      ),
      equivalentIntermediateBlockMinutes: toNumber(
        settings.equivalentIntermediateBlockMinutes,
        seed.settings.equivalentIntermediateBlockMinutes
      ),
    },
    subjects: migrateSubjects(record.subjects, seed.subjects),
    periods: migratePeriods(record.periods),
    freeSlots: migrateFreeSlots(record.freeSlots),
    workBlocks: migrateWorkBlocks(record.workBlocks),
    events: migrateEvents(record.events),
    todos: migrateTodos(record.todos),
    notes: migrateNotes(record.notes),
    schoolItems: migrateSchoolItems(record.schoolItems),
    reminders: migrateReminders(record.reminders),
    examWeek: migrateExamWeek(record.examWeek, seed.examWeek),
  }
}

export const localAdapter: PersistenceAdapter = {
  load(): AppState | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return parseStoredState(JSON.parse(raw))
    } catch {
      console.warn('[planning-bac] Failed to load from localStorage')
      return null
    }
  },

  save(state: AppState): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      console.warn('[planning-bac] Failed to save to localStorage')
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  },
}
