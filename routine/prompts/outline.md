# Outline prompt

System: (see CLAUDE.md system prompt section)

User:

Generate the outline for a physics lesson on: {topic}
{hint}

Learner state:
- Mastered: {mastered}
- In progress: {inProgress}
- Queued (flagged as confusing): {queued}
- Open confusion queue: {openQueue}

Return valid JSON only — no preamble, no markdown fence:

{
  "slug": "YYYY-MM-DD-{topic-kebab}",
  "title": "...",
  "node": {
    "id": "{topic-snake-case}",
    "label": "...",      // max 14 chars
    "subtitle": "..."    // max 16 chars, formula or descriptor
  },
  "intro": "...",        // 1 paragraph, 3-4 sentences
  "sections": [
    { "id": "s1", "heading": "1. ...", "hasQuiz": false },
    { "id": "s2", "heading": "2. ...", "hasQuiz": true },
    { "id": "s3", "heading": "3. ...", "hasQuiz": false },
    { "id": "s4", "heading": "4. ...", "hasQuiz": true },
    { "id": "s5", "heading": "5. ...", "hasQuiz": false }
  ],
  "checkInAfter": [1, 3],
  "suggestedNodes": [
    { "id": "...", "label": "...", "subtitle": "...", "edgeType": "extends|applied|related" },
    { "id": "...", "label": "...", "subtitle": "...", "edgeType": "extends|applied|related" },
    { "id": "...", "label": "...", "subtitle": "...", "edgeType": "extends|applied|related" }
  ]
}

Constraints:
- Exactly 5 sections. Sections 2 and 4 have hasQuiz: true. Others have hasQuiz: false.
- Exactly 3 suggestedNodes. Each must have a valid edgeType.
- Intro is 3-4 sentences. Story-led. No em-dashes.
- node.label max 14 chars. node.subtitle max 16 chars.
