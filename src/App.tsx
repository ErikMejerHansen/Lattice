import { useState, useMemo } from 'react'
import type React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import graphData from '../state/concept_graph.json'

type NodeState = 'available' | 'in_progress' | 'mastered' | 'queued'

type GraphNode = {
  id: string
  label: string
  subtitle: string
  state: NodeState
  lesson: string
  col: number
  row: number
}

type Edge = {
  from: string
  to: string
  kind: 'extends' | 'related' | 'applied'
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'math'; tex: string; display?: boolean }
  | { type: 'viz'; src: string; height: number; caption: string }

type Quiz = {
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
}

type Lesson = {
  slug: string
  title: string
  node: { id: string; label: string; subtitle: string }
  intro: string
  sections: Array<{
    id: string
    heading: string
    hasQuiz: boolean
    blocks: Block[]
    quiz?: Quiz
  }>
}

const lessonModules = import.meta.glob<{ default: Lesson }>('../lessons/20*.json')

function loadNodeStates(): Record<string, NodeState> {
  try {
    const stored = localStorage.getItem('lattice_node_states')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function persistNodeState(
  id: string,
  state: NodeState,
  current: Record<string, NodeState>,
): Record<string, NodeState> {
  const next = { ...current, [id]: state }
  localStorage.setItem('lattice_node_states', JSON.stringify(next))
  return next
}

// ── Primitives ─────────────────────────────────────────────────────────

function CategoryLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        fontWeight: 500,
      }}>{children}</div>
      <div style={{ width: 40, height: 1, background: 'var(--rule-strong)', marginTop: 6 }} />
    </div>
  )
}

function HammingHeading({ num, children, style }: {
  num?: string | number
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <h2 style={{
      fontFamily: 'var(--serif)',
      fontWeight: 600,
      fontSize: 22,
      lineHeight: 1.25,
      letterSpacing: '-0.005em',
      color: 'var(--ink)',
      margin: 0,
      ...style,
    }}>
      {num != null && (
        <span style={{
          fontFamily: 'var(--mono)',
          fontWeight: 400,
          fontSize: 13,
          color: 'var(--ink-muted)',
          marginRight: 10,
          letterSpacing: '0.04em',
        }}>{num}</span>
      )}
      {children}
    </h2>
  )
}

function ContinueBtn({ label = 'Continue', onClick, style }: {
  label?: string
  onClick?: () => void
  style?: React.CSSProperties
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        borderTop: '1px solid var(--rule)',
        paddingTop: 14,
        marginTop: 36,
        fontFamily: 'var(--serif)',
        fontSize: 17,
        fontWeight: 500,
        color: 'var(--rust)',
        letterSpacing: '0.005em',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        ...style,
      }}
    >
      <span>{label}</span>
      <span>→</span>
    </div>
  )
}

// ── ConceptNode ────────────────────────────────────────────────────────

function ConceptNode({ title, state = 'available', cat, onClick, style }: {
  title: string
  state?: NodeState
  cat?: string
  onClick?: () => void
  style?: React.CSSProperties
}) {
  const s = ({
    mastered:    { bg: 'var(--paper-raised)', border: 'var(--rule-strong)', dash: 'solid',  ink: 'var(--ink)',       cat: 'var(--ink-muted)', bar: 'var(--ink)'  },
    in_progress: { bg: 'var(--paper-raised)', border: 'var(--rust-soft)',   dash: 'solid',  ink: 'var(--ink)',       cat: 'var(--rust)',      bar: 'var(--rust)' },
    available:   { bg: 'transparent',         border: 'var(--rule)',        dash: 'dashed', ink: 'var(--ink)',       cat: 'var(--ink-muted)', bar: null          },
    queued:      { bg: 'transparent',         border: 'var(--rule)',        dash: 'dashed', ink: 'var(--ink-muted)', cat: 'var(--ink-ghost)', bar: null          },
  } as const)[state]

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: s.bg,
        border: `1px ${s.dash} ${s.border}`,
        padding: '11px 12px 12px',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 78,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {(state === 'mastered' || state === 'in_progress') && (
        <div style={{
          position: 'absolute', top: -1, left: -1, right: -1, height: 3,
          background: s.bar!,
        }} />
      )}
      {state === 'queued' && (
        <span style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: 'var(--serif)', fontSize: 14,
          color: 'var(--ink-ghost)',
        }}>◷</span>
      )}
      {cat && (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: s.cat,
        }}>{cat}</div>
      )}
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.25,
        color: s.ink, fontWeight: 500, letterSpacing: '-0.005em',
        marginTop: cat ? 6 : 0,
      }}>{title}</div>
    </div>
  )
}

// ── Constellation (card grid + SVG edges) ──────────────────────────────

function Constellation({ nodes, edges, onNode }: {
  nodes: GraphNode[]
  edges: Edge[]
  onNode?: (n: GraphNode) => void
}) {
  const COL_W = 159
  const COL_GAP = 16
  const ROW_H = 96
  const ROW_GAP = 38
  const PAD_X = 28
  const PAD_Y = 8

  const maxRow = Math.max(...nodes.map(n => n.row))
  const totalH = PAD_Y + (maxRow + 1) * ROW_H + maxRow * ROW_GAP + PAD_Y + 20
  const totalW = PAD_X * 2 + 2 * COL_W + COL_GAP

  const byId = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.id, n])),
    [nodes],
  )

  function center(col: number, row: number, side: 'top' | 'mid' | 'bot' = 'mid') {
    const x = PAD_X + col * (COL_W + COL_GAP) + COL_W / 2
    const yTop = PAD_Y + row * (ROW_H + ROW_GAP)
    return {
      x,
      y: side === 'top' ? yTop : side === 'bot' ? yTop + ROW_H : yTop + ROW_H / 2,
    }
  }

  return (
    <div style={{ position: 'relative', width: totalW, height: totalH, margin: '0 auto' }}>
      <svg
        width={totalW} height={totalH}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      >
        {edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to]
          if (!a || !b) return null
          const sameCol = a.col === b.col
          const pa = center(a.col, a.row, sameCol ? 'bot' : 'mid')
          const pb = center(b.col, b.row, sameCol ? 'top' : 'mid')
          const stroke = e.kind === 'related' ? 'var(--rule-strong)' : 'var(--ink-muted)'
          const dash = e.kind === 'applied' ? '4 4' : e.kind === 'related' ? '2 5' : undefined
          if (sameCol) {
            return (
              <line key={i}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={stroke} strokeWidth="1" strokeDasharray={dash} opacity="0.9"
              />
            )
          }
          const mx = (pa.x + pb.x) / 2
          return (
            <path key={i}
              d={`M ${pa.x} ${pa.y} C ${mx} ${pa.y}, ${mx} ${pb.y}, ${pb.x} ${pb.y}`}
              fill="none" stroke={stroke} strokeWidth="1" strokeDasharray={dash} opacity="0.9"
            />
          )
        })}
      </svg>

      {nodes.map(n => {
        const x = PAD_X + n.col * (COL_W + COL_GAP)
        const y = PAD_Y + n.row * (ROW_H + ROW_GAP)
        return (
          <div key={n.id} style={{ position: 'absolute', left: x, top: y, width: COL_W, height: ROW_H }}>
            <ConceptNode
              title={n.label} cat={n.subtitle} state={n.state}
              onClick={() => onNode?.(n)}
              style={{ height: '100%' }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── ConstellationView ──────────────────────────────────────────────────

function ConstellationView({ onSelect, nodeStates }: {
  onSelect: (slug: string, nodeId: string) => void
  nodeStates: Record<string, NodeState>
}) {
  const nodes = (graphData.nodes as GraphNode[]).map(n => ({
    ...n,
    state: (nodeStates[n.id] ?? n.state) as NodeState,
  }))
  const edges = graphData.edges as Edge[]
  const masteredCount = nodes.filter(n => n.state === 'mastered').length

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ padding: '36px 28px 6px' }}>
        <CategoryLabel>{masteredCount > 0 ? 'Constellation' : 'Begin here'}</CategoryLabel>
        <h1 style={{
          fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600,
          lineHeight: 1.2, letterSpacing: '-0.01em', margin: '14px 0 0',
          color: 'var(--ink)',
        }}>
          {masteredCount > 0 ? 'A growing map.' : 'A small map.'}
        </h1>
        <p style={{
          margin: '8px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.5, maxWidth: 320,
        }}>
          {masteredCount > 0
            ? <>{masteredCount} of {nodes.length} mastered. Tap a concept to keep reading.</>
            : 'Tap a concept to begin reading.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0 28px' }}>
        <Constellation nodes={nodes} edges={edges} onNode={n => onSelect(n.lesson, n.id)} />

        <div style={{
          margin: '24px 28px 0', paddingTop: 16,
          borderTop: '1px solid var(--rule)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 12,
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-muted)',
        }}>
          <div>
            <span style={{
              display: 'inline-block', width: 12, height: 8,
              background: 'var(--paper-raised)', border: '1px solid var(--rule-strong)',
              borderTop: '2px solid var(--ink)', verticalAlign: 'middle', marginRight: 6,
            }} />
            Mastered
          </div>
          <div>
            <span style={{
              display: 'inline-block', width: 12, height: 8,
              background: 'var(--paper-raised)', border: '1px solid var(--rust-soft)',
              borderTop: '2px solid var(--rust)', verticalAlign: 'middle', marginRight: 6,
            }} />
            In progress
          </div>
          <div>
            <span style={{
              display: 'inline-block', width: 12, height: 8,
              border: '1px dashed var(--rule)', verticalAlign: 'middle', marginRight: 6,
            }} />
            Available
          </div>
          <div>
            <span style={{
              display: 'inline-block', width: 12, height: 8,
              border: '1px dashed var(--rule)', verticalAlign: 'middle', marginRight: 6,
            }} />
            Queued ◷
          </div>
          <div style={{ gridColumn: '1 / -1', height: 1, background: 'var(--rule)', margin: '4px 0' }} />
          <div>
            <svg width="20" height="6" style={{ verticalAlign: 'middle', marginRight: 6 }}>
              <line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink-muted)" strokeWidth="1" />
            </svg>
            builds on
          </div>
          <div>
            <svg width="20" height="6" style={{ verticalAlign: 'middle', marginRight: 6 }}>
              <line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink-muted)" strokeWidth="1" strokeDasharray="2 5" />
            </svg>
            related
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 11,
        color: 'var(--ink-ghost)', letterSpacing: '0.08em',
        padding: '10px 28px 14px',
        textTransform: 'uppercase',
        borderTop: '1px solid var(--rule)',
        flexShrink: 0,
      }}>
        <span>Lattice</span>
        <span>{nodes.length} concept{nodes.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ── LessonHeader ───────────────────────────────────────────────────────

function LessonHeader({ title, current, total, noteCount, onBack }: {
  title: string
  current: number
  total: number
  noteCount: number
  onBack: () => void
}) {
  return (
    <div style={{
      padding: '14px 28px 14px',
      borderBottom: '1px solid var(--rule)',
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--paper)',
      flexShrink: 0,
    }}>
      <div
        onClick={onBack}
        style={{
          fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink-muted)',
          lineHeight: 1, cursor: 'pointer', userSelect: 'none', marginTop: -1,
        }}
      >←</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 600,
          letterSpacing: '-0.005em', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2,
        }}>
          {current} / {total}
          {noteCount > 0 ? `  ·  ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}` : ''}
        </div>
      </div>
    </div>
  )
}

// ── PageFolio ──────────────────────────────────────────────────────────

function PageFolio({ left, right }: { left: string; right: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: 'var(--mono)', fontSize: 11,
      color: 'var(--ink-ghost)', letterSpacing: '0.08em',
      padding: '10px 28px 14px',
      textTransform: 'uppercase',
      borderTop: '1px solid var(--rule)',
      flexShrink: 0,
    }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

// ── renderBlock ────────────────────────────────────────────────────────

function renderBlock(block: Block, i: number) {
  if (block.type === 'p') {
    return (
      <p key={i} style={{ margin: '0 0 18px' }}>
        {block.text}
      </p>
    )
  }
  if (block.type === 'math') {
    const html = katex.renderToString(block.tex, {
      displayMode: block.display ?? false,
      throwOnError: false,
    })
    if (block.display) {
      return (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ margin: '14px 0 16px', overflowX: 'auto' }}
        />
      )
    }
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
  }
  if (block.type === 'viz') {
    return (
      <figure key={i} style={{
        margin: '18px 0 4px',
        background: 'var(--paper-raised)',
        border: '1px solid var(--rule)',
        padding: '16px 18px 14px',
      }}>
        <iframe
          src={`${import.meta.env.BASE_URL}lessons/${block.src}`}
          height={block.height}
          style={{ width: '100%', border: 'none', display: 'block' }}
          sandbox="allow-scripts"
          title={block.caption}
        />
        <figcaption style={{
          marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4,
        }}>
          {block.caption}
        </figcaption>
      </figure>
    )
  }
  return null
}

// ── NoteInput ──────────────────────────────────────────────────────────

function NoteInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(value.trim().length > 0)

  return (
    <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 14, marginTop: 24 }}>
      {!open ? (
        <div
          onClick={() => setOpen(true)}
          style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 14, color: 'var(--ink-muted)', cursor: 'pointer',
          }}
        >
          + note something to revisit
        </div>
      ) : (
        <div>
          <CategoryLabel>Note for the queue</CategoryLabel>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="what do you want to revisit?"
            rows={2}
            style={{
              display: 'block', width: '100%',
              fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic',
              color: 'var(--ink)',
              border: 'none', borderBottom: '1px solid var(--ink)',
              padding: '10px 0 8px', marginTop: 12,
              background: 'transparent',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          {!value.trim() && (
            <div
              onClick={() => setOpen(false)}
              style={{
                fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                color: 'var(--ink-ghost)', cursor: 'pointer', marginTop: 8,
              }}
            >cancel</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SectionQuiz ────────────────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function SectionQuiz({ quiz, quizLabel, selectedIndex, onAnswer, onContinue }: {
  quiz: Quiz
  quizLabel: string
  selectedIndex: number | null
  onAnswer: (index: number) => void
  onContinue: () => void
}) {
  const answered = selectedIndex !== null
  const correct = answered && selectedIndex === quiz.correctIndex

  return (
    <div style={{ marginTop: 36 }}>
      <CategoryLabel style={{ marginBottom: 14 }}>Quick check</CategoryLabel>
      <HammingHeading num={quizLabel} style={{ marginBottom: 16 }}>
        {quiz.question}
      </HammingHeading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {quiz.options.map((opt, i) => {
          const isPicked = answered && selectedIndex === i
          const isCorrect = i === quiz.correctIndex
          const isRight = isCorrect && answered
          const isWrong = isPicked && !isCorrect
          return (
            <div
              key={i}
              onClick={() => !answered && onAnswer(i)}
              style={{
                border: '1px solid ' + (isWrong ? 'var(--warning)' : isRight ? 'var(--olive)' : 'var(--rule-strong)'),
                background: isWrong ? 'rgba(153,51,34,0.06)' : isRight ? 'rgba(63,107,58,0.07)' : 'transparent',
                padding: '12px 14px',
                display: 'flex', gap: 14, alignItems: 'baseline',
                cursor: answered ? 'default' : 'pointer',
                opacity: answered && !isPicked && !isRight ? 0.5 : 1,
              }}
            >
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 12,
                color: isWrong ? 'var(--warning)' : isRight ? 'var(--olive)' : 'var(--ink-muted)',
                letterSpacing: '0.06em',
              }}>{OPTION_LETTERS[i]}</span>
              <span style={{
                fontFamily: 'var(--serif)', fontSize: 16,
                color: 'var(--ink)', lineHeight: 1.4, flex: 1,
              }}>{opt}</span>
              {isRight && <span style={{ color: 'var(--olive)' }}>✓</span>}
              {isWrong && <span style={{ color: 'var(--warning)' }}>✗</span>}
            </div>
          )
        })}
      </div>

      {answered && (
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <CategoryLabel style={{ marginBottom: 12 }}>
            {correct ? '✓ Right' : '✗ Not quite'}
          </CategoryLabel>
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.55, color: 'var(--ink)' }}>
            {quiz.explanation}
          </p>
          <ContinueBtn onClick={onContinue} style={{ marginTop: 24 }} />
        </div>
      )}
    </div>
  )
}

// ── formatNotes ────────────────────────────────────────────────────────

function formatNotesForClipboard(lesson: Lesson, notes: Record<string, string>): string {
  return lesson.sections
    .filter(s => notes[s.id]?.trim())
    .map(s => `- ${notes[s.id].trim()} (${lesson.title}, ${s.heading})`)
    .join('\n')
}

// ── LessonView ─────────────────────────────────────────────────────────

function LessonView({ lesson, onBack, onComplete }: { lesson: Lesson; onBack: () => void; onComplete: () => void }) {
  const notesKey = `lattice_notes_${lesson.slug}`
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(notesKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })
  const [copied, setCopied] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [sectionIndex, setSectionIndex] = useState(-1)
  const [showReview, setShowReview] = useState(false)

  const totalSections = lesson.sections.length
  const totalPages = totalSections + 1
  const currentPage = sectionIndex + 2
  const noteCount = lesson.sections.filter(s => notes[s.id]?.trim()).length
  const nonEmptyNotes = lesson.sections.filter(s => notes[s.id]?.trim())

  const quizLabels: Record<string, string> = {}
  let quizCounter = 0
  lesson.sections.forEach(s => {
    if (s.hasQuiz) {
      quizCounter++
      const sNum = parseInt(s.id.replace('s', ''), 10)
      quizLabels[s.id] = `${sNum}.${quizCounter}`
    }
  })

  const currentSection = sectionIndex >= 0 ? lesson.sections[sectionIndex] : null
  const currentSectionNum = currentSection ? parseInt(currentSection.id.replace('s', ''), 10) : null

  function handleContinue() {
    if (sectionIndex < totalSections - 1) {
      setSectionIndex(prev => prev + 1)
    } else {
      setShowReview(true)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(formatNotesForClipboard(lesson, notes)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const wrapper: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    height: '100dvh',
    maxWidth: 660, margin: '0 auto',
  }

  const folioRight = currentSection
    ? `§ ${currentSectionNum} — ${currentPage} / ${totalPages}`
    : `${currentPage} / ${totalPages}`

  if (showReview) {
    return (
      <div style={wrapper}>
        <LessonHeader
          title={lesson.title}
          current={totalPages}
          total={totalPages}
          noteCount={noteCount}
          onBack={() => setShowReview(false)}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 3rem' }}>
          <CategoryLabel style={{ marginBottom: 14 }}>Your notes</CategoryLabel>
          <HammingHeading style={{ marginBottom: 18 }}>
            {nonEmptyNotes.length > 0
              ? `${nonEmptyNotes.length} ${nonEmptyNotes.length === 1 ? 'thing' : 'things'} to revisit`
              : 'No notes taken'}
          </HammingHeading>

          {nonEmptyNotes.length > 0 ? (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0' }}>
                {nonEmptyNotes.map(s => (
                  <li key={s.id} style={{
                    padding: '14px 0',
                    borderTop: '1px solid var(--rule)',
                  }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 10.5,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--ink-muted)', marginBottom: 6,
                    }}>{s.heading}</div>
                    <div style={{
                      fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.45, color: 'var(--ink)',
                    }}>— {notes[s.id].trim()}</div>
                  </li>
                ))}
              </ul>
              <div
                onClick={handleCopy}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid var(--ink)', padding: '11px 14px',
                  cursor: 'pointer', marginTop: 22,
                  background: copied ? 'var(--paper-raised)' : 'transparent',
                }}
              >
                <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500 }}>
                  {copied ? 'Copied to clipboard' : `Copy all ${nonEmptyNotes.length} ↗`}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10.5,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                }}>{copied ? '✓' : 'plain text'}</span>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: 14 }}>
              Nothing flagged this time.
            </p>
          )}

          <ContinueBtn label="Back to constellation" onClick={onComplete} />
        </div>
        <PageFolio left={lesson.title} right="Notes" />
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <LessonHeader
        title={lesson.title}
        current={currentPage}
        total={totalPages}
        noteCount={noteCount}
        onBack={onBack}
      />
      <div key={sectionIndex} style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 3rem' }}>
        {sectionIndex === -1 ? (
          <>
            <CategoryLabel style={{ marginBottom: 14 }}>{lesson.node.subtitle}</CategoryLabel>
            <h1 style={{
              fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600,
              lineHeight: 1.2, letterSpacing: '-0.01em', margin: '14px 0 0',
              color: 'var(--ink)',
            }}>
              {lesson.title}
            </h1>
            <p style={{
              margin: '16px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic',
              color: 'var(--ink-muted)', lineHeight: 1.6, fontSize: 16,
            }}>
              {lesson.intro}
            </p>
            <ContinueBtn label="Begin" onClick={handleContinue} />
          </>
        ) : (
          <>
            <CategoryLabel style={{ marginBottom: 14 }}>
              Section {currentSectionNum}
            </CategoryLabel>
            <HammingHeading num={String(currentSectionNum)} style={{ marginBottom: 18 }}>
              {currentSection!.heading}
            </HammingHeading>
            {(currentSection!.blocks as Block[]).map((block, i) => renderBlock(block, i))}
            <NoteInput
              value={notes[currentSection!.id] ?? ''}
              onChange={v => setNotes(prev => {
                const next = { ...prev, [currentSection!.id]: v }
                try { localStorage.setItem(notesKey, JSON.stringify(next)) } catch {}
                return next
              })}
            />
            {currentSection!.hasQuiz && currentSection!.quiz ? (
              <SectionQuiz
                quiz={currentSection!.quiz}
                quizLabel={quizLabels[currentSection!.id]}
                selectedIndex={quizAnswers[currentSection!.id] ?? null}
                onAnswer={index => setQuizAnswers(prev => ({ ...prev, [currentSection!.id]: index }))}
                onContinue={handleContinue}
              />
            ) : (
              <ContinueBtn
                label={sectionIndex < totalSections - 1 ? `Continue to §${currentSectionNum! + 1}` : 'Finish lesson'}
                onClick={handleContinue}
              />
            )}
          </>
        )}
      </div>
      <PageFolio left={lesson.title} right={folioRight} />
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────

function App() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>(loadNodeStates)

  async function handleSelect(slug: string, nodeId: string) {
    if ((nodeStates[nodeId] ?? 'available') !== 'mastered') {
      setNodeStates(prev => persistNodeState(nodeId, 'in_progress', prev))
    }
    const mod = await lessonModules[`../lessons/${slug}.json`]()
    setLesson(mod.default)
  }

  if (lesson) {
    return (
      <LessonView
        lesson={lesson}
        onBack={() => setLesson(null)}
        onComplete={() => {
          setNodeStates(prev => persistNodeState(lesson.node.id, 'mastered', prev))
          setLesson(null)
        }}
      />
    )
  }

  return <ConstellationView onSelect={handleSelect} nodeStates={nodeStates} />
}

export default App
