// OneYT — Phase 6 performance tests (node:test, fake DOM).
// 6.1: the mini-player observer must only run when the user
// configured something; debounce must collapse rapid writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const { createFakeDocument, createFakeElement, createFakeDom, quietLogger } = require('./fake-dom');
const { createPlayerModule } = require('../content/modules/player/player');
const settingsManagerApi = require('../content/core/settings-manager');

function settingsWith(patch) {
  const s = defaults.cloneDefaults();
  if (patch) {
    for (const [section, values] of Object.entries(patch)) {
      Object.assign(s[section], values);
    }
  }
  return s;
}

// Counts only document-subtree observes (the mini-player
// observer). The theater observer watches one element's
// attributes and is expected — it is not counted here.
function installFakeObserver(counter) {
  globalThis.MutationObserver = class {
    constructor() {
      counter.created++;
      this.subtree = false;
    }
    observe(target, options) {
      if (options && options.subtree) {
        this.subtree = true;
        counter.observed++;
      }
    }
    disconnect() {
      if (this.subtree) counter.disconnected++;
    }
  };
}

test('perf: no mini-player observer when nothing is configured', () => {
  const counter = { created: 0, observed: 0, disconnected: 0 };
  installFakeObserver(counter);
  try {
    const doc = createFakeDocument();
    const dom = createFakeDom({
      watchFlexy: createFakeElement(),
      playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
      player: createFakeElement(),
    });
    const mod = createPlayerModule({ dom, logger: quietLogger, document: doc });
    // No mini-player element, all mini settings at defaults.
    mod.apply(settingsWith({}), 'watch');
    mod.apply(settingsWith({}), 'home');
    assert.equal(counter.observed, 0, 'observer must not attach with defaults');
  } finally {
    delete globalThis.MutationObserver;
  }
});

test('perf: observer attaches when mini-player is configured, drops when cleared', () => {
  const counter = { created: 0, observed: 0, disconnected: 0 };
  installFakeObserver(counter);
  try {
    const doc = createFakeDocument();
    const dom = createFakeDom({
      watchFlexy: createFakeElement(),
      playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
      player: createFakeElement(),
    });
    const mod = createPlayerModule({ dom, logger: quietLogger, document: doc });
    mod.apply(
      settingsWith({ player: { miniPlayer: { size: 400, position: 'bottom-left' } } }),
      'home'
    );
    assert.equal(counter.observed, 1, 'observer attaches for configured mini-player');
    // Clear the configuration: the observer must disconnect.
    mod.apply(settingsWith({}), 'home');
    assert.equal(counter.disconnected, 1, 'observer disconnects when config is cleared');
    // Configured again: attaches once more (no duplicates).
    mod.apply(settingsWith({ player: { miniPlayer: { size: 400 } } }), 'home');
    assert.equal(counter.observed, 2);
    mod.disable();
    assert.equal(counter.disconnected, 2);
  } finally {
    delete globalThis.MutationObserver;
  }
});

test('perf: settings writes debounce — 10 rapid sets become 1 write', async () => {
  const store = new Map();
  let writes = 0;
  const storage = {
    get: async (key) => store.get(key),
    set: async (items) => {
      writes++;
      for (const key in items) store.set(key, items[key]);
    },
  };
  const manager = settingsManagerApi.createSettingsManager({
    storage,
    logger: quietLogger,
  });
  await manager.load();
  writes = 0;
  for (let i = 0; i < 10; i++) {
    manager.set('player.customWidth', 800 + i);
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(writes, 1);
  assert.equal(store.get('oneyt.settings.v1').player.customWidth, 809);
});
