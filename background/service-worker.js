/* OneYT — background/service-worker.js
 *
 * Manifest V3 service worker. Kept deliberately thin:
 * - onInstalled: seed default settings when none exist yet.
 * - onMessage: relay for popup/dashboard — get settings, or set
 *   one setting by dotted path. The content script stays the
 *   source of truth for what is applied on the page.
 *
 * No DOM access, no fetching, no timers, no network (Rules.md).
 * Stateless by design: everything is re-read from storage, so a
 * worker restart loses nothing.
 *
 * Shared files are loaded with importScripts (classic worker,
 * same UMD pattern as the content scripts).
 */
try {
  importScripts('../shared/constants.js', '../shared/defaults.js', '../shared/storage.js');
} catch (err) {
  console.error('[OneYT:error] service worker failed to load shared files', err);
}

(function () {
  'use strict';

  var ns = globalThis.OneYT || {};
  var constants = ns.constants || {};
  var defaultsApi = ns.defaults;
  var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';

  function storage() {
    return ns.storage.createStorage();
  }

  function setByPath(settings, path, value) {
    var parts = String(path).split('.');
    var node = settings;
    for (var i = 0; i < parts.length - 1; i++) {
      if (node[parts[i]] === null || typeof node[parts[i]] !== 'object') {
        node[parts[i]] = {};
      }
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
    return settings;
  }

  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason !== 'install' && details.reason !== 'update') return;
    storage()
      .get(STORAGE_KEY)
      .then(function (stored) {
        var migrated = defaultsApi.migrateSettings(stored);
        if (stored === undefined || JSON.stringify(stored) !== JSON.stringify(migrated)) {
          return storage().set({ [STORAGE_KEY]: migrated });
        }
        return undefined;
      })
      .catch(function (err) {
        console.error('[OneYT:error] failed to seed settings', err);
      });
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || typeof message.type !== 'string') return false;
    if (message.type === 'oneyt:get-settings') {
      storage()
        .get(STORAGE_KEY)
        .then(function (stored) {
          sendResponse({ ok: true, settings: defaultsApi.migrateSettings(stored) });
        })
        .catch(function (err) {
          sendResponse({ ok: false, error: String(err) });
        });
      return true; // async response
    }
    if (message.type === 'oneyt:set-setting' && typeof message.path === 'string') {
      storage()
        .get(STORAGE_KEY)
        .then(function (stored) {
          var settings = setByPath(
            defaultsApi.migrateSettings(stored),
            message.path,
            message.value
          );
          return storage()
            .set({ [STORAGE_KEY]: settings })
            .then(function () {
              sendResponse({ ok: true, settings: settings });
            });
        })
        .catch(function (err) {
          sendResponse({ ok: false, error: String(err) });
        });
      return true; // async response
    }
    return false;
  });
})();
