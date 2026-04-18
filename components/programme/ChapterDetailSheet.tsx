'use client'

import { useState, useEffect } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { useProgramStore } from '@/lib/store/useProgramStore'
import { generateId } from '@/lib/utils/idUtils'
import type {
  ProgramSubjectId,
  ProgramChapter,
  PhiloNotion,
  ChapterDifficulty,
  ChapterPrep,
  ChapterPart,
} from '@/lib/types'

// ── Visual config ────────────────────────────────────────────────────────────

export const PREP_COLORS: Record<ChapterPrep, string> = {
  rouge:  '#ef4444',
  orange: '#f97316',
  jaune:  '#eab308',
  vert:   '#22c55e',
}

export const PREP_LABELS: Record<ChapterPrep, string> = {
  rouge:  'Non maîtrisé',
  orange: 'À consolider',
  jaune:  'Assez bien',
  vert:   'Maîtrisé',
}

export const DIFF_LABELS: Record<ChapterDifficulty, string> = {
  'ca-va':       'Ça va',
  intermediaire: 'Intermédiaire',
  dur:           'Difficile',
}

const DIFFS: ChapterDifficulty[] = ['ca-va', 'intermediaire', 'dur']
const PREPS: ChapterPrep[]       = ['rouge', 'orange', 'jaune', 'vert']

// ── Types ────────────────────────────────────────────────────────────────────

export type SheetTarget =
  | null
  | { mode: 'create'; subjectId: ProgramSubjectId }
  | { mode: 'edit-chapter'; chapter: ProgramChapter }
  | { mode: 'edit-notion';  notion: PhiloNotion }

interface Props {
  target: SheetTarget
  onClose: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyPart(): ChapterPart {
  return { id: generateId(), name: '', difficulty: 'intermediaire', prep: 'orange', exerciseCount: 0 }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DifficultyPicker({
  value,
  onChange,
}: {
  value: ChapterDifficulty
  onChange: (d: ChapterDifficulty) => void
}) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
      {DIFFS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            value === d
              ? 'bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
          ].join(' ')}
        >
          {DIFF_LABELS[d]}
        </button>
      ))}
    </div>
  )
}

function PrepPicker({
  value,
  onChange,
}: {
  value: ChapterPrep
  onChange: (p: ChapterPrep) => void
}) {
  return (
    <div className="flex gap-4">
      {PREPS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className="flex flex-col items-center gap-1.5"
          title={PREP_LABELS[p]}
        >
          <span
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width:  44,
              height: 44,
              backgroundColor: PREP_COLORS[p],
              boxShadow:
                value === p
                  ? `0 0 0 3px white, 0 0 0 5px ${PREP_COLORS[p]}`
                  : 'none',
              opacity: value === p ? 1 : 0.45,
            }}
          />
          <span className="text-[10px] text-[var(--text-muted)] text-center leading-tight max-w-[44px]">
            {PREP_LABELS[p]}
          </span>
        </button>
      ))}
    </div>
  )
}

function ExerciseCounter({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-16 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
      >
        +
      </button>
    </div>
  )
}

function PartRow({
  part,
  onChange,
  onDelete,
}: {
  part: ChapterPart
  onChange: (patch: Partial<ChapterPart>) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={part.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nom de la partie…"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
        />
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Difficulty mini-picker */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ difficulty: d })}
              className={[
                'px-2 py-1 text-[11px] font-medium transition-colors',
                part.difficulty === d
                  ? 'bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)]'
                  : 'bg-[var(--surface)] text-[var(--text-faint)] hover:bg-[var(--surface-2)]',
              ].join(' ')}
            >
              {DIFF_LABELS[d]}
            </button>
          ))}
        </div>
        {/* Prep mini-picker */}
        <div className="flex gap-2">
          {PREPS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ prep: p })}
              title={PREP_LABELS[p]}
              className="rounded-full transition-all"
              style={{
                width: 22,
                height: 22,
                backgroundColor: PREP_COLORS[p],
                boxShadow:
                  part.prep === p
                    ? `0 0 0 2px white, 0 0 0 3.5px ${PREP_COLORS[p]}`
                    : 'none',
                opacity: part.prep === p ? 1 : 0.45,
              }}
            />
          ))}
        </div>
        {/* Exercise count */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[11px] text-[var(--text-faint)]">Exos :</span>
          <input
            type="number"
            min={0}
            value={part.exerciseCount}
            onChange={(e) => onChange({ exerciseCount: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-12 text-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1 py-1 text-sm focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// ── Main sheet ───────────────────────────────────────────────────────────────

export function ChapterDetailSheet({ target, onClose }: Props) {
  const addChapter       = useProgramStore((s) => s.addChapter)
  const updateChapter    = useProgramStore((s) => s.updateChapter)
  const deleteChapter    = useProgramStore((s) => s.deleteChapter)
  const addPhiloNotion   = useProgramStore((s) => s.addPhiloNotion)
  const updatePhiloNotion = useProgramStore((s) => s.updatePhiloNotion)
  const deletePhiloNotion = useProgramStore((s) => s.deletePhiloNotion)

  // ── Local form state ─────────────────────────────────────────────────────
  const [name, setName]             = useState('')
  const [difficulty, setDifficulty] = useState<ChapterDifficulty>('intermediaire')
  const [prep, setPrep]             = useState<ChapterPrep>('orange')
  const [exoCount, setExoCount]     = useState(0)
  const [notes, setNotes]           = useState('')
  const [parts, setParts]           = useState<ChapterPart[]>([])

  useEffect(() => {
    if (!target) return

    queueMicrotask(() => {
      if (target.mode === 'edit-chapter') {
        const chapter = target.chapter
        setName(chapter.name)
        setDifficulty(chapter.difficulty)
        setPrep(chapter.prep)
        setExoCount(chapter.exerciseCount)
        setNotes('')
        setParts(chapter.parts)
      } else if (target.mode === 'edit-notion') {
        const notion = target.notion
        setName(notion.name)
        setDifficulty(notion.difficulty)
        setPrep(notion.prep)
        setExoCount(notion.exerciseCount)
        setNotes(notion.notes ?? '')
        setParts([])
      } else {
        setName('')
        setDifficulty('intermediaire')
        setPrep('orange')
        setExoCount(0)
        setNotes('')
        setParts([])
      }
    })
  }, [target])

  const isPhilo = target
    ? target.mode === 'edit-notion' ||
      (target.mode === 'create' && target.subjectId === 'philosophie')
    : false

  const isCreate = target?.mode === 'create'
  const isEdit   = target?.mode === 'edit-chapter' || target?.mode === 'edit-notion'

  const title = isCreate
    ? isPhilo
      ? 'Nouvelle notion'
      : 'Nouveau chapitre'
    : isPhilo
      ? 'Modifier la notion'
      : 'Modifier le chapitre'

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (target?.mode === 'create') {
      if (isPhilo) {
        addPhiloNotion({ name: trimmed, difficulty, prep, exerciseCount: exoCount, notes: notes.trim() || undefined })
      } else {
        addChapter({ subjectId: target.subjectId, name: trimmed, difficulty, prep, exerciseCount: exoCount, parts })
      }
    } else if (target?.mode === 'edit-chapter') {
      updateChapter(target.chapter.id, { name: trimmed, difficulty, prep, exerciseCount: exoCount, parts })
    } else if (target?.mode === 'edit-notion') {
      updatePhiloNotion(target.notion.id, { name: trimmed, difficulty, prep, exerciseCount: exoCount, notes: notes.trim() || undefined })
    }
    onClose()
  }

  function handleDelete() {
    if (target?.mode === 'edit-chapter') {
      deleteChapter(target.chapter.id)
      onClose()
    } else if (target?.mode === 'edit-notion') {
      deletePhiloNotion(target.notion.id)
      onClose()
    }
  }

  function updatePart(index: number, patch: Partial<ChapterPart>) {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function deletePart(index: number) {
    setParts((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Sheet open={!!target} onClose={onClose} title={title}>
      <div className="px-5 pb-6 space-y-6 pt-2">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-2">
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isPhilo ? 'Nom de la notion…' : 'Nom du chapitre…'}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            autoFocus
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-2">
            Difficulté
          </label>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </div>

        {/* Preparation */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-3">
            État de préparation
          </label>
          <PrepPicker value={prep} onChange={setPrep} />
        </div>

        {/* Exercise count */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-2">
            Exercices effectués
          </label>
          <ExerciseCounter value={exoCount} onChange={setExoCount} />
        </div>

        {/* Philo notes */}
        {isPhilo && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Arguments, auteurs, exemples…"
              rows={3}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage-strong)]"
            />
          </div>
        )}

        {/* Parts — Maths/Physique/Chimie only */}
        {!isPhilo && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Parties du chapitre
              </label>
              <button
                type="button"
                onClick={() => setParts((prev) => [...prev, emptyPart()])}
                className="text-xs font-medium text-[var(--accent-sage-strong)] hover:underline"
              >
                + Ajouter
              </button>
            </div>
            {parts.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)] italic">
                Aucune partie — le chapitre est évalué globalement.
              </p>
            ) : (
              <div className="space-y-2">
                {parts.map((part, i) => (
                  <PartRow
                    key={part.id}
                    part={part}
                    onChange={(patch) => updatePart(i, patch)}
                    onDelete={() => deletePart(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[var(--border)]" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border border-red-200"
            >
              Supprimer
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta-deep)] hover:bg-[var(--accent-terracotta-deep)] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCreate ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
