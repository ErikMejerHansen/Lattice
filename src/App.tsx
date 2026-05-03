import { useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import manifest from '../lessons/manifest.json'

type ManifestEntry = {
  slug: string
  title: string
  subtitle: string
  date: string
  estimatedReadingMinutes: number
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

// Matches date-prefixed lesson files only, not manifest.json
const lessonModules = import.meta.glob<{ default: Lesson }>('../lessons/20*.json')

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
  // viz blocks handled in slice 7
  return null
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function LessonList({ onSelect }: { onSelect: (slug: string) => void }) {
  const entries = manifest as ManifestEntry[]
  return (
    <main style={{ maxWidth: 660, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      <header style={{ marginBottom: '3rem', borderBottom: '1px solid #d8cfc0', paddingBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Lattice
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: '#888', fontSize: '0.875rem' }}>
          {entries.length} lesson{entries.length !== 1 ? 's' : ''}
        </p>
      </header>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((entry, i) => (
          <li
            key={entry.slug}
            onClick={() => onSelect(entry.slug)}
            style={{
              cursor: 'pointer',
              padding: '1.25rem 0',
              borderBottom: i < entries.length - 1 ? '1px solid #d8cfc0' : 'none',
            }}
          >
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#9c3a22',
              marginBottom: '0.4rem',
            }}>
              {entry.subtitle}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.35rem' }}>
              {entry.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              {formatDate(entry.date)} · {entry.estimatedReadingMinutes} min read
            </div>
          </li>
        ))}
      </ul>
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
        ← All lessons
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

  async function handleSelect(slug: string) {
    const mod = await lessonModules[`../lessons/${slug}.json`]()
    setLesson(mod.default)
  }

  if (lesson) {
    return <LessonView lesson={lesson} onBack={() => setLesson(null)} />
  }

  return <LessonList onSelect={handleSelect} />
}

export default App
