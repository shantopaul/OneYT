/* OneYT — content/modules/player/player.js
 *
 * Player module (Phase 2).
 *
 * Watch page only. What it does:
 * - Sizing: custom width / max-width, alignment (left/center/right).
 * - Position: default | sticky | fixed | absolute (the `sticky`
 *   boolean in settings is the legacy alias for position "sticky").
 *   Fixed/absolute measure the player container and reserve its
 *   height on #primary (padding-top) so the title/comments do
 *   not jump up underneath it.
 * - Appearance: border radius, border, shadow, spacing.
 *
 * Guards (hard rules):
 * - Fullscreen (document.fullscreenElement): ALL player classes
 *   are removed — native fullscreen must never be disturbed.
 * - Theater mode (ytd-watch-flexy[theater]): sizing/position/
 *   alignment are skipped (YouTube already owns the layout);
 *   appearance (radius/border/shadow) still applies. A scoped
 *   MutationObserver on the theater attribute re-applies when
 *   the user toggles theater.
 * - If the player container is not in the DOM yet, one scoped
 *   waitFor retries, then apply() runs again.
 *
 * Static rules live in player.css (manifest), scoped under the
 * classes below. Dynamic values travel as CSS variables.
 * Disable removes every class, variable and observer it added.
 *
 * Honest limit: the fixed/absolute geometry depends on
 * YouTube's #primary > #player structure (see selectors.js).
 * It is verified only by the browser checklist
 * (tests/manual-checklist.md) — if YouTube changes that
 * structure, the module degrades to default positioning.
 */
(function () {
  'use strict';

  var VARS = [
    '--oneyt-player-width',
    '--oneyt-player-max-width',
    '--oneyt-player-radius',
    '--oneyt-player-border',
    '--oneyt-player-shadow',
    '--oneyt-player-spacing',
    '--oneyt-player-offset',
    '--oneyt-player-fixed-left',
    '--oneyt-player-fixed-width',
    '--oneyt-player-height',
  ];
  var CLASSES = [
    'oneyt-player-sized',
    'oneyt-player-maxed',
    'oneyt-player-align-left',
    'oneyt-player-align-center',
    'oneyt-player-align-right',
    'oneyt-player-sticky',
    'oneyt-player-fixed',
    'oneyt-player-absolute',
    'oneyt-player-styled',
  ];
  var POSITIONS = ['default', 'sticky', 'fixed', 'absolute'];

  function createPlayerModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || { debug: function () {}, error: function () {} };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);

    var ctx = null;
    var lastSettings = null;
    var lastPage = null;
    var waitPending = false;
    var theaterObserver = null;
    var theaterObserved = false;

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

    function isFullscreen() {
      return !!(doc && doc.fullscreenElement);
    }

    function isTheater() {
      var flexy = dom ? dom.query('watchFlexy') : null;
      return !!(flexy && flexy.hasAttribute && flexy.hasAttribute('theater'));
    }

    function playerContainer() {
      if (!dom) return null;
      return dom.query('playerContainer') || dom.query('player');
    }

    function measure() {
      var el = playerContainer();
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      try {
        var rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          setVar('--oneyt-player-fixed-width', Math.round(rect.width) + 'px');
          setVar('--oneyt-player-fixed-left', Math.round(rect.left) + 'px');
        }
        if (rect.height > 0) {
          setVar('--oneyt-player-height', Math.round(rect.height) + 'px');
        }
      } catch (err) {
        logger.debug('player: measure failed', err);
      }
    }

    function observeTheater() {
      if (theaterObserved || typeof MutationObserver === 'undefined') return;
      var flexy = dom ? dom.query('watchFlexy') : null;
      if (!flexy || typeof flexy.addEventListener !== 'function') {
        // watchFlexy itself may arrive late; waitFor handles it.
        if (!waitPending && dom && dom.waitFor) {
          waitPending = true;
          dom
            .waitFor('watchFlexy')
            .then(function () {
              waitPending = false;
              observeTheater();
              if (lastSettings) apply(lastSettings, lastPage);
            })
            .catch(function () {
              waitPending = false;
            });
        }
        return;
      }
      theaterObserved = true;
      theaterObserver = new MutationObserver(function () {
        if (lastSettings) apply(lastSettings, lastPage);
      });
      theaterObserver.observe(flexy, { attributes: true, attributeFilter: ['theater'] });
    }

    function cleanup() {
      CLASSES.forEach(function (name) {
        setClass(name, false);
      });
      VARS.forEach(function (name) {
        setVar(name, null);
      });
      if (theaterObserver) {
        theaterObserver.disconnect();
        theaterObserver = null;
        theaterObserved = false;
      }
    }

    function apply(settings, page) {
      lastSettings = settings;
      lastPage = page;
      if (!settings || !settings.player) return;
      var pl = settings.player;
      var isWatch = page === 'watch';
      var fullscreen = isFullscreen();
      var theater = isWatch && !fullscreen ? isTheater() : false;

      if (!isWatch || fullscreen) {
        cleanup();
        return;
      }

      // --- Dynamic values (variables) ---
      setVar(
        '--oneyt-player-width',
        pl.customWidth && pl.customWidth > 0 ? pl.customWidth + 'px' : null
      );
      setVar(
        '--oneyt-player-max-width',
        pl.maxWidth && pl.maxWidth > 0 ? pl.maxWidth + 'px' : null
      );
      setVar(
        '--oneyt-player-radius',
        typeof pl.borderRadius === 'number' ? pl.borderRadius + 'px' : null
      );
      setVar('--oneyt-player-border', pl.border && pl.border !== 'none' ? pl.border : null);
      setVar('--oneyt-player-shadow', pl.shadow && pl.shadow !== 'none' ? pl.shadow : null);
      setVar(
        '--oneyt-player-spacing',
        pl.spacing && pl.spacing > 0 ? pl.spacing + 'px' : null
      );
      var offset =
        settings.sidebar && settings.sidebar.playerOffset ? settings.sidebar.playerOffset : 0;
      setVar('--oneyt-player-offset', offset > 0 ? offset + 'px' : null);

      // --- Sizing / alignment (skipped in theater) ---
      var sized = pl.customWidth && pl.customWidth > 0;
      setClass('oneyt-player-sized', !theater && sized);
      setClass('oneyt-player-maxed', !theater && pl.maxWidth && pl.maxWidth > 0);
      setClass('oneyt-player-align-left', !theater && sized && pl.alignment === 'left');
      setClass('oneyt-player-align-center', !theater && sized && pl.alignment === 'center');
      setClass('oneyt-player-align-right', !theater && sized && pl.alignment === 'right');

      // --- Position ---
      var position = POSITIONS.indexOf(pl.position) !== -1 ? pl.position : 'default';
      if (position === 'default' && pl.sticky === true) position = 'sticky';
      setClass('oneyt-player-sticky', !theater && position === 'sticky');
      setClass('oneyt-player-fixed', !theater && position === 'fixed');
      setClass('oneyt-player-absolute', !theater && position === 'absolute');

      // --- Appearance (safe in theater too) ---
      setClass('oneyt-player-styled', true);

      if (!theater && (position === 'fixed' || position === 'absolute')) {
        var el = playerContainer();
        if (el) {
          measure();
        } else if (!waitPending && dom && dom.waitFor) {
          waitPending = true;
          dom
            .waitFor('playerContainer')
            .then(function () {
              waitPending = false;
              if (lastSettings) apply(lastSettings, lastPage);
            })
            .catch(function () {
              waitPending = false;
            });
        }
      }

      observeTheater();
    }

    return {
      id: 'player',
      init: function (context) {
        ctx = context;
        observeTheater();
      },
      apply: apply,
      update: apply,
      enable: function () {
        if (lastSettings) apply(lastSettings, lastPage);
      },
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
        ctx = null;
      },
    };
  }

  var api = { createPlayerModule: createPlayerModule };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.player = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
