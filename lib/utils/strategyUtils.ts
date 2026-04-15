import { endOfDay, isSameDay, parseISO } from 'date-fns'
import type {
  AppSettings,
  FreeSlot,
  SchoolItem,
  Subject,
  WorkBlock,
  WorkBlockStatus,
} from '@/lib/types'
import { daysUntil, durationMinutes } from './dateUtils'

export const REALISTIC_CAPACITY_FACTOR = 0.9

export type StrategicStatus = 'under-control' | 'tense' | 'critical'

export interface SubjectStrategicStats {
  subjectId: Subject['id']
  name: string
  color: string
  doneMinutes: number
  plannedMinutes: number
  skippedMinutes: number
  remainingMinutes: number
  remainingEquivalentBlocks: number
  requiredEquivalentBlocksPerDay: number
  requiredHoursPerDay: number
  riskScore: number
}

export interface StrategicSummary {
  daysUntilBac: number
  remainingWorkMinutes: number
  remainingWorkEquivalentBlocks: number
  includedSchoolMinutes: number
  idealRemainingCapacityMinutes: number
  idealRemainingCapacityEquivalentBlocks: number
  realisticRemainingCapacityMinutes: number
  realisticRemainingCapacityEquivalentBlocks: number
  gapMinutes: number
  gapEquivalentBlocks: number
  totalFutureSlots: number
  todayCapacityMinutes: number
  todayCapacityEquivalentBlocks: number
  requiredEquivalentBlocksPerDay: number
  requiredHoursPerDay: number
  mostTenseSubject: SubjectStrategicStats | null
  status: StrategicStatus
  impactOfLosingDayMinutes: number
  impactOfLosingDayEquivalentBlocks: number
  impactOfLosingSlotMinutes: number
  impactOfLosingSlotEquivalentBlocks: number
  impactOfSkippingOneBlockMinutes: number
  impactOfSkippingOneBlockEquivalentBlocks: number
  subjects: SubjectStrategicStats[]
}

function futureSlotsUntilBac(freeSlots: FreeSlot[], bacDate: string, now: Date) {
  const bacEnd = endOfDay(parseISO(bacDate))

  return freeSlots
    .filter((slot) => {
      const start = parseISO(slot.startTime)
      const end = parseISO(slot.endTime)
      return end > now && start <= bacEnd
    })
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
}

function sumBlockMinutes(blocks: WorkBlock[], status: WorkBlockStatus, now: Date) {
  return blocks
    .filter((block) => {
      if (block.status !== status) return false
      if (status === 'planned') return parseISO(block.endTime) > now
      return true
    })
    .reduce((sum, block) => sum + durationMinutes(block.startTime, block.endTime), 0)
}

export function minutesToEquivalentBlocks(minutes: number, settings: Pick<AppSettings, 'equivalentIntermediateBlockMinutes'>) {
  if (settings.equivalentIntermediateBlockMinutes <= 0) return 0
  return minutes / settings.equivalentIntermediateBlockMinutes
}

export function minutesToHours(minutes: number) {
  return minutes / 60
}

export function formatBlockCount(value: number) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: value < 10 && value % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  })
}

export function formatHourCount(hours: number) {
  return hours.toLocaleString('fr-FR', {
    minimumFractionDigits: hours < 10 && hours % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  })
}

export function getBlockSizeLabel(
  minutes: number,
  settings: Pick<AppSettings, 'smallBlockMaxMinutes' | 'intermediateBlockMaxMinutes'>
) {
  if (minutes <= settings.smallBlockMaxMinutes) return 'petit bloc'
  if (minutes <= settings.intermediateBlockMaxMinutes) return 'bloc intermediaire'
  return 'grand bloc'
}

export function computeStrategicSummary(
  subjects: Subject[],
  workBlocks: WorkBlock[],
  freeSlots: FreeSlot[],
  schoolItems: SchoolItem[],
  settings: AppSettings,
  now = new Date()
): StrategicSummary {
  const futureSlots = futureSlotsUntilBac(freeSlots, settings.bacDate, now)
  const idealRemainingCapacityMinutes = futureSlots.reduce(
    (sum, slot) => sum + durationMinutes(slot.startTime, slot.endTime),
    0
  )
  const realisticRemainingCapacityMinutes =
    idealRemainingCapacityMinutes * REALISTIC_CAPACITY_FACTOR
  const todayCapacityMinutes = futureSlots
    .filter((slot) => isSameDay(parseISO(slot.startTime), now))
    .reduce((sum, slot) => sum + durationMinutes(slot.startTime, slot.endTime), 0)

  const subjectStats = subjects.map((subject) => {
    const subjectBlocks = workBlocks.filter((block) => block.subjectId === subject.id)
    const doneMinutes = sumBlockMinutes(subjectBlocks, 'done', now)
    const plannedMinutes = sumBlockMinutes(subjectBlocks, 'planned', now)
    const skippedMinutes = sumBlockMinutes(subjectBlocks, 'skipped', now)
    const remainingMinutes = Math.max(0, subject.estimatedMinutesRemaining - doneMinutes)
    const remainingEquivalentBlocks = minutesToEquivalentBlocks(remainingMinutes, settings)
    const dayCount = Math.max(1, daysUntil(settings.bacDate))

    return {
      subjectId: subject.id,
      name: subject.name,
      color: subject.color,
      doneMinutes,
      plannedMinutes,
      skippedMinutes,
      remainingMinutes,
      remainingEquivalentBlocks,
      requiredEquivalentBlocksPerDay: remainingEquivalentBlocks / dayCount,
      requiredHoursPerDay: minutesToHours(remainingMinutes) / dayCount,
      riskScore:
        remainingEquivalentBlocks / Math.max(0.25, minutesToEquivalentBlocks(plannedMinutes, settings) + 0.5),
    }
  })

  const includedSchoolMinutes = schoolItems
    .filter((item) => item.includeInBacStats && item.status !== 'done' && item.status !== 'archived')
    .reduce((sum, item) => sum + item.estimatedMinutes, 0)

  const remainingWorkMinutes =
    subjectStats.reduce((sum, subject) => sum + subject.remainingMinutes, 0) + includedSchoolMinutes
  const remainingWorkEquivalentBlocks = minutesToEquivalentBlocks(remainingWorkMinutes, settings)
  const gapMinutes = realisticRemainingCapacityMinutes - remainingWorkMinutes
  const gapEquivalentBlocks = minutesToEquivalentBlocks(gapMinutes, settings)
  const daysRemaining = Math.max(0, daysUntil(settings.bacDate))
  const safeDayCount = Math.max(1, daysRemaining)
  const requiredEquivalentBlocksPerDay = remainingWorkEquivalentBlocks / safeDayCount
  const requiredHoursPerDay = minutesToHours(remainingWorkMinutes) / safeDayCount
  const mostTenseSubject =
    [...subjectStats].sort((a, b) => {
      if (b.requiredEquivalentBlocksPerDay !== a.requiredEquivalentBlocksPerDay) {
        return b.requiredEquivalentBlocksPerDay - a.requiredEquivalentBlocksPerDay
      }
      return b.remainingEquivalentBlocks - a.remainingEquivalentBlocks
    })[0] ?? null

  const status: StrategicStatus =
    remainingWorkEquivalentBlocks <= realisticRemainingCapacityMinutes / settings.equivalentIntermediateBlockMinutes * 0.85
      ? 'under-control'
      : gapMinutes >= 0
      ? 'tense'
      : 'critical'

  const nextSlot = futureSlots[0]
  const plannedFutureBlocks = workBlocks
    .filter((block) => block.status === 'planned' && parseISO(block.endTime) > now)
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())

  const impactOfLosingDayMinutes =
    daysRemaining > 0 ? idealRemainingCapacityMinutes / Math.max(1, futureSlots.length ? daysRemaining : 1) : 0
  const impactOfLosingSlotMinutes = nextSlot
    ? durationMinutes(nextSlot.startTime, nextSlot.endTime)
    : settings.equivalentIntermediateBlockMinutes
  const impactOfSkippingOneBlockMinutes = plannedFutureBlocks[0]
    ? durationMinutes(plannedFutureBlocks[0].startTime, plannedFutureBlocks[0].endTime)
    : settings.equivalentIntermediateBlockMinutes

  return {
    daysUntilBac: daysRemaining,
    remainingWorkMinutes,
    remainingWorkEquivalentBlocks,
    includedSchoolMinutes,
    idealRemainingCapacityMinutes,
    idealRemainingCapacityEquivalentBlocks: minutesToEquivalentBlocks(
      idealRemainingCapacityMinutes,
      settings
    ),
    realisticRemainingCapacityMinutes,
    realisticRemainingCapacityEquivalentBlocks: minutesToEquivalentBlocks(
      realisticRemainingCapacityMinutes,
      settings
    ),
    gapMinutes,
    gapEquivalentBlocks,
    totalFutureSlots: futureSlots.length,
    todayCapacityMinutes,
    todayCapacityEquivalentBlocks: minutesToEquivalentBlocks(todayCapacityMinutes, settings),
    requiredEquivalentBlocksPerDay,
    requiredHoursPerDay,
    mostTenseSubject,
    status,
    impactOfLosingDayMinutes,
    impactOfLosingDayEquivalentBlocks: minutesToEquivalentBlocks(impactOfLosingDayMinutes, settings),
    impactOfLosingSlotMinutes,
    impactOfLosingSlotEquivalentBlocks: minutesToEquivalentBlocks(impactOfLosingSlotMinutes, settings),
    impactOfSkippingOneBlockMinutes,
    impactOfSkippingOneBlockEquivalentBlocks: minutesToEquivalentBlocks(
      impactOfSkippingOneBlockMinutes,
      settings
    ),
    subjects: subjectStats,
  }
}
