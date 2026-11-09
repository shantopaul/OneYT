// OneYT — validators tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const validators = require('../shared/validators');
const defaults = require('../shared/defaults');

test('validateSettings accepts a valid partial import', () => {
  const r = validators.validateSettings({ enabled: true, sidebar: { customWidth: 400 } }, defaults);
  assert.equal(r.valid, true);
  assert.equal(r.cleaned.sidebar.customWidth, 400);
  assert.equal(r.cleaned.enabled, true);
});

test('validateSettings rejects a non-object import', () => {
  const r = validators.validateSettings('nope', defaults);
  assert.equal(r.valid, false);
  assert.equal(r.cleaned, null);
  assert.ok(r.errors.length > 0);
});

test('validateSettings rejects a wrong-typed known key and applies nothing', () => {
  const r = validators.validateSettings({ enabled: 'yes' }, defaults);
  assert.equal(r.valid, false);
  assert.equal(r.cleaned, null);
  assert.match(r.errors[0], /enabled/);
});

test('validateSettings warns on unknown keys but stays valid', () => {
  const r = validators.validateSettings({ enabled: true, nope: 1 }, defaults);
  assert.equal(r.valid, true);
  assert.ok(r.warnings.some((w) => w.includes('nope')));
});

test('validateCustomCSS accepts plain CSS', () => {
  assert.equal(validators.validateCustomCSS('#secondary { color: red; }').valid, true);
});

test('validateCustomCSS rejects unbalanced braces', () => {
  const r = validators.validateCustomCSS('a { b { c }');
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes('braces')));
});

test('validateCustomCSS rejects @import, HTML tags and javascript:', () => {
  assert.equal(validators.validateCustomCSS('@import url(x);').valid, false);
  assert.equal(validators.validateCustomCSS('<style>a{}</style>').valid, false);
  assert.equal(validators.validateCustomCSS('a{background:url(javascript:alert(1))}').valid, false);
});

test('validateCustomCSS rejects non-string input', () => {
  assert.equal(validators.validateCustomCSS(42).valid, false);
});
