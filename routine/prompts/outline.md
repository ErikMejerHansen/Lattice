# Outline prompt

System: (see CLAUDE.md system prompt section)

User:

Generate the outline for a physics lesson on: {topic}
{hint}

Repo state (the routine cannot see what the learner has actually studied; per-browser progress is invisible. Treat existing graph nodes as material that has been published and may or may not have been read.):
- Published lessons (graph nodes already in the repo): {graphNodes}
- Wishlist (topics queued for future lessons): {wishlist}
- Open confusion queue (learner-flagged terms from queue.md): {openQueue}

The lesson should stand on its own. It may reference earlier lessons by name, but should not assume the learner has internalized them.

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
- Section 5 develops one specific case (a distinction, a refinement, a single historical resolution) and earns any broader observation from it. Not a generic moral closer ("hold onto", "take comfort in", "remember that"), not a teaser for the next lesson.
- Exactly 3 suggestedNodes. Each must have a valid edgeType. SuggestedNodes can be forward-pointing (topics this lesson sets up, e.g., photoelectric → Compton) or sideways (terms the lesson uses but does not fully unpack, e.g., "equipartition", "energy density", "statistical mechanics"). When the lesson leans on an unfamiliar term, prefer surfacing it as a suggestedNode over inserting a digression to define it. Avoid suggesting topics already in {graphNodes} or {wishlist}.
- Intro is 3-4 sentences. Story-led. No em-dashes.
- node.label max 14 chars. node.subtitle max 16 chars.
