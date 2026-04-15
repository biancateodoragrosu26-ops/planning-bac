// Subjects

export type SubjectId =
  | 'maths'
  | 'physique-chimie'
  | 'philosophie'
  | 'grand-oral'

export interface Subject {
  id: SubjectId
  name: string
  color: string
  estimatedMinutesRemaining: number
  estimatedUpdatedAt: string
}

// Periods

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  color: string
  description?: string
}

// Free slots

export interface FreeSlot {
  id: string
  startTime: string
  endTime: string
  label?: string
}

// Work blocks

export type WorkBlockStatus = 'planned' | 'done' | 'skipped'

export interface WorkBlock {
  id: string
  subjectId: SubjectId
  freeSlotId: string
  startTime: string
  endTime: string
  status: WorkBlockStatus
  notes?: string
}

// Calendar events

export type CalendarEventType =
  | 'exam'
  | 'school'
  | 'personal'
  | 'holiday'
  | 'constraint'

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  type: CalendarEventType
  color?: string
}

// Subject todos

export type TodoPriority = 'high' | 'medium' | 'low'
export type TodoStatus = 'todo' | 'done'

export interface SubjectTodo {
  id: string
  subjectId: SubjectId
  title: string
  estimatedMinutes: number
  priority: TodoPriority
  status: TodoStatus
  dueDate?: string
  createdAt: string
  originNoteId?: string
}

// Inbox notes

export type NoteWorkflowStatus = 'brute' | 'triee' | 'convertie' | 'archivee'
export type NoteRouteTarget =
  | 'calendar-event'
  | 'work-block'
  | 'subject-todo'
  | 'fixed-constraint'
  | 'free-note'
  | 'school-item'

export interface QuickNote {
  id: string
  content: string
  createdAt: string
  linkedSubjectId?: SubjectId
  status: NoteWorkflowStatus
  routeTarget?: NoteRouteTarget
  convertedEntityId?: string
  convertedEntityType?: 'event' | 'workBlock' | 'todo' | 'schoolItem'
  schoolCategory?: SchoolCategory
  includeInBacStats?: boolean
}

// School layer

export type SchoolCategory =
  | 'anglais'
  | 'espagnol'
  | 'devoirs'
  | 'controles'
  | 'contraintes-scolaires'
  | 'administratif'
  | 'autre'

export type SchoolItemRouteKind = 'todo' | 'event' | 'constraint'
export type SchoolItemStatus = 'active' | 'planned' | 'done' | 'archived'

export interface SchoolItem {
  id: string
  title: string
  category: SchoolCategory
  estimatedMinutes: number
  createdAt: string
  notes?: string
  includeInBacStats: boolean
  status: SchoolItemStatus
  routeKind: SchoolItemRouteKind
  linkedNoteId?: string
  eventId?: string
}

// Personal reminders

export interface PersonalReminder {
  id: string
  title: string
  dueDate: string
  done: boolean
  createdAt: string
}

// Exam week

export interface ExamEntry {
  subjectId: SubjectId
  examDate: string
  examTime: string
  durationMinutes: number
}

export interface ExamWeekSettings {
  entries: ExamEntry[]
  notes: string
}

// App settings

export interface AppSettings {
  bacDate: string
  studentName?: string
  weekStartsOn: 0 | 1
  workdayStartHour: number
  workdayEndHour: number
  smallBlockMaxMinutes: number
  intermediateBlockMaxMinutes: number
  equivalentIntermediateBlockMinutes: number
}

// Root state

export interface AppState {
  subjects: Subject[]
  periods: Period[]
  freeSlots: FreeSlot[]
  workBlocks: WorkBlock[]
  events: CalendarEvent[]
  todos: SubjectTodo[]
  notes: QuickNote[]
  schoolItems: SchoolItem[]
  reminders: PersonalReminder[]
  examWeek: ExamWeekSettings
  settings: AppSettings
}

// Calendar UI types

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarUIState {
  view: CalendarView
  anchorDate: string
}

// Detail panel

export type PanelTarget =
  | { type: 'freeSlot'; id: string }
  | { type: 'workBlock'; id: string }
  | { type: 'event'; id: string }
  | { type: 'createFreeSlot'; startTime?: string; endTime?: string }
  | { type: 'createWorkBlock'; freeSlotId: string; startTime: string; endTime: string }
  | { type: 'createEvent'; startTime?: string; endTime?: string }
  | null
