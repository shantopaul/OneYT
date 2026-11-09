// OneYT — Phase 6 accessibility tests (node:test).
// 6.9: dashboard + popup text contrast meets WCAG AA (4.5:1
// for normal text), keyboard focus is visible, and shortcut
// capture cannot swallow the Tab key.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const themes = require('../shared/themes');

const AA = 4.5;

test('a11y: dashboard + popup text colours meet WCAG AA', () => {
  // Token values from options/options.css and popup/popup.css.
  const pairs = [
    ['dark primary on bg', '#f1f1f1', '#0f0f0f'],
    ['dark primary on surface', '#f1f1f1', '#181818'],
    ['dark secondary on bg', '#aaaaaa', '#0f0f0f'],
    ['dark secondary on surface', '#aaaaaa', '#181818'],
    ['dark muted on bg', '#9a9a9a', '#0f0f0f'],
    ['dark muted on surface', '#9a9a9a', '#181818'],
    ['dark accent on bg', '#ff0033', '#0f0f0f'],
    ['dark success on bg', '#22c55e', '#0f0f0f'],
    ['dark danger on bg', '#ef4444', '#0f0f0f'],
    ['light primary on bg', '#0f0f0f', '#ffffff'],
    ['light secondary on surface', '#606060', '#f9f9f9'],
    ['light muted on bg', '#6b6b6b', '#ffffff'],
    ['light muted on surface', '#6b6b6b', '#f9f9f9'],
  ];
  for (const [name, fg, bg] of pairs) {
    const ratio = themes.contrastRatio(fg, bg);
    assert.ok(ratio >= AA, name + ' is ' + ratio.toFixed(2) + ', below AA ' + AA);
  }
});

test('a11y: the muted tokens in the CSS files are the AA-passing ones', () => {
  // Strip comments first: the token lines document the old
  // values they replaced ("was #717171").
  const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
  const optionsCss = strip(
    fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8')
  );
  const popupCss = strip(fs.readFileSync(path.join(__dirname, '..', 'popup', 'popup.css'), 'utf8'));
  assert.ok(optionsCss.includes('#9a9a9a'), 'dark muted token must be #9a9a9a');
  assert.ok(optionsCss.includes('#6b6b6b'), 'light muted token must be #6b6b6b');
  assert.ok(popupCss.includes('#9a9a9a'), 'popup muted must be #9a9a9a');
  assert.ok(!optionsCss.includes('#717171'), 'old failing muted #717171 must be gone');
  assert.ok(!optionsCss.includes('#909090'), 'old failing muted #909090 must be gone');
  assert.ok(!popupCss.includes('#717171'), 'old failing muted #717171 must be gone from popup');
});

test('a11y: focus is visible on every interactive element', () => {
  const optionsCss = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  assert.ok(optionsCss.includes('.btn:focus-visible'), 'buttons need a focus ring');
  assert.ok(optionsCss.includes('.nav-item:focus-visible'), 'nav items need a focus ring');
  assert.ok(optionsCss.includes('.control-input:focus'), 'inputs need a focus style');
  // The old rule removed the outline entirely — a border-colour
  // change alone is not a visible focus indicator.
  assert.ok(!optionsCss.includes('outline: none'), 'no outline:none anywhere');
  const popupCss = fs.readFileSync(path.join(__dirname, '..', 'popup', 'popup.css'), 'utf8');
  assert.ok(popupCss.includes(':focus-visible'), 'popup needs focus rings');
});

test('a11y: shortcut capture lets Tab move focus (no keyboard trap)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const capture = src.slice(src.indexOf('var onKey = function (event) {'));
  assert.ok(capture.length > 0, 'capture handler must exist');
  assert.ok(capture.includes("event.key === 'Tab'"), 'Tab must be handled in capture');
  // Tab must be handled BEFORE preventDefault — otherwise the
  // keydown is swallowed and focus never moves.
  const tabAt = capture.indexOf("event.key === 'Tab'");
  const preventAt = capture.indexOf('event.preventDefault()');
  assert.ok(
    tabAt !== -1 && preventAt !== -1 && tabAt < preventAt,
    'Tab check must come before preventDefault'
  );
});

test('a11y: dashboard and popup controls are labelled', () => {
  const optionsHtml = fs.readFileSync(
    path.join(__dirname, '..', 'options', 'options.html'),
    'utf8'
  );
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup', 'popup.html'), 'utf8');
  assert.ok(optionsHtml.includes('aria-label="Search settings"'));
  assert.ok(optionsHtml.includes('aria-label="Settings sections"'));
  assert.ok(popupHtml.includes('for="enabled-toggle"'));
  assert.ok(popupHtml.includes('for="focus-toggle"'));
  assert.ok(popupHtml.includes('for="theme-select"') || popupHtml.includes('aria-label'));
});

test('a11y: dark primary buttons use the AA-passing accent, and save errors are red', () => {
  // White text on the dark --ui-accent #ff0033 is ~3.9:1, so
  // the dark-scope .btn-primary override must use #e6002e
  // (4.53) with a #cc0027 hover, in all three pages.
  assert.ok(themes.contrastRatio('#ffffff', '#e6002e') >= AA, 'white on #e6002e');
  assert.ok(themes.contrastRatio('#ffffff', '#cc0027') >= AA, 'white on #cc0027');
  for (const cssPath of [
    '../options/options.css',
    '../popup/popup.css',
    '../onboarding/onboarding.css',
  ]) {
    const css = fs.readFileSync(path.join(__dirname, cssPath), 'utf8');
    assert.ok(
      css.includes(":root:not([data-theme='light']) .btn-primary"),
      cssPath + ' needs the dark primary-button override'
    );
    assert.ok(css.includes('background: #e6002e;'), cssPath + ' primary must be #e6002e');
    assert.ok(css.includes('background: #cc0027;'), cssPath + ' primary hover must be #cc0027');
  }
  const optionsCss = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  assert.ok(
    optionsCss.includes('.saved-indicator.error'),
    'save-failure text must have an error style'
  );
});
