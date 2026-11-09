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

test('migration repairs a null settings section with the defaults', () => {
  const m = defaults.migrateSettings({ player: null, layout: null });
  assert.deepEqual(m.player, defaults.DEFAULT_SETTINGS.player);
  assert.deepEqual(m.layout, defaults.DEFAULT_SETTINGS.layout);
  assert.equal(m.enabled, true);
});

test('migration repairs non-boolean values for nullable keys', () => {
  const m = defaults.migrateSettings({ playback: { autoplay: 'yes', captions: 42 } });
  assert.equal(m.playback.autoplay, null);
  assert.equal(m.playback.captions, null);
});

test('migration keeps null for nullable keys', () => {
  const m = defaults.migrateSettings({ playback: { autoplay: null, captions: null } });
  assert.equal(m.playback.autoplay, null);
  assert.equal(m.playback.captions, null);
});

test('a preset applies onto a repaired null section', () => {
  const profiles = require('../shared/profiles');
  const repaired = defaults.migrateSettings({ player: null });
  const next = profiles.applyPreset(repaired, 'cinema', defaults);
  assert.equal(next.player.defaultTheater, true);
  assert.equal(next.player.maxWidth, 0);
});

test('settings-manager load does not persist when only key order differs', async () => {
  // Same values as the defaults, but stored with the top-level
  // keys in reverse order. JSON.stringify would call this
  // "changed" and rewrite storage on every load.
  const full = defaults.cloneDefaults();
  const reversed = {};
  Object.keys(full)
    .reverse()
    .forEach((k) => {
      reversed[k] = full[k];
    });
  let sets = 0;
  const storage = {
    get: () => Promise.resolve(reversed),
    set: () => {
      sets++;
      return Promise.resolve();
    },
    onChanged: () => () => {},
  };
  const sm = require('../content/core/settings-manager').createSettingsManager({
    storage,
    defaults,
    constants: require('../shared/constants'),
  });
  await sm.load();
  assert.equal(sm.getPath('sidebar.customWidth'), 402);
  assert.equal(sets, 0);
});

test('settings-manager ignores an external change identical to current state', async () => {
  let handler = null;
  const storage = {
    get: () => Promise.resolve(undefined),
    set: () => Promise.resolve(),
    onChanged: (fn) => {
      handler = fn;
      return () => {};
    },
  };
  const sm = require('../content/core/settings-manager').createSettingsManager({
    storage,
    defaults,
    constants: require('../shared/constants'),
  });
  await sm.load();
  sm.watchExternalChanges();
  let notified = 0;
  sm.onChange(() => {
    notified++;
  });
  // A local change carrying the current value — e.g. the echo
  // of our own sync-merge write — must not notify.
  handler({ 'oneyt.settings.v1': { newValue: sm.get() } }, 'local');
  assert.equal(notified, 0);
  const changed = defaults.cloneDefaults();
  changed.enabled = false;
  handler({ 'oneyt.settings.v1': { newValue: changed } }, 'local');
  assert.equal(notified, 1);
  assert.equal(sm.get().enabled, false);
});
