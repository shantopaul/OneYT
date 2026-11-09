// OneYT — Phase 20 CSS templates tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const cssTemplates = require('../shared/cssTemplates');
const validators = require('../shared/validators');

test('cssTemplates: six templates exist with unique ids and complete fields', () => {
  assert.equal(cssTemplates.CSS_TEMPLATES.length, 6);
  const ids = cssTemplates.CSS_TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, [
    'hide-duration-badges',
    'fade-watched-videos',
    'hide-video-badges',
    'hide-home-metadata',
    'hide-voice-search',
    'hide-channel-banner',
  ]);
  cssTemplates.CSS_TEMPLATES.forEach((template) => {
    assert.equal(typeof template.id, 'string');
    assert.ok(template.name.length > 0);
    assert.ok(template.description.length > 0);
    assert.ok(template.css.length > 0);
  });
});

test('cssTemplates: every template CSS passes the custom-CSS validator', () => {
  cssTemplates.CSS_TEMPLATES.forEach((template) => {
    const check = validators.validateCustomCSS(template.css);
    assert.deepEqual(check.errors, [], 'template ' + template.id + ' must be valid CSS');
    assert.equal(check.valid, true);
    assert.ok(!/@import/i.test(template.css), 'no @import in ' + template.id);
    assert.ok(!/url\(/i.test(template.css), 'no url() in ' + template.id);
  });
});

test('cssTemplates: getCssTemplate returns the template or null', () => {
  const found = cssTemplates.getCssTemplate('hide-voice-search');
  assert.equal(found.name, 'Hide voice search');
  assert.ok(found.css.includes('#voice-search-button'));
  assert.equal(cssTemplates.getCssTemplate('no-such-template'), null);
  assert.equal(cssTemplates.getCssTemplate(''), null);
});

test('cssTemplates: listCssTemplates returns a copy', () => {
  const list = cssTemplates.listCssTemplates();
  assert.equal(list.length, 6);
  list.pop();
  assert.equal(cssTemplates.CSS_TEMPLATES.length, 6);
});

test('cssTemplates: apply appends the marker + CSS to empty text', () => {
  const result = cssTemplates.applyCssTemplate('', 'hide-duration-badges');
  assert.equal(result.applied, true);
  assert.equal(result.alreadyApplied, false);
  assert.equal(
    result.css,
    '/* OneYT template: hide-duration-badges */\n' +
      'ytd-thumbnail-overlay-time-status-renderer { display: none !important; }'
  );
});

test('cssTemplates: apply appends after existing CSS with a blank line', () => {
  const current = '/* my own */\nytd-rich-item-renderer { color: red; }';
  const result = cssTemplates.applyCssTemplate(current, 'hide-video-badges');
  assert.equal(result.applied, true);
  assert.ok(result.css.startsWith(current));
  assert.ok(result.css.includes('\n\n/* OneYT template: hide-video-badges */\n'));
  assert.ok(result.css.includes('ytd-badge-supported-renderer'));
});

test('cssTemplates: applying twice is a no-op and leaves the text unchanged', () => {
  const first = cssTemplates.applyCssTemplate('', 'hide-channel-banner');
  const second = cssTemplates.applyCssTemplate(first.css, 'hide-channel-banner');
  assert.equal(second.applied, false);
  assert.equal(second.alreadyApplied, true);
  assert.equal(second.css, first.css);
  assert.equal(cssTemplates.isCssTemplateApplied(first.css, 'hide-channel-banner'), true);
  assert.equal(cssTemplates.isCssTemplateApplied('', 'hide-channel-banner'), false);
  assert.equal(cssTemplates.isCssTemplateApplied(first.css, 'nope'), false);
});

test('cssTemplates: unknown id returns the text unchanged', () => {
  const result = cssTemplates.applyCssTemplate('keep me', 'no-such-template');
  assert.equal(result.applied, false);
  assert.equal(result.alreadyApplied, false);
  assert.equal(result.css, 'keep me');
});

test('cssTemplates: non-string current CSS is treated as empty', () => {
  const result = cssTemplates.applyCssTemplate(null, 'hide-home-metadata');
  assert.equal(result.applied, true);
  assert.ok(result.css.includes('/* OneYT template: hide-home-metadata */'));
});

test('cssTemplates: applied text still passes the custom-CSS validator', () => {
  let css = '';
  cssTemplates.CSS_TEMPLATES.forEach((template) => {
    css = cssTemplates.applyCssTemplate(css, template.id).css;
  });
  const check = validators.validateCustomCSS(css);
  assert.deepEqual(check.errors, []);
  assert.equal(check.valid, true);
});
