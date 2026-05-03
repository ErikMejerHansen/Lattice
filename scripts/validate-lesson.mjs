#!/usr/bin/env node
// Usage: node scripts/validate-lesson.mjs lessons/{slug}.json

import { readFileSync } from 'fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: validate-lesson.mjs <path-to-lesson.json>');
  process.exit(1);
}

let lesson;
try {
  lesson = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

// Top-level required fields
check(typeof lesson.slug === 'string' && lesson.slug.length > 0, 'slug must be a non-empty string');
check(typeof lesson.title === 'string' && lesson.title.length > 0, 'title must be a non-empty string');
check(lesson.node != null, 'node is required');
check(typeof lesson.node?.id === 'string', 'node.id must be a string');
check(typeof lesson.node?.label === 'string', 'node.label must be a string');
check((lesson.node?.label?.length ?? 99) <= 14, `node.label must be at most 14 chars (got ${lesson.node?.label?.length})`);
check(typeof lesson.node?.subtitle === 'string', 'node.subtitle must be a string');
check((lesson.node?.subtitle?.length ?? 99) <= 16, `node.subtitle must be at most 16 chars (got ${lesson.node?.subtitle?.length})`);
check(typeof lesson.intro === 'string' && lesson.intro.length > 0, 'intro must be a non-empty string');
check(Array.isArray(lesson.sections), 'sections must be an array');
check(lesson.sections?.length === 5, `sections must have exactly 5 entries (got ${lesson.sections?.length})`);

// Section checks
if (Array.isArray(lesson.sections)) {
  lesson.sections.forEach((s, i) => {
    check(typeof s.id === 'string', `sections[${i}].id must be a string`);
    check(typeof s.heading === 'string', `sections[${i}].heading must be a string`);
    check(typeof s.hasQuiz === 'boolean', `sections[${i}].hasQuiz must be a boolean`);
    check(Array.isArray(s.blocks), `sections[${i}].blocks must be an array`);

    if (i === 1 || i === 3) {
      check(s.hasQuiz === true, `sections[${i}] (section ${i + 1}) must have hasQuiz: true`);
      check(s.quiz != null, `sections[${i}] (section ${i + 1}) must have a quiz object`);
    } else {
      check(s.hasQuiz === false, `sections[${i}] (section ${i + 1}) must have hasQuiz: false`);
    }

    if (s.quiz) {
      check(typeof s.quiz.question === 'string', `sections[${i}].quiz.question must be a string`);
      check(Array.isArray(s.quiz.options) && s.quiz.options.length === 4,
        `sections[${i}].quiz must have exactly 4 options`);
      check(typeof s.quiz.correctIndex === 'number' && s.quiz.correctIndex >= 0 && s.quiz.correctIndex <= 3,
        `sections[${i}].quiz.correctIndex must be 0-3`);
      check(typeof s.quiz.explanation === 'string', `sections[${i}].quiz.explanation must be a string`);
    }

    if (Array.isArray(s.blocks)) {
      s.blocks.forEach((b, j) => {
        check(['p', 'math', 'viz'].includes(b.type),
          `sections[${i}].blocks[${j}].type must be p, math, or viz (got "${b.type}")`);
        if (b.type === 'p') check(typeof b.text === 'string', `sections[${i}].blocks[${j}].text must be a string`);
        if (b.type === 'math') {
          check(typeof b.tex === 'string', `sections[${i}].blocks[${j}].tex must be a string`);
          check(typeof b.display === 'boolean', `sections[${i}].blocks[${j}].display must be a boolean`);
        }
        if (b.type === 'viz') {
          check(typeof b.src === 'string', `sections[${i}].blocks[${j}].src must be a string`);
          check(typeof b.height === 'number', `sections[${i}].blocks[${j}].height must be a number`);
          check(typeof b.caption === 'string', `sections[${i}].blocks[${j}].caption must be a string`);
        }
      });
    }
  });

  // Exactly one viz block, in section 2, 3, or 4 (indices 1-3)
  const vizBlocks = lesson.sections.flatMap((s, i) =>
    (s.blocks ?? []).filter(b => b.type === 'viz').map(b => ({ ...b, sectionIndex: i }))
  );
  check(vizBlocks.length === 1, `must have exactly 1 viz block total (found ${vizBlocks.length})`);
  if (vizBlocks.length === 1) {
    check([1, 2, 3].includes(vizBlocks[0].sectionIndex),
      `viz block must be in section 2, 3, or 4 (found in section ${vizBlocks[0].sectionIndex + 1})`);
  }
}

// finalQuiz
check(lesson.finalQuiz != null, 'finalQuiz is required');
if (lesson.finalQuiz) {
  check(typeof lesson.finalQuiz.question === 'string', 'finalQuiz.question must be a string');
  check(Array.isArray(lesson.finalQuiz.options) && lesson.finalQuiz.options.length === 4,
    'finalQuiz must have exactly 4 options');
  check(typeof lesson.finalQuiz.correctIndex === 'number', 'finalQuiz.correctIndex must be a number');
  check(typeof lesson.finalQuiz.explanation === 'string', 'finalQuiz.explanation must be a string');
}

// suggestedNodes
check(Array.isArray(lesson.suggestedNodes) && lesson.suggestedNodes.length === 3,
  `suggestedNodes must have exactly 3 entries (got ${lesson.suggestedNodes?.length})`);
if (Array.isArray(lesson.suggestedNodes)) {
  lesson.suggestedNodes.forEach((n, i) => {
    check(typeof n.id === 'string', `suggestedNodes[${i}].id must be a string`);
    check(['extends', 'applied', 'related'].includes(n.edgeType),
      `suggestedNodes[${i}].edgeType must be extends, applied, or related (got "${n.edgeType}")`);
  });
}

// metadata
check(lesson.metadata != null, 'metadata is required');

if (errors.length === 0) {
  console.log(`✓ ${path} is valid`);
  process.exit(0);
} else {
  console.error(`✗ ${path} has ${errors.length} error(s):`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}
