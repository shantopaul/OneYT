/* OneYT — content/early-shorts-block.js
 *
 * Document-start interceptor for YouTube /shorts/* URLs.
 *
 * Runs at "run_at": "document_start" strictly on /shorts* routes so enabling
 * "Remove all Shorts & block /shorts/ URLs" (or "Block Shorts") redirects before
 * YouTube parses HTML, paints a frame, or starts Shorts playback — avoiding any
 * millisecond flash of the Shorts player.
 *
 * Fast path: reads a tiny per-origin cache in localStorage ('oneyt.shortsBlockMode')
 * kept in sync by content/modules/layout/layout.js. If missing or uncertain,
 * temporarily hides <html> visibility (zero paint) and confirms against
 * chrome.storage.local ('oneyt.settings.v1') before either redirecting or
 * restoring visibility.
 */
(function () {
  'use strict';

  var SETTINGS_KEY = 'oneyt.settings.v1';
  var SHORTS_CACHE_KEY = 'oneyt.shortsBlockMode';

  function modeFromSettings(record) {
    if (!record || typeof record !== 'object') return 'off';
    if (record.enabled === false) return 'off';
    if (record.modules && record.modules.layout === false) return 'off';
    var layout = record.layout;
    if (!layout || typeof layout !== 'object') return 'off';
    if (layout.removeAllShorts === true) return 'remove';
    if (layout.blockShorts === true) return 'watch';
    return 'off';
  }

  function redirectTarget(pathname, mode) {
    if (typeof pathname !== 'string' || !/^\/shorts(?:\/|$)/.test(pathname)) {
      return null;
    }
    if (mode === 'remove') return '/';
    if (mode === 'watch') {
      var m = pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})(?:\/|$)/);
      return m ? '/watch?v=' + m[1] : null;
    }
    return null;
  }

  function hideRoot(doc) {
    try {
      if (doc && doc.documentElement && doc.documentElement.style) {
        doc.documentElement.style.display = 'none';
      }
    } catch {}
  }

  function setHiddenVisibility(doc, hidden) {
    try {
      if (doc && doc.documentElement && doc.documentElement.style) {
        doc.documentElement.style.visibility = hidden ? 'hidden' : '';
      }
    } catch {}
  }

  function readCachedMode(ls) {
    if (!ls || typeof ls.getItem !== 'function') return null;
    try {
      var value = ls.getItem(SHORTS_CACHE_KEY);
      if (value === 'remove' || value === 'watch' || value === 'off') return value;
    } catch {}
    return null;
  }

  function writeCachedMode(ls, mode) {
    if (!ls || typeof ls.setItem !== 'function') return;
    try {
      ls.setItem(SHORTS_CACHE_KEY, mode);
    } catch {}
  }

  function performRedirect(win, doc, loc, target) {
    hideRoot(doc);
    try {
      if (win && typeof win.stop === 'function') win.stop();
    } catch {}
    if (loc && typeof loc.replace === 'function') {
      loc.replace(target);
    }
  }

  function runEarlyShortsBlock(env) {
    env = env || {};
    var loc =
      Object.prototype.hasOwnProperty.call(env, 'location')
        ? env.location
        : typeof location !== 'undefined'
          ? location
          : null;
    var win =
      Object.prototype.hasOwnProperty.call(env, 'window')
        ? env.window
        : typeof window !== 'undefined'
          ? window
          : null;
    var doc =
      Object.prototype.hasOwnProperty.call(env, 'document')
        ? env.document
        : typeof document !== 'undefined'
          ? document
          : null;
    var ls =
      Object.prototype.hasOwnProperty.call(env, 'localStorage')
        ? env.localStorage
        : typeof localStorage !== 'undefined'
          ? localStorage
          : null;
    var storage =
      Object.prototype.hasOwnProperty.call(env, 'storage')
        ? env.storage
        : typeof chrome !== 'undefined' && chrome && chrome.storage && chrome.storage.local
          ? chrome.storage.local
          : null;

    var pathname = loc && typeof loc.pathname === 'string' ? loc.pathname : '';
    if (!/^\/shorts(?:\/|$)/.test(pathname)) return 'ignored';

    var cachedMode = readCachedMode(ls);
    var syncTarget = redirectTarget(pathname, cachedMode);
    if (syncTarget) {
      performRedirect(win, doc, loc, syncTarget);
      return 'redirected-sync';
    }

    // Cache absent or stale ('off'): hide paint while verifying against storage.
    setHiddenVisibility(doc, true);
    if (!storage || typeof storage.get !== 'function') {
      setHiddenVisibility(doc, false);
      return 'no-storage';
    }

    try {
      return Promise.resolve(storage.get(SETTINGS_KEY)).then(
        function (result) {
          var mode = modeFromSettings(result && result[SETTINGS_KEY]);
          writeCachedMode(ls, mode);
          var asyncTarget = redirectTarget(pathname, mode);
          if (asyncTarget) {
            performRedirect(win, doc, loc, asyncTarget);
            return 'redirected-async';
          }
          setHiddenVisibility(doc, false);
          return 'allowed';
        },
        function () {
          setHiddenVisibility(doc, false);
          return 'error';
        }
      );
    } catch {
      setHiddenVisibility(doc, false);
      return 'error';
    }
  }

  var api = {
    SETTINGS_KEY: SETTINGS_KEY,
    SHORTS_CACHE_KEY: SHORTS_CACHE_KEY,
    modeFromSettings: modeFromSettings,
    redirectTarget: redirectTarget,
    runEarlyShortsBlock: runEarlyShortsBlock,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    runEarlyShortsBlock();
  }
})();
