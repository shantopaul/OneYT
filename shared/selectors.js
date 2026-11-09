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
    primary: '#primary', // Left column: player + title + comments
    secondary: '#secondary', // Right column: recommendations sidebar
    watchFlexy: 'ytd-watch-flexy', // Watch page root element
    below: '#below', // Area under the player (title, description)
    comments: '#comments', // Comments section root

    // --- Recommendations (Phase 2/4) ---
    sidebarItems: '#secondary ytd-compact-video-renderer',
    sidebarSection: '#secondary ytd-item-section-renderer',

    // --- Home / Shorts (Phase 3) ---
    shortsShelf: 'ytd-rich-shelf-renderer[is-shorts]',
    richGrid: 'ytd-rich-grid-renderer',

    // --- Navigation (Phase 4) ---
    guide: '#guide',
    masthead: '#masthead',
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
