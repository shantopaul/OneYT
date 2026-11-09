/* OneYT — content/modules/health/health.js
 *
 * Selector health module (Phase 18, PL-18). Runs the
 * shared health engine against the live YouTube page
 * and writes the record to local storage, where the
 * dashboard reads it.
 *
 * Behaviour:
 * - One delayed check (2 s) per apply: YouTube loads
 *   elements late, so checking immediately would
 *   report working selectors as missing. Re-applying
 *   (SPA navigation, settings change) resets the timer,
 *   so the check always runs 2 s after the last apply.
 * - Page types with nothing to check (shorts, channel,
 *   playlist, other — no selector in the metadata lives
 *   there) skip the check entirely and write nothing.
 * - A failed storage write is logged, never fatal: the
 *   module must not break the page, and the next
 *   navigation re-checks anyway.
 * - Two tabs can interleave read-then-write (each reads
 *   the record, then writes its own page back); the
 *   loser loses the other tab's page for one cycle, and
 *   the next check repairs it. Accepted: the record is
 *   a best-effort snapshot, and the dashboard shows the
 *   last-checked time per page.
 *
 * No CSS, no DOM writes, no settings leaf: this module
 * is infrastructure, not a feature — it runs whenever
 * the extension is enabled (it has no modules.* toggle,
 * so the manager defaults it to on) and stops when the
 * extension is disabled.
 */
(function () {
  'use strict';

  // Late elements (player controls, sidebar) need a
  // moment after navigation; 2 s covers them without
  // making the dashboard wait long for fresh data.
  var CHECK_DELAY_MS = 2000;

  function createHealthModule(deps) {
    deps = deps || {};
    var dom = deps.dom || null;
    var storage = deps.storage || null;
    var logger = deps.logger || { debug: function () {}, error: function () {} };
    var healthApi = deps.health || (globalThis.OneYT && globalThis.OneYT.health) || null;
    var constants = deps.constants || (globalThis.OneYT && globalThis.OneYT.constants) || {};
    var HEALTH_KEY = constants.HEALTH_STORAGE_KEY || 'oneyt.health.v1';
    var setTimeoutFn = deps.setTimeout || setTimeout;
    var clearTimeoutFn = deps.clearTimeout || clearTimeout;
    var nowFn = deps.now || Date.now;

    var timer = null;

    function exists(key) {
      if (!dom || typeof dom.query !== 'function') return false;
      return dom.query(key) !== null;
    }

    function runCheck(page) {
      if (!healthApi || !storage) return Promise.resolve();
      var pageRecord;
      try {
        pageRecord = healthApi.checkHealth(page, exists, nowFn());
      } catch (err) {
        logger.error('health: check failed', err);
        return Promise.resolve();
      }
      return storage
        .get(HEALTH_KEY)
        .then(function (stored) {
          var record = healthApi.validateHealthRecord(stored, nowFn());
          record[page] = pageRecord;
          return storage.set({ [HEALTH_KEY]: record });
        })
        .catch(function (err) {
          logger.error('health: failed to store health record', err);
        });
    }

    function scheduleCheck(page) {
      if (timer !== null) {
        clearTimeoutFn(timer);
        timer = null;
      }
      if (!healthApi || healthApi.selectorsForPage(page).length === 0) return;
      timer = setTimeoutFn(function () {
        timer = null;
        runCheck(page);
      }, CHECK_DELAY_MS);
    }

    function apply(settings, page) {
      // settings unused — the check runs whenever the
      // extension is enabled, on every page type that
      // has selectors to check.
      scheduleCheck(page);
    }

    function clearTimer() {
      if (timer !== null) {
        clearTimeoutFn(timer);
        timer = null;
      }
    }

    return {
      id: 'health',
      init: function () {},
      apply: apply,
      update: apply,
      enable: function () {},
      disable: function () {
        clearTimer();
      },
      destroy: function () {
        clearTimer();
      },
    };
  }

  var api = { createHealthModule: createHealthModule, CHECK_DELAY_MS: CHECK_DELAY_MS };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.health = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
