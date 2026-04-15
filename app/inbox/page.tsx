'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { generateId } from '@/lib/utils/idUtils'
import { isBlockContained } from '@/lib/utils/slotUtils'
import type { NoteRouteTarget, QuickNote, SchoolCategory, SubjectId, TodoPriority } from '@/lib/types'

const statusLabel = { brute: 'Brute', triee: 'Triee', convertie: 'Convertie', archivee: 'Archivee' } as const
const routeLabel = {
  'calendar-event': 'Evenement',
  'work-block': 'Bloc',
  'subject-todo': 'Todo matiere',
  'fixed-constraint': 'Contrainte',
  'free-note': 'Note libre',
  'school-item': 'Item scolaire',
} as const
const schoolLabel: Record<SchoolCategory, string> = {
  anglais: 'Anglais',
  espagnol: 'Espagnol',
  devoirs: 'Devoirs',
  controles: 'Controles',
  'contraintes-scolaires': 'Contraintes scolaires',
  administratif: 'Administratif',
  autre: 'Autre',
}

type ConversionState = {
  noteId: string
  target: NoteRouteTarget
  title: string
  subjectId: SubjectId
  start: string
  end: string
  freeSlotId: string
  estimatedMinutes: string
  priority: TodoPriority
  dueDate: string
  schoolCategory: SchoolCategory
  includeInBacStats: boolean
  schoolRoute: 'todo' | 'event' | 'constraint'
}

function toLocalDateTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function defaultConversion(note: QuickNote, subjectId: SubjectId, freeSlotId: string, target: NoteRouteTarget): ConversionState {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    noteId: note.id,
    target,
    title: note.content.split('\n')[0]?.trim().slice(0, 60) || 'Note',
    subjectId: note.linkedSubjectId ?? subjectId,
    start: toLocalDateTime(start),
    end: toLocalDateTime(end),
    freeSlotId,
    estimatedMinutes: '120',
    priority: 'medium',
    dueDate: '',
    schoolCategory: note.schoolCategory ?? 'devoirs',
    includeInBacStats: !!note.includeInBacStats,
    schoolRoute: 'todo',
  }
}

export default function InboxPage() {
  const subjects = useAppStore((s) => s.subjects)
  const notes = useAppStore((s) => s.notes)
  const freeSlots = useAppStore((s) => s.freeSlots)
  const schoolItems = useAppStore((s) => s.schoolItems)
  const addNote = useAppStore((s) => s.addNote)
  const updateNote = useAppStore((s) => s.updateNote)
  const deleteNote = useAppStore((s) => s.deleteNote)
  const addEvent = useAppStore((s) => s.addEvent)
  const addTodo = useAppStore((s) => s.addTodo)
  const addWorkBlock = useAppStore((s) => s.addWorkBlock)
  const addSchoolItem = useAppStore((s) => s.addSchoolItem)
  const updateSchoolItem = useAppStore((s) => s.updateSchoolItem)

  const [draft, setDraft] = useState('')
  const [conversion, setConversion] = useState<ConversionState | null>(null)

  const futureSlots = useMemo(
    () =>
      [...freeSlots]
        .filter((slot) => new Date(slot.endTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [freeSlots]
  )

  const activeNotes = notes.filter((note) => note.status !== 'archivee')

  function capture() {
    const content = draft.trim()
    if (!content) return
    addNote({ id: generateId(), content, createdAt: new Date().toISOString(), status: 'brute' })
    setDraft('')
  }

  function finish(noteId: string, target: NoteRouteTarget, entityId?: string, entityType?: QuickNote['convertedEntityType'], extra: Partial<QuickNote> = {}) {
    updateNote(noteId, {
      status: 'convertie',
      routeTarget: target,
      convertedEntityId: entityId,
      convertedEntityType: entityType,
      ...extra,
    })
    setConversion(null)
  }

  function convert() {
    if (!conversion) return
    const title = conversion.title.trim() || 'Note'

    if (conversion.target === 'free-note') return finish(conversion.noteId, 'free-note')

    if (conversion.target === 'calendar-event' || conversion.target === 'fixed-constraint') {
      const start = new Date(conversion.start)
      const end = new Date(conversion.end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return
      const id = generateId()
      addEvent({
        id,
        title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: conversion.target === 'fixed-constraint' ? 'constraint' : 'school',
        color: conversion.target === 'fixed-constraint' ? '#b95c45' : '#8c9a72',
      })
      return finish(conversion.noteId, conversion.target, id, 'event')
    }

    if (conversion.target === 'subject-todo') {
      const estimatedMinutes = Number.parseInt(conversion.estimatedMinutes, 10)
      if (Number.isNaN(estimatedMinutes) || estimatedMinutes <= 0) return
      const id = generateId()
      addTodo({
        id,
        subjectId: conversion.subjectId,
        title,
        estimatedMinutes,
        priority: conversion.priority,
        status: 'todo',
        dueDate: conversion.dueDate || undefined,
        createdAt: new Date().toISOString(),
        originNoteId: conversion.noteId,
      })
      return finish(conversion.noteId, 'subject-todo', id, 'todo', { linkedSubjectId: conversion.subjectId })
    }

    if (conversion.target === 'work-block') {
      const slot = futureSlots.find((freeSlot) => freeSlot.id === conversion.freeSlotId)
      if (!slot) return
      const start = new Date(conversion.start)
      const end = new Date(conversion.end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return
      const block = {
        id: generateId(),
        subjectId: conversion.subjectId,
        freeSlotId: slot.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'planned' as const,
        notes: title,
      }
      if (!isBlockContained(block, slot)) return
      addWorkBlock(block)
      return finish(conversion.noteId, 'work-block', block.id, 'workBlock', { linkedSubjectId: conversion.subjectId })
    }

    if (conversion.target === 'school-item') {
      const estimatedMinutes = Number.parseInt(conversion.estimatedMinutes, 10)
      if (Number.isNaN(estimatedMinutes) || estimatedMinutes <= 0) return
      let eventId: string | undefined
      if (conversion.schoolRoute !== 'todo') {
        const start = new Date(conversion.start)
        const end = new Date(conversion.end)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return
        eventId = generateId()
        addEvent({
          id: eventId,
          title,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          type: conversion.schoolRoute === 'constraint' ? 'constraint' : 'school',
          color: conversion.schoolRoute === 'constraint' ? '#b95c45' : '#a87f6a',
        })
      }
      const id = generateId()
      addSchoolItem({
        id,
        title,
        category: conversion.schoolCategory,
        estimatedMinutes,
        createdAt: new Date().toISOString(),
        includeInBacStats: conversion.includeInBacStats,
        status: conversion.schoolRoute === 'todo' ? 'active' : 'planned',
        routeKind: conversion.schoolRoute,
        linkedNoteId: conversion.noteId,
        eventId,
        notes: notes.find((note) => note.id === conversion.noteId)?.content,
      })
      return finish(conversion.noteId, 'school-item', id, 'schoolItem', {
        schoolCategory: conversion.schoolCategory,
        includeInBacStats: conversion.includeInBacStats,
      })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Inbox</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-strong)]">
            Capture, trie, route.
          </h1>
          <p className="max-w-3xl text-sm md:text-base text-[var(--text-muted)]">
            Les notes entrent en brut puis partent vers le bon objet sans polluer les stats bac par defaut.
          </p>
        </div>

        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) capture()
                }}
                placeholder="Ajoute une idee, un devoir, une contrainte, un appel, une tache..."
                className="min-h-[124px] w-full resize-none rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 text-sm outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
              />
              <Button variant="primary" onClick={capture} disabled={!draft.trim()}>
                Ajouter a l&apos;inbox
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {(['brute', 'triee', 'convertie', 'archivee'] as const).map((status) => (
                <div key={status} className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">{statusLabel[status]}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                    {notes.filter((note) => note.status === status).length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {activeNotes.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--text-muted)]">
                Rien dans l&apos;inbox pour le moment.
              </div>
            ) : (
              activeNotes.map((note) => (
                <article key={note.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--surface-3)] px-3 py-1 text-xs text-[var(--text-muted)]">{statusLabel[note.status]}</span>
                        {note.routeTarget && <span className="rounded-full bg-[var(--accent-sage-soft)] px-3 py-1 text-xs text-[var(--accent-sage-strong)]">{routeLabel[note.routeTarget]}</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-strong)]">{note.content}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {note.status === 'brute' && <Button variant="secondary" size="sm" onClick={() => updateNote(note.id, { status: 'triee' })}>Marquer triee</Button>}
                      <Button variant="ghost" size="sm" onClick={() => updateNote(note.id, { status: 'archivee' })}>Archiver</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>Supprimer</Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Object.keys(routeLabel) as NoteRouteTarget[]).map((target) => (
                      <button
                        key={target}
                        onClick={() => setConversion(defaultConversion(note, subjects[0]?.id ?? 'maths', futureSlots[0]?.id ?? '', target))}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          conversion?.noteId === note.id && conversion.target === target
                            ? 'border-[var(--accent-terracotta-strong)] bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]'
                        }`}
                      >
                        {routeLabel[target]}
                      </button>
                    ))}
                  </div>

                  {conversion?.noteId === note.id && (
                    <div className="mt-4 space-y-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      {conversion.target !== 'free-note' && (
                        <input
                          type="text"
                          value={conversion.title}
                          onChange={(event) => setConversion((current) => (current ? { ...current, title: event.target.value } : current))}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]"
                        />
                      )}

                      {(conversion.target === 'calendar-event' || conversion.target === 'fixed-constraint') && (
                        <div className="grid gap-3 md:grid-cols-2">
                          <input type="datetime-local" value={conversion.start} onChange={(event) => setConversion((current) => (current ? { ...current, start: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                          <input type="datetime-local" value={conversion.end} onChange={(event) => setConversion((current) => (current ? { ...current, end: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                        </div>
                      )}

                      {conversion.target === 'subject-todo' && (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select value={conversion.subjectId} onChange={(event) => setConversion((current) => (current ? { ...current, subjectId: event.target.value as SubjectId } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                            <input type="number" min="15" step="15" value={conversion.estimatedMinutes} onChange={(event) => setConversion((current) => (current ? { ...current, estimatedMinutes: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select value={conversion.priority} onChange={(event) => setConversion((current) => (current ? { ...current, priority: event.target.value as TodoPriority } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              <option value="high">Haute</option>
                              <option value="medium">Moyenne</option>
                              <option value="low">Basse</option>
                            </select>
                            <input type="date" value={conversion.dueDate} onChange={(event) => setConversion((current) => (current ? { ...current, dueDate: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                          </div>
                        </>
                      )}

                      {conversion.target === 'work-block' && (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select value={conversion.subjectId} onChange={(event) => setConversion((current) => (current ? { ...current, subjectId: event.target.value as SubjectId } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                            <select value={conversion.freeSlotId} onChange={(event) => setConversion((current) => (current ? { ...current, freeSlotId: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              {futureSlots.length === 0 ? <option value="">Aucun creneau</option> : futureSlots.map((slot) => <option key={slot.id} value={slot.id}>{new Date(slot.startTime).toLocaleString('fr-FR')}</option>)}
                            </select>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input type="datetime-local" value={conversion.start} onChange={(event) => setConversion((current) => (current ? { ...current, start: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                            <input type="datetime-local" value={conversion.end} onChange={(event) => setConversion((current) => (current ? { ...current, end: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                          </div>
                        </>
                      )}

                      {conversion.target === 'school-item' && (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select value={conversion.schoolCategory} onChange={(event) => setConversion((current) => (current ? { ...current, schoolCategory: event.target.value as SchoolCategory } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              {Object.entries(schoolLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <input type="number" min="15" step="15" value={conversion.estimatedMinutes} onChange={(event) => setConversion((current) => (current ? { ...current, estimatedMinutes: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select value={conversion.schoolRoute} onChange={(event) => setConversion((current) => (current ? { ...current, schoolRoute: event.target.value as ConversionState['schoolRoute'] } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]">
                              <option value="todo">Todo</option>
                              <option value="event">Evenement</option>
                              <option value="constraint">Contrainte</option>
                            </select>
                            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm text-[var(--text-muted)]">
                              <input type="checkbox" checked={conversion.includeInBacStats} onChange={(event) => setConversion((current) => (current ? { ...current, includeInBacStats: event.target.checked } : current))} />
                              Inclure dans les stats bac
                            </label>
                          </div>
                          {conversion.schoolRoute !== 'todo' && (
                            <div className="grid gap-3 md:grid-cols-2">
                              <input type="datetime-local" value={conversion.start} onChange={(event) => setConversion((current) => (current ? { ...current, start: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                              <input type="datetime-local" value={conversion.end} onChange={(event) => setConversion((current) => (current ? { ...current, end: event.target.value } : current))} className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage-strong)] focus:ring-2 focus:ring-[var(--accent-sage-soft)]" />
                            </div>
                          )}
                        </>
                      )}

                      <Button variant="primary" onClick={convert}>Convertir</Button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          <aside className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Couche scolaire</p>
            <div className="mt-4 space-y-3">
              {schoolItems.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Aucun item scolaire non-bac route pour le moment.</p>
              ) : (
                schoolItems.map((item) => (
                  <div key={item.id} className="rounded-[1.2rem] bg-[var(--surface-2)] p-4">
                    <p className="font-medium text-[var(--text-strong)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {schoolLabel[item.category]} · {item.estimatedMinutes} min · {item.routeKind}
                    </p>
                    {item.includeInBacStats && <p className="mt-1 text-xs font-medium text-[var(--accent-amber-strong)]">Inclus dans les stats bac</p>}
                    <div className="mt-3 flex gap-2">
                      {item.status !== 'done' && <Button variant="secondary" size="sm" onClick={() => updateSchoolItem(item.id, { status: 'done' })}>Fait</Button>}
                      {item.status !== 'archived' && <Button variant="ghost" size="sm" onClick={() => updateSchoolItem(item.id, { status: 'archived' })}>Archiver</Button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
