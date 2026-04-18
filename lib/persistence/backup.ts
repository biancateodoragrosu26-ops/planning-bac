import type { AppState } from '@/lib/types'
import { parseStoredState } from './localAdapter'

export const BACKUP_PAYLOAD_VERSION = 1
export const SAFETY_BACKUP_STORAGE_KEY = 'planning-bac-import-safety-v1'

export interface BackupPayload {
  version: number
  exportedAt: string
  data: AppState
}

export interface BackupSummary {
  exportedAt: string
  counts: {
    subjects: number
    periods: number
    freeSlots: number
    workBlocks: number
    events: number
    todos: number
    notes: number
    schoolItems: number
    reminders: number
  }
}

export interface ParsedBackup {
  state: AppState
  summary: BackupSummary
}

function cloneAppState(state: AppState): AppState {
  return {
    subjects: state.subjects.map((subject) => ({ ...subject })),
    periods: state.periods.map((period) => ({ ...period })),
    freeSlots: state.freeSlots.map((slot) => ({ ...slot })),
    workBlocks: state.workBlocks.map((block) => ({ ...block })),
    events: state.events.map((event) => ({ ...event })),
    todos: state.todos.map((todo) => ({ ...todo })),
    notes: state.notes.map((note) => ({ ...note })),
    schoolItems: state.schoolItems.map((item) => ({ ...item })),
    reminders: state.reminders.map((reminder) => ({ ...reminder })),
    examWeek: {
      ...state.examWeek,
      entries: state.examWeek.entries.map((entry) => ({ ...entry })),
    },
    settings: { ...state.settings },
  }
}

export function buildBackupPayload(state: AppState): BackupPayload {
  return {
    version: BACKUP_PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    data: cloneAppState(state),
  }
}

export function summarizeState(state: AppState, exportedAt: string): BackupSummary {
  return {
    exportedAt,
    counts: {
      subjects: state.subjects.length,
      periods: state.periods.length,
      freeSlots: state.freeSlots.length,
      workBlocks: state.workBlocks.length,
      events: state.events.length,
      todos: state.todos.length,
      notes: state.notes.length,
      schoolItems: state.schoolItems.length,
      reminders: state.reminders.length,
    },
  }
}

export function backupFileName(exportedAt: string): string {
  const safeStamp = exportedAt.replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z')
  return `planning-bac-sauvegarde-${safeStamp}.json`
}

export function parseBackupFile(rawText: string): ParsedBackup {
  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(rawText)
  } catch {
    throw new Error('Ce fichier ne peut pas etre lu.')
  }

  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Ce fichier ne ressemble pas a une sauvegarde.')
  }

  const payload = rawPayload as Record<string, unknown>
  if (payload.version !== BACKUP_PAYLOAD_VERSION) {
    throw new Error('Cette sauvegarde n’est pas reconnue par l’application.')
  }

  if (typeof payload.exportedAt !== 'string' || Number.isNaN(Date.parse(payload.exportedAt))) {
    throw new Error('La date de la sauvegarde est invalide.')
  }

  const parsedState = parseStoredState(payload.data)
  if (!parsedState) {
    throw new Error('Le contenu de la sauvegarde est invalide.')
  }

  return {
    state: parsedState,
    summary: summarizeState(parsedState, payload.exportedAt),
  }
}

export function saveSafetyBackup(state: AppState): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(SAFETY_BACKUP_STORAGE_KEY, JSON.stringify(buildBackupPayload(state)))
    return true
  } catch {
    return false
  }
}
