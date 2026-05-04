import { useState } from 'react'
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
  kind: 'extends' | 'related'
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

function renderBlock(block: Block, i: number) {
  if (block.type === 'p') {
    return <p key={i} style={{ margin: '0 0 1.25rem' }}>{block.text}</p>
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
          style={{ margin: '1.75rem 0', overflowX: 'auto' }}
        />
      )
    }
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
  }
  if (block.type === 'viz') {
    return (
      <figure key={i} style={{ margin: '1.75rem 0' }}>
        <iframe
          src={`${import.meta.env.BASE_URL}lessons/${block.src}`}
          height={block.height}
          style={{ width: '100%', border: 'none', display: 'block' }}
          sandbox="allow-scripts"
          title={block.caption}
        />
        <figcaption style={{
          fontSize: '0.8rem',
          color: '#666',
          marginTop: '0.5rem',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {block.caption}
        </figcaption>
      </figure>
    )
  }
  return null
}

const CELL_W = 180
const CELL_H = 160
const NODE_R = 28
const PAD_X = 90
const PAD_Y = 80

function nodeCenter(node: GraphNode) {
  return {
    x: PAD_X + node.col * CELL_W,
    y: PAD_Y + node.row * CELL_H,
  }
}

function nodeById(nodes: GraphNode[], id: string) {
  return nodes.find(n => n.id === id)!
}

function circleFill(state: NodeState) {
  if (state === 'mastered') return '#9c3a22'
  if (state === 'in_progress') return '#e8d5c4'
  return '#f4eee2'
}

function circleStrokeWidth(state: NodeState) {
  if (state === 'in_progress') return 2.5
  return 1.5
}

function ConstellationView({
  onSelect,
  nodeStates,
}: {
  onSelect: (slug: string, nodeId: string) => void
  nodeStates: Record<string, NodeState>
}) {
  const nodes = graphData.nodes as GraphNode[]
  const edges = graphData.edges as Edge[]

  const maxCol = Math.max(...nodes.map(n => n.col))
  const maxRow = Math.max(...nodes.map(n => n.row))

  const W = PAD_X + maxCol * CELL_W + PAD_X
  const H = PAD_Y + maxRow * CELL_H + 90

  return (
    <main style={{ maxWidth: 660, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      <header style={{ marginBottom: '3rem', borderBottom: '1px solid #d8cfc0', paddingBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Lattice
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: '#888', fontSize: '0.875rem' }}>
          {nodes.length} concept{nodes.length !== 1 ? 's' : ''}
        </p>
      </header>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Concept constellation"
      >
        <defs>
          <marker id="arrow-extends" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0.5 L0,6.5 L6,3.5 z" fill="#c4b49a" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const from = nodeById(nodes, edge.from)
          const to = nodeById(nodes, edge.to)
          const { x: x1, y: y1 } = nodeCenter(from)
          const { x: x2, y: y2 } = nodeCenter(to)
          const dx = x2 - x1
          const dy = y2 - y1
          const d = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / d
          const ny = dy / d
          const arrowGap = edge.kind === 'extends' ? NODE_R + 8 : NODE_R
          return (
            <line
              key={i}
              x1={x1 + nx * NODE_R}
              y1={y1 + ny * NODE_R}
              x2={x2 - nx * arrowGap}
              y2={y2 - ny * arrowGap}
              stroke="#c4b49a"
              strokeWidth={edge.kind === 'extends' ? 1.5 : 1}
              strokeDasharray={edge.kind === 'related' ? '5,4' : undefined}
              markerEnd={edge.kind === 'extends' ? 'url(#arrow-extends)' : undefined}
            />
          )
        })}

        {nodes.map(node => {
          const { x, y } = nodeCenter(node)
          const state = nodeStates[node.id] ?? node.state
          const labelColor = state === 'mastered' ? '#f4eee2' : '#3a2c1a'
          return (
            <g
              key={node.id}
              onClick={() => onSelect(node.lesson, node.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={node.label}
            >
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill={circleFill(state)}
                stroke="#9c3a22"
                strokeWidth={circleStrokeWidth(state)}
                strokeDasharray={state === 'queued' ? '4,3' : undefined}
              />
              {state === 'mastered' && (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={labelColor}
                  fontSize={14}
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  ✓
                </text>
              )}
              <text
                x={x}
                y={y + NODE_R + 16}
                textAnchor="middle"
                fill="#3a2c1a"
                fontSize={12}
                fontFamily="'Source Serif 4', Georgia, serif"
                fontWeight={600}
              >
                {node.label}
              </text>
              <text
                x={x}
                y={y + NODE_R + 29}
                textAnchor="middle"
                fill="#888"
                fontSize={9}
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.05em"
              >
                {node.subtitle}
              </text>
            </g>
          )
        })}
      </svg>
    </main>
  )
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function SectionQuiz({
  quiz,
  quizLabel,
  selectedIndex,
  onAnswer,
  onContinue,
}: {
  quiz: Quiz
  quizLabel: string
  selectedIndex: number | null
  onAnswer: (index: number) => void
  onContinue: () => void
}) {
  const answered = selectedIndex !== null
  const correct = answered && selectedIndex === quiz.correctIndex

  return (
    <div style={{ margin: '2rem 0 0' }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#9c3a22',
        marginBottom: '0.5rem',
        fontWeight: 500,
      }}>
        Quick check
      </div>
      <div style={{ width: '2rem', borderBottom: '1px solid #9c3a22', marginBottom: '1.25rem' }} />

      <p style={{ margin: '0 0 1rem', fontSize: '1.05rem', lineHeight: 1.4 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.85rem',
          color: '#888',
          marginRight: '0.5rem',
        }}>
          {quizLabel}
        </span>
        <strong>{quiz.question}</strong>
      </p>

      {quiz.options.map((opt, i) => {
        const isCorrect = i === quiz.correctIndex
        const dimmed = answered && !isCorrect
        return (
          <button
            key={i}
            onClick={() => { if (!answered) onAnswer(i) }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 0.875rem',
              marginBottom: '0.5rem',
              background: answered && isCorrect ? '#eaf2e8' : '#f4eee2',
              border: `1px solid ${answered && isCorrect ? '#6a9a6a' : '#d8cfc0'}`,
              borderRadius: 0,
              cursor: answered ? 'default' : 'pointer',
              textAlign: 'left',
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: '0.95rem',
              lineHeight: 1.5,
              color: dimmed ? '#b8ae9e' : '#3a2c1a',
            }}
          >
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: dimmed ? '#c8c0b0' : '#888',
              minWidth: '1rem',
              paddingTop: '0.1rem',
            }}>
              {OPTION_LETTERS[i]}
            </span>
            <span style={{ flex: 1 }}>{opt}</span>
            {answered && isCorrect && (
              <span style={{ color: '#6a9a6a' }}>✓</span>
            )}
          </button>
        )
      })}

      {answered && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d8cfc0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: correct ? '#6a9a6a' : '#9c3a22',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}>
            {correct ? '✓ Right' : '✗ Wrong'}
          </div>
          <div style={{ width: '2rem', borderBottom: '1px solid #d8cfc0', marginBottom: '0.875rem' }} />
          <p style={{ margin: '0 0 1.25rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {quiz.explanation}
          </p>
          <button
            onClick={onContinue}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: '1rem',
              color: '#9c3a22',
            }}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}

function formatNotesForClipboard(lesson: Lesson, notes: Record<string, string>): string {
  return lesson.sections
    .filter(s => notes[s.id]?.trim())
    .map(s => `- ${notes[s.id].trim()} (${lesson.title}, ${s.heading})`)
    .join('\n')
}

const noteInputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '1.5rem',
  padding: '0.5rem 0.625rem',
  fontFamily: "'Source Serif 4', Georgia, serif",
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: '#3a2c1a',
  background: '#faf7f1',
  border: '1px solid #d8cfc0',
  borderRadius: 0,
  resize: 'vertical',
  boxSizing: 'border-box',
  outline: 'none',
}

function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  // -1 = intro page, 0..N-1 = section pages
  const [sectionIndex, setSectionIndex] = useState(-1)
  const [showReview, setShowReview] = useState(false)

  const totalSections = lesson.sections.length
  const totalPages = totalSections + 1 // intro + sections
  const currentPage = sectionIndex + 2 // intro=1, section[0]=2, …
  const noteCount = lesson.sections.filter(s => notes[s.id]?.trim()).length
  const nonEmptyNotes = lesson.sections.filter(s => notes[s.id]?.trim())

  const quizLabels: Record<string, string> = {}
  let quizCount = 0
  lesson.sections.forEach(s => {
    if (s.hasQuiz) {
      quizCount++
      const sectionNum = parseInt(s.id.replace('s', ''), 10)
      quizLabels[s.id] = `${sectionNum}.${quizCount}`
    }
  })

  const currentSection = sectionIndex >= 0 ? lesson.sections[sectionIndex] : null
  const currentSectionNum = currentSection ? parseInt(currentSection.id.replace('s', ''), 10) : null
  const sectionLabel = currentSection
    ? (quizLabels[currentSection.id] ?? String(currentSectionNum))
    : null

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

  const monoSm: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 500,
  }

  const header = (
    <div style={{
      padding: '0.875rem 1.5rem 0.75rem',
      borderBottom: '1px solid #d8cfc0',
      background: '#f4eee2',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.9rem',
            color: '#9c3a22',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <span style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: '1.05rem',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {lesson.title}
        </span>
      </div>
      {!showReview && (
        <div style={{
          ...monoSm,
          color: '#888',
          marginTop: '0.2rem',
          paddingLeft: '1.625rem',
        }}>
          {currentPage} / {totalPages}
          {noteCount > 0 ? ` · ${noteCount} NOTE${noteCount !== 1 ? 'S' : ''}` : ''}
        </div>
      )}
    </div>
  )

  const footer = (
    <div style={{
      padding: '0.5rem 1.5rem 0.625rem',
      borderTop: '1px solid #d8cfc0',
      background: '#f4eee2',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.375rem',
      }}>
        <span style={{ ...monoSm, color: '#aaa', fontSize: '0.65rem' }}>
          {lesson.title}
        </span>
        <span style={{ ...monoSm, color: '#aaa', fontSize: '0.65rem', textTransform: 'none' }}>
          {sectionLabel ? `§ ${sectionLabel} — ` : ''}{currentPage} / {totalPages}
        </span>
      </div>
      <div style={{ height: '2px', background: '#e8ddd0' }}>
        <div style={{
          height: '100%',
          width: `${(currentPage / totalPages) * 100}%`,
          background: '#9c3a22',
          transition: 'width 0.25s ease',
        }} />
      </div>
    </div>
  )

  const wrapper: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: 660,
    margin: '0 auto',
  }

  if (showReview) {
    return (
      <div style={wrapper}>
        {header}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 3rem' }}>
          <div style={{ ...monoSm, color: '#9c3a22', marginBottom: '1rem' }}>
            Your notes
          </div>
          {nonEmptyNotes.length > 0 ? (
            <>
              <ul style={{ margin: '0 0 1.25rem', padding: '0 0 0 1.25rem' }}>
                {nonEmptyNotes.map(s => (
                  <li key={s.id} style={{ marginBottom: '0.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <span style={{ color: '#888', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s.heading}:{' '}
                    </span>
                    {notes[s.id].trim()}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: '1px solid #9c3a22',
                  padding: '0.4rem 0.9rem',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#9c3a22',
                  marginBottom: '2.5rem',
                  display: 'block',
                }}
              >
                {copied ? 'Copied' : 'Copy to wishlist'}
              </button>
            </>
          ) : (
            <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '2.5rem' }}>No notes taken.</p>
          )}
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: '1rem',
              color: '#9c3a22',
            }}
          >
            ← Back to constellation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      {header}
      <div key={sectionIndex} style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 3rem' }}>
        {sectionIndex === -1 ? (
          <>
            <div style={{ ...monoSm, color: '#9c3a22', marginBottom: '0.6rem' }}>
              {lesson.node.subtitle}
            </div>
            <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.875rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {lesson.title}
            </h1>
            <p style={{ margin: '0 0 2.5rem', fontStyle: 'italic', color: '#555', lineHeight: 1.6, fontSize: '1rem' }}>
              {lesson.intro}
            </p>
            <button
              onClick={handleContinue}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1rem', color: '#9c3a22' }}
            >
              Begin →
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.25rem', color: '#9c3a22' }}>
              {currentSection!.heading}
            </h2>
            {(currentSection!.blocks as Block[]).map((block, i) => renderBlock(block, i))}
            <textarea
              value={notes[currentSection!.id] ?? ''}
              onChange={e => setNotes(prev => ({ ...prev, [currentSection!.id]: e.target.value }))}
              placeholder="Add a note..."
              rows={2}
              style={noteInputStyle}
              onFocus={e => { e.target.style.borderColor = '#9c3a22' }}
              onBlur={e => { e.target.style.borderColor = '#d8cfc0' }}
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
              <button
                onClick={handleContinue}
                style={{ background: 'none', border: 'none', padding: '1.5rem 0 0', cursor: 'pointer', fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1rem', color: '#9c3a22', display: 'block' }}
              >
                Continue →
              </button>
            )}
          </>
        )}
      </div>
      {footer}
    </div>
  )
}

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
    return <LessonView lesson={lesson} onBack={() => setLesson(null)} />
  }

  return <ConstellationView onSelect={handleSelect} nodeStates={nodeStates} />
}

export default App
