'use client'

import { useCalendarStore } from '@/lib/store/useCalendarStore'
import { useAppStore } from '@/lib/store/useAppStore'
import { Sheet } from '@/components/ui/Sheet'
import { CreateFreeSlotForm } from './CreateFreeSlotForm'
import { FreeSlotDetail } from './FreeSlotDetail'
import { WorkBlockDetail } from './WorkBlockDetail'
import { EventDetail } from './EventDetail'
import { CreateWorkBlockForm } from './CreateWorkBlockForm'
import { CreateEventForm } from './CreateEventForm'

export function DetailPanel() {
  const panel = useCalendarStore((s) => s.panel)
  const closePanel = useCalendarStore((s) => s.closePanel)

  const freeSlots = useAppStore((s) => s.freeSlots)
  const workBlocks = useAppStore((s) => s.workBlocks)
  const events = useAppStore((s) => s.events)

  if (!panel) return null

  let title = ''
  let content: React.ReactNode = null

  if (panel.type === 'createFreeSlot') {
    title = 'Nouveau créneau libre'
    content = (
      <CreateFreeSlotForm
        startTime={panel.startTime}
        endTime={panel.endTime}
        onClose={closePanel}
      />
    )
  } else if (panel.type === 'freeSlot') {
    const slot = freeSlots.find((s) => s.id === panel.id)
    if (!slot) return null
    title = 'Créneau libre'
    content = <FreeSlotDetail slot={slot} onClose={closePanel} />
  } else if (panel.type === 'createWorkBlock') {
    title = 'Nouveau bloc de travail'
    content = (
      <CreateWorkBlockForm
        freeSlotId={panel.freeSlotId}
        startTime={panel.startTime}
        endTime={panel.endTime}
        onClose={closePanel}
      />
    )
  } else if (panel.type === 'workBlock') {
    const block = workBlocks.find((b) => b.id === panel.id)
    if (!block) return null
    title = 'Bloc de travail'
    content = <WorkBlockDetail block={block} onClose={closePanel} />
  } else if (panel.type === 'event') {
    const event = events.find((e) => e.id === panel.id)
    if (!event) return null
    title = event.title
    content = <EventDetail event={event} onClose={closePanel} />
  } else if (panel.type === 'createEvent') {
    title = 'Nouvel événement'
    content = (
      <CreateEventForm
        startTime={panel.startTime}
        endTime={panel.endTime}
        onClose={closePanel}
      />
    )
  }

  return (
    <Sheet open={true} onClose={closePanel} title={title}>
      {content}
    </Sheet>
  )
}
