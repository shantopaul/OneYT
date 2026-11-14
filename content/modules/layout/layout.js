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
 * - Home feed max width (layout.homeMaxWidth, px, 0 = default) —
 *   caps the home grid width and centres it (the ultrawide fix).
 * - Hide Shorts shelf (layout.hideShortsHome).
 * - Hide topic chips bar (layout.hideTopicChips) — the topic
 *   filter row ("All", "Music", ...) at the top of the feed.
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

  // Clamp a number to the dashboard control's range. Non-numbers
  // pass through unchanged (the caller's type check decides what
  // happens to them). A hand-edited import bypasses the dashboard
  // inputs, so the content script is the last line of defence
  // against e.g. a 99999px gap.
  function clampNum(value, min, max) {
    if (typeof value !== 'number' || !isFinite(value)) return value;
    if (value < min) return min;
    if (value > max) return max;
    return value;
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

    function setAttr(name, value) {
      var root = rootEl();
      if (!root) return;
      if (value === null || value === undefined || value === '') {
        if (typeof root.removeAttribute === 'function') root.removeAttribute(name);
      } else if (typeof root.setAttribute === 'function') {
        root.setAttribute(name, String(value));
      }
    }

    function validColCount(value, min, max) {
      if (typeof value !== 'number' || !isFinite(value)) return 0;
      if (value < min || value > max) return 0;
      return Math.floor(value);
    }

    function clearWatch() {
      setClass('oneyt-hide-comments', false);
      setClass('oneyt-watch-spaced', false);
      setVar('--oneyt-watch-spacing', null);
      setClass('oneyt-hide-shorts-watch', false);
    }

    function clearHomeOnly() {
      setClass('oneyt-hide-shorts-home', false);
      setClass('oneyt-hide-topic-chips', false);
      setClass('oneyt-hide-live-shelf', false);
      setClass('oneyt-hide-mixes-shelf', false);
      setClass('oneyt-hide-news-shelf', false);
      setClass('oneyt-home-max-width', false);
      setVar('--oneyt-home-max-width', null);
    }

    function clearFeedGrid() {
      setClass('oneyt-home-columns', false);
      setClass('oneyt-posts-per-row', false);
      setClass('oneyt-shelf-items', false);
      setClass('oneyt-card-spaced', false);
      setClass('oneyt-thumb-sized', false);
      setVar('--oneyt-home-columns', null);
      setVar('--oneyt-posts-per-row', null);
      setVar('--oneyt-shelf-items-per-row', null);
      setVar('--oneyt-card-spacing', null);
      setVar('--oneyt-thumb-width', null);
      setAttr('data-oneyt-shelf-cols', null);
    }

    function clearChannel() {
      setClass('oneyt-channel-wide', false);
      setClass('oneyt-channel-columns', false);
      setClass('oneyt-channel-shelf-items', false);
      setVar('--oneyt-channel-columns', null);
      setVar('--oneyt-channel-shelf-items-per-row', null);
      setAttr('data-oneyt-channel-shelf-cols', null);
    }

    function cleanup() {
      clearWatch();
      clearHomeOnly();
      clearFeedGrid();
      clearChannel();
      setClass('oneyt-responsive-columns', false);
      setClass('oneyt-hide-channel-profile', false);
      setClass('oneyt-full-video-titles', false);
      setClass('oneyt-block-shorts', false);
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
      var spacing = clampNum(layout.watchSpacing, 0, 200);
      var spaced = spacing && spacing > 0;
      setClass('oneyt-watch-spaced', !!spaced);
      setVar('--oneyt-watch-spacing', spaced ? spacing + 'px' : null);
      setClass('oneyt-hide-shorts-watch', layout.hideShortsWatch === true);
    }

    function applyFeedGrid(layout) {
      var columns = validColCount(layout.homeColumns, 1, 15);
      setClass('oneyt-home-columns', columns > 0);
      setVar('--oneyt-home-columns', columns > 0 ? String(columns) : null);

      var posts = validColCount(layout.postsPerRow, 1, 6);
      setClass('oneyt-posts-per-row', posts > 0);
      setVar('--oneyt-posts-per-row', posts > 0 ? String(posts) : null);

      var shelfItems = validColCount(layout.shelfItemsPerRow, 1, 15);
      setClass('oneyt-shelf-items', shelfItems > 0);
      setVar('--oneyt-shelf-items-per-row', shelfItems > 0 ? String(shelfItems) : null);
      setAttr('data-oneyt-shelf-cols', shelfItems > 0 ? String(shelfItems) : null);

      var gap = clampNum(layout.cardSpacing, 0, 60);
      var spaced = gap && gap > 0;
      setClass('oneyt-card-spaced', !!spaced);
      setVar('--oneyt-card-spacing', spaced ? gap + 'px' : null);
      var thumb = clampNum(layout.thumbnailSize, 0, 800);
      var sized = thumb && thumb >= 120;
      setClass('oneyt-thumb-sized', !!sized);
      setVar('--oneyt-thumb-width', sized ? thumb + 'px' : null);
    }

    function applyHomeOnly(layout) {
      var cap = clampNum(layout.homeMaxWidth, 0, 2560);
      var capped = cap && cap > 0;
      setClass('oneyt-home-max-width', !!capped);
      setVar('--oneyt-home-max-width', capped ? cap + 'px' : null);
      setClass('oneyt-hide-shorts-home', layout.hideShortsHome === true);
      setClass('oneyt-hide-topic-chips', layout.hideTopicChips === true);
      setClass('oneyt-hide-live-shelf', layout.hideLiveShelf === true);
      setClass('oneyt-hide-mixes-shelf', layout.hideMixesShelf === true);
      setClass('oneyt-hide-news-shelf', layout.hideNewsShelf === true);
    }

    function applyChannel(layout) {
      setClass('oneyt-channel-wide', layout.channelWide === true);
      var columns = validColCount(layout.channelColumns, 1, 15);
      setClass('oneyt-channel-columns', columns > 0);
      setVar('--oneyt-channel-columns', columns > 0 ? String(columns) : null);

      var shelfItems = validColCount(layout.channelShelfItemsPerRow, 1, 15);
      setClass('oneyt-channel-shelf-items', shelfItems > 0);
      setVar('--oneyt-channel-shelf-items-per-row', shelfItems > 0 ? String(shelfItems) : null);
      setAttr('data-oneyt-channel-shelf-cols', shelfItems > 0 ? String(shelfItems) : null);
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
        clearHomeOnly();
        clearFeedGrid();
        clearChannel();
        setClass('oneyt-responsive-columns', false);
        setClass('oneyt-hide-channel-profile', false);
        setClass('oneyt-full-video-titles', layout.fullVideoTitles === true);
      } else if (page === 'home') {
        applyFeedGrid(layout);
        applyHomeOnly(layout);
        clearWatch();
        clearChannel();
        setClass('oneyt-responsive-columns', layout.responsiveColumns === true);
        setClass('oneyt-hide-channel-profile', layout.hideChannelProfile === true);
        setClass('oneyt-full-video-titles', layout.fullVideoTitles === true);
      } else if (page === 'subscriptions') {
        applyFeedGrid(layout);
        clearHomeOnly();
        clearWatch();
        clearChannel();
        setClass('oneyt-responsive-columns', layout.responsiveColumns === true);
        setClass('oneyt-hide-channel-profile', layout.hideChannelProfile === true);
        setClass('oneyt-full-video-titles', layout.fullVideoTitles === true);
      } else if (page === 'channel') {
        applyChannel(layout);
        clearWatch();
        clearHomeOnly();
        clearFeedGrid();
        setClass('oneyt-responsive-columns', layout.responsiveColumns === true);
        setClass('oneyt-hide-channel-profile', layout.hideChannelProfile === true);
        setClass('oneyt-full-video-titles', layout.fullVideoTitles === true);
      } else if (page === 'search' || page === 'playlist') {
        clearWatch();
        clearHomeOnly();
        clearFeedGrid();
        clearChannel();
        setClass('oneyt-responsive-columns', false);
        setClass('oneyt-hide-channel-profile', page === 'search' && layout.hideChannelProfile === true);
        setClass('oneyt-full-video-titles', layout.fullVideoTitles === true);
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
