/* OneYT — content/core/page-detector.js
 *
 * Maps a YouTube URL to a page type (home / watch / search /
 * subscriptions / channel / playlist / shorts / other) and
 * listens for YouTube's SPA navigation event `yt-navigate-finish`
 * so modules re-apply without a full reload.
 *
 * Pure URL -> type mapping is testable in Node; the window
 * listener is a no-op outside a browser.
 */
(function () {
  'use strict';

  function createPageDetector(deps) {
    var constants = (deps && deps.constants) || (globalThis.OneYT && globalThis.OneYT.constants);
    var logger = (deps && deps.logger) || (globalThis.OneYT && globalThis.OneYT.logger) || { debug: function () {} };
    var PAGE_TYPES = (constants && constants.PAGE_TYPES) || {
      HOME: 'home',
      WATCH: 'watch',
      SEARCH: 'search',
      SUBSCRIPTIONS: 'subscriptions',
      CHANNEL: 'channel',
      PLAYLIST: 'playlist',
      SHORTS: 'shorts',
      OTHER: 'other',
    };
    var NAV_EVENT = (constants && constants.YT_NAVIGATE_FINISH) || 'yt-navigate-finish';

    function detect(url) {
      var href = url || (typeof location !== 'undefined' ? location.href : '');
      var path = '';
      try {
        var parsed = new URL(href, 'https://www.youtube.com');
        // The content script only runs on youtube.com, but detect()
        // must not classify other hosts as YouTube pages.
        if (
          parsed.hostname !== 'www.youtube.com' &&
          parsed.hostname !== 'youtube.com' &&
          parsed.hostname !== 'm.youtube.com' &&
          parsed.hostname !== 'music.youtube.com'
        ) {
          return PAGE_TYPES.OTHER;
        }
        path = parsed.pathname;
      } catch (err) {
        return PAGE_TYPES.OTHER;
      }
      if (path === '/watch') return PAGE_TYPES.WATCH;
      if (path === '/results') return PAGE_TYPES.SEARCH;
      if (path === '/playlist') return PAGE_TYPES.PLAYLIST;
      if (path.indexOf('/shorts/') === 0) return PAGE_TYPES.SHORTS;
      if (path === '/feed/subscriptions') return PAGE_TYPES.SUBSCRIPTIONS;
      if (
        path === '/' ||
        path === '/feed/trending' ||
        path.indexOf('/feed/') === 0
      ) {
        return PAGE_TYPES.HOME;
      }
      if (
        path.indexOf('/@') === 0 ||
        path.indexOf('/channel/') === 0 ||
        path.indexOf('/c/') === 0 ||
        path.indexOf('/user/') === 0
      ) {
        return PAGE_TYPES.CHANNEL;
      }
      return PAGE_TYPES.OTHER;
    }

    // Calls `callback(newPageType)` on every SPA navigation.
    // Returns an unsubscribe function. No-op in Node.
    function onNavigate(callback) {
      if (typeof window === 'undefined' || !window.addEventListener) {
        return function () {};
      }
      var lastPage = detect();
      function handler() {
        var page = detect();
        if (page !== lastPage) {
          lastPage = page;
          logger.debug('page-detector: navigated to', page);
        }
        try {
          callback(page);
        } catch (err) {
          logger.error('page-detector: onNavigate callback threw', err);
        }
      }
      window.addEventListener(NAV_EVENT, handler);
      return function () {
        window.removeEventListener(NAV_EVENT, handler);
      };
    }

    return { detect: detect, onNavigate: onNavigate };
  }

  var api = { createPageDetector: createPageDetector };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.pageDetector = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
