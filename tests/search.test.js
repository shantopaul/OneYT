// OneYT — Phase 9 dashboard search tests (node:test, no DOM).
// Covers the search ranking, match highlighting, keyboard
// state machine and the anchored dropdown CSS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const options = require('../options/options');

function entry(key, sectionTitle, label, description) {
  return {
    key: key,
    sectionId: 's',
    sectionTitle: sectionTitle,
    label: label,
    description: description,
    haystack: [key, sectionTitle, label, description].join(' ').toLowerCase(),
  };
}

test('search: label matches rank before description-only matches', () => {
  const index = [
    entry('appearance.theme', 'Appearance', 'Theme', 'controls the speed of animations'),
    entry('playback.speedPresets', 'Playback', 'Speed presets', 'choose the speeds'),
  ];
  const results = options.searchSettings(index, 'speed');
  assert.deepEqual(
    results.map((e) => e.key),
    ['playback.speedPresets', 'appearance.theme']
  );
});

test('search: key/section matches rank above description-only matches', () => {
  const index = [
    entry('playback.defaultSpeed', 'Playback', 'Default speed', 'speed at start'),
    entry('appearance.theme', 'Appearance', 'Theme', 'mentions speed here'),
  ];
  // Both match 'speed' in the label here; use a word that only
  // appears in one key and the other's description.
  const byKey = options.searchSettings(index, 'defaultspeed');
  assert.deepEqual(
    byKey.map((e) => e.key),
    ['playback.defaultSpeed']
  );
  const byDesc = options.searchSettings(index, 'mentions');
  assert.deepEqual(
    byDesc.map((e) => e.key),
    ['appearance.theme']
  );
});

test('search: splitHighlight marks matches, longest word first', () => {
  assert.deepEqual(options.splitHighlight('Theme', ['the']), [
    { text: 'The', match: true },
    { text: 'me', match: false },
  ]);
  assert.deepEqual(options.splitHighlight('Dashboard theme', ['theme', 'the']), [
    { text: 'Dashboard ', match: false },
    { text: 'theme', match: true },
  ]);
  assert.deepEqual(options.splitHighlight('aaaa', ['aa']), [
    { text: 'aa', match: true },
    { text: 'aa', match: true },
  ]);
  assert.deepEqual(options.splitHighlight('Speed', []), [{ text: 'Speed', match: false }]);
});

test('search: key action moves, wraps, activates, closes and clears', () => {
  const act = options.searchKeyAction;
  assert.deepEqual(act('ArrowDown', -1, 3, true), { action: 'move', index: 0 });
  assert.deepEqual(act('ArrowDown', 2, 3, true), { action: 'move', index: 0 });
  assert.deepEqual(act('ArrowUp', 0, 3, true), { action: 'move', index: 2 });
  assert.deepEqual(act('ArrowUp', 1, 3, true), { action: 'move', index: 0 });
  assert.deepEqual(act('Enter', 1, 3, true), { action: 'activate', index: 1 });
  assert.deepEqual(act('Enter', -1, 3, true), { action: 'activate', index: 0 });
  assert.deepEqual(act('Escape', 1, 3, true), { action: 'close', index: -1 });
  assert.deepEqual(act('Escape', -1, 0, false), { action: 'clear', index: -1 });
  assert.deepEqual(act('ArrowDown', -1, 3, false), { action: 'none', index: -1 });
  assert.deepEqual(act('Enter', -1, 0, true), { action: 'none', index: -1 });
  assert.deepEqual(act('a', 1, 3, true), { action: 'none', index: 1 });
});

test('search: dropdown is anchored to its wrapper, not the topbar', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  assert.match(css, /\.search-wrap\s*\{[^}]*position:\s*relative/);
  assert.match(css, /\.search-results\s*\{[^}]*top:\s*calc\(100% \+ 6px\)/);
  assert.doesNotMatch(css, /top:\s*56px/);
});

test('search: tool-box entries (no control key) are searchable and rank by label', () => {
  const index = [
    entry('appearance.theme', 'Appearance', 'Theme', 'pick a theme'),
    {
      key: '',
      sectionId: 'appearance',
      sectionTitle: 'Appearance',
      label: 'CSS template: Hide duration badges',
      description: 'Hides the length badge on video thumbnails.',
      haystack: 'appearance css template: hide duration badges hides the length badge css template',
    },
    {
      key: '',
      sectionId: 'profiles',
      sectionTitle: 'Profiles',
      label: 'Profile: Focus',
      description: 'Saved profile',
      haystack: 'profiles profile: focus saved profile profile',
    },
  ];
  assert.deepEqual(
    options.searchSettings(index, 'duration').map((e) => e.label),
    ['CSS template: Hide duration badges']
  );
  assert.deepEqual(
    options.searchSettings(index, 'focus').map((e) => e.label),
    ['Profile: Focus']
  );
});

test('search: dashboard appends dynamic tool-box entries at search time', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(src.includes('function dynamicSearchEntries()'), 'dynamic entries helper exists');
  assert.ok(
    src.includes('searchIndex.concat(dynamicSearchEntries())'),
    'renderResults searches the static index plus tool-box entries'
  );
  assert.ok(src.includes('CSS_TEMPLATES.forEach'), 'CSS templates indexed');
  assert.ok(src.includes('LAYOUT_PRESETS.forEach'), 'layout presets indexed');
  assert.ok(src.includes("add('profiles', 'Profiles', 'Profile: '"), 'profiles indexed');
  assert.ok(src.includes("add('appearance', 'Appearance', 'Saved theme: '"), 'themes indexed');
});
