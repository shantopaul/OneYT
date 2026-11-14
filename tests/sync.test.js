// OneYT — Phase 6 sync tests (node:test, fake storage areas).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const storageApi = require('../shared/storage');
const settingsManagerApi = require('../content/core/settings-manager');

const KEY = 'oneyt.settings.v1';
const quietLogger = { debug: () => {}, error: () => {} };

function fakeArea() {
  const map = new Map();
  return {
    map,
    get: async (key) => {
      const value = map.get(key);
      return value === undefined ? {} : { [key]: value };
    },
    set: async (items) => {
      for (const key in items) map.set(key, items[key]);
    },
    remove: async (key) => {
      map.delete(key);
    },
  };
}

function failingArea() {
  return {
    get: async () => {
      throw new Error('quota exceeded');
    },
    set: async () => {
      throw new Error('quota exceeded');
    },
    remove: async () => {
      throw new Error('quota exceeded');
    },
  };
}

test('sync: syncableSettings strips only custom CSS, does not mutate', () => {
  const settings = defaults.cloneDefaults();
  settings.appearance.customCSS = 'x{color:red}';
  settings.appearance.theme = 'midnight';
  settings.sync.enabled = true;
  const subset = storageApi.syncableSettings(settings);
  assert.equal(subset.appearance.customCSS, undefined);
  assert.equal(subset.appearance.theme, 'midnight');
  assert.equal(subset.sync.enabled, true);
  assert.equal(settings.appearance.customCSS, 'x{color:red}');
});

test('sync: set mirrors to sync when enabled, removes stale copy when off', async () => {
  const local = fakeArea();
  const sync = fakeArea();
  const storage = storageApi.createStorage(local, sync);
  const on = defaults.cloneDefaults();
  on.appearance.customCSS = 'x{}';
  on.sync.enabled = true;
  await storage.set({ [KEY]: on });
  const mirrored = sync.map.get(KEY);
  assert.ok(mirrored);
  assert.equal(mirrored.appearance.customCSS, undefined);
  assert.equal(mirrored.sync.enabled, true);
  assert.equal(local.map.get(KEY).appearance.customCSS, 'x{}');

  const off = defaults.cloneDefaults();
  off.sync.enabled = false;
  await storage.set({ [KEY]: off });
  assert.equal(sync.map.has(KEY), false);
});

test('sync: a failing sync area never fails the local save', async () => {
  const local = fakeArea();
  const storage = storageApi.createStorage(local, failingArea());
  const settings = defaults.cloneDefaults();
  settings.sync.enabled = true;
  await storage.set({ [KEY]: settings });
  assert.equal(local.map.get(KEY).sync.enabled, true);
  assert.equal(await storage.getFromSync(KEY), undefined);
});

test('sync: settings-manager seeds from sync when local is empty', async () => {
  const local = fakeArea();
  const sync = fakeArea();
  const seed = defaults.cloneDefaults();
  seed.player.customWidth = 900;
  seed.sync.enabled = true;
  sync.map.set(KEY, seed);
  const manager = settingsManagerApi.createSettingsManager({
    storage: storageApi.createStorage(local, sync),
    logger: quietLogger,
  });
  await manager.load();
  assert.equal(manager.get().player.customWidth, 900);
  assert.equal(local.map.get(KEY).player.customWidth, 900);
});

test('sync: settings-manager merges sync changes, keeps local custom CSS', async () => {
  const local = fakeArea();
  const sync = fakeArea();
  let listener = null;
  globalThis.chrome = {
    storage: {
      onChanged: {
        addListener: (fn) => {
          listener = fn;
        },
        removeListener: () => {
          listener = null;
        },
      },
    },
  };
  try {
    const manager = settingsManagerApi.createSettingsManager({
      storage: storageApi.createStorage(local, sync),
      logger: quietLogger,
    });
    await manager.load();
    manager.set('appearance.customCSS', 'local-css{}');
    await manager.flush();
    manager.watchExternalChanges();
    assert.ok(listener);

    const incoming = defaults.cloneDefaults();
    incoming.player.customWidth = 700;
    incoming.sync.enabled = true;
    listener({ [KEY]: { newValue: incoming } }, 'sync');
    await new Promise((resolve) => setTimeout(resolve, 20));
    const after = manager.get();
    assert.equal(after.player.customWidth, 700);
    assert.equal(after.appearance.customCSS, 'local-css{}');
    assert.equal(local.map.get(KEY).player.customWidth, 700);

    // The same sync event again must not rewrite local (no loop).
    const before = local.map.get(KEY);
    listener({ [KEY]: { newValue: incoming } }, 'sync');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(local.map.get(KEY), before);
  } finally {
    delete globalThis.chrome;
  }
});

test('createStorage resolves cleanly on sync/async Extension context invalidated errors', async () => {
  const ctxErr = () => new Error('Extension context invalidated.');
  const invalidatedSyncArea = {
    get: () => {
      throw ctxErr();
    },
    set: () => {
      throw ctxErr();
    },
    remove: () => {
      throw ctxErr();
    },
  };

  const syncThrowStorage = storageApi.createStorage(invalidatedSyncArea, invalidatedSyncArea);
  assert.equal(await syncThrowStorage.get(KEY), undefined);
  assert.equal(await syncThrowStorage.getFromSync(KEY), undefined);
  assert.equal(await syncThrowStorage.set({ [KEY]: { sync: { enabled: true } } }), undefined);

  const invalidatedAsyncArea = {
    get: () => Promise.reject(ctxErr()),
    set: () => Promise.reject(ctxErr()),
  };
  const asyncRejectStorage = storageApi.createStorage(invalidatedAsyncArea, null);
  assert.equal(await asyncRejectStorage.get(KEY), undefined);
  assert.equal(await asyncRejectStorage.set({ [KEY]: { ok: true } }), undefined);

  const realFailureArea = {
    get: () => {
      throw new Error('Quota exceeded');
    },
    set: () => Promise.reject(new Error('Disk full')),
  };
  const realErrorStorage = storageApi.createStorage(realFailureArea, null);
  await assert.rejects(() => realErrorStorage.get(KEY), /Quota exceeded/);
  await assert.rejects(() => realErrorStorage.set({ [KEY]: 1 }), /Disk full/);
});

test('createStorage guards default chrome.storage and onChanged when runtime is invalidated', async () => {
  const invalidatedErr = new Error('Extension context invalidated.');
  globalThis.chrome = {
    runtime: { id: undefined },
    storage: {
      local: {
        get: () => {
          throw new Error('Unexpected native failure');
        },
        set: () => {
          throw new Error('Unexpected native failure');
        },
      },
      onChanged: {
        addListener: () => {
          throw invalidatedErr;
        },
        removeListener: () => {
          throw invalidatedErr;
        },
      },
    },
  };
  try {
    const store = storageApi.createStorage();
    assert.equal(await store.get(KEY), undefined);
    assert.equal(await store.set({ [KEY]: { ok: true } }), undefined);
    const unsub = store.onChanged(() => {});
    unsub();

    // Even when runtime.id looks present initially and invalidates during listener removal
    globalThis.chrome.runtime.id = 'ext-id';
    let removed = false;
    globalThis.chrome.storage.onChanged = {
      addListener: () => {
        throw invalidatedErr;
      },
      removeListener: () => {
        removed = true;
      },
    };
    const unsubThrow = store.onChanged(() => {});
    unsubThrow();
    assert.equal(removed, false);
  } finally {
    delete globalThis.chrome;
  }
});
