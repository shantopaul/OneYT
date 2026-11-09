// OneYT — Phase 3 theme data tests (node:test, pure, no DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const themes = require('../shared/themes');

test('themes: six presets + custom exist, default has no overrides', () => {
  assert.deepEqual(themes.THEME_NAMES.sort(), [
    'amoled',
    'custom',
    'dark',
    'default',
    'light',
    'midnight',
    'minimal',
  ]);
  assert.equal(themes.THEMES.default, null);
  assert.equal(themes.THEMES.dark.bg, '#0f0f0f');
  assert.equal(themes.THEMES.amoled.bg, '#000000');
});

test('themes: unknown theme name falls back to default (empty vars)', () => {
  assert.deepEqual(themes.resolveThemeVars('bogus', {}), {});
  assert.deepEqual(themes.resolveThemeVars('dark', {}), themes.THEMES.dark);
});

test('themes: custom theme starts from dark, user colours override', () => {
  const vars = themes.resolveThemeVars('custom', { accent: '#00ff00' });
  assert.equal(vars.bg, '#0f0f0f');
  assert.equal(vars.accent, '#00ff00');
  const preset = themes.resolveThemeVars('light', { background: '#123456' });
  assert.equal(preset.bg, '#123456');
  assert.equal(preset.text, '#0f0f0f');
});

test('themes: invalid custom colours are ignored, never stored', () => {
  const vars = themes.resolveThemeVars('dark', {
    text: 'not-a-color',
    accent: 'red',
    background: '#12',
  });
  assert.equal(vars.text, '#f1f1f1');
  assert.equal(vars.accent, '#ff0033');
  assert.equal(vars.bg, '#0f0f0f');
});

test('themes: contrast ratio — black/white is 21, same colour is 1', () => {
  assert.equal(themes.contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(themes.contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(themes.contrastRatio('nope', '#ffffff'), null);
});

test('themes: text contrast — dark and light pass AA, low contrast fails', () => {
  assert.equal(themes.textContrastOk(themes.resolveThemeVars('dark', {})), true);
  assert.equal(themes.textContrastOk(themes.resolveThemeVars('light', {})), true);
  assert.equal(
    themes.textContrastOk(
      themes.resolveThemeVars('custom', { text: '#777777', background: '#888888' })
    ),
    false
  );
  assert.equal(themes.textContrastOk({}), null);
});

test('themes: font stacks — known families map, unknown is undefined', () => {
  assert.match(themes.FONT_STACKS.Georgia, /Georgia/);
  assert.match(themes.FONT_STACKS.monospace, /monospace/);
  assert.equal(themes.FONT_STACKS.ComicSans, undefined);
});
