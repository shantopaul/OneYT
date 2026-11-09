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
 */
(function () {
  'use strict';

  function defaultArea() {
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      return chrome.storage.local;
    }
    return null;
  }

  function createStorage(area) {
    var store = area || defaultArea();

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

      // Writes an object of key -> value pairs.
      set: function (items) {
        var s = requireStore();
        return Promise.resolve(s.set(items));
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
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.storage = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
