# Section prompt

System: (see CLAUDE.md system prompt section)

User:

Write section {sectionNumber} of a lesson on: {topic}
Lesson title: {lessonTitle}
Section heading: {sectionHeading}

Prior sections covered: {prior}
Upcoming sections will cover: {upcoming}
Open confusion queue: {openQueue}
This section gets the viz: {vizSlot}  (true = include exactly one viz block; false = no viz block)

Return valid JSON only — no preamble, no markdown fence:

{
  "blocks": [
    { "type": "p", "text": "..." },
    { "type": "math", "tex": "...", "display": true, "caption": "..." },
    { "type": "viz", "src": "{slug}.html", "height": 260, "caption": "..." }
  ],
  "quiz": {                          // include only if this section hasQuiz
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "..."
  }
}

Constraints:
- 3-4 paragraph (p) blocks. Total prose ~220 words.
- If vizSlot is true: include exactly one viz block. If false: no viz block.
- Math blocks: always include the formula before describing its parts. Every display-math block must include a "caption" field. The caption is one or two sentences naming each symbol introduced, and (when useful) a one-line read-aloud of what the equation says. Caption uses ASCII apostrophes and unicode math symbols (λ, ν, π); no em-dashes.
- No em-dashes. Plain ASCII apostrophes. Unicode math symbols in prose (λ, ν, ∝, ≈, π, ², ³).
- Quiz (if required): exactly 4 options, one correct. Explanation names the most tempting wrong answer and why it is wrong.
