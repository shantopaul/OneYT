// OneYT — Phase 9 dashboard theme tests (node:test, no DOM).
// resolveDashboardTheme + light-mode contrast + the
// data-theme CSS rules that carry the theme.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const themes = require('../shared/themes');
const options = require('../options/options');

const AA = 4.5;

test('theme: resolveDashboardTheme forces dark/light, system follows the OS', () => {
  const resolve = options.resolveDashboardTheme;
  assert.equal(resolve('dark', false), 'dark');
  assert.equal(resolve('dark', true), 'dark');
  assert.equal(resolve('light', true), 'light');
  assert.equal(resolve('light', false), 'light');
  assert.equal(resolve('system', true), 'dark');
  assert.equal(resolve('system', false), 'light');
  // A bad stored value degrades to system behaviour, never
  // to a broken theme.
  assert.equal(resolve('bogus', true), 'dark');
  assert.equal(resolve(undefined, false), 'light');
});

test('theme: light-mode text colours meet WCAG AA', () => {
  const pairs = [
    ['light warning on surface', '#b45309', '#f9f9f9'],
    ['light warning on bg', '#b45309', '#ffffff'],
    ['light success on surface', '#15803d', '#f9f9f9'],
    ['light success on bg', '#15803d', '#ffffff'],
    ['light danger on surface', '#b91c1c', '#f9f9f9'],
    ['light danger on bg', '#b91c1c', '#ffffff'],
    ['light accent on surface', '#e6002e', '#f9f9f9'],
    ['light accent on bg', '#e6002e', '#ffffff'],
    ['white on light accent (primary button)', '#ffffff', '#e6002e'],
    ['white on light accent hover', '#ffffff', '#cc0027'],
  ];
  for (const [name, fg, bg] of pairs) {
    const ratio = themes.contrastRatio(fg, bg);
    assert.ok(ratio >= AA, name + ' is ' + ratio.toFixed(2) + ', below AA ' + AA);
  }
});

test('theme: the data-theme light block carries the fixed tokens', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const block = css.match(/:root\[data-theme='light'\]\s*\{([^}]*)\}/);
  assert.ok(block, 'no :root[data-theme=light] block');
  const tokens = block[1];
  assert.match(tokens, /--ui-warning:\s*#b45309/);
  assert.match(tokens, /--ui-success:\s*#15803d/);
  assert.match(tokens, /--ui-danger:\s*#b91c1c/);
  assert.match(tokens, /--ui-accent:\s*#e6002e/);
  assert.match(tokens, /--ui-accent-hover:\s*#cc0027/);
  assert.match(tokens, /color-scheme:\s*light/);
});

test('theme: media fallback matches the light block and skips forced dark', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  // Each fixed token must appear twice: once in the
  // prefers-color-scheme fallback, once in the data-theme
  // block — the two light sources stay in sync.
  for (const [token, value] of [
    ['--ui-warning', '#b45309'],
    ['--ui-success', '#15803d'],
    ['--ui-danger', '#b91c1c'],
    ['--ui-accent', '#e6002e'],
  ]) {
    const count = (css.match(new RegExp(token + ':\\s*' + value, 'g')) || []).length;
    assert.ok(count >= 2, token + ' ' + value + ' appears ' + count + ' times, expected 2');
  }
  assert.match(css, /:root:not\(\[data-theme='dark'\]\)/);
  assert.match(css, /:root\[data-theme='dark'\]\s*\{[^}]*--ui-warning:\s*#f59e0b/);
});
