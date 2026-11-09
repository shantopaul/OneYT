/* OneYT — content/core/settings-manager.js
 *
 * Owns the settings lifecycle:
 *   load()  — read storage, migrate (additive only), persist the
 *             migrated copy only when something actually changed
 *             (new keys added / corrupt keys repaired / old schema).
 *   get()   — current settings (deep clone; callers must not mutate)
 *   set(path, value) — dotted path, e.g. set('sidebar.customWidth', 420);
 *             writes are debounced (150 ms) so slider drags do
 *             not spam chrome.storage.
 *   onChange(fn) — notified on any change, local or from another
 *             context (popup / dashboard) via storage.onChanged.
 *
 * Storage writes go through shared/storage.js only.
 * Migration itself lives in shared/defaults.js (pure, tested).
 */
(function () {
  'use strict';

  function createSettingsManager(deps) {
    var storage = deps.storage;
    var defaultsApi = deps.defaults || (globalThis.OneYT && globalThis.OneYT.defaults);
    var constants = deps.constants || (globalThis.OneYT && globalThis.OneYT.constants);
    var logger = deps.logger ||
      (globalThis.OneYT && globalThis.OneYT.logger) || {
        debug: function () {},
        error: function () {},
      };
    var STORAGE_KEY = (constants && constants.STORAGE_KEY) || 'oneyt.settings.v1';
    var DEBOUNCE_MS = (constants && constants.DEBOUNCE && constants.DEBOUNCE.STORAGE_WRITE) || 150;

    var current = defaultsApi.cloneDefaults();
    var listeners = [];
    var writeTimer = null;
    var loaded = false;
    var unsubscribeStorage = null;

    function notify() {
      var snapshot = defaultsApi.deepClone(current);
      listeners.slice().forEach(function (fn) {
        try {
          fn(snapshot);
        } catch (err) {
          logger.error('settings: onChange listener threw', err);
        }
      });
    }

    function scheduleWrite() {
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(function () {
        writeTimer = null;
        storage.set({ [STORAGE_KEY]: defaultsApi.deepClone(current) }).catch(function (err) {
          logger.error('settings: failed to save', err);
        });
      }, DEBOUNCE_MS);
    }

    // For tests / shutdown: flush a pending debounced write now.
    function flush() {
      if (writeTimer) {
        clearTimeout(writeTimer);
        writeTimer = null;
        return storage.set({ [STORAGE_KEY]: defaultsApi.deepClone(current) });
      }
      return Promise.resolve();
    }

    function load() {
      var seeded = false;
      return storage
        .get(STORAGE_KEY)
        .then(function (stored) {
          if (stored !== undefined) return stored;
          // First run on this device: seed from sync (AD-08) when
          // another device already synced settings.
          if (typeof storage.getFromSync !== 'function') return undefined;
          return storage.getFromSync(STORAGE_KEY).then(function (synced) {
            if (synced !== undefined) seeded = true;
            return synced;
          });
        })
        .then(function (stored) {
          var migrated = defaultsApi.migrateSettings(stored);
          var changed =
            seeded ||
            stored === undefined ||
            JSON.stringify(stored) !== JSON.stringify(migrated);
          current = migrated;
          loaded = true;
          if (changed) {
            // Persist added defaults / repaired keys / new schema.
            // Awaited so callers know storage is consistent.
            return storage
              .set({ [STORAGE_KEY]: defaultsApi.deepClone(current) })
              .catch(function (err) {
                logger.error('settings: failed to save migrated settings', err);
              });
          }
          return undefined;
        })
        .catch(function (err) {
          logger.error('settings: failed to load, using defaults', err);
          current = defaultsApi.cloneDefaults();
          loaded = true;
          return undefined;
        });
    }

    function get() {
      return defaultsApi.deepClone(current);
    }

    function getPath(path) {
      var parts = String(path).split('.');
      var node = current;
      for (var i = 0; i < parts.length; i++) {
        if (node === null || typeof node !== 'object') return undefined;
        node = node[parts[i]];
      }
      return defaultsApi.deepClone(node);
    }

    function set(path, value) {
      var parts = String(path).split('.');
      var node = current;
      for (var i = 0; i < parts.length - 1; i++) {
        if (node[parts[i]] === null || typeof node[parts[i]] !== 'object') {
          node[parts[i]] = {};
        }
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = defaultsApi.deepClone(value);
      scheduleWrite();
      notify();
    }

    function onChange(fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (f) {
          return f !== fn;
        });
      };
    }

    // Watch for changes made in another context (popup/dashboard)
    // or on another device (sync area, AD-08).
    function watchExternalChanges() {
      if (unsubscribeStorage) return;
      unsubscribeStorage = storage.onChanged(function (changes, areaName) {
        if (areaName !== 'local' && areaName !== 'sync') return;
        var change = changes && changes[STORAGE_KEY];
        if (!change || !change.newValue) return;
        if (areaName === 'sync') {
          // Merge: the synced copy wins, except customCSS which
          // is local-only — the local value is kept. Identical
          // merges are skipped, so a mirror write back to sync
          // cannot loop (mirror -> sync event -> same merge).
          var merged = defaultsApi.migrateSettings(change.newValue);
          var localCSS =
            current && current.appearance ? current.appearance.customCSS || '' : '';
          if (!merged.appearance) merged.appearance = {};
          merged.appearance.customCSS = localCSS;
          if (JSON.stringify(merged) === JSON.stringify(current)) return;
          current = merged;
          storage
            .set({ [STORAGE_KEY]: defaultsApi.deepClone(current) })
            .catch(function (err) {
              logger.error('settings: failed to save merged sync settings', err);
            });
          notify();
          return;
        }
        current = defaultsApi.migrateSettings(change.newValue);
        notify();
      });
    }

    function isLoaded() {
      return loaded;
    }

    return {
      load: load,
      get: get,
      getPath: getPath,
      set: set,
      flush: flush,
      onChange: onChange,
      watchExternalChanges: watchExternalChanges,
      isLoaded: isLoaded,
    };
  }

  var api = { createSettingsManager: createSettingsManager };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.settingsManager = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
