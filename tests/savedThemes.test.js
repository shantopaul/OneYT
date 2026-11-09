// OneYT — Phase 21 saved themes tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const savedThemes = require('../shared/savedThemes');
const themes = require('../shared/themes');
const defaults = require('../shared/defaults');

function themedSettings() {
  const s = defaults.cloneDefaults();
  s.appearance.theme = 'midnight';
  s.appearance.colors = { accent: '#FF0033', text: '#eeeeee' };
  s.layout.blockShorts = true;
  return s;
}

test('savedThemes: create captures theme + colours only, cleaning bad entries', () => {
  const s = themedSettings();
  s.appearance.colors.bogus = '#123456';
  s.appearance.colors.background = '';
  s.appearance.colors.border = 'not-a-hex';
  const result = savedThemes.createSavedTheme('My Night', s, [], defaults, themes);
  assert.equal(result.error, undefined);
  assert.equal(result.themes.length, 1);
  assert.deepEqual(result.themes[0], {
    name: 'My Night',
    createdAt: result.themes[0].createdAt,
    theme: 'midnight',
    colors: { accent: '#ff0033', text: '#eeeeee', background: '' },
  });
  assert.equal(typeof result.themes[0].createdAt, 'number');
});

test('savedThemes: create with unknown base theme falls back to default', () => {
  const s = defaults.cloneDefaults();
  s.appearance.theme = 'no-such-theme';
  const result = savedThemes.createSavedTheme('Plain', s, [], defaults, themes);
  assert.equal(result.themes[0].theme, 'default');
});

test('savedThemes: name validation — empty, too long, duplicate, built-in', () => {
  const existing = [{ name: 'My Night', theme: 'dark', colors: {} }];
  assert.equal(
    savedThemes.validateSavedThemeName('', existing, themes),
    'Theme name cannot be empty.'
  );
  assert.equal(
    savedThemes.validateSavedThemeName('x'.repeat(41), existing, themes),
    'Theme name is too long (max 40 characters).'
  );
  assert.equal(
    savedThemes.validateSavedThemeName('my night', existing, themes),
    'A saved theme named "My Night" already exists.'
  );
  assert.equal(
    savedThemes.validateSavedThemeName('Dark', existing, themes),
    '"Dark" is a built-in theme name — pick another name.'
  );
  assert.equal(
    savedThemes.validateSavedThemeName('  My Night  ', existing, themes),
    'A saved theme named "My Night" already exists.'
  );
  assert.equal(savedThemes.validateSavedThemeName('My Night', existing, themes, 'My Night'), null);
});

test('savedThemes: create rejects duplicates and caps at 10', () => {
  const existing = [{ name: 'My Night', theme: 'dark', colors: {} }];
  const dup = savedThemes.createSavedTheme(
    'my night',
    defaults.cloneDefaults(),
    existing,
    defaults,
    themes
  );
  assert.equal(dup.error, 'A saved theme named "My Night" already exists.');
  const full = Array.from({ length: 10 }, (_, i) => ({ name: 'T' + i, theme: 'dark', colors: {} }));
  const over = savedThemes.createSavedTheme(
    'One more',
    defaults.cloneDefaults(),
    full,
    defaults,
    themes
  );
  assert.equal(over.error, 'You already have 10 saved themes — delete one first.');
});

test('savedThemes: apply changes only theme + colours', () => {
  const s = themedSettings();
  const created = savedThemes.createSavedTheme('My Night', s, [], defaults, themes).themes[0];
  const current = defaults.cloneDefaults();
  current.layout.blockShorts = true;
  current.appearance.theme = 'light';
  current.appearance.colors = { accent: '#111111' };
  const applied = savedThemes.applySavedTheme(current, created, defaults, themes);
  assert.equal(applied.appearance.theme, 'midnight');
  assert.deepEqual(applied.appearance.colors, { accent: '#ff0033', text: '#eeeeee' });
  assert.equal(applied.layout.blockShorts, true);
  assert.equal(applied.appearance.borderRadius, 12);
});

test('savedThemes: apply with a corrupt entry returns current settings unchanged', () => {
  const current = themedSettings();
  const unchanged = savedThemes.applySavedTheme(current, null, defaults, themes);
  assert.deepEqual(unchanged, current);
  assert.notEqual(unchanged, current);
  const bad = savedThemes.applySavedTheme(current, { theme: 'dark' }, defaults, themes);
  assert.deepEqual(bad, current);
});

test('savedThemes: validateSavedThemes repairs stored data', () => {
  const repaired = savedThemes.validateSavedThemes(
    [
      { name: 'Good', theme: 'amoled', colors: { accent: '#FF0033' }, createdAt: 5 },
      { name: 'good', theme: 'dark', colors: {} },
      { name: '  ', theme: 'dark', colors: {} },
      { name: 'Bad theme', theme: 'nope', colors: { accent: '#112233' } },
      { name: 'Bad colours', theme: 'dark', colors: { accent: 'red', text: '#aabbcc' } },
      null,
      { name: 'No colours', theme: 'dark' },
    ],
    themes
  );
  assert.deepEqual(repaired, [
    { name: 'Good', createdAt: 5, theme: 'amoled', colors: { accent: '#ff0033' } },
    { name: 'Bad theme', createdAt: 0, theme: 'default', colors: { accent: '#112233' } },
    { name: 'Bad colours', createdAt: 0, theme: 'dark', colors: { text: '#aabbcc' } },
  ]);
  assert.deepEqual(savedThemes.validateSavedThemes('not an array', themes), []);
});

test('savedThemes: rename and delete', () => {
  const list = [
    { name: 'Alpha', theme: 'dark', colors: {} },
    { name: 'Beta', theme: 'light', colors: {} },
  ];
  const renamed = savedThemes.renameSavedTheme(list, 'alpha', 'Gamma', themes);
  assert.deepEqual(
    renamed.themes.map((t) => t.name),
    ['Gamma', 'Beta']
  );
  assert.equal(
    savedThemes.renameSavedTheme(list, 'Alpha', 'Beta', themes).error,
    'A saved theme named "Beta" already exists.'
  );
  assert.equal(
    savedThemes.renameSavedTheme(list, 'Missing', 'Gamma', themes).error,
    'No saved theme named "Missing" was found.'
  );
  assert.deepEqual(
    savedThemes.deleteSavedTheme(list, 'BETA', themes).map((t) => t.name),
    ['Alpha']
  );
  assert.equal(savedThemes.deleteSavedTheme(list, 'Missing', themes).length, 2);
});

test('savedThemes: export filename slug and JSON round-trip', () => {
  assert.equal(savedThemes.exportFileName('My Night!'), 'oneyt-theme-my-night.json');
  assert.equal(savedThemes.exportFileName('   '), 'oneyt-theme-theme.json');
  assert.equal(savedThemes.exportFileName('নীল'), 'oneyt-theme-theme.json');
  const created = savedThemes.createSavedTheme('My Night', themedSettings(), [], defaults, themes)
    .themes[0];
  const exported = savedThemes.exportSavedTheme(created);
  assert.equal(exported.filename, 'oneyt-theme-my-night.json');
  const parsed = JSON.parse(exported.json);
  assert.equal(parsed.oneytTheme, 1);
  assert.equal(parsed.name, 'My Night');
  const imported = savedThemes.parseSavedThemeImport(exported.json, [], themes);
  assert.equal(imported.error, undefined);
  assert.equal(imported.theme.name, 'My Night');
  assert.equal(imported.theme.theme, 'midnight');
  assert.deepEqual(imported.theme.colors, { accent: '#ff0033', text: '#eeeeee' });
});

test('savedThemes: import rejects bad files', () => {
  const cases = [
    ['', 'Import is empty — paste exported theme JSON first.'],
    ['not json', null], // message includes the JSON error; checked by prefix below
    ['[]', 'Imported theme must be a JSON object.'],
    ['{}', 'This file is not a OneYT theme export (missing oneytTheme: 1).'],
    [
      '{"oneytTheme":2,"name":"X","theme":"dark","colors":{}}',
      'This file is not a OneYT theme export (missing oneytTheme: 1).',
    ],
    ['{"oneytTheme":1,"theme":"dark","colors":{}}', 'Imported theme has no name.'],
    [
      '{"oneytTheme":1,"name":"X","theme":"nope","colors":{}}',
      'Imported theme uses unknown base theme "nope".',
    ],
    ['{"oneytTheme":1,"name":"X","theme":"dark","colors":[]}', 'Imported theme has no colours.'],
    [
      '{"oneytTheme":1,"name":"X","theme":"dark","colors":{"bogus":"#112233"}}',
      'Imported theme has unknown colour "bogus".',
    ],
    [
      '{"oneytTheme":1,"name":"X","theme":"dark","colors":{"accent":"red"}}',
      'Imported theme has an invalid colour for "accent".',
    ],
  ];
  cases.forEach(([text, expected]) => {
    const result = savedThemes.parseSavedThemeImport(text, [], themes);
    assert.ok(result.error, 'expected rejection for: ' + text);
    if (expected) assert.equal(result.error, expected);
    else assert.ok(result.error.startsWith('Not valid JSON: '), result.error);
  });
  const good = JSON.stringify({
    oneytTheme: 1,
    name: 'Dup',
    theme: 'dark',
    colors: {},
  });
  const dup = savedThemes.parseSavedThemeImport(
    good,
    [{ name: 'dup', theme: 'dark', colors: {} }],
    themes
  );
  assert.equal(dup.error, 'A saved theme named "dup" already exists.');
});
