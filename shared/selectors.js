/* OneYT — shared/selectors.js
 *
 * THE ONLY place YouTube selectors live (Rules.md).
 * No module may hard-code a selector — import from here via
 * dom-manager.js.
 *
 * YouTube changes its DOM regularly. When a selector breaks,
 * fix it HERE only and note the change in Memory.md.
 *
 * Selectors below are the stable, well-known watch-page hooks
 * from the PRD (§3.2). Live verification against the current
 * YouTube DOM is a Phase 1 manual-checklist item
 * (tests/manual-checklist.md) — run in the browser, not here.
 * Phase 2+ modules add their selectors to this file, grouped
 * by page / feature, with a comment on what each targets.
 */
(function () {
  'use strict';

  var SELECTORS = {
    // --- Watch page core (Phase 1: detection + future Phase 2) ---
    player: '#movie_player', // YouTube video player element
    playerContainer: '#primary #player', // Wraps #movie_player; positioning target for fixed/absolute (verify live — see tests/manual-checklist.md; player module falls back to #movie_player when absent)
    primary: '#primary', // Left column: player + title + comments
    secondary: '#secondary', // Right column: recommendations sidebar
    watchFlexy: 'ytd-watch-flexy', // Watch page root element
    below: '#below', // Area under the player (title, description)
    comments: '#comments', // Comments section root

    // --- Recommendations (Phase 2/4) ---
    // Note: these keys are used by module CSS (which cannot read
    // this map), not by dom.query — the registry documents the
    // canonical strings; tests/selectors.test.js enforces that
    // every key's value appears somewhere in the extension.
    sidebarItems: '#secondary ytd-compact-video-renderer',

    // --- Home / Shorts (Phase 3) ---
    shortsShelf: 'ytd-rich-shelf-renderer[is-shorts]',
    // Shorts shelf on search / subscriptions (v1.1 Block Shorts).
    reelShelf: 'ytd-reel-shelf-renderer',
    richGrid: 'ytd-rich-grid-renderer',

    // --- Navigation (Phase 4) ---
    guide: '#guide',
    masthead: '#masthead',

    // --- Playback controls (Phase 4) ---
    video: 'video.html5-main-video', // The <video> element itself
    theaterButton: '#movie_player .ytp-size-button', // Toggles theater mode
    autonavToggle: '#movie_player .ytp-autonav-toggle-button', // Autoplay-next toggle
    captionsButton: '#movie_player .ytp-subtitles-button', // Captions toggle

    // --- Mini-player (Phase 4) ---
    miniPlayer: 'ytd-miniplayer', // Appears only while mini-player is open

    // --- Focus Mode targets (Phase 4) ---
    chat: '#chat', // Live chat container on watch pages
    actions: '#actions', // Like/share/download row under the player
    description: '#description', // Expandable video description
  };

  // Selectors that must exist for the watch page to be usable.
  // Used by the selector sanity test (tests/).
  var REQUIRED_WATCH_SELECTORS = ['player', 'primary', 'secondary', 'watchFlexy'];

  var api = {
    SELECTORS: SELECTORS,
    REQUIRED_WATCH_SELECTORS: REQUIRED_WATCH_SELECTORS,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.selectors = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
