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
 * - Player accent (Phase 23): when player.accentColor
 *   is a #rrggbb hex, the played progress bar and the
 *   scrubber knob take that colour (class + variable,
 *   theater-safe); empty/invalid means YouTube red.
 * - Default theater (Phase 14): when player.defaultTheater
 *   is on, the theater button is clicked once per video so
 *   every video opens in theater mode. See enableTheater()
 *   — the click-once rule is what keeps a manual exit from
 *   being undone by the theater observer's re-apply.
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
 *
 * Mini-player (Phase 4): size / position / radius / shadow /
 * offsets for ytd-miniplayer. It is page-independent — the
 * mini-player survives navigation — so it is applied on every
 * page, not just watch. A scoped MutationObserver watches for
 * it appearing (opening the mini-player fires no navigation
 * event). When nothing is configured, no rule applies and the
 * native mini-player (open/close/drag) is completely untouched.
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
    '--oneyt-player-accent',
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
    'oneyt-player-accent',
    'oneyt-player-hide-endscreen',
    'oneyt-player-hide-like-count',
    'oneyt-player-hide-view-count',
    'oneyt-player-hide-subscriber-count',
  ];
  var POSITIONS = ['default', 'sticky', 'fixed', 'absolute'];
  var MINI_VARS = [
    '--oneyt-miniplayer-width',
    '--oneyt-miniplayer-radius',
    '--oneyt-miniplayer-shadow',
    '--oneyt-miniplayer-offset-x',
    '--oneyt-miniplayer-offset-y',
  ];
  var MINI_CLASSES = [
    'oneyt-miniplayer-sized',
    'oneyt-miniplayer-pos-bottom-left',
    'oneyt-miniplayer-pos-top-right',
    'oneyt-miniplayer-pos-top-left',
    'oneyt-miniplayer-styled',
  ];
  var MINI_POSITIONS = ['default', 'bottom-right', 'bottom-left', 'top-right', 'top-left'];

  function createPlayerModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || { debug: function () {}, error: function () {} };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var loc = deps.location || (typeof location !== 'undefined' ? location : null);

    var lastSettings = null;
    var lastPage = null;
    var waitPending = false;
    var theaterObserver = null;
    var theaterObserved = false;
    var miniObserver = null;
    var miniObserved = false;
    var miniPresent = false;
    // Default theater (Phase 14): the URL the theater button
    // was already clicked for, and the URL a waitFor is
    // pending for. A new video URL differs from both, so
    // navigation resets them; cleanup() (disable/destroy)
    // forgets the video entirely.
    var theaterClickedUrl = null;
    var theaterPendingUrl = null;

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

    function currentUrl() {
      return loc && typeof loc.href === 'string' ? loc.href : '';
    }

    // Player accent (Phase 23): only a #rrggbb hex counts.
    // Anything else (empty, a colour name, a 3-digit hex, a
    // hand-edited import) means YouTube's default red — the
    // dashboard colour control only ever writes '' or
    // #rrggbb, so a stored value outside that is corrupt.
    function validAccent(value) {
      return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '';
    }

    // Clamp a number to the dashboard control's range (see
    // layout.js: a hand-edited import bypasses the dashboard
    // inputs). Non-numbers pass through unchanged.
    function clampNum(value, min, max) {
      if (typeof value !== 'number' || !isFinite(value)) return value;
      if (value < min) return min;
      if (value > max) return max;
      return value;
    }

    // Default theater (Phase 14): click the theater button
    // once for this video. Never click when already in
    // theater, and never click twice for the same URL — the
    // theater observer re-applies when the user exits
    // theater, and a second click there would trap them in
    // theater. The flag is set synchronously BEFORE the
    // click, so a re-apply racing the click cannot double it.
    function enableTheater(url) {
      if (isFullscreen() || isTheater()) return;
      var btn = dom ? dom.query('theaterButton') : null;
      if (btn && typeof btn.click === 'function') {
        theaterClickedUrl = url;
        theaterPendingUrl = null;
        btn.click();
        return;
      }
      // Button not in the DOM yet — wait for it once (the
      // dom-manager waitFor resolves null after 10 s and
      // never rejects). Click only if still the same video,
      // still opted in, still on a watch page, and still not
      // in theater: the user may have navigated away while
      // waiting, and that must not click on the new page.
      if (theaterPendingUrl !== url && dom && dom.waitFor) {
        theaterPendingUrl = url;
        dom
          .waitFor('theaterButton')
          .then(function () {
            // Clear only if this waiter still owns the flag:
            // a newer video may have started its own waiter
            // while this one was pending, and clearing its
            // flag would let a third waiter start.
            if (theaterPendingUrl === url) theaterPendingUrl = null;
            if (
              lastSettings &&
              lastSettings.player &&
              lastSettings.player.defaultTheater === true &&
              lastPage === 'watch' &&
              !isFullscreen() &&
              !isTheater()
            ) {
              var now = currentUrl();
              if (now !== '' && now === url && now !== theaterClickedUrl) {
                var b = dom ? dom.query('theaterButton') : null;
                if (b && typeof b.click === 'function') {
                  theaterClickedUrl = now;
                  b.click();
                }
              }
            }
          })
          .catch(function () {
            if (theaterPendingUrl === url) theaterPendingUrl = null;
          });
      }
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
      if (!flexy) {
        // watchFlexy may arrive late; apply() calls observeTheater()
        // on every navigation / settings / resize update, so the
        // observer attaches then. No waitFor here: retrying blindly
        // could loop forever when the element never appears.
        return;
      }
      theaterObserved = true;
      theaterObserver = new MutationObserver(function () {
        if (lastSettings) apply(lastSettings, lastPage);
      });
      theaterObserver.observe(flexy, { attributes: true, attributeFilter: ['theater'] });
    }

    function cleanupMini() {
      MINI_CLASSES.forEach(function (name) {
        setClass(name, false);
      });
      MINI_VARS.forEach(function (name) {
        setVar(name, null);
      });
      miniPresent = false;
    }

    function cleanup() {
      CLASSES.forEach(function (name) {
        setClass(name, false);
      });
      VARS.forEach(function (name) {
        setVar(name, null);
      });
      cleanupMini();
      if (theaterObserver) {
        theaterObserver.disconnect();
        theaterObserver = null;
        theaterObserved = false;
      }
      if (miniObserver) {
        miniObserver.disconnect();
        miniObserver = null;
        miniObserved = false;
      }
      // Default theater forgets the video on disable/destroy:
      // a later enable() starts the click-once tracking fresh.
      theaterClickedUrl = null;
      theaterPendingUrl = null;
    }

    // True when the user configured anything for the mini-player.
    // With all defaults there is nothing to apply when it opens,
    // so no observer is needed at all (Phase 6 perf audit: the
    // document-subtree observer used to run on every page even
    // with nothing configured).
    function miniConfigured(mini) {
      return (
        (typeof mini.size === 'number' && mini.size > 0) ||
        (typeof mini.position === 'string' &&
          mini.position !== 'default' &&
          mini.position !== '') ||
        (typeof mini.borderRadius === 'number' && mini.borderRadius > 0) ||
        (typeof mini.shadow === 'string' && mini.shadow !== 'none' && mini.shadow !== '') ||
        (typeof mini.offsetX === 'number' && mini.offsetX !== 0) ||
        (typeof mini.offsetY === 'number' && mini.offsetY !== 0)
      );
    }

    // The mini-player opens without any navigation event, so a
    // scoped observer watches for it. The callback only
    // re-applies when the mini-player's presence actually
    // changes — YouTube mutates the DOM constantly, and every
    // mutation must not trigger a re-apply.
    function observeMini() {
      if (miniObserved || typeof MutationObserver === 'undefined') return;
      var root = rootEl();
      if (!root || !dom) return;
      miniObserved = true;
      miniObserver = new MutationObserver(function () {
        var present = !!dom.query('miniPlayer');
        if (present !== miniPresent && lastSettings) {
          apply(lastSettings, lastPage);
        }
      });
      miniObserver.observe(root, { childList: true, subtree: true });
    }

    function applyMiniPlayer(pl, fullscreen) {
      if (fullscreen) {
        cleanupMini();
        return;
      }
      var mini = (pl && pl.miniPlayer) || {};
      var el = dom ? dom.query('miniPlayer') : null;
      var configured = miniConfigured(mini);
      if (!configured && miniObserver) {
        // Config removed: the observer has nothing to watch for.
        miniObserver.disconnect();
        miniObserver = null;
        miniObserved = false;
      }
      if (!el) {
        // The mini-player is closed (or never opened): drop
        // the stale classes/vars and forget it was present,
        // so the observer fires a real re-apply with the
        // CURRENT config when it opens again. Without this,
        // miniPresent stuck at true and the reopen was a
        // no-op — the old config kept styling the new
        // mini-player (e.g. a size set back to 0 stayed).
        cleanupMini();
        if (configured) observeMini();
        return;
      }
      miniPresent = true;
      if (configured) observeMini();
      var sized = typeof mini.size === 'number' && mini.size > 0;
      setClass('oneyt-miniplayer-sized', sized);
      setVar('--oneyt-miniplayer-width', sized ? mini.size + 'px' : null);
      var position = MINI_POSITIONS.indexOf(mini.position) !== -1 ? mini.position : 'default';
      setClass('oneyt-miniplayer-pos-bottom-left', position === 'bottom-left');
      setClass('oneyt-miniplayer-pos-top-right', position === 'top-right');
      setClass('oneyt-miniplayer-pos-top-left', position === 'top-left');
      setVar(
        '--oneyt-miniplayer-offset-x',
        typeof mini.offsetX === 'number' && mini.offsetX !== 0 ? mini.offsetX + 'px' : null
      );
      setVar(
        '--oneyt-miniplayer-offset-y',
        typeof mini.offsetY === 'number' && mini.offsetY !== 0 ? mini.offsetY + 'px' : null
      );
      var styled =
        (typeof mini.borderRadius === 'number' && mini.borderRadius > 0) ||
        (typeof mini.shadow === 'string' && mini.shadow !== 'none' && mini.shadow !== '');
      setClass('oneyt-miniplayer-styled', styled);
      setVar(
        '--oneyt-miniplayer-radius',
        typeof mini.borderRadius === 'number' && mini.borderRadius > 0
          ? mini.borderRadius + 'px'
          : null
      );
      setVar(
        '--oneyt-miniplayer-shadow',
        typeof mini.shadow === 'string' && mini.shadow !== 'none' ? mini.shadow : null
      );
    }

    function apply(settings, page) {
      var prevDefaultTheater =
        lastSettings && lastSettings.player ? lastSettings.player.defaultTheater : false;
      lastSettings = settings;
      lastPage = page;
      if (!settings || !settings.player) return;
      var pl = settings.player;
      // Clamp numeric values to the dashboard control ranges
      // (customWidth/maxWidth 0–2000, radius 0–32, spacing
      // 0–100, mini size 0–800, mini radius 0–32, mini
      // offsets 0–500). A hand-edited import bypasses the
      // dashboard inputs; the module is the last line of
      // defence. Only finite numbers are clamped — other
      // types keep the old behaviour (the checks below).
      var mini = pl.miniPlayer || {};
      pl = Object.assign({}, pl, {
        customWidth: clampNum(pl.customWidth, 0, 2000),
        maxWidth: clampNum(pl.maxWidth, 0, 2000),
        borderRadius: clampNum(pl.borderRadius, 0, 32),
        spacing: clampNum(pl.spacing, 0, 100),
        miniPlayer: Object.assign({}, mini, {
          size: clampNum(mini.size, 0, 800),
          borderRadius: clampNum(mini.borderRadius, 0, 32),
          offsetX: clampNum(mini.offsetX, 0, 500),
          offsetY: clampNum(mini.offsetY, 0, 500),
        }),
      });
      var isWatch = page === 'watch';
      var fullscreen = isFullscreen();
      var theater = isWatch && !fullscreen ? isTheater() : false;

      // Mini-player is page-independent: it survives navigation,
      // so it is applied even on non-watch pages.
      applyMiniPlayer(pl, fullscreen);

      if (!isWatch || fullscreen) {
        CLASSES.forEach(function (name) {
          setClass(name, false);
        });
        VARS.forEach(function (name) {
          setVar(name, null);
        });
        // The theater observer belongs to the watch page only;
        // leaving it attached after navigation would watch a
        // detached node. (The mini-player observer stays: the
        // mini-player itself survives navigation.)
        if (theaterObserver) {
          theaterObserver.disconnect();
          theaterObserver = null;
          theaterObserved = false;
        }
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
      setVar('--oneyt-player-spacing', pl.spacing && pl.spacing > 0 ? pl.spacing + 'px' : null);
      var accent = validAccent(pl.accentColor);
      setVar('--oneyt-player-accent', accent);
      var offset =
        settings.sidebar && settings.sidebar.playerOffset ? settings.sidebar.playerOffset : 0;
      setVar('--oneyt-player-offset', offset > 0 ? clampNum(offset, 0, 200) + 'px' : null);

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
      setClass('oneyt-player-accent', accent !== '');
      setClass('oneyt-player-hide-endscreen', pl.hideEndscreen === true);
      setClass('oneyt-player-hide-like-count', pl.hideLikeCount === true);
      setClass('oneyt-player-hide-view-count', pl.hideViewCount === true);
      setClass('oneyt-player-hide-subscriber-count', pl.hideSubscriberCount === true);

      // --- Default theater (Phase 14) ---
      // Click at most once per video: a fresh video URL, or
      // the setting just turned on mid-video — an explicit
      // re-assertion, and it still sets the flag, so later
      // re-applies for this video (including the theater
      // observer's, when the user exits theater manually)
      // do nothing. Turning the setting off never exits
      // theater: there is no click on that path at all.
      if (pl.defaultTheater === true && !theater) {
        var url = currentUrl();
        var freshVideo = url !== '' && url !== theaterClickedUrl;
        var justEnabled = prevDefaultTheater !== true;
        if (freshVideo || justEnabled) {
          enableTheater(url);
        }
      }

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
              // Only re-apply when the element actually arrived;
              // otherwise a never-appearing element would loop
              // waitFor -> apply -> waitFor forever.
              if (dom.query('playerContainer') && lastSettings) {
                apply(lastSettings, lastPage);
              }
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
      init: function () {
        observeTheater();
        // No observeMini() here: the mini-player observer
        // attaches lazily from applyMiniPlayer, only when
        // something is configured (Phase 6 perf audit) —
        // attaching it at init briefly watched the whole
        // document subtree for nothing.
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
