'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/lib/store/useAppStore'
import { generateId } from '@/lib/utils/idUtils'
import type { SubjectId } from '@/lib/types'

export default function TachesBacPage() {
  const subjects = useAppStore((state) => state.subjects)
  const todos = useAppStore((state) => state.todos)
  const addTodo = useAppStore((state) => state.addTodo)
  const updateTodo = useAppStore((state) => state.updateTodo)
  const deleteTodo = useAppStore((state) => state.deleteTodo)

  const [subjectId, setSubjectId] = useState<SubjectId>(subjects[0]?.id ?? 'maths')
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('60')

  const groupedTodos = useMemo(
    () =>
      subjects.map((subject) => ({
        subject,
        active: todos.filter((todo) => todo.subjectId === subject.id && todo.status !== 'done'),
        done: todos.filter((todo) => todo.subjectId === subject.id && todo.status === 'done'),
      })),
    [subjects, todos]
  )

  function handleCreate() {
    if (!title.trim()) return
    addTodo({
      id: generateId(),
      subjectId,
      title: title.trim(),
      estimatedMinutes: Number(estimatedMinutes) || 60,
      priority: 'medium',
      status: 'todo',
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setEstimatedMinutes('60')
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Taches bac
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text-strong)]">
              Les choses a faire, matiere par matiere
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Les notes routees depuis l&apos;inbox arrivent ici. Tu peux aussi ajouter une tache
              directement sans toucher au reste de l&apos;application.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_2fr_1fr_auto]">
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value as SubjectId)}
              className="rounded-2xl border border-[var(--border)] bg-transparent px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: refaire les exos de probabilites"
              className="rounded-2xl border border-[var(--border)] bg-transparent px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            />
            <input
              type="number"
              min="15"
              step="15"
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-transparent px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            />
            <Button variant="primary" onClick={handleCreate}>
              Ajouter
            </Button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {groupedTodos.map(({ subject, active, done }) => (
            <article
              key={subject.id}
              className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-[var(--text-strong)]">{subject.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {active.length} a faire • {done.length} faites
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {active.length === 0 && done.length === 0 && (
                  <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    Rien ici pour le moment.
                  </div>
                )}

                {active.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
                  >
                    <button
                      onClick={() => updateTodo(todo.id, { status: 'done' })}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]"
                      aria-label="Marquer comme faite"
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-strong)]">{todo.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {todo.estimatedMinutes} min
                        {todo.dueDate ? ` • pour ${todo.dueDate}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-sm text-[var(--text-faint)] transition-colors hover:text-[var(--critical-strong)]"
                    >
                      Suppr.
                    </button>
                  </div>
                ))}

                {done.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                      Deja faites
                    </p>
                    {done.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 opacity-70"
                      >
                        <button
                          onClick={() => updateTodo(todo.id, { status: 'todo' })}
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage-strong)] text-[10px] text-white"
                          aria-label="Remettre a faire"
                        >
                          ✓
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-through text-[var(--text-muted)]">
                            {todo.title}
                          </p>
                          <p className="text-xs text-[var(--text-faint)]">{todo.estimatedMinutes} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
