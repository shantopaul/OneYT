/* OneYT — shared/constants.js
 *
 * Single source of truth for magic strings: page types, events,
 * storage keys, message types and numeric limits.
 * No YouTube selectors here — those live in selectors.js.
 * No defaults here — those live in defaults.js.
 *
 * Loaded as a classic script (see manifest.json). Exposes
 * `OneYT.constants` in the browser and `module.exports` in Node.
 */
(function () {
  'use strict';

  var CONSTANTS = {
    EXTENSION_NAME: 'OneYT',
    SCHEMA_VERSION: 1,

    // Page types returned by PageDetector.detect()
    PAGE_TYPES: {
      HOME: 'home',
      WATCH: 'watch',
      SEARCH: 'search',
      SUBSCRIPTIONS: 'subscriptions',
      CHANNEL: 'channel',
      PLAYLIST: 'playlist',
      SHORTS: 'shorts',
      OTHER: 'other',
    },

    // YouTube SPA navigation event (fired by YouTube itself)
    YT_NAVIGATE_FINISH: 'yt-navigate-finish',

    // chrome.storage keys
    STORAGE_KEY: 'oneyt.settings.v1',

    // Debounce intervals (ms) — see Rules.md: no storage spam
    // from sliders, no layout thrash from resize.
    DEBOUNCE: {
      STORAGE_WRITE: 150,
      RESIZE: 150,
    },

    // How long a scoped MutationObserver waits for a late-loaded
    // element before giving up silently (ms).
    OBSERVER_TIMEOUT: 10000,

    // Import/export limits
    MAX_CUSTOM_CSS_LENGTH: 50000,
    MAX_IMPORT_BYTES: 200000,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.constants = CONSTANTS;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
  }
})();
