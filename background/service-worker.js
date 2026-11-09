/* OneYT — background/service-worker.js
 *
 * Manifest V3 service worker. Kept deliberately thin:
 * - onInstalled: seed default settings when none exist yet.
 * - onInstalled (install only): open the welcome setup
 *   once (Phase 17). Update installs never open it.
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
      .then(function () {
        // Welcome setup (Phase 17): open the page once, on
        // a fresh install only. An update install never
        // opens it — existing users are never interrupted.
        // If the page was already finished or skipped
        // (ui.onboarded), the page itself shows the last
        // step instead of restarting the setup.
        if (details.reason !== 'install') return undefined;
        if (
          typeof chrome !== 'undefined' &&
          chrome.tabs &&
          chrome.tabs.create &&
          chrome.runtime &&
          chrome.runtime.getURL
        ) {
          chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
        }
        return undefined;
      })
      .catch(function (err) {
        console.error('[OneYT:error] failed to seed settings', err);
      });
  });
})();
