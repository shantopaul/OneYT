/* OneYT — focus module (Phase 4, AD-07).
 *
 * One-click distraction hiding on watch + home pages, with
 * EXACT restore: everything is a class on <html> (focus.css
 * does the hiding). Toggling off — or disabling the module —
 * removes the classes and YouTube is byte-for-byte back to
 * what it was. No element is ever removed, moved or restyled
 * inline, so there is nothing to "restore" imperfectly.
 *
 * Scope (AD-07): the global switch is
 * settings.productivity.focusMode. The per-tab toggle is an
 * in-memory override (toggleTab): current tab only, resets on
 * navigation/reload, never persisted — a tab can never get
 * stuck in Focus Mode.
 *
 * Deliberate limit: the guide (sidebar nav) can be hidden, but
 * the masthead (search + account menu) is NEVER hidden — the
 * user must always be able to reach search, their account and
 * the way out.
 */
(function () {
  'use strict';

  var FLAG_CLASSES = {
    focusHideComments: 'oneyt-focus-hide-comments',
    focusHideChat: 'oneyt-focus-hide-chat',
    focusHideRecommendations: 'oneyt-focus-hide-recommendations',
    focusHideShorts: 'oneyt-focus-hide-shorts',
    focusHideButtons: 'oneyt-focus-hide-buttons',
    focusHideMetadata: 'oneyt-focus-hide-metadata',
    focusHideNav: 'oneyt-focus-hide-nav',
  };

  function createFocusModule(deps) {
    var logger = deps.logger || {
      debug: function () {},
      warn: function () {},
      error: function () {},
    };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);

    var tabOverride = null; // null = follow the global setting
    var lastSettings = null;
    var lastPage = null;

    function root() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function isEffective(settings) {
      if (tabOverride !== null) return tabOverride;
      return !!(settings.productivity && settings.productivity.focusMode);
    }

    function cleanup() {
      var el = root();
      if (!el) return;
      el.classList.remove('oneyt-focus');
      for (var flag in FLAG_CLASSES) {
        el.classList.remove(FLAG_CLASSES[flag]);
      }
    }

    return {
      id: 'focus',
      init: function () {},
      apply: function (settings, page) {
        // AD-07: the per-tab override resets on navigation.
        // apply() runs on every navigation, so a changed page
        // type clears the override before the new page is
        // evaluated — a tab can never get stuck in Focus Mode
        // after navigating away.
        if (lastPage !== null && page !== lastPage) tabOverride = null;
        lastSettings = settings;
        lastPage = page;
        if (!settings || !settings.productivity || (page !== 'watch' && page !== 'home')) {
          cleanup();
          return;
        }
        var el = root();
        if (!el) return;
        if (!isEffective(settings)) {
          cleanup();
          return;
        }
        var prod = settings.productivity;
        el.classList.add('oneyt-focus');
        for (var flag in FLAG_CLASSES) {
          if (prod[flag] === true) el.classList.add(FLAG_CLASSES[flag]);
          else el.classList.remove(FLAG_CLASSES[flag]);
        }
      },
      // Per-tab toggle (AD-07). Returns the new effective state.
      toggleTab: function () {
        var current = lastSettings ? isEffective(lastSettings) : false;
        tabOverride = !current;
        if (lastSettings) this.apply(lastSettings, lastPage || 'watch');
        logger.debug('focus: per-tab override -> ' + tabOverride);
        return tabOverride;
      },
      isEffective: function () {
        return lastSettings ? isEffective(lastSettings) : false;
      },
      disable: function () {
        cleanup();
      },
      destroy: function () {
        tabOverride = null;
        cleanup();
      },
    };
  }

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.focus = { createFocusModule: createFocusModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createFocusModule: createFocusModule };
  }
})();
