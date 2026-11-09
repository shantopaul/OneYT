/* OneYT — shared/defaults.js
 *
 * Single source of truth for ALL default setting values.
 * No default value may live anywhere else (Rules.md).
 *
 * Also holds the pure (no chrome.*) helpers used by migration:
 * deepClone, deepMerge and migrateSettings. They are pure so
 * unit tests can run them in Node with no browser.
 *
 * Migration rule (Architecture.md §7.2): additive only.
 * - User values are never overwritten.
 * - New keys get defaults.
 * - Unknown old keys are preserved (forward-compat).
 * - A stored value whose type does not match the default's type
 *   is treated as corrupt for that key and replaced by the default.
 */
(function () {
  'use strict';

  var SCHEMA_VERSION = 1;

  var DEFAULT_SETTINGS = {
    schemaVersion: 1,
    enabled: true,

    sync: {
      enabled: false, // opt-in (AD-08): mirror settings to chrome.storage.sync
    },

    // Dashboard UI itself (v1.2): which colour scheme the
    // settings dashboard uses. 'system' follows the OS
    // (prefers-color-scheme); 'dark'/'light' force one.
    ui: {
      dashboardTheme: 'system', // system | dark | light
    },

    modules: {
      player: true,
      layout: true,
      sidebar: true,
      appearance: true,
      playback: true,
      recommendations: true,
      focus: true,
      navigation: true,
      typography: true,
      keyboard: true,
    },

    player: {
      customWidth: 0, // 0 = YouTube default; px otherwise
      maxWidth: 1280, // px, 0 = no cap
      alignment: 'center', // left | center | right
      position: 'default', // default | sticky | fixed | absolute
      borderRadius: 12, // px
      border: 'none', // CSS border shorthand or "none"
      shadow: 'none', // CSS box-shadow or "none"
      spacing: 0, // px around player
      sticky: false,
      hideEndscreen: false, // hide the video suggestions shown at the end of a video
      miniPlayer: {
        size: 0, // px width, 0 = YouTube default
        position: 'default', // default | bottom-right | bottom-left | top-right | top-left
        borderRadius: 0, // px, 0 = YouTube default
        shadow: 'none', // CSS box-shadow or "none"
        offsetX: 0, // px from the chosen corner
        offsetY: 0, // px from the chosen corner
      },
    },

    sidebar: {
      independentScroll: true,
      maxHeight: 'calc(100vh - 100px)',
      customWidth: 402, // px, 0 = YouTube default
      scrollbarVisible: true,
      scrollbarWidth: 8, // px
      smoothScroll: true,
      scrollSensitivity: 1, // multiplier
      keepPlayerVisible: true,
      playerOffset: 0, // px
    },

    layout: {
      blockShorts: false, // v1.1: hide Shorts everywhere + open /shorts/ links as normal videos
      hideShortsHome: false,
      hideShortsWatch: false,
      homeColumns: 0, // 0 = default
      cardSpacing: 0, // px, 0 = default
      thumbnailSize: 0, // px width, 0 = default
      hideComments: false,
      watchSpacing: 0, // px gap between player and #below, 0 = default (Phase 2)
    },

    appearance: {
      theme: 'default', // default | dark | light | midnight | amoled | minimal | custom
      colors: {},
      typography: {
        fontFamily: '',
        fontSize: 0, // 0 = YouTube default
        fontWeight: 0, // 0 = YouTube default
        lineHeight: 0, // 0 = YouTube default
      },
      customCSS: '',
      customCSSEnabled: false,
      borderRadius: 12, // px, thumbnails/cards (0 = sharp corners)
      spacing: 16, // px, UI gaps (filter chips)
    },

    playback: {
      defaultSpeed: 1,
      rememberSpeed: true,
      speedPresets: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      defaultVolume: 100,
      rememberVolume: true,
      autoplay: null, // null = YouTube default
      defaultQuality: 'auto', // auto | 1080p | 720p | ... (best-effort)
      captions: null, // null = YouTube default
      captionFontSize: 0, // % , 0 = YouTube default
    },

    recommendations: {
      hideSidebar: false,
      density: 'comfortable', // comfortable | compact
      cardSize: 0, // 0 = default
      showMetadata: true,
    },

    productivity: {
      focusMode: false,
      focusHideComments: true,
      focusHideChat: true,
      focusHideRecommendations: true,
      focusHideShorts: true,
      focusHideButtons: true, // like/share/download row
      focusHideMetadata: true, // video description
      focusHideNav: true, // guide only — masthead (search/account) is never hidden
    },

    keyboard: {
      shortcuts: {
        // Shift+ combos: plain letters are YouTube-native keys
        // (f = fullscreen, t = theater, ...), so defaults use
        // Shift to avoid conflicts. "" = unbound.
        toggleFocus: 'Shift+F',
        toggleSidebar: 'Shift+S',
        togglePlayerPosition: 'Shift+P',
        speedUp: 'Shift+>',
        speedDown: 'Shift+<',
        resetSpeed: 'Shift+R',
        toggleTheater: 'Shift+T',
      },
    },

    navigation: {
      hideHome: false,
      hideShorts: false,
      hideSubscriptions: false,
      hideLibrary: false,
      hideHistory: false,
      compact: false, // mini guide (icons only)
      guideWidth: 0, // px, 0 = YouTube default (min 72)
    },
  };

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function deepClone(value) {
    if (Array.isArray(value)) return value.map(deepClone);
    if (isPlainObject(value)) {
      var out = {};
      for (var key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          out[key] = deepClone(value[key]);
        }
      }
      return out;
    }
    return value;
  }

  function cloneDefaults() {
    return deepClone(DEFAULT_SETTINGS);
  }

  // Deep-merge `stored` onto a fresh copy of the defaults.
  // Stored values win when their type matches the default's type
  // (null in the stored value is kept only when the default is
  // also null, or the key is a known nullable key — autoplay /
  // captions / defaultQuality handled by the type check below:
  // typeof null is "object", so null only survives where the
  // default is null).
  function deepMerge(defaults, stored) {
    var out = deepClone(defaults);
    if (!isPlainObject(stored)) return out;
    for (var key in stored) {
      if (!Object.prototype.hasOwnProperty.call(stored, key)) continue;
      var storedValue = stored[key];
      if (!(key in out)) {
        // Unknown key: preserve it (forward-compat).
        out[key] = deepClone(storedValue);
        continue;
      }
      var defaultValue = out[key];
      if (isPlainObject(defaultValue) && isPlainObject(storedValue)) {
        out[key] = deepMerge(defaultValue, storedValue);
      } else if (Array.isArray(defaultValue) && Array.isArray(storedValue)) {
        out[key] = deepClone(storedValue);
      } else if (defaultValue === null) {
        // Nullable key (e.g. autoplay / captions: boolean | null).
        // Accept null or any primitive; reject objects/arrays.
        out[key] =
          storedValue === null || typeof storedValue !== 'object'
            ? deepClone(storedValue)
            : defaultValue;
      } else if (typeof storedValue === typeof defaultValue) {
        out[key] = deepClone(storedValue);
      }
      // Type mismatch: keep the default (corrupt key repaired).
    }
    return out;
  }

  // Migrate any stored settings object to the current schema.
  // Returns a fresh, fully-populated settings object.
  // Non-object / null input yields a clean copy of the defaults.
  function migrateSettings(stored) {
    var merged = deepMerge(DEFAULT_SETTINGS, stored);
    merged.schemaVersion = SCHEMA_VERSION;
    return merged;
  }

  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    cloneDefaults: cloneDefaults,
    deepClone: deepClone,
    deepMerge: deepMerge,
    migrateSettings: migrateSettings,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.defaults = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
