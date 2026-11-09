/* OneYT — shared/health.js
 *
 * Selector health check (Phase 18, PL-18). Pure: no
 * chrome.* and no document here, so unit tests can run
 * it in Node. The content-side health module calls
 * checkHealth with a query function; the dashboard calls
 * summarizeHealth on the stored record.
 *
 * The problem: YouTube changes its DOM, a selector
 * stops matching, and the feature that depends on it
 * quietly does nothing. The check turns that silence
 * into a dashboard status, per feature: working,
 * broken, or not seen on this visit.
 *
 * Per-selector metadata (SELECTOR_HEALTH):
 * - `pages`: the page types the element lives on
 *   (page-detector types: home, watch, ...). A selector
 *   is only checked on its own pages.
 * - `feature`: the human label the dashboard shows.
 * - `presence`: 'always' or 'sometimes'.
 *   'always' — the element exists on every load of
 *   those pages (the player, the theater button, the
 *   home chip bar). Missing means broken: YouTube
 *   renamed it, or the selector is wrong.
 *   'sometimes' — the element only exists in some
 *   states (the endscreen only at the end of a video,
 *   a shelf only when YouTube shows one, the
 *   mini-player only while it is open). Absent means
 *   "not seen on this visit" — never an alarm, because
 *   the feature is not broken, there was just nothing
 *   for it to act on.
 *
 * Deliberately no auto-disable: a selector missing at
 * check time does not prove the feature is broken
 * (late loading, page state), and disabling on that
 * signal would break working features. The warning IS
 * the feature.
 *
 * A health record is one object per page type:
 *   { watch: { checkedAt: <ms>, results: { key: 'ok' | 'missing' } },
 *     home:  { checkedAt: <ms>, results: { ... } } }
 * `results` only ever holds keys the check actually
 * looked for on that page. validateHealthRecord repairs
 * a stored record the way validateProfiles does:
 * non-objects become {}, corrupt entries are dropped,
 * unknown keys are dropped, and a record older than
 * HEALTH_RECORD_MAX_AGE_MS is dropped (a stale "all
 * OK" is worse than no record at all).
 */
(function () {
  'use strict';

  // A stored record older than 7 days is stale — drop it
  // rather than showing a week-old "all OK".
  var HEALTH_RECORD_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  // Per-selector metadata. Every key here must exist in
  // shared/selectors.js (enforced by tests/health.test.js);
  // a key missing from this map is simply not checked.
  var SELECTOR_HEALTH = {
    player: { pages: ['watch'], feature: 'Video player', presence: 'always' },
    playerContainer: { pages: ['watch'], feature: 'Video player', presence: 'always' },
    primary: { pages: ['watch'], feature: 'Watch page layout', presence: 'always' },
    secondary: { pages: ['watch'], feature: 'Recommendations sidebar', presence: 'always' },
    watchFlexy: { pages: ['watch'], feature: 'Watch page layout', presence: 'always' },
    below: { pages: ['watch'], feature: 'Watch page layout', presence: 'always' },
    comments: { pages: ['watch'], feature: 'Comments section', presence: 'always' },
    sidebarItems: { pages: ['watch'], feature: 'Recommendations sidebar', presence: 'always' },
    shortsShelf: { pages: ['home'], feature: 'Shorts shelf (home)', presence: 'sometimes' },
    reelShelf: {
      pages: ['home', 'search', 'subscriptions'],
      feature: 'Shorts shelf',
      presence: 'sometimes',
    },
    richGrid: { pages: ['home'], feature: 'Home feed grid', presence: 'always' },
    topicChips: { pages: ['home'], feature: 'Topic chips bar', presence: 'always' },
    liveShelf: { pages: ['home'], feature: 'Live shelf', presence: 'sometimes' },
    mixesShelf: { pages: ['home'], feature: 'Mixes shelf', presence: 'sometimes' },
    mixesItem: { pages: ['home'], feature: 'Mixes items', presence: 'sometimes' },
    newsShelf: { pages: ['home'], feature: 'News shelf', presence: 'sometimes' },
    channelShortsTab: {
      pages: ['channel'],
      feature: 'Shorts tab (channel)',
      presence: 'sometimes',
    },
    guide: {
      pages: ['home', 'watch', 'search', 'subscriptions'],
      feature: 'Guide (sidebar menu)',
      presence: 'always',
    },
    masthead: {
      pages: ['home', 'watch', 'search', 'subscriptions'],
      feature: 'Masthead (top bar)',
      presence: 'always',
    },
    video: { pages: ['watch'], feature: 'Video element', presence: 'always' },
    theaterButton: { pages: ['watch'], feature: 'Theater mode button', presence: 'always' },
    autonavToggle: { pages: ['watch'], feature: 'Autoplay toggle', presence: 'always' },
    captionsButton: { pages: ['watch'], feature: 'Captions button', presence: 'always' },
    miniPlayer: { pages: ['watch'], feature: 'Mini-player', presence: 'sometimes' },
    endscreenContent: { pages: ['watch'], feature: 'Endscreen cards', presence: 'sometimes' },
    likeCountText: { pages: ['watch'], feature: 'Like count', presence: 'always' },
    viewCountText: { pages: ['watch'], feature: 'View count', presence: 'always' },
    subscriberCount: { pages: ['watch'], feature: 'Subscriber count', presence: 'always' },
    chat: { pages: ['watch'], feature: 'Live chat', presence: 'sometimes' },
    actions: { pages: ['watch'], feature: 'Action row (like / share)', presence: 'always' },
    description: { pages: ['watch'], feature: 'Video description', presence: 'always' },
  };

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // The selector keys checked on this page type, in
  // metadata order. Unknown page types check nothing.
  function selectorsForPage(pageType) {
    var out = [];
    Object.keys(SELECTOR_HEALTH).forEach(function (key) {
      if (SELECTOR_HEALTH[key].pages.indexOf(pageType) !== -1) out.push(key);
    });
    return out;
  }

  // Check one page: for every selector that lives on it,
  // ask `exists(key)` whether it matched. Returns a page
  // record { checkedAt, results }. `exists` throwing for
  // a key counts that key as missing (a query that throws
  // is a broken selector, not a crash).
  function checkHealth(pageType, exists, now) {
    var checkedAt = typeof now === 'number' ? now : Date.now();
    var results = {};
    selectorsForPage(pageType).forEach(function (key) {
      var found = false;
      try {
        found = exists(key) === true;
      } catch {
        found = false;
      }
      results[key] = found ? 'ok' : 'missing';
    });
    return { checkedAt: checkedAt, results: results };
  }

  // Repair a stored health record: non-objects become {},
  // entries without a numeric checkedAt or a results
  // object are dropped, unknown selector keys are
  // dropped, non-'ok'/'missing' values are dropped, and
  // entries older than the max age are dropped. The
  // input is never mutated.
  function validateHealthRecord(stored, now) {
    if (!isPlainObject(stored)) return {};
    var at = typeof now === 'number' ? now : Date.now();
    var out = {};
    Object.keys(stored).forEach(function (pageType) {
      var entry = stored[pageType];
      if (!isPlainObject(entry)) return;
      if (typeof entry.checkedAt !== 'number') return;
      if (at - entry.checkedAt > HEALTH_RECORD_MAX_AGE_MS) return;
      if (!isPlainObject(entry.results)) return;
      var results = {};
      Object.keys(entry.results).forEach(function (key) {
        if (!SELECTOR_HEALTH[key]) return;
        if (entry.results[key] !== 'ok' && entry.results[key] !== 'missing') return;
        results[key] = entry.results[key];
      });
      out[pageType] = { checkedAt: entry.checkedAt, results: results };
    });
    return out;
  }

  // Summarize a (validated) record for the dashboard.
  // Returns { status, checked: {...}, features: [...] }:
  // - status: 'unknown' (no record yet, or only pages
  //   whose selectors are all 'sometimes' were checked),
  //   'ok' (every always-selector matched), or 'broken'
  //   (at least one always-selector missing). A page
  //   with no always-selector cannot say "all OK" —
  //   nothing was actually verified there.
  // - checked: the last checkedAt per page type.
  // - features: one row per feature label, in metadata
  //   order, with status 'working' | 'broken' |
  //   'not-seen' | 'unchecked' (no record for its page
  //   yet). A feature is 'broken' when any of its
  //   always-selectors is missing; 'not-seen' when all of
  //   its selectors are sometimes-selectors that did not
  //   match; 'working' when at least one selector
  //   matched and none of its always-selectors is
  //   missing.
  function summarizeHealth(record) {
    var clean = validateHealthRecord(record);
    var checked = {};
    var brokenKeys = [];
    var seenKeys = {};
    Object.keys(clean).forEach(function (pageType) {
      checked[pageType] = clean[pageType].checkedAt;
      Object.keys(clean[pageType].results).forEach(function (key) {
        seenKeys[key] = true;
        if (
          clean[pageType].results[key] === 'missing' &&
          SELECTOR_HEALTH[key].presence === 'always'
        ) {
          brokenKeys.push(key);
        }
      });
    });

    var features = [];
    var seenFeatures = {};
    Object.keys(SELECTOR_HEALTH).forEach(function (key) {
      var meta = SELECTOR_HEALTH[key];
      if (seenFeatures[meta.feature]) return;
      seenFeatures[meta.feature] = true;
      var keys = Object.keys(SELECTOR_HEALTH).filter(function (k) {
        return SELECTOR_HEALTH[k].feature === meta.feature;
      });
      var anyChecked = keys.some(function (k) {
        return seenKeys[k] === true;
      });
      if (!anyChecked) {
        features.push({ feature: meta.feature, status: 'unchecked' });
        return;
      }
      var anyAlwaysMissing = keys.some(function (k) {
        return brokenKeys.indexOf(k) !== -1;
      });
      if (anyAlwaysMissing) {
        features.push({ feature: meta.feature, status: 'broken' });
        return;
      }
      var anyOk = keys.some(function (k) {
        return Object.keys(clean).some(function (pageType) {
          return clean[pageType].results[k] === 'ok';
        });
      });
      if (anyOk) {
        features.push({ feature: meta.feature, status: 'working' });
        return;
      }
      features.push({ feature: meta.feature, status: 'not-seen' });
    });

    var anyAlwaysChecked = false;
    Object.keys(clean).forEach(function (pageType) {
      Object.keys(clean[pageType].results).forEach(function (key) {
        if (SELECTOR_HEALTH[key] && SELECTOR_HEALTH[key].presence === 'always') {
          anyAlwaysChecked = true;
        }
      });
    });
    var status = 'unknown';
    if (brokenKeys.length > 0) {
      status = 'broken';
    } else if (anyAlwaysChecked) {
      status = 'ok';
    }
    return { status: status, checked: checked, features: features };
  }

  var api = {
    HEALTH_RECORD_MAX_AGE_MS: HEALTH_RECORD_MAX_AGE_MS,
    SELECTOR_HEALTH: SELECTOR_HEALTH,
    selectorsForPage: selectorsForPage,
    checkHealth: checkHealth,
    validateHealthRecord: validateHealthRecord,
    summarizeHealth: summarizeHealth,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.health = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
