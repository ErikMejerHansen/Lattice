import katex from 'katex'
import 'katex/dist/katex.min.css'
import lesson from '../lessons/2026-05-04-wavelength.json'

type Block =
  | { type: 'p'; text: string }
  | { type: 'math'; tex: string; display?: boolean }
  | { type: 'viz'; src: string; height: number; caption: string }

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

function App() {
  return (
    <main style={{ maxWidth: 660, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
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

export default App
