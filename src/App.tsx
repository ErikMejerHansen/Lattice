import { useState } from 'react'
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

type Lesson = {
  slug: string
  title: string
  node: { id: string; label: string; subtitle: string }
  intro: string
  sections: Array<{
    id: string
    heading: string
    blocks: Block[]
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

function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  return (
    <main style={{ maxWidth: 660, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#9c3a22',
          marginBottom: '2rem',
          display: 'block',
        }}
      >
        ← Constellation
      </button>

      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9c3a22',
          marginBottom: '0.6rem',
        }}>
          {lesson.node.subtitle}
        </div>
        <h1 style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {lesson.title}
        </h1>
      </header>

      <article>
        <p style={{ margin: '0 0 2rem', fontStyle: 'italic', color: '#555' }}>
          {lesson.intro}
        </p>
        {lesson.sections.map(section => (
          <section key={section.id} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              margin: '0 0 1rem',
              color: '#9c3a22',
            }}>
              {section.heading}
            </h2>
            {(section.blocks as Block[]).map((block, i) => renderBlock(block, i))}
          </section>
        ))}
      </article>
    </main>
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
