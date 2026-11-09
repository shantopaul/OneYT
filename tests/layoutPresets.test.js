// OneYT — Phase 22 layout editor tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const layoutPresets = require('../shared/layoutPresets');
const defaults = require('../shared/defaults');

test('layoutPresets: three built-ins exist with unique ids and complete overrides', () => {
  assert.equal(layoutPresets.LAYOUT_PRESETS.length, 3);
  const ids = layoutPresets.LAYOUT_PRESETS.map((p) => p.id);
  assert.deepEqual(ids, ['compact', 'balanced', 'spacious']);
  layoutPresets.LAYOUT_PRESETS.forEach((preset) => {
    assert.ok(preset.name.length > 0);
    assert.ok(preset.description.length > 0);
    const layout = preset.overrides.layout;
    assert.equal(typeof layout.homeColumns, 'number');
    assert.ok(layout.homeColumns >= 1 && layout.homeColumns <= 12);
    assert.equal(typeof layout.cardSpacing, 'number');
    assert.ok(layout.cardSpacing >= 0);
    assert.equal(typeof layout.homeMaxWidth, 'number');
    assert.ok(layout.homeMaxWidth >= 0 && layout.homeMaxWidth <= 2560);
    assert.equal(typeof layout.watchSpacing, 'number');
    assert.ok(layout.watchSpacing >= 0);
  });
});

test('layoutPresets: the three presets differ in columns, gap and max-width', () => {
  const [compact, balanced, spacious] = layoutPresets.LAYOUT_PRESETS.map((p) => p.overrides.layout);
  assert.ok(compact.homeColumns > balanced.homeColumns);
  assert.ok(balanced.homeColumns > spacious.homeColumns);
  assert.ok(compact.cardSpacing < balanced.cardSpacing);
  assert.ok(balanced.cardSpacing < spacious.cardSpacing);
  assert.equal(compact.homeMaxWidth, 0);
  assert.equal(balanced.homeMaxWidth, 1600);
  assert.equal(spacious.homeMaxWidth, 1280);
});

test('layoutPresets: getLayoutPreset returns the preset or null', () => {
  assert.equal(layoutPresets.getLayoutPreset('balanced').name, 'Balanced');
  assert.equal(layoutPresets.getLayoutPreset('no-such-preset'), null);
  assert.equal(layoutPresets.getLayoutPreset(''), null);
});

test('layoutPresets: apply changes only the layout numbers it names', () => {
  const current = defaults.cloneDefaults();
  current.layout.hideComments = true;
  current.layout.hideTopicChips = true;
  current.appearance.theme = 'midnight';
  const applied = layoutPresets.applyLayoutPreset(current, 'spacious', defaults);
  assert.equal(applied.layout.homeColumns, 3);
  assert.equal(applied.layout.cardSpacing, 24);
  assert.equal(applied.layout.homeMaxWidth, 1280);
  assert.equal(applied.layout.watchSpacing, 32);
  assert.equal(applied.layout.hideComments, true);
  assert.equal(applied.layout.hideTopicChips, true);
  assert.equal(applied.appearance.theme, 'midnight');
});

test('layoutPresets: apply with an unknown id returns the settings unchanged', () => {
  const current = defaults.cloneDefaults();
  const unchanged = layoutPresets.applyLayoutPreset(current, 'nope', defaults);
  assert.deepEqual(unchanged, current);
  assert.notEqual(unchanged, current);
});

test('layoutPresets: apply does not mutate the input settings', () => {
  const current = defaults.cloneDefaults();
  const before = JSON.stringify(current);
  layoutPresets.applyLayoutPreset(current, 'compact', defaults);
  assert.equal(JSON.stringify(current), before);
});

test('layoutPresets: preview summary reads defaults as 4 columns, 12 px gap, full width', () => {
  assert.deepEqual(layoutPresets.layoutPreviewSummary(defaults.cloneDefaults()), {
    columns: 4,
    gap: 12,
    maxWidth: 0,
  });
  assert.deepEqual(layoutPresets.layoutPreviewSummary(null), {
    columns: 4,
    gap: 12,
    maxWidth: 0,
  });
  assert.deepEqual(layoutPresets.layoutPreviewSummary({}), {
    columns: 4,
    gap: 12,
    maxWidth: 0,
  });
});

test('layoutPresets: preview summary follows the settings, clamping bad values', () => {
  const s = defaults.cloneDefaults();
  s.layout.homeColumns = 5;
  s.layout.cardSpacing = 8;
  s.layout.homeMaxWidth = 1600;
  assert.deepEqual(layoutPresets.layoutPreviewSummary(s), {
    columns: 5,
    gap: 8,
    maxWidth: 1600,
  });
  s.layout.homeColumns = 99;
  s.layout.cardSpacing = 0;
  s.layout.homeMaxWidth = -50;
  assert.deepEqual(layoutPresets.layoutPreviewSummary(s), {
    columns: 4,
    gap: 12,
    maxWidth: 0,
  });
});

test('layoutPresets: every preset previews to its own numbers', () => {
  layoutPresets.LAYOUT_PRESETS.forEach((preset) => {
    const applied = layoutPresets.applyLayoutPreset(defaults.cloneDefaults(), preset.id, defaults);
    const summary = layoutPresets.layoutPreviewSummary(applied);
    assert.equal(summary.columns, preset.overrides.layout.homeColumns);
    assert.equal(summary.gap, preset.overrides.layout.cardSpacing);
    assert.equal(summary.maxWidth, preset.overrides.layout.homeMaxWidth);
  });
});

test('defaults: migration adds layout.homeMaxWidth as 0 for old settings', () => {
  const migrated = defaults.migrateSettings({});
  assert.equal(migrated.layout.homeMaxWidth, 0);
  const old = defaults.cloneDefaults();
  delete old.layout.homeMaxWidth;
  assert.equal(defaults.migrateSettings(old).layout.homeMaxWidth, 0);
});
