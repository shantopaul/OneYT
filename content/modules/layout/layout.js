/* OneYT — content/modules/layout/layout.js
 *
 * Layout module: watch page (Phase 2) + homepage (Phase 3).
 *
 * Watch page:
 * - Hide comments (layout.hideComments) — hides #comments.
 * - Watch spacing (layout.watchSpacing, px) — gap between the
 *   player and the area below it (#below).
 * - Hide Shorts shelf (layout.hideShortsWatch).
 *
 * Homepage:
 * - Grid columns (layout.homeColumns, 0 = YouTube default) —
 *   sets --ytd-rich-grid-items-per-row through a variable.
 * - Card spacing (layout.cardSpacing, px, 0 = default) —
 *   sets --ytd-rich-grid-item-margin through a variable.
 * - Thumbnail size (layout.thumbnailSize, px width, 0 = default).
 * - Hide Shorts shelf (layout.hideShortsHome).
 * - Hide Live / Mixes / News shelves (layout.hideLiveShelf,
 *   layout.hideMixesShelf, layout.hideNewsShelf) — the
 *   "Live now" shelf, Mixes, and the "Breaking news" shelf
 *   on the home feed.
 *
 * Every page (v1.1 Block Shorts):
 * - Block Shorts (layout.blockShorts) — one class on <html>
 *   on every page type (see apply(): it is set after the
 *   page branches so cleanup() cannot strip it), plus a
 *   redirect off the Shorts player page: /shorts/VIDEOID
 *   becomes /watch?v=VIDEOID. The redirect target is a pure
 *   function (shortsWatchUrl) so it is unit-testable, and the
 *   actual navigation is injectable (deps.redirect) so tests
 *   never navigate.
 *
 * All are class + variable toggles; disabling removes them.
 * The grid variables are YouTube's own — if YouTube renames
 * them, the rule silently does nothing instead of breaking
 * the page (same graceful-degradation idea as AD-10).
 * Fullscreen does not need a guard here: #comments is not
 * visible in fullscreen, and the spacing has no effect there.
 */
(function () {
  'use strict';

  // Pure: /shorts/VIDEOID -> /watch?v=VIDEOID, anything else -> null.
  // Video IDs are 11 chars [A-Za-z0-9_-]; anything that does not
  // match is left alone (safe fallback — no redirect).
  function shortsWatchUrl(pathname) {
    if (typeof pathname !== 'string') return null;
    var m = pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})(?:\/|$)/);
    if (!m) return null;
    return '/watch?v=' + m[1];
  }

  function createLayoutModule(deps) {
    deps = deps || {};
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var loc = deps.location || (typeof location !== 'undefined' ? location : null);
    // Default redirect: location.replace (no history entry, so
    // Back does not return to the Shorts page). Overridden in
    // tests with a recorder.
    var redirectFn =
      deps.redirect ||
      function (url) {
        if (loc && typeof loc.replace === 'function') loc.replace(url);
      };

    function rootEl() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function setClass(name, on) {
      var root = rootEl();
      if (!root || !root.classList) return;
      if (on) root.classList.add(name);
      else root.classList.remove(name);
    }

    function setVar(name, value) {
      var root = rootEl();
      if (!root || !root.style || typeof root.style.setProperty !== 'function') return;
      if (value === null || value === undefined || value === '') {
        root.style.removeProperty(name);
      } else {
        root.style.setProperty(name, value);
      }
    }

    function cleanup() {
      setClass('oneyt-hide-comments', false);
      setClass('oneyt-watch-spaced', false);
      setVar('--oneyt-watch-spacing', null);
      setClass('oneyt-hide-shorts-watch', false);
      setClass('oneyt-home-columns', false);
      setClass('oneyt-card-spaced', false);
      setClass('oneyt-thumb-sized', false);
      setClass('oneyt-hide-shorts-home', false);
      setClass('oneyt-hide-live-shelf', false);
      setClass('oneyt-hide-mixes-shelf', false);
      setClass('oneyt-hide-news-shelf', false);
      setClass('oneyt-block-shorts', false);
      setVar('--oneyt-home-columns', null);
      setVar('--oneyt-card-spacing', null);
      setVar('--oneyt-thumb-width', null);
    }

    // Off the Shorts player page: /shorts/VIDEOID -> /watch?v=VIDEOID.
    // No loop: after the redirect the pathname is /watch, so
    // shortsWatchUrl returns null on the next apply().
    function redirectShorts() {
      var path = loc && loc.pathname ? loc.pathname : '';
      var url = shortsWatchUrl(path);
      if (!url) return;
      redirectFn(url);
    }

    function applyWatch(layout) {
      setClass('oneyt-hide-comments', layout.hideComments === true);
      var spaced = layout.watchSpacing && layout.watchSpacing > 0;
      setClass('oneyt-watch-spaced', !!spaced);
      setVar('--oneyt-watch-spacing', spaced ? layout.watchSpacing + 'px' : null);
      setClass('oneyt-hide-shorts-watch', layout.hideShortsWatch === true);
    }

    function applyHome(layout) {
      var columns = layout.homeColumns && layout.homeColumns >= 1 && layout.homeColumns <= 12;
      setClass('oneyt-home-columns', !!columns);
      setVar('--oneyt-home-columns', columns ? String(layout.homeColumns) : null);
      var spaced = layout.cardSpacing && layout.cardSpacing > 0;
      setClass('oneyt-card-spaced', !!spaced);
      setVar('--oneyt-card-spacing', spaced ? layout.cardSpacing + 'px' : null);
      var sized = layout.thumbnailSize && layout.thumbnailSize >= 120;
      setClass('oneyt-thumb-sized', !!sized);
      setVar('--oneyt-thumb-width', sized ? layout.thumbnailSize + 'px' : null);
      setClass('oneyt-hide-shorts-home', layout.hideShortsHome === true);
      setClass('oneyt-hide-live-shelf', layout.hideLiveShelf === true);
      setClass('oneyt-hide-mixes-shelf', layout.hideMixesShelf === true);
      setClass('oneyt-hide-news-shelf', layout.hideNewsShelf === true);
    }

    function apply(settings, page) {
      if (!settings || !settings.layout) return;
      var layout = settings.layout;
      // Block Shorts: redirect off the Shorts player page first.
      if (page === 'shorts' && layout.blockShorts === true) {
        redirectShorts();
      }
      if (page === 'watch') {
        applyWatch(layout);
        // Home rules must not linger after a watch -> home -> watch
        // hop: clear the home side, keep the watch side.
        setClass('oneyt-home-columns', false);
        setClass('oneyt-card-spaced', false);
        setClass('oneyt-thumb-sized', false);
        setClass('oneyt-hide-shorts-home', false);
        setClass('oneyt-hide-live-shelf', false);
        setClass('oneyt-hide-mixes-shelf', false);
        setClass('oneyt-hide-news-shelf', false);
        setVar('--oneyt-home-columns', null);
        setVar('--oneyt-card-spacing', null);
        setVar('--oneyt-thumb-width', null);
      } else if (page === 'home') {
        applyHome(layout);
        setClass('oneyt-hide-comments', false);
        setClass('oneyt-watch-spaced', false);
        setVar('--oneyt-watch-spacing', null);
        setClass('oneyt-hide-shorts-watch', false);
      } else {
        cleanup();
      }
      // Block Shorts applies on EVERY page type (watch, home,
      // search, subscriptions, channel, shorts) — set after
      // the page branches so cleanup() in the else branch
      // cannot strip it. disable()/destroy() still remove it
      // via cleanup().
      setClass('oneyt-block-shorts', layout.blockShorts === true);
    }

    return {
      id: 'layout',
      init: function () {},
      apply: apply,
      update: apply,
      enable: function () {},
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
      },
    };
  }

  var api = { createLayoutModule: createLayoutModule, shortsWatchUrl: shortsWatchUrl };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.layout = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
