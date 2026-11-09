// OneYT — Phase 6 selector audit tests (node:test).
// 6.7: every selector lives in shared/selectors.js, no module
// hard-codes a YouTube selector, and every registered selector
// is actually used (by key in JS, or by raw value in module CSS).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SELECTORS, REQUIRED_WATCH_SELECTORS } = require('../shared/selectors');

function readTree(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...readTree(full, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function readFiles(files) {
  return files.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }));
}

test('selectors: required watch selectors exist', () => {
  REQUIRED_WATCH_SELECTORS.forEach((key) => {
    assert.ok(SELECTORS[key], 'missing required selector: ' + key);
    assert.equal(typeof SELECTORS[key], 'string');
    assert.ok(SELECTORS[key].length > 0);
  });
  assert.equal(Object.keys(SELECTORS).length, 22); // +endscreenContent (v1.3 hide endscreen)
});

test('selectors: every key is used — by name in JS or raw value in CSS', () => {
  const root = path.join(__dirname, '..');
  const js = readFiles(
    readTree(path.join(root, 'content'), ['.js']).filter(
      (file) =>
        !file.endsWith('selectors.js') && !file.endsWith(path.join('core', 'dom-manager.js'))
    )
  );
  const css = readFiles(readTree(path.join(root, 'content'), ['.css']));
  const unused = [];
  for (const [key, value] of Object.entries(SELECTORS)) {
    const byKey = js.some(
      (entry) => entry.text.includes("'" + key + "'") || entry.text.includes('"' + key + '"')
    );
    const byValue =
      css.some((entry) => entry.text.includes(value)) ||
      js.some((entry) => entry.text.includes(value));
    if (!byKey && !byValue) unused.push(key);
  }
  assert.deepEqual(unused, []);
});

test('selectors: no module JS hard-codes a YouTube selector', () => {
  const root = path.join(__dirname, '..');
  const youtubeTokens = [
    '#movie_player',
    '#primary',
    '#secondary',
    '#below',
    '#comments',
    '#chat',
    '#actions',
    '#description',
    '#guide',
    '#masthead',
    'ytd-',
  ];
  const allowed = new Set([
    path.join(root, 'shared', 'selectors.js'),
    path.join(root, 'content', 'core', 'dom-manager.js'),
  ]);
  // Header comments legitimately name the elements a module
  // touches — only code counts, so strip comments first.
  const stripComments = (text) =>
    text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const offenders = [];
  for (const file of readTree(path.join(root, 'content'), ['.js'])) {
    if (allowed.has(file)) continue;
    const text = stripComments(fs.readFileSync(file, 'utf8'));
    for (const token of youtubeTokens) {
      if (text.includes(token)) offenders.push(path.relative(root, file) + ' contains ' + token);
    }
  }
  assert.deepEqual(offenders, []);
});
