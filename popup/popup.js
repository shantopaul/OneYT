/* OneYT — popup/popup.js
 *
 * Minimal Phase 1 popup: master enable/disable + status.
 * Reads/writes settings through shared/storage.js (same store
 * the content script watches), so a toggle here applies live
 * on any open YouTube tab via storage.onChanged — no reload.
 *
 * Full quick controls (Focus, scroll, theme, player) arrive
 * in Phase 5 with the dashboard.
 */
(function () {
  'use strict';

  var ns = globalThis.OneYT || {};
  var storage = ns.storage.createStorage();
  var defaultsApi = ns.defaults;
  var constants = ns.constants || {};
  var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';

  var statusEl = document.getElementById('status');
  var toggleEl = document.getElementById('enabled-toggle');
  var hintEl = document.getElementById('page-hint');

  function render(settings) {
    var enabled = !!settings.enabled;
    toggleEl.checked = enabled;
    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.classList.toggle('on', enabled);
    statusEl.classList.toggle('off', !enabled);
    hintEl.textContent = enabled
      ? 'OneYT is active on YouTube pages.'
      : 'OneYT is off — YouTube is untouched.';
  }

  function load() {
    return storage
      .get(STORAGE_KEY)
      .then(function (stored) {
        return defaultsApi.migrateSettings(stored);
      })
      .catch(function () {
        return defaultsApi.cloneDefaults();
      });
  }

  toggleEl.addEventListener('change', function () {
    var enabled = toggleEl.checked;
    load()
      .then(function (settings) {
        settings.enabled = enabled;
        return storage.set({ [STORAGE_KEY]: settings }).then(function () {
          render(settings);
        });
      })
      .catch(function () {
        // Write failed: put the toggle back to the last good state.
        load().then(render);
      });
  });

  // Keep the popup in sync if settings change elsewhere.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;
      var change = changes && changes[STORAGE_KEY];
      if (change && change.newValue) {
        render(defaultsApi.migrateSettings(change.newValue));
      }
    });
  }

  load().then(render);
})();
