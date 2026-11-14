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
      onboarded: false, // true once the welcome setup is finished or skipped (Phase 17)
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
      accentColor: '', // #rrggbb = recolour the progress bar + scrubber knob; '' = YouTube default red (Phase 23)
      sticky: false,
      defaultTheater: false, // open every video in theater mode automatically
      hideEndscreen: false, // hide the video suggestions shown at the end of a video
      hideLikeCount: false, // hide the number next to the Like button (button stays clickable)
      hideViewCount: false, // hide the "X views" line on the watch page
      hideSubscriberCount: false, // hide "X subscribers" next to the channel name (Subscribe stays)
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
      playerOffset: 0, // px
    },

    layout: {
      blockShorts: false, // v1.1: hide Shorts everywhere + open /shorts/ links as normal videos
      hideShortsHome: false,
      hideShortsWatch: false,
      hideTopicChips: false, // hide the topic filter chips row on the home feed
      hideLiveShelf: false, // hide the "Live now" shelf on the home feed
      hideMixesShelf: false, // hide Mixes on the home feed (shelf + individual mix cards)
      hideNewsShelf: false, // hide the "Breaking news" shelf on the home feed
      homeColumns: 0, // 0 = default (1-15)
      responsiveColumns: false, // auto-adjust columns on narrow viewports
      postsPerRow: 0, // 0 = default (1-6)
      shelfItemsPerRow: 0, // 0 = default (1-15, Shorts & shelf cards)
      cardSpacing: 0, // px, 0 = default
      thumbnailSize: 0, // px width, 0 = default
      homeMaxWidth: 0, // px, 0 = YouTube default (Phase 22: cap + centre the home grid)
      hideChannelProfile: false, // hide channel avatars under video cards
      fullVideoTitles: false, // show full video titles without line clamping
      channelWide: false, // full-width channel grid layout
      channelColumns: 0, // 0 = default (1-15 videos per row on channel pages)
      channelShelfItemsPerRow: 0, // 0 = default (1-15 Shorts/shelf items per row on channel pages)
      hideComments: false,
      watchSpacing: 0, // px gap between player and #below, 0 = default (Phase 2)
    },

    appearance: {
      theme: 'default', // default | dark | light | midnight | amoled | minimal | custom
      colors: {},
      typography: {
        fontFamily: '',
        customFont: '', // any font installed on this device, by name; wins over fontFamily when valid (Phase 24)
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
  // Stored values win when their type matches the default's type.
  // `null` is never a valid section/object value: a stored null
  // for an object-typed default is corrupt and replaced by the
  // default (a stored `{player: null}` used to wipe the whole
  // section). Nullable leaves (autoplay / captions: boolean |
  // null) accept null or a boolean only — any other primitive
  // (e.g. "yes" from a hand-edited import) is corrupt too.
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
        // Nullable key (autoplay / captions: boolean | null).
        // Accept null or a boolean only; any other primitive
        // or object is corrupt and replaced by the default.
        out[key] =
          storedValue === null || typeof storedValue === 'boolean'
            ? deepClone(storedValue)
            : defaultValue;
      } else if (storedValue !== null && typeof storedValue === typeof defaultValue) {
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
