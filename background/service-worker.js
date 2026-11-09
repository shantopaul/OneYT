/* OneYT — background/service-worker.js
 *
 * Manifest V3 service worker. Kept deliberately thin:
 * - onInstalled: seed default settings when none exist yet.
 *
 * No onMessage relay: popup and dashboard write storage
 * directly, so no relay is needed. (Phase 6 security review
 * removed the old relay — it had no senders, and its
 * set-by-path handler accepted an arbitrary path/value with
 * no validation, which is exactly the shape a prototype
 * pollution bug takes. Dead code with that shape does not
 * ship.)
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
})();
