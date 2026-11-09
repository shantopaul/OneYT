// OneYT — settings migration tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');

function fakeStorageArea(initial) {
  const mem = { ...initial };
  return {
    get: (key) => Promise.resolve({ [key]: mem[key] }),
    set: (obj) => {
      Object.assign(mem, obj);
      return Promise.resolve();
    },
    _mem: mem,
  };
}

test('migrateSettings(null) returns a clean copy of the defaults', () => {
  const m = defaults.migrateSettings(null);
  assert.equal(m.enabled, true);
  assert.equal(m.schemaVersion, 1);
  assert.equal(m.sidebar.customWidth, 402);
  assert.deepEqual(m.playback.speedPresets, [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
});

test('migrateSettings(undefined) returns defaults', () => {
  assert.equal(defaults.migrateSettings(undefined).enabled, true);
});

test('migration preserves user values and adds new defaults', () => {
  const m = defaults.migrateSettings({
    schemaVersion: 0,
    enabled: false,
    sidebar: { customWidth: 500 },
  });
  assert.equal(m.enabled, false);
  assert.equal(m.sidebar.customWidth, 500);
  assert.equal(m.sidebar.independentScroll, true); // new default added
  assert.equal(m.schemaVersion, 1);
});

test('migration repairs a corrupt value type with the default', () => {
  const m = defaults.migrateSettings({
    playback: { defaultSpeed: 'fast', speedPresets: 'all' },
  });
  assert.equal(m.playback.defaultSpeed, 1);
  assert.deepEqual(m.playback.speedPresets, [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
});

test('migration keeps nullable keys (autoplay: false survives)', () => {
  const m = defaults.migrateSettings({ playback: { autoplay: false, captions: true } });
  assert.equal(m.playback.autoplay, false);
  assert.equal(m.playback.captions, true);
});

test('migration preserves unknown keys (forward-compat)', () => {
  const m = defaults.migrateSettings({ futureFeature: { x: 1 } });
  assert.deepEqual(m.futureFeature, { x: 1 });
});

test('cloneDefaults returns independent copies', () => {
  const a = defaults.cloneDefaults();
  const b = defaults.cloneDefaults();
  a.sidebar.customWidth = 999;
  assert.equal(b.sidebar.customWidth, 402);
});

test('settings-manager load/save round-trip with a fake storage area', async () => {
  const storage = require('../shared/storage').createStorage(fakeStorageArea({}));
  const sm = require('../content/core/settings-manager').createSettingsManager({
    storage,
    defaults,
    constants: require('../shared/constants'),
  });
  await sm.load();
  assert.equal(sm.get().enabled, true);
  sm.set('sidebar.customWidth', 500);
  await sm.flush();
  assert.equal(sm.getPath('sidebar.customWidth'), 500);

  // A second manager reading the same area sees the saved value.
  const sm2 = require('../content/core/settings-manager').createSettingsManager({
    storage,
    defaults,
    constants: require('../shared/constants'),
  });
  await sm2.load();
  assert.equal(sm2.getPath('sidebar.customWidth'), 500);
});
