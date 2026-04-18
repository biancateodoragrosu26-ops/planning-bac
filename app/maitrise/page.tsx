'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProgramStore } from '@/lib/store/useProgramStore'
import {
  ChapterDetailSheet,
  PREP_COLORS,
  PREP_LABELS,
  DIFF_LABELS,
  type SheetTarget,
} from '@/components/programme/ChapterDetailSheet'
import type {
  ProgramSubjectId,
  ProgramChapter,
  PhiloNotion,
  ChapterPrep,
  ChapterDifficulty,
} from '@/lib/types'

// ── Subject config ────────────────────────────────────────────────────────────

const SUBJECTS: { id: ProgramSubjectId; label: string; color: string }[] = [
  { id: 'maths',      label: 'Maths',      color: '#9a6b57' },
  { id: 'physique',   label: 'Physique',   color: '#5b7fa6' },
  { id: 'chimie',     label: 'Chimie',     color: '#7b9377' },
  { id: 'philosophie', label: 'Philosophie', color: '#c58366' },
]

const PREPS: ChapterPrep[] = ['rouge', 'orange', 'jaune', 'vert']

// ── Difficulty badge ──────────────────────────────────────────────────────────

const DIFF_BADGE: Record<ChapterDifficulty, { bg: string; text: string }> = {
  'ca-va':       { bg: '#dcfce7', text: '#15803d' },
  intermediaire: { bg: '#fef9c3', text: '#a16207' },
  dur:           { bg: '#fee2e2', text: '#b91c1c' },
}

// ── Chapter card ──────────────────────────────────────────────────────────────

function ChapterCard({
  chapter,
  onClick,
}: {
  chapter: ProgramChapter
  onClick: () => void
}) {
  const diff = DIFF_BADGE[chapter.difficulty]
  const hasParts = chapter.parts.length > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden flex transition-shadow hover:shadow-md active:scale-[0.99]"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      {/* Left prep color bar */}
      <div
        className="w-1 flex-none"
        style={{ backgroundColor: PREP_COLORS[chapter.prep] }}
      />

      <div className="flex-1 px-4 py-3 min-w-0">
        {/* Row 1: name + prep dot */}
        <div className="flex items-start gap-2">
          <span className="flex-1 font-semibold text-[15px] text-[var(--text-strong)] leading-snug">
            {chapter.name}
          </span>
          <span
            className="mt-0.5 flex-none w-3 h-3 rounded-full"
            style={{ backgroundColor: PREP_COLORS[chapter.prep] }}
            title={PREP_LABELS[chapter.prep]}
          />
        </div>

        {/* Row 2: difficulty badge + exercise count */}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {DIFF_LABELS[chapter.difficulty]}
          </span>
          {chapter.exerciseCount > 0 && (
            <span className="text-[12px] text-[var(--text-faint)]">
              {chapter.exerciseCount} exo{chapter.exerciseCount > 1 ? 's' : ''}
            </span>
          )}
          {hasParts && (
            <span className="text-[12px] text-[var(--text-faint)]">
              {chapter.parts.length} partie{chapter.parts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Row 3: parts mini-row (if any) */}
        {hasParts && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {chapter.parts.map((part) => (
              <span
                key={part.id}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: PREP_COLORS[part.prep] + '22',
                  color: PREP_COLORS[part.prep],
                  border: `1px solid ${PREP_COLORS[part.prep]}55`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-none"
                  style={{ backgroundColor: PREP_COLORS[part.prep] }}
                />
                {part.name || '—'}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Notion card (Philosophie) ─────────────────────────────────────────────────

function NotionCard({
  notion,
  onClick,
}: {
  notion: PhiloNotion
  onClick: () => void
}) {
  const diff = DIFF_BADGE[notion.difficulty]

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden flex transition-shadow hover:shadow-md active:scale-[0.99]"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      {/* Left prep color bar */}
      <div
        className="w-1 flex-none"
        style={{ backgroundColor: PREP_COLORS[notion.prep] }}
      />

      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start gap-2">
          <span className="flex-1 font-semibold text-[15px] text-[var(--text-strong)] leading-snug">
            {notion.name}
          </span>
          <span
            className="mt-0.5 flex-none w-3 h-3 rounded-full"
            style={{ backgroundColor: PREP_COLORS[notion.prep] }}
            title={PREP_LABELS[notion.prep]}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {DIFF_LABELS[notion.difficulty]}
          </span>
          {notion.exerciseCount > 0 && (
            <span className="text-[12px] text-[var(--text-faint)]">
              {notion.exerciseCount} exo{notion.exerciseCount > 1 ? 's' : ''}
            </span>
          )}
          {notion.notes && (
            <span className="text-[12px] text-[var(--text-faint)] italic truncate max-w-[200px]">
              {notion.notes}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Bilan section ─────────────────────────────────────────────────────────────

function BilanSection({
  preps,
  totalExos,
  itemLabel,
}: {
  preps: ChapterPrep[]
  totalExos: number
  itemLabel: string
}) {
  const counts = useMemo(() => {
    const map: Record<ChapterPrep, number> = { rouge: 0, orange: 0, jaune: 0, vert: 0 }
    preps.forEach((p) => { map[p]++ })
    return map
  }, [preps])

  const total    = preps.length
  const maitrise = counts.vert
  const aRisque  = counts.rouge + counts.orange

  if (total === 0) return null

  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-4 space-y-3"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        Bilan
      </h3>

      {/* Distribution bar */}
      <div className="flex rounded-full overflow-hidden h-3">
        {PREPS.map((p) => {
          const pct = (counts[p] / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={p}
              title={`${PREP_LABELS[p]}: ${counts[p]}`}
              style={{ width: `${pct}%`, backgroundColor: PREP_COLORS[p] }}
            />
          )
        })}
      </div>

      {/* Chip row */}
      <div className="flex flex-wrap gap-2">
        {PREPS.map((p) => (
          <div
            key={p}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
            style={{
              backgroundColor: PREP_COLORS[p] + '20',
              color: PREP_COLORS[p],
              border: `1px solid ${PREP_COLORS[p]}44`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-none"
              style={{ backgroundColor: PREP_COLORS[p] }}
            />
            <span>{counts[p]} {PREP_LABELS[p]}</span>
          </div>
        ))}
      </div>

      {/* Summary text */}
      <p className="text-sm text-[var(--text-muted)]">
        {maitrise > 0
          ? `${maitrise}/${total} ${itemLabel}${maitrise > 1 ? 's' : ''} maîtrisé${maitrise > 1 ? 's' : ''}.`
          : `Aucun ${itemLabel} maîtrisé pour l'instant.`}
        {aRisque > 0 && (
          <span className="text-red-500 font-medium">
            {' '}{aRisque} à risque.
          </span>
        )}
        {totalExos > 0 && (
          <span className="text-[var(--text-faint)]">
            {' '}{totalExos} exercice{totalExos > 1 ? 's' : ''} au total.
          </span>
        )}
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MaitrisePage() {
  const hydrate    = useProgramStore((s) => s.hydrate)
  const _hydrated  = useProgramStore((s) => s._hydrated)
  const chapters   = useProgramStore((s) => s.chapters)
  const notions    = useProgramStore((s) => s.philoNotions)

  const [activeSubject, setActiveSubject] = useState<ProgramSubjectId>('maths')
  const [sheetTarget, setSheetTarget]     = useState<SheetTarget>(null)

  useEffect(() => { hydrate() }, [hydrate])

  const activeChapters = useMemo(
    () => chapters.filter((c) => c.subjectId === activeSubject),
    [chapters, activeSubject]
  )

  const isPhilo = activeSubject === 'philosophie'

  // Bilan data
  const bilanPreps = useMemo(() => {
    if (isPhilo) return notions.map((n) => n.prep)
    return activeChapters.map((c) => c.prep)
  }, [isPhilo, notions, activeChapters])

  const bilanTotalExos = useMemo(() => {
    if (isPhilo) return notions.reduce((sum, n) => sum + n.exerciseCount, 0)
    return activeChapters.reduce((sum, c) => sum + c.exerciseCount, 0)
  }, [isPhilo, notions, activeChapters])

  if (!_hydrated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--text-faint)] text-sm">Chargement…</p>
      </div>
    )
  }

  const activeSubjectConfig = SUBJECTS.find((s) => s.id === activeSubject)!

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 border-b border-[var(--border)] flex-none bg-[var(--surface)]/90 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-strong)] tracking-tight">
              Programme
            </h1>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">
              Maîtrise des chapitres et notions
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSheetTarget({ mode: 'create', subjectId: activeSubject })
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              backgroundColor: activeSubjectConfig.color + '20',
              color: activeSubjectConfig.color,
              border: `1px solid ${activeSubjectConfig.color}44`,
            }}
          >
            <span className="text-base leading-none">+</span>
            <span>{isPhilo ? 'Notion' : 'Chapitre'}</span>
          </button>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-1">
          {SUBJECTS.map((s) => {
            const active = s.id === activeSubject
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSubject(s.id)}
                className={[
                  'flex-1 py-2 px-1 rounded-xl text-sm font-semibold transition-all text-center',
                  active ? 'shadow-sm' : 'text-[var(--text-muted)]',
                ].join(' ')}
                style={
                  active
                    ? {
                        backgroundColor: s.color + '18',
                        color: s.color,
                        border: `1.5px solid ${s.color}55`,
                      }
                    : { border: '1.5px solid transparent' }
                }
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Color legend ────────────────────────────────────────────────── */}
      <div className="flex-none px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
        <div className="flex items-center gap-4 flex-wrap">
          {PREPS.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-none"
                style={{ backgroundColor: PREP_COLORS[p] }}
              />
              <span className="text-[11px] text-[var(--text-faint)]">{PREP_LABELS[p]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-2.5">

          {/* Empty state */}
          {(isPhilo ? notions.length === 0 : activeChapters.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <span className="text-4xl opacity-30">📚</span>
              <p className="text-[var(--text-muted)] font-medium">
                Aucun{isPhilo ? 'e notion' : ' chapitre'} pour l&apos;instant
              </p>
              <button
                type="button"
                onClick={() =>
                  setSheetTarget({ mode: 'create', subjectId: activeSubject })
                }
                className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: activeSubjectConfig.color + '18',
                  color: activeSubjectConfig.color,
                  border: `1px solid ${activeSubjectConfig.color}44`,
                }}
              >
                Ajouter {isPhilo ? 'une notion' : 'un chapitre'}
              </button>
            </div>
          )}

          {/* Chapter cards */}
          {!isPhilo &&
            activeChapters.map((ch) => (
              <ChapterCard
                key={ch.id}
                chapter={ch}
                onClick={() => setSheetTarget({ mode: 'edit-chapter', chapter: ch })}
              />
            ))}

          {/* Notion cards (Philosophie) */}
          {isPhilo &&
            notions.map((n) => (
              <NotionCard
                key={n.id}
                notion={n}
                onClick={() => setSheetTarget({ mode: 'edit-notion', notion: n })}
              />
            ))}

          {/* Bilan */}
          {bilanPreps.length > 0 && (
            <div className="pt-4">
              <BilanSection
                preps={bilanPreps}
                totalExos={bilanTotalExos}
                itemLabel={isPhilo ? 'notion' : 'chapitre'}
              />
            </div>
          )}

          {/* Bottom spacer for iOS safe area */}
          <div className="h-8" />
        </div>
      </div>

      {/* ── Detail sheet ─────────────────────────────────────────────────── */}
      <ChapterDetailSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </div>
  )
}
