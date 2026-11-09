/* OneYT — shared/storage.js
 *
 * The ONLY place that touches chrome.storage (Rules.md).
 * Everything else goes through SettingsManager, which uses this.
 *
 * The storage area is injectable so unit tests can pass a fake
 * in-memory area instead of chrome.storage.local:
 *
 *   const storage = OneYT.storage.createStorage(fakeArea);
 *   await storage.get('oneyt.settings.v1');
 *
 * In the extension, call createStorage() with no argument and it
 * uses chrome.storage.local. Outside a browser context (Node)
 * with no area given, every call rejects with a clear error
 * instead of crashing on an undefined `chrome`.
 *
 * Sync (AD-08, Phase 6): createStorage(area, syncArea) also
 * mirrors settings to chrome.storage.sync when the value being
 * saved has sync.enabled === true. The mirrored copy is the
 * syncable subset (see syncableSettings): everything except
 * appearance.customCSS, which stays local-only (sync size
 * limits). When sync is off, the stale sync copy is removed.
 * A failed sync write never fails the local save — local is
 * the source of truth.
 */
(function () {
  'use strict';

  function defaultArea() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    }
    return null;
  }

  function defaultSyncArea() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return chrome.storage.sync;
    }
    return null;
  }

  // The syncable subset of a settings object (AD-08): everything
  // except appearance.customCSS. Pure; does not mutate its input.
  function syncableSettings(settings) {
    var copy = JSON.parse(JSON.stringify(settings || {}));
    if (copy.appearance) delete copy.appearance.customCSS;
    return copy;
  }

  function createStorage(area, syncArea) {
    var store = area || defaultArea();
    var syncStore = syncArea !== undefined ? syncArea : defaultSyncArea();

    function requireStore() {
      if (!store) {
        throw new Error('OneYT storage: chrome.storage.local is not available');
      }
      return store;
    }

    return {
      // Reads one key (or an object of defaults). Resolves to the
      // stored value, or undefined when the key is absent.
      get: function (key) {
        var s = requireStore();
        return Promise.resolve(s.get(key)).then(function (result) {
          return result ? result[key] : undefined;
        });
      },

      // Reads one key from the sync area. Resolves to undefined
      // when sync is unavailable or the key is absent.
      getFromSync: function (key) {
        if (!syncStore) return Promise.resolve(undefined);
        return Promise.resolve(syncStore.get(key))
          .then(function (result) {
            return result ? result[key] : undefined;
          })
          .catch(function () {
            return undefined;
          });
      },

      // Writes an object of key -> value pairs to local storage.
      // When a value opts into sync (sync.enabled === true), the
      // syncable subset is mirrored to the sync area; when sync
      // is off, any stale sync copy is removed. Sync failures
      // never reject this promise — local is the source of truth.
      set: function (items) {
        var s = requireStore();
        return Promise.resolve(s.set(items)).then(function () {
          if (!syncStore) return undefined;
          var jobs = [];
          for (var key in items) {
            var value = items[key];
            if (
              !value ||
              typeof value !== 'object' ||
              !value.sync ||
              typeof value.sync !== 'object'
            ) {
              continue;
            }
            if (value.sync.enabled === true) {
              jobs.push(
                Promise.resolve(syncStore.set({ [key]: syncableSettings(value) })).catch(
                  function () {}
                )
              );
            } else if (typeof syncStore.remove === 'function') {
              jobs.push(Promise.resolve(syncStore.remove(key)).catch(function () {}));
            }
          }
          return Promise.all(jobs).then(function () {
            return undefined;
          });
        });
      },

      // Subscribes to chrome.storage.onChanged. The listener gets
      // (changes, areaName). Returns an unsubscribe function.
      onChanged: function (listener) {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) {
          return function () {};
        }
        chrome.storage.onChanged.addListener(listener);
        return function () {
          chrome.storage.onChanged.removeListener(listener);
        };
      },
    };
  }

  var api = {
    createStorage: createStorage,
    syncableSettings: syncableSettings,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.storage = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
