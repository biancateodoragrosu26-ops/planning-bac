import type { AppState } from '@/lib/types'

export interface PersistenceAdapter {
  load(): AppState | null
  save(state: AppState): void
  clear(): void
}
