/* OneYT — content/modules/layout/layout.js
 *
 * Layout module, part 1 (Phase 2 — watch page only).
 * Homepage / search / subscriptions layout arrives in Phase 3.
 *
 * Watch page:
 * - Hide comments (layout.hideComments) — hides #comments.
 * - Watch spacing (layout.watchSpacing, px) — gap between the
 *   player and the area below it (#below).
 *
 * Both are class + variable toggles; disabling removes them.
 * Fullscreen does not need a guard here: #comments is not
 * visible in fullscreen, and the spacing has no effect there.
 */
(function () {
  'use strict';

  function createLayoutModule(deps) {
    deps = deps || {};
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);

    var ctx = null;

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

    function cleanup() {
      setClass('oneyt-hide-comments', false);
      setClass('oneyt-watch-spaced', false);
      setVar('--oneyt-watch-spacing', null);
    }

    function apply(settings, page) {
      if (!settings || !settings.layout) return;
      if (page !== 'watch') {
        cleanup();
        return;
      }
      var layout = settings.layout;
      setClass('oneyt-hide-comments', layout.hideComments === true);
      var spaced = layout.watchSpacing && layout.watchSpacing > 0;
      setClass('oneyt-watch-spaced', !!spaced);
      setVar('--oneyt-watch-spacing', spaced ? layout.watchSpacing + 'px' : null);
    }

    return {
      id: 'layout',
      init: function (context) {
        ctx = context;
      },
      apply: apply,
      update: apply,
      enable: function () {},
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
        ctx = null;
      },
    };
  }

  var api = { createLayoutModule: createLayoutModule };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.layout = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
