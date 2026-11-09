/* OneYT — content/modules/sidebar/sidebar.js
 *
 * Sidebar module (Phase 2, flagship).
 *
 * What it does, on the watch page only:
 * - Independent scrolling: #secondary gets its own scrollbar
 *   (max-height + overflow-y + overscroll-behavior: contain),
 *   so recommendations scroll while the player stays put.
 * - Width: --oneyt-sidebar-width from settings (0 = YouTube default).
 * - Scrollbar: visibility + width (webkit) / thin (Firefox).
 * - Smooth scrolling (scroll-behavior) and scroll sensitivity
 *   (a wheel handler that scales deltaY; only bound when the
 *   sensitivity is not 1, so the native path stays untouched
 *   for the common case).
 *
 * How it applies: static rules live in sidebar.css (manifest),
 * scoped under html.oneyt-sidebar-scroll etc. This file only
 * toggles those classes and sets CSS variables. Disabling
 * removes every class, variable and listener it added.
 *
 * Suspended in fullscreen (document.fullscreenElement).
 * If #secondary is not in the DOM yet (late load), one scoped
 * waitFor retries, then apply() runs again.
 */
(function () {
  'use strict';

  var VARS = ['--oneyt-sidebar-max-height', '--oneyt-sidebar-width', '--oneyt-scrollbar-width'];
  var CLASSES = ['oneyt-sidebar-scroll', 'oneyt-sidebar-smooth', 'oneyt-sidebar-hide-scrollbar'];

  function createSidebarModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || { debug: function () {}, error: function () {} };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);

    var lastSettings = null;
    var lastPage = null;
    var waitPending = false;
    var wheelEl = null;
    var wheelHandler = null;

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

    function unbindWheel() {
      if (wheelEl && wheelHandler) {
        try {
          wheelEl.removeEventListener('wheel', wheelHandler);
        } catch (err) {
          logger.debug('sidebar: wheel unbind failed', err);
        }
      }
      wheelEl = null;
      wheelHandler = null;
    }

    function bindWheel(el, sensitivity) {
      unbindWheel();
      if (!el || typeof el.addEventListener !== 'function') return;
      if (sensitivity === 1) return; // native scrolling is fine
      wheelHandler = function (event) {
        try {
          event.preventDefault();
          el.scrollTop = el.scrollTop + event.deltaY * sensitivity;
        } catch (err) {
          logger.debug('sidebar: wheel handler failed', err);
        }
      };
      el.addEventListener('wheel', wheelHandler, { passive: false });
      wheelEl = el;
    }

    function cleanup() {
      CLASSES.forEach(function (name) {
        setClass(name, false);
      });
      VARS.forEach(function (name) {
        setVar(name, null);
      });
      unbindWheel();
    }

    function apply(settings, page) {
      lastSettings = settings;
      lastPage = page;
      if (!settings || !settings.sidebar) return;
      var sb = settings.sidebar;

      // Width applies on the watch page whenever the module runs;
      // scrolling classes only when independent scroll is on.
      var isWatch = page === 'watch';
      var fullscreen = !!(doc && doc.fullscreenElement);
      var scrollOn = isWatch && sb.independentScroll === true && !fullscreen;

      if (isWatch && !fullscreen) {
        setVar('--oneyt-sidebar-max-height', sb.maxHeight || 'calc(100vh - 100px)');
        if (sb.customWidth && sb.customWidth > 0) {
          setVar('--oneyt-sidebar-width', sb.customWidth + 'px');
        } else {
          setVar('--oneyt-sidebar-width', null);
        }
        if (sb.scrollbarWidth && sb.scrollbarWidth > 0) {
          setVar('--oneyt-scrollbar-width', sb.scrollbarWidth + 'px');
        } else {
          setVar('--oneyt-scrollbar-width', null);
        }
      } else {
        VARS.forEach(function (name) {
          setVar(name, null);
        });
      }

      setClass('oneyt-sidebar-scroll', scrollOn);
      setClass('oneyt-sidebar-smooth', scrollOn && sb.smoothScroll === true);
      setClass('oneyt-sidebar-hide-scrollbar', scrollOn && sb.scrollbarVisible === false);

      if (scrollOn) {
        var el = dom ? dom.query('secondary') : null;
        if (el) {
          bindWheel(el, sb.scrollSensitivity || 1);
        } else if (!waitPending && dom && dom.waitFor) {
          waitPending = true;
          dom
            .waitFor('secondary')
            .then(function () {
              waitPending = false;
              // Only re-apply when the element actually arrived;
              // otherwise a never-appearing element would loop
              // waitFor -> apply -> waitFor forever.
              if (dom.query('secondary') && lastSettings) {
                apply(lastSettings, lastPage);
              }
            })
            .catch(function () {
              waitPending = false;
            });
        }
      } else {
        unbindWheel();
      }
    }

    return {
      id: 'sidebar',
      init: function () {},
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

  var api = { createSidebarModule: createSidebarModule };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.sidebar = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
