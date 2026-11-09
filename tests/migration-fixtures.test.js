// OneYT — Phase 6 migration fixtures (node:test).
// 6.6: a stored settings object from an older release must
// migrate to the current schema: user values preserved, new
// keys filled with defaults, corrupt types repaired.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const defaults = require('../shared/defaults');
const { createStorage } = require('../shared/storage');
const { createSettingsManager } = require('../content/core/settings-manager');
const constants = require('../shared/constants');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

test('migration: v0.1 (Phase 1) settings upgrade to current', () => {
  const stored = loadFixture('v0.1-phase1.json');
  // A Phase 1 install never saw these sections/keys.
  assert.equal(stored.layout.watchSpacing, undefined);
  assert.equal(stored.player.miniPlayer, undefined);
  assert.equal(stored.appearance.typography, undefined);
  assert.equal(stored.playback, undefined);
  assert.equal(stored.productivity, undefined);
  assert.equal(stored.keyboard, undefined);
  assert.equal(stored.navigation, undefined);
  assert.equal(stored.sync, undefined);

  const migrated = defaults.migrateSettings(stored);
  // User values survive.
  assert.equal(migrated.enabled, true);
  assert.equal(migrated.appearance.theme, 'dark');
  assert.equal(migrated.sidebar.customWidth, 500);
  assert.equal(migrated.player.customWidth, 1000);
  assert.equal(migrated.layout.hideShortsHome, true);
  // Later keys arrive with defaults.
  assert.equal(migrated.layout.watchSpacing, 0);
  assert.deepEqual(migrated.player.miniPlayer.size, 0);
  assert.equal(migrated.appearance.typography.fontSize, 0);
  assert.equal(migrated.playback.defaultSpeed, 1);
  assert.equal(migrated.productivity.focusMode, false);
  assert.equal(migrated.keyboard.shortcuts.toggleFocus, 'Shift+F');
  assert.equal(migrated.navigation.compact, false);
  assert.equal(migrated.sync.enabled, false);
  assert.equal(migrated.schemaVersion, 1);
});

test('migration: v0.4 (Phase 4) settings upgrade only adds sync', () => {
  const stored = loadFixture('v0.4-phase4.json');
  assert.equal(stored.sync, undefined);
  const migrated = defaults.migrateSettings(stored);
  // Everything the user set in Phase 4 survives.
  assert.equal(migrated.player.miniPlayer.size, 400);
  assert.equal(migrated.player.miniPlayer.position, 'bottom-left');
  assert.equal(migrated.playback.defaultSpeed, 1.5);
  assert.deepEqual(migrated.playback.speedPresets, [0.5, 1, 1.5, 2]);
  assert.equal(migrated.productivity.focusMode, true);
  assert.equal(migrated.appearance.colors.accent, '#ff0033');
  assert.equal(migrated.layout.watchSpacing, 12);
  // Only the Phase 6 key is new.
  assert.equal(migrated.sync.enabled, false);
  assert.equal(migrated.schemaVersion, 1);
});

test('migration: corrupt fixture is repaired, unknown keys kept', () => {
  const stored = loadFixture('corrupt.json');
  const migrated = defaults.migrateSettings(stored);
  assert.equal(migrated.enabled, true);
  assert.equal(migrated.appearance.theme, 'default');
  assert.equal(migrated.playback.defaultSpeed, 1);
  assert.deepEqual(migrated.playback.speedPresets, [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  assert.equal(migrated.sidebar.customWidth, 402);
  assert.equal(migrated.sidebar.scrollSensitivity, 1);
  assert.deepEqual(migrated.player.customWidth, 0);
  assert.deepEqual(migrated.futureFeature, { x: 1 });
  assert.equal(migrated.schemaVersion, 1);
});

test('migration: settings-manager persists the migrated v0.1 copy', async () => {
  const mem = {};
  const area = {
    get: (key) => Promise.resolve({ [key]: mem[key] }),
    set: (obj) => {
      Object.assign(mem, obj);
      return Promise.resolve();
    },
  };
  area.set({ [constants.STORAGE_KEY]: loadFixture('v0.1-phase1.json') });
  const manager = createSettingsManager({
    storage: createStorage(area),
    defaults,
    constants,
    logger: { debug: () => {}, error: () => {} },
  });
  await manager.load();
  const persisted = mem[constants.STORAGE_KEY];
  assert.equal(persisted.sidebar.customWidth, 500);
  assert.equal(persisted.playback.defaultSpeed, 1);
  assert.equal(persisted.sync.enabled, false);
  assert.equal(persisted.schemaVersion, 1);
});
