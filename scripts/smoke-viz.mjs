#!/usr/bin/env node
// Usage: node scripts/smoke-viz.mjs [file ...] (defaults to all lessons/*.html)

import { readFileSync, readdirSync, statSync } from 'fs';

const args = process.argv.slice(2);
const paths = args.length > 0
  ? args
  : readdirSync('lessons')
      .filter(f => f.endsWith('.html'))
      .map(f => `lessons/${f}`)
      .sort();

if (paths.length === 0) {
  console.error('No viz files found.');
  process.exit(1);
}

const MAX_BYTES = 30 * 1024;

function smokeViz(path) {
  let html;
  try {
    html = readFileSync(path, 'utf8');
  } catch (e) {
    return [`Cannot read file: ${e.message}`];
  }

  const errors = [];
  function check(condition, message) {
    if (!condition) errors.push(message);
  }

  // File size
  const bytes = statSync(path).size;
  check(bytes <= MAX_BYTES, `file exceeds 30KB (${(bytes / 1024).toFixed(1)}KB)`);

  // Required root element
  check(/<div\s+id="viz"/.test(html), 'missing <div id="viz"> root element');

  // Required CSS preamble variables
  const requiredVars = ['--bg: #f4eee2', '--accent: #9c3a22', '--text: #1a1a18'];
  for (const v of requiredVars) {
    check(html.includes(v), `missing required CSS preamble variable: ${v}`);
  }

  // Caption
  check(html.includes('viz-caption'), 'missing element with class viz-caption');

  // CDN policy: only cdnjs.cloudflare.com allowed
  const externalRefs = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g)]
    .map(m => m[1]);
  for (const url of externalRefs) {
    check(url.startsWith('https://cdnjs.cloudflare.com/'),
      `external resource from disallowed CDN: ${url}`);
  }

  // Forbidden APIs
  check(!html.includes('localStorage'), 'uses localStorage (forbidden)');
  check(!/\bfetch\s*\(/.test(html), 'uses fetch() (forbidden)');
  check(!/window\.addEventListener\s*\(\s*['"]resize['"]/.test(html),
    'uses window resize listener (forbidden)');

  // Detect runaway setInterval: flag any setInterval call with a literal > 30000
  const intervals = [...html.matchAll(/setInterval\s*\([^,]+,\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const ms of intervals) {
    check(ms <= 30000, `setInterval with ${ms}ms exceeds 30s limit`);
  }

  // Interactive element present
  const hasInteractive =
    /input[^>]+type=["']range["']/.test(html) ||
    /addEventListener\s*\(\s*['"](?:click|mousedown|touchstart|pointerdown|input|change)['"]/.test(html) ||
    /\.on\s*\(\s*['"](?:click|drag|mousedown)['"]/.test(html);
  check(hasInteractive, 'no interactive element found (need slider, click handler, or drag)');

  return errors;
}

let failCount = 0;

for (const path of paths) {
  const errors = smokeViz(path);
  if (errors.length === 0) {
    console.log(`✓ ${path}`);
  } else {
    console.error(`✗ ${path} (${errors.length} error${errors.length > 1 ? 's' : ''})`);
    errors.forEach(e => console.error(`    - ${e}`));
    failCount++;
  }
}

if (paths.length > 1) {
  console.log(failCount === 0
    ? `\nall ${paths.length} passed`
    : `\n${failCount} of ${paths.length} failed`);
}

process.exit(failCount > 0 ? 1 : 0);
