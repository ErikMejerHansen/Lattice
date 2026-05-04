/* Lattice — components & screens
   All screens render at 390 (iPhone-ish) inside an IOSDevice frame.
*/

const { useState, useMemo, useEffect, useRef } = React;

/* ───────────────────────── primitives ───────────────────────── */

function CategoryLabel({ children, style }) {
  return (
    <div style={style}>
      <div className="cat">{children}</div>
      <div className="cat-rule" />
    </div>
  );
}

function HammingHeading({ num, children, style }) {
  return (
    <h2 className="h-section" style={style}>
      {num != null && <span className="num">{num}</span>}
      {children}
    </h2>
  );
}

function Continue({ label = "Continue", onClick, style }) {
  return (
    <div
      className="continue press"
      onClick={onClick}
      role="button"
      style={style}
    >
      <span>{label}</span>
      <span className="arr">→</span>
    </div>
  );
}

function ChoiceButton({ children, variant = 'ghost', onClick, style }) {
  const filled = variant === 'filled';
  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
        fontFamily: 'var(--serif)',
        fontSize: 16,
        padding: '13px 18px',
        background: filled ? 'var(--ink)' : 'transparent',
        color: filled ? 'var(--paper)' : 'var(--ink)',
        border: filled ? '1px solid var(--ink)' : '1px solid var(--rule-strong)',
        borderRadius: 2,
        letterSpacing: '0.005em',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* small animated horizontal line for loading */
function LoadingLine() {
  return (
    <div style={{
      position: 'relative',
      width: 120, height: 1, background: 'var(--rule)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, height: 1, width: 36,
        background: 'var(--rust)',
        animation: 'lattice-load 1.6s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes lattice-load {
          0% { transform: translateX(-36px); }
          50% { transform: translateX(120px); }
          100% { transform: translateX(-36px); }
        }
      `}</style>
    </div>
  );
}

/* page chrome — folio numbers like a book */
function PageFolio({ left, right, top = false, foot = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontFamily: 'var(--mono)', fontSize: 11,
      color: 'var(--ink-ghost)', letterSpacing: '0.08em',
      padding: foot ? '0 28px 14px' : ((top ? '58px' : '14px') + ' 28px 0'),
      textTransform: 'uppercase',
      borderTop: foot ? '1px solid var(--rule)' : 'none',
      paddingTop: foot ? 10 : undefined,
      marginTop: foot ? 'auto' : 0,
    }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

/* ───────────────────────── ConceptNode ───────────────────────── */

/* states: mastered | in_progress | available | queued */
function ConceptNode({ title, state = 'available', cat, onClick, style }) {
  const styles = {
    mastered: {
      bg: 'var(--paper-raised)', border: 'var(--rule-strong)',
      ink: 'var(--ink)', cat: 'var(--ink-muted)', glyph: null,
      bar: 'var(--ink)',
    },
    in_progress: {
      bg: 'var(--paper-raised)', border: 'var(--rust-soft)',
      ink: 'var(--ink)', cat: 'var(--rust)', glyph: null,
      bar: 'var(--rust-soft)',
    },
    available: {
      bg: 'transparent', border: 'var(--rule)',
      ink: 'var(--ink)', cat: 'var(--ink-muted)', glyph: null,
      bar: null,
    },
    queued: {
      bg: 'transparent', border: 'var(--rule)',
      ink: 'var(--ink-muted)', cat: 'var(--ink-ghost)', glyph: '◷',
      bar: null,
    },
  }[state];

  return (
    <div
      className="press"
      onClick={onClick}
      style={{
        position: 'relative',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderStyle: state === 'available' || state === 'queued' ? 'dashed' : 'solid',
        padding: '11px 12px 12px',
        cursor: 'pointer',
        minHeight: 78,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        ...style,
      }}
    >
      {state === 'mastered' && (
        <div style={{
          position: 'absolute', top: -1, left: -1, right: -1, height: 3,
          background: 'var(--ink)',
        }} />
      )}
      {state === 'in_progress' && (
        <div style={{
          position: 'absolute', top: -1, left: -1, right: -1, height: 3,
          background: 'var(--rust)',
        }} />
      )}
      {styles.glyph && (
        <span style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: 'var(--serif)', fontSize: 14,
          color: 'var(--ink-ghost)',
        }}>{styles.glyph}</span>
      )}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: styles.cat,
      }}>{cat}</div>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.25,
        color: styles.ink, fontWeight: 500, letterSpacing: '-0.005em',
        marginTop: 6,
      }}>{title}</div>
    </div>
  );
}

/* ───────────────────────── Constellation ─────────────────────────
   Two-column grid; we lay out edges using SVG drawn over the grid.
   Each node has an integer (col, row) coordinate.
*/

function Constellation({ nodes, edges, onNode }) {
  // grid params
  const COL_W = 159;        // column width
  const COL_GAP = 16;
  const ROW_H = 96;
  const ROW_GAP = 38;       // generous breathing room between rows
  const PAD_X = 28;
  const PAD_Y = 8;
  const NODE_W = COL_W;
  const NODE_H = ROW_H;

  const maxRow = Math.max(...nodes.map(n => n.row));
  const totalH = PAD_Y + (maxRow + 1) * ROW_H + maxRow * ROW_GAP + PAD_Y;
  const totalW = PAD_X * 2 + 2 * COL_W + COL_GAP;

  const center = (col, row, side = 'mid') => {
    const x = PAD_X + col * (COL_W + COL_GAP) + COL_W / 2;
    const yTop = PAD_Y + row * (ROW_H + ROW_GAP);
    const y = side === 'top' ? yTop
            : side === 'bot' ? yTop + ROW_H
            : yTop + ROW_H / 2;
    return { x, y };
  };

  const byId = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div style={{ position: 'relative', width: totalW, height: totalH, margin: '0 auto' }}>
      {/* edges layer */}
      <svg
        width={totalW} height={totalH}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to];
          if (!a || !b) return null;
          const sameCol = a.col === b.col;
          const pa = center(a.col, a.row, sameCol ? 'bot' : 'mid');
          const pb = center(b.col, b.row, sameCol ? 'top' : 'mid');
          const stroke = e.type === 'related' ? 'var(--rule-strong)' : 'var(--ink-muted)';
          const dash = e.type === 'applied' ? '4 4'
                      : e.type === 'related' ? '2 5'
                      : 'none';
          if (sameCol) {
            return <line key={i}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={stroke} strokeWidth="1" strokeDasharray={dash}
              opacity="0.9"
            />;
          }
          // diagonal between columns: gentle curve
          const mx = (pa.x + pb.x) / 2;
          return <path key={i}
            d={`M ${pa.x} ${pa.y} C ${mx} ${pa.y}, ${mx} ${pb.y}, ${pb.x} ${pb.y}`}
            fill="none" stroke={stroke} strokeWidth="1" strokeDasharray={dash}
            opacity="0.9"
          />;
        })}
      </svg>
      {/* nodes layer */}
      {nodes.map(n => {
        const x = PAD_X + n.col * (COL_W + COL_GAP);
        const y = PAD_Y + n.row * (ROW_H + ROW_GAP);
        return (
          <div key={n.id} style={{
            position: 'absolute', left: x, top: y, width: NODE_W, height: NODE_H,
          }}>
            <ConceptNode
              title={n.title} cat={n.cat} state={n.state}
              onClick={() => onNode && onNode(n)}
              style={{ height: '100%' }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── LessonHeader ───────────────────────── */

function LessonHeader({ title, progress, notes, onBack }) {
  return (
    <div style={{
      padding: '58px 28px 14px',
      borderBottom: '1px solid var(--rule)',
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--paper)',
    }}>
      <div onClick={onBack} className="press" style={{
        fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink-muted)',
        lineHeight: 1, cursor: 'pointer', marginTop: -1,
      }}>←</div>
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
          {progress[0]} / {progress[1]}
          {notes != null && <>  ·  {notes} {notes === 1 ? 'note' : 'notes'}</>}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── VizCard (Planck slider) ───────────────────────── */

function PlanckViz() {
  const [T, setT] = useState(5800);
  // Planck's law shape — peak shifts with T (Wien)
  const W = 280, H = 130, PAD_L = 10, PAD_R = 8, PAD_T = 6, PAD_B = 14;
  const peakLambda = 2.898e6 / T; // nm
  const lamMin = 100, lamMax = 2000;
  const samples = 80;
  const pts = [];
  let maxI = 0;
  const intensities = [];
  for (let i = 0; i <= samples; i++) {
    const lam = lamMin + (i / samples) * (lamMax - lamMin);
    // simplified Planck shape (arbitrary units)
    const c1 = 3.7418e-16, c2 = 1.4388e-2;
    const lamM = lam * 1e-9;
    const exp = Math.exp(c2 / (lamM * T));
    const I = (c1 / Math.pow(lamM, 5)) / (exp - 1);
    intensities.push(I);
    if (I > maxI) maxI = I;
  }
  for (let i = 0; i <= samples; i++) {
    const lam = lamMin + (i / samples) * (lamMax - lamMin);
    const x = PAD_L + ((lam - lamMin) / (lamMax - lamMin)) * (W - PAD_L - PAD_R);
    const y = PAD_T + (1 - intensities[i] / maxI) * (H - PAD_T - PAD_B);
    pts.push([x, y]);
  }
  const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  // peak marker
  const peakX = PAD_L + ((peakLambda - lamMin) / (lamMax - lamMin)) * (W - PAD_L - PAD_R);

  return (
    <figure style={{
      background: 'var(--paper-raised)',
      border: '1px solid var(--rule)',
      padding: '16px 18px 14px',
      margin: '8px 0 4px',
    }}>
      <CategoryLabel style={{ marginBottom: 12 }}>Figure 3.1 — Planck spectrum</CategoryLabel>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* axes */}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--ink)" strokeWidth="0.7" />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--ink)" strokeWidth="0.7" />
        {/* gridline at peak */}
        <line x1={peakX} y1={PAD_T} x2={peakX} y2={H - PAD_B}
          stroke="var(--rust)" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.9" />
        {/* curve */}
        <path d={path} fill="none" stroke="var(--rust)" strokeWidth="1.4"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* axis labels */}
        <text x={W - PAD_R} y={H - 2} textAnchor="end"
          fontFamily="var(--mono)" fontSize="8" fill="var(--ink-muted)">λ (nm)</text>
        <text x={PAD_L + 3} y={PAD_T + 8}
          fontFamily="var(--mono)" fontSize="8" fill="var(--ink-muted)">B(λ,T)</text>
        <text x={peakX} y={PAD_T + 8} textAnchor="middle"
          fontFamily="var(--mono)" fontSize="8" fill="var(--rust)">
          {Math.round(peakLambda)}
        </text>
      </svg>
      {/* slider row */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--ink-muted)',
        }}>temperature</span>
        <input type="range" min="2000" max="9000" step="100" value={T}
          onChange={e => setT(+e.target.value)}
          className="lattice-slider"
          style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)',
          letterSpacing: '0.04em', minWidth: 52, textAlign: 'right',
        }}>{T} K</span>
      </div>
      <figcaption style={{
        marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic',
        fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4,
      }}>
        Spectral radiance of a black body. Drag to feel Wien's law: hotter
        bodies peak at shorter wavelengths.
      </figcaption>
    </figure>
  );
}

/* ───────────────────────── inline math (faux KaTeX) ───────────────────────── */

function MathSpan({ children, display }) {
  return (
    <span style={{
      fontFamily: 'KaTeX_Main, "Source Serif 4", serif',
      fontStyle: display ? 'normal' : 'italic',
      letterSpacing: '0.01em',
      ...(display ? {
        display: 'block',
        textAlign: 'center',
        margin: '14px 0 16px',
        fontSize: 17,
      } : {}),
    }}>{children}</span>
  );
}

/* ───────────────────────── NoteInput ───────────────────────── */

function NoteInput({ notes, setNotes }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim();
    if (!t) return;
    setNotes([...notes, t]);
    setText('');
  };
  return (
    <div style={{
      borderTop: '1px solid var(--rule)',
      paddingTop: 14, marginTop: 24,
    }}>
      {!open ? (
        <div onClick={() => setOpen(true)} className="press" style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 14, color: 'var(--ink-muted)', cursor: 'pointer',
        }}>
          + note something to revisit
        </div>
      ) : (
        <div>
          <CategoryLabel>Note for the queue</CategoryLabel>
          <input
            autoFocus
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder="why does dS = δQ/T?"
            style={{
              all: 'unset', display: 'block', width: '100%',
              fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic',
              color: 'var(--ink)', borderBottom: '1px solid var(--ink)',
              padding: '10px 0 8px', marginTop: 12,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 10 }}>
            <div onClick={() => { setOpen(false); setText(''); }}
              className="press" style={{
                fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                color: 'var(--ink-ghost)', cursor: 'pointer',
              }}>cancel</div>
            <div onClick={add} className="press" style={{
              fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500,
              color: 'var(--rust)', cursor: 'pointer',
            }}>add →</div>
          </div>
          {notes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
              {notes.map((n, i) => (
                <li key={i} style={{
                  fontFamily: 'var(--serif)', fontStyle: 'italic',
                  fontSize: 14, color: 'var(--ink-muted)',
                  padding: '6px 0', borderTop: i ? '1px dotted var(--rule)' : 'none',
                  display: 'flex', justifyContent: 'space-between', gap: 12,
                }}>
                  <span>— {n}</span>
                  <span onClick={() => setNotes(notes.filter((_, j) => j !== i))}
                    style={{ color: 'var(--ink-ghost)', cursor: 'pointer' }}>×</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── QASection ─────────────────────────
   Per-section ask-a-question affordance. Each Q gets a brief inline
   answer (mocked here). Conversation accumulates; available later as
   "questions from §3.1" on the lesson Q&A export screen.
*/
function QASection({ section, qa, setQa }) {
  const [open, setOpen] = useState(qa.length > 0);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);

  const ask = () => {
    const q = text.trim();
    if (!q || pending) return;
    setPending(true);
    setText('');
    // mock answer — would call window.claude.complete in a real build
    const answers = [
      "A subtle question. Carnot's argument is that any engine exceeding this efficiency could be coupled in reverse to the Carnot engine and produce net work from a single reservoir — forbidden by the second law. The ceiling is therefore not a property of the machinery but of the surrounding thermodynamics.",
      "Yes — the formula assumes both reservoirs are infinite, so they don't change temperature as heat is drawn or dumped. In practice, finite reservoirs warm and cool, which is why real engines deliver less than even their Carnot ceiling would predict.",
      "The reversibility is the strict requirement. Any irreversibility — friction, finite-rate heat flow, turbulence — increases entropy in the universe and lowers the work extracted. The Carnot engine is the limit of an infinitely slow, infinitely careful process.",
    ];
    const a = answers[qa.length % answers.length];
    setTimeout(() => {
      setQa([...qa, { section, q, a }]);
      setPending(false);
    }, 700);
  };

  return (
    <div style={{
      borderTop: '1px solid var(--rule)',
      paddingTop: 16, marginTop: 28,
    }}>
      <CategoryLabel>Ask about this section</CategoryLabel>

      {qa.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {qa.map((item, i) => (
            <div key={i} style={{
              borderLeft: '2px solid var(--rust-soft)',
              paddingLeft: 14, marginBottom: 16,
            }}>
              <div style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic',
                fontSize: 15, color: 'var(--ink)', lineHeight: 1.5,
              }}>{item.q}</div>
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 15.5,
                color: 'var(--ink)', lineHeight: 1.6, marginTop: 8,
                textWrap: 'pretty',
              }}>{item.a}</div>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <div onClick={() => setOpen(true)} className="press" style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 14, color: 'var(--ink-muted)',
          cursor: 'pointer', marginTop: qa.length ? 6 : 12,
        }}>
          + {qa.length ? 'ask another' : 'ask a clarifying question'}
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask();
            }}
            placeholder="why is the formula independent of pressure?"
            rows={2}
            style={{
              all: 'unset', display: 'block', width: '100%',
              fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic',
              color: 'var(--ink)', borderBottom: '1px solid var(--ink)',
              padding: '8px 0', resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 10,
          }}>
            <div onClick={() => { setOpen(false); setText(''); }}
              className="press" style={{
                fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                color: 'var(--ink-ghost)', cursor: 'pointer',
              }}>cancel</div>
            {pending ? (
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                color: 'var(--ink-muted)',
              }}>thinking…</div>
            ) : (
              <div onClick={ask} className="press" style={{
                fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 500,
                color: text.trim() ? 'var(--rust)' : 'var(--ink-ghost)',
                cursor: text.trim() ? 'pointer' : 'default',
              }}>ask →</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  CategoryLabel, HammingHeading, Continue, ChoiceButton,
  LoadingLine, PageFolio, ConceptNode, Constellation,
  LessonHeader, PlanckViz, MathSpan, NoteInput, QASection,
});
