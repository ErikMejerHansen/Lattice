/* Lattice — screens
   Each screen is a function returning JSX that fits a 390x844 frame.
*/

const { useState: useStateS } = React;

/* ───────────────────────── 1. Constellation ───────────────────────── */

function ScreenConstellation({ first = false, onPickLesson }) {
  const populated = [
    { id: 'newton', col: 0, row: 0, cat: 'Mechanics',  title: "Newton's laws",          state: 'mastered' },
    { id: 'energy', col: 1, row: 0, cat: 'Mechanics',  title: 'Work & energy',          state: 'mastered' },
    { id: 'osc',    col: 0, row: 1, cat: 'Mechanics',  title: 'Simple harmonic motion', state: 'mastered' },
    { id: 'wave',   col: 1, row: 1, cat: 'Waves',      title: 'Wave equation',          state: 'mastered' },
    { id: 'temp',   col: 0, row: 2, cat: 'Thermo',     title: 'Temperature & heat',     state: 'mastered' },
    { id: 'kin',    col: 1, row: 2, cat: 'Thermo',     title: 'Kinetic theory',         state: 'mastered' },
    { id: 'ent',    col: 0, row: 3, cat: 'Thermo',     title: 'Entropy',                state: 'mastered' },
    { id: 'carnot', col: 1, row: 3, cat: 'Thermo',     title: 'Carnot cycles',          state: 'in_progress' },
    { id: 'super',  col: 0, row: 4, cat: 'Waves',      title: 'Superposition',          state: 'mastered' },
    { id: 'fou',    col: 1, row: 4, cat: 'Math',       title: 'Fourier basics',         state: 'available' },
    { id: 'planck', col: 0, row: 5, cat: 'Quantum',    title: 'Black-body radiation',   state: 'available' },
    { id: 'photo',  col: 1, row: 5, cat: 'Quantum',    title: 'Photoelectric effect',   state: 'available' },
    { id: 'free',   col: 0, row: 6, cat: 'Thermo',     title: 'Free energy',            state: 'queued' },
    { id: 'stat',   col: 1, row: 6, cat: 'Thermo',     title: 'Boltzmann distribution', state: 'queued' },
    { id: 'maxw',   col: 0, row: 7, cat: 'EM',         title: "Maxwell's equations",    state: 'queued' },
  ];
  const populatedEdges = [
    { from: 'newton', to: 'energy', type: 'extends' },
    { from: 'newton', to: 'osc',    type: 'extends' },
    { from: 'energy', to: 'wave',   type: 'related' },
    { from: 'osc',    to: 'wave',   type: 'extends' },
    { from: 'osc',    to: 'temp',   type: 'related' },
    { from: 'temp',   to: 'kin',    type: 'extends' },
    { from: 'kin',    to: 'ent',    type: 'extends' },
    { from: 'ent',    to: 'carnot', type: 'applied' },
    { from: 'wave',   to: 'super',  type: 'extends' },
    { from: 'super',  to: 'fou',    type: 'extends' },
    { from: 'ent',    to: 'planck', type: 'related' },
    { from: 'fou',    to: 'planck', type: 'related' },
    { from: 'planck', to: 'photo',  type: 'extends' },
    { from: 'planck', to: 'free',   type: 'related' },
    { from: 'carnot', to: 'free',   type: 'extends' },
    { from: 'kin',    to: 'stat',   type: 'related' },
    { from: 'photo',  to: 'maxw',   type: 'related' },
  ];

  const firstNodes = [
    { id: 'newton', col: 0, row: 0, cat: 'Mechanics', title: "Newton's laws",     state: 'available' },
    { id: 'energy', col: 1, row: 0, cat: 'Mechanics', title: 'Work & energy',     state: 'queued' },
    { id: 'wave',   col: 0, row: 1, cat: 'Waves',     title: 'Wave equation',     state: 'queued' },
    { id: 'temp',   col: 1, row: 1, cat: 'Thermo',    title: 'Temperature & heat', state: 'queued' },
  ];
  const firstEdges = [
    { from: 'newton', to: 'energy', type: 'extends' },
    { from: 'newton', to: 'wave',   type: 'related' },
    { from: 'energy', to: 'temp',   type: 'related' },
  ];

  const nodes = first ? firstNodes : populated;
  const edges = first ? firstEdges : populatedEdges;
  const mastered = nodes.filter(n => n.state === 'mastered').length;
  const total = nodes.length;

  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '64px 28px 6px' }}>
        <CategoryLabel>{first ? 'Begin here' : 'Constellation'}</CategoryLabel>
        <h1 className="h-page" style={{ marginTop: 14 }}>
          {first ? 'A small map.' : 'A growing map.'}
        </h1>
        <p style={{
          margin: '8px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.5, maxWidth: 320,
        }}>
          {first
            ? "Four concepts to begin. Tap one to read this morning's lesson; the rest will open as you go."
            : <>{mastered} of {total} mastered. Carnot cycles is open. Three more wait below.</>}
        </p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0 28px' }}>
        <Constellation nodes={nodes} edges={edges} onNode={onPickLesson} />
        {/* legend */}
        <div style={{
          margin: '24px 28px 0', paddingTop: 16,
          borderTop: '1px solid var(--rule)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 12,
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-muted)',
        }}>
          <div><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--paper-raised)', border: '1px solid var(--rule-strong)', borderTop: '2px solid var(--ink)', verticalAlign: 'middle', marginRight: 6 }} />Mastered</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--paper-raised)', border: '1px solid var(--rust-soft)', borderTop: '2px solid var(--rust)', verticalAlign: 'middle', marginRight: 6 }} />In progress</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 8, border: '1px dashed var(--rule)', verticalAlign: 'middle', marginRight: 6 }} />Available</div>
          <div><span style={{ display: 'inline-block', width: 12, height: 8, border: '1px dashed var(--rule)', verticalAlign: 'middle', marginRight: 6 }} />Queued ◷</div>
          <div style={{ gridColumn: '1 / -1', height: 1, background: 'var(--rule)', margin: '4px 0' }} />
          <div><svg width="20" height="6" style={{ verticalAlign: 'middle', marginRight: 6 }}><line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink-muted)" strokeWidth="1" /></svg>builds on</div>
          <div><svg width="20" height="6" style={{ verticalAlign: 'middle', marginRight: 6 }}><line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink-muted)" strokeWidth="1" strokeDasharray="2 5" /></svg>related</div>
        </div>
      </div>
      <PageFolio foot left="Lattice" right={first ? 'Day 1' : `Day 47`} />
    </div>
  );
}

/* ───────────────────────── 2. Lesson section ───────────────────────── */

function ScreenLessonSection({ onContinue, onBack, seedQa }) {
  const [notes, setNotes] = useStateS([
    'how does this map to the steam engine paper?',
  ]);
  const [qa, setQa] = useStateS(seedQa || []);
  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[3, 12]} notes={notes.length + qa.length} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '22px 28px 28px', maxWidth: 560 }}>
          <CategoryLabel style={{ marginBottom: 14 }}>Section 3</CategoryLabel>
          <HammingHeading num="3.1" style={{ marginBottom: 18 }}>
            The reversible engine
          </HammingHeading>
          <div className="prose">
            <p>
              Imagine an engine so gentle that, run backwards, it consumes
              exactly the work it produced going forward. No friction, no
              turbulence, no rush. Carnot's question was simple and devastating:
              <em> what is the most work such an engine can possibly do?</em>
            </p>
            <p>
              The answer depends only on the two temperatures the engine sits
              between — the hot reservoir at <MathSpan>T_h</MathSpan> and the cold one at <MathSpan>T_c</MathSpan>. 
              Not on the working fluid, not on the machinery. Only the temperatures.
            </p>
            <MathSpan display>η = 1 − T_c ⁄ T_h</MathSpan>
            <p>
              This is the ceiling. Every real engine you will ever meet — steam,
              diesel, jet, fusion if we ever get there — sits beneath it. The
              gap between the real engine and this number is, in a strict sense,
              waste.
            </p>
          </div>

          <PlanckViz />

          <div className="prose" style={{ marginTop: 18 }}>
            <p>
              The figure above shows a related ceiling for a different
              question: how much energy a body radiates as a function of
              wavelength. Slide the temperature; notice how the peak walks
              left as the body heats. The same severity holds — the curve is
              the maximum, not a target.
            </p>
            <p>
              Hold this thought. In the next section we will run the cycle
              forward on a P–V diagram, and the efficiency formula will fall
              out almost without algebra.
            </p>
          </div>

          <NoteInput notes={notes} setNotes={setNotes} />
          <QASection section="§ 3.1 — The reversible engine" qa={qa} setQa={setQa} />
          <Continue label="Continue to §3.2" onClick={onContinue} />
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="§ 3.1 — 3 / 12" />
    </div>
  );
}

/* ───────────────────────── 3. Quiz ───────────────────────── */

function ScreenQuiz({ onContinue, onBack }) {
  const [picked, setPicked] = useStateS(null);
  const correct = 'B';
  const opts = [
    { k: 'A', t: 'On the working fluid (water vs. helium)' },
    { k: 'B', t: 'Only on the two reservoir temperatures' },
    { k: 'C', t: 'On the size of the engine' },
    { k: 'D', t: 'On the speed at which the cycle is run' },
  ];

  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[6, 12]} notes={1} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '22px 28px 28px' }}>
          <CategoryLabel style={{ marginBottom: 14 }}>Quick check</CategoryLabel>
          <HammingHeading num="3.2" style={{ marginBottom: 16 }}>
            What does Carnot efficiency depend on?
          </HammingHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {opts.map(o => {
              const isPicked = picked === o.k;
              const isRight = picked && o.k === correct;
              const isWrong = isPicked && o.k !== correct;
              const showResult = picked != null;
              return (
                <div key={o.k}
                  className="press"
                  onClick={() => !picked && setPicked(o.k)}
                  style={{
                    cursor: picked ? 'default' : 'pointer',
                    border: '1px solid ' + (
                      isWrong ? 'var(--warning)'
                      : isRight ? 'var(--olive)'
                      : 'var(--rule-strong)'),
                    background: isWrong ? 'rgba(153,51,34,0.06)'
                      : isRight ? 'rgba(63,107,58,0.07)'
                      : 'transparent',
                    padding: '12px 14px',
                    display: 'flex', gap: 14, alignItems: 'baseline',
                    opacity: showResult && !isPicked && !isRight ? 0.5 : 1,
                  }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 12,
                    color: isWrong ? 'var(--warning)' : isRight ? 'var(--olive)' : 'var(--ink-muted)',
                    letterSpacing: '0.06em',
                  }}>{o.k}</span>
                  <span style={{
                    fontFamily: 'var(--serif)', fontSize: 16,
                    color: 'var(--ink)', lineHeight: 1.4, flex: 1,
                  }}>{o.t}</span>
                  {isRight && <span style={{ color: 'var(--olive)', fontFamily: 'var(--serif)' }}>✓</span>}
                  {isWrong && <span style={{ color: 'var(--warning)', fontFamily: 'var(--serif)' }}>✗</span>}
                </div>
              );
            })}
          </div>

          {picked && (
            <div style={{
              marginTop: 22, paddingTop: 16,
              borderTop: '1px solid var(--rule)',
            }}>
              <CategoryLabel style={{ marginBottom: 12 }}>
                {picked === correct ? '✓ Right' : '✗ Not quite'}
              </CategoryLabel>
              <p style={{
                margin: 0, fontFamily: 'var(--serif)', fontSize: 16,
                lineHeight: 1.55, color: 'var(--ink)',
              }}>
                {picked === correct
                  ? <>Carnot's result is striking precisely because it ignores the engine. <em>Only the temperatures matter</em> — that's the point. A steam Carnot engine and a helium Carnot engine between the same reservoirs reach the same ceiling.</>
                  : <>The fluid, the size, and the speed are real engineering constraints, but they affect <em>real</em> engines, not the ideal one. Carnot's result depends only on <MathSpan>T_h</MathSpan> and <MathSpan>T_c</MathSpan>.</>}
              </p>
              <Continue onClick={onContinue} style={{ marginTop: 24 }} />
            </div>
          )}
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="§ 3.2 — 6 / 12" />
    </div>
  );
}

/* ───────────────────────── 4. Checkin ───────────────────────── */

function ScreenCheckin({ onKeep, onSwitch, onBack }) {
  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[7, 12]} notes={1} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '22px 28px 28px' }}>
          <CategoryLabel style={{ marginBottom: 16 }}>A pause</CategoryLabel>
          <h2 style={{
            fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500,
            fontStyle: 'italic', letterSpacing: '-0.005em', lineHeight: 1.3,
            margin: '0 0 14px', color: 'var(--ink)',
          }}>
            How is this landing?
          </h2>
          <p style={{
            margin: 0, fontFamily: 'var(--serif)', fontSize: 16,
            color: 'var(--ink-muted)', lineHeight: 1.55, fontStyle: 'italic',
          }}>
            We're halfway through. The next section gets denser — the P–V
            diagram, the four strokes, the algebra falling out. It can wait if
            you've had enough for one morning.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 30 }}>
            <ChoiceButton variant="filled" onClick={onKeep}>Keep going</ChoiceButton>
            <ChoiceButton onClick={onSwitch}>Pause and pick another concept</ChoiceButton>
          </div>
          <p style={{
            margin: '20px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 13.5, color: 'var(--ink-ghost)', textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Either way, your place is kept.
          </p>
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="§ 3.3 — 7 / 12" />
    </div>
  );
}

/* ───────────────────────── 5. Queue review ───────────────────────── */

function ScreenQueueReview({ onContinue, onBack }) {
  const [items, setItems] = useStateS([
    { t: 'how does this map to the steam engine paper?', mode: 'flag' },
    { t: "what's the entropy story for the reversible step?", mode: 'node' },
    { t: 'sample data for the smoothing filter — try later', mode: 'flag' },
  ]);
  const [adding, setAdding] = useStateS(false);
  const [text, setText] = useStateS('');
  const toggle = (i) => {
    setItems(items.map((x, j) => j === i ? { ...x, mode: x.mode === 'node' ? 'flag' : 'node' } : x));
  };
  const remove = (i) => setItems(items.filter((_, j) => j !== i));

  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[12, 12]} notes={items.length} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '22px 28px 28px' }}>
          <CategoryLabel style={{ marginBottom: 14 }}>Notes from this lesson</CategoryLabel>
          <HammingHeading style={{ marginBottom: 14 }}>
            Three things to revisit
          </HammingHeading>
          <p style={{
            margin: '0 0 22px', fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.5,
          }}>
            Make any of these into their own concept on the map, or keep them
            flagged as context for future lessons.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((it, i) => (
              <li key={i} style={{
                padding: '14px 0',
                borderTop: '1px solid var(--rule)',
              }}>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.45,
                  color: 'var(--ink)',
                }}>
                  — {it.t}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginTop: 10,
                }}>
                  <div onClick={() => toggle(i)} className="press" style={{
                    fontFamily: 'var(--mono)', fontSize: 10.5,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer',
                    color: it.mode === 'node' ? 'var(--rust)' : 'var(--ink-muted)',
                  }}>
                    {it.mode === 'node' ? '▣ Make a node' : '◷ Keep flagged'}
                  </div>
                  <div onClick={() => remove(i)} style={{
                    fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1,
                    color: 'var(--ink-ghost)', cursor: 'pointer', padding: '0 4px',
                  }}>×</div>
                </div>
              </li>
            ))}
            <li style={{ borderTop: '1px solid var(--rule)', padding: '14px 0 0' }}>
              {!adding ? (
                <div onClick={() => setAdding(true)} className="press" style={{
                  fontFamily: 'var(--serif)', fontStyle: 'italic',
                  fontSize: 14.5, color: 'var(--ink-muted)', cursor: 'pointer',
                }}>
                  + add another
                </div>
              ) : (
                <div>
                  <input
                    autoFocus value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && text.trim()) {
                        setItems([...items, { t: text.trim(), mode: 'flag' }]);
                        setText(''); setAdding(false);
                      }
                    }}
                    placeholder="another note…"
                    style={{
                      all: 'unset', display: 'block', width: '100%',
                      fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic',
                      borderBottom: '1px solid var(--ink)', padding: '6px 0',
                    }} />
                </div>
              )}
            </li>
          </ul>

          <Continue label="Finish lesson" onClick={onContinue} />
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="Notes" />
    </div>
  );
}

/* ───────────────────────── 6. Lesson completion ───────────────────────── */

function ScreenComplete({ onAdd, onBack }) {
  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[12, 12]} notes={3} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '28px 28px 28px' }}>
          <CategoryLabel style={{ marginBottom: 16 }}>Lesson complete</CategoryLabel>
          <h1 className="h-page" style={{ marginBottom: 14, lineHeight: 1.2 }}>
            Carnot cycles, mastered.
          </h1>
          <p style={{
            margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 15.5, color: 'var(--ink-muted)', lineHeight: 1.55,
          }}>
            Twenty-four minutes. Twelve sections. Three notes for the queue. The
            efficiency ceiling is now part of the map.
          </p>

          {/* small numerics */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            margin: '28px 0 4px',
            borderTop: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)',
            paddingTop: 12, paddingBottom: 12,
          }}>
            {[
              ['24m', 'reading'],
              ['12 / 12', 'sections'],
              ['3', 'notes'],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600 }}>{n}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-muted)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2,
                }}>{l}</div>
              </div>
            ))}
          </div>

          <CategoryLabel style={{ margin: '32px 0 14px' }}>What opens next</CategoryLabel>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { rel: 'extends', cat: 'Thermo',  title: 'Free energy & spontaneity' },
              { rel: 'related', cat: 'Quantum', title: 'Black-body radiation' },
              { rel: 'applied', cat: 'History', title: 'The 1824 steam paper' },
            ].map((s, i) => (
              <li key={i} style={{
                padding: '14px 0',
                borderTop: i ? '1px solid var(--rule)' : 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-muted)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {s.rel}  ·  {s.cat}
                </div>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500,
                  color: 'var(--ink)', letterSpacing: '-0.005em',
                }}>{s.title}</div>
              </li>
            ))}
          </ul>

          <Continue label="Add to map" onClick={onAdd} />
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="Complete · 12 / 12" />
    </div>
  );
}

/* ───────────────────────── 7. Lesson Q&A export ───────────────────────── */

function ScreenQAExport({ onBack, onDone }) {
  const [bundle, setBundle] = useStateS([
    {
      section: '§ 3.1 — The reversible engine',
      q: 'Why is the formula independent of the working fluid?',
      a: "Carnot's argument is that any engine exceeding this efficiency could be coupled in reverse to the Carnot engine and produce net work from a single reservoir — forbidden by the second law. The ceiling is therefore not a property of the machinery but of the surrounding thermodynamics.",
    },
    {
      section: '§ 3.2 — The P–V cycle',
      q: 'What if the reservoirs are finite?',
      a: "Then they warm and cool as heat flows. The formula assumes infinite reservoirs that hold their temperature; finite reservoirs are why real engines fall short of even their Carnot ceiling.",
    },
    {
      section: '§ 3.4 — Reversibility',
      q: 'How fast is "infinitely slow" in practice?',
      a: 'Slow enough that the working fluid stays in equilibrium with whichever reservoir it is touching. Any finite rate of heat flow generates entropy and lowers the work extracted. The Carnot engine is a limit, not a recipe.',
    },
  ]);
  const [copied, setCopied] = useStateS(false);

  const transcript = bundle.map(b =>
    `${b.section}\nQ. ${b.q}\nA. ${b.a}\n`
  ).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const remove = (i) => setBundle(bundle.filter((_, j) => j !== i));

  return (
    <div className="lattice" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LessonHeader title="Carnot cycles" progress={[12, 12]} notes={bundle.length} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <article style={{ padding: '22px 28px 28px' }}>
          <CategoryLabel style={{ marginBottom: 14 }}>Questions from this lesson</CategoryLabel>
          <HammingHeading style={{ marginBottom: 14 }}>
            Three things you wanted clearer.
          </HammingHeading>
          <p style={{
            margin: '0 0 18px', fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.55,
          }}>
            Your conversation with the lesson, gathered. Copy the whole bundle
            to your notes app, or trim it first.
          </p>

          <div onClick={copy} className="press" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid var(--ink)', padding: '11px 14px',
            cursor: 'pointer', marginBottom: 22, background: copied ? 'var(--paper-raised)' : 'transparent',
          }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500 }}>
              {copied ? 'Copied to clipboard' : `Copy all ${bundle.length} ↗`}
            </span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10.5,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--ink-muted)',
            }}>{copied ? '✓' : 'plain text'}</span>
          </div>

          {bundle.map((b, i) => (
            <div key={i} style={{
              borderTop: '1px solid var(--rule)',
              padding: '16px 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10.5,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                }}>{b.section}</div>
                <div onClick={() => remove(i)} style={{
                  fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1,
                  color: 'var(--ink-ghost)', cursor: 'pointer', padding: '0 4px',
                }}>×</div>
              </div>
              <div style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic',
                fontSize: 16, color: 'var(--ink)', lineHeight: 1.5,
                marginTop: 8,
              }}>{b.q}</div>
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 15.5,
                color: 'var(--ink)', lineHeight: 1.6, marginTop: 10,
                paddingLeft: 14, borderLeft: '2px solid var(--rust-soft)',
              }}>{b.a}</div>
            </div>
          ))}

          <Continue label="Done" onClick={onDone} />
        </article>
      </div>
      <PageFolio foot left="Carnot cycles" right="Q&A · 12 / 12" />
    </div>
  );
}

/* ───────────────────────── 8. Loading & Error ───────────────────────── */

function ScreenLoading() {
  return (
    <div className="lattice" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '64px 28px 0',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
      <CategoryLabel style={{ marginBottom: 22 }}>Generating</CategoryLabel>
      <div style={{
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18,
        color: 'var(--ink)', textAlign: 'center', maxWidth: 280,
        lineHeight: 1.45, marginBottom: 22,
      }}>
        Drafting tomorrow's lesson on free energy…
      </div>
      <LoadingLine />
      <div style={{
        marginTop: 30, fontFamily: 'var(--mono)', fontSize: 10.5,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--ink-ghost)', textAlign: 'center', lineHeight: 1.7,
      }}>
        sections drafted · 4 of 11<br />
        viz · planck curve, ready
      </div>
      </div>
      <PageFolio foot left="Lattice" right="Generating" />
    </div>
  );
}

function ScreenError({ onRetry, onExit }) {
  return (
    <div className="lattice" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '64px 28px 0',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
      <CategoryLabel style={{ marginBottom: 18 }}>Something went wrong</CategoryLabel>
      <div style={{
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16,
        color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 300,
        lineHeight: 1.55, marginBottom: 30,
      }}>
        The lesson didn't finish drafting overnight. The model timed out at
        section 8 of 12. We can try again, or you can come back later.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 220 }}>
        <ChoiceButton variant="filled" onClick={onRetry}>Try again</ChoiceButton>
        <ChoiceButton onClick={onExit}>Back to constellation</ChoiceButton>
      </div>
      <div style={{
        marginTop: 26, fontFamily: 'var(--mono)', fontSize: 10,
        color: 'var(--ink-ghost)', letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        err · timeout / sec 8
      </div>
      </div>
      <PageFolio foot left="Lattice" right="Error" />
    </div>
  );
}

Object.assign(window, {
  ScreenConstellation, ScreenLessonSection, ScreenQuiz,
  ScreenCheckin, ScreenQueueReview, ScreenComplete,
  ScreenQAExport,
  ScreenLoading, ScreenError,
});
