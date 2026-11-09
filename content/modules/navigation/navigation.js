/* OneYT — navigation module (Phase 4).
 *
 * Guide (sidebar nav) customisation: hide guide entries, compact
 * mode, guide width. Applies on every page — the guide exists
 * everywhere on YouTube.
 *
 * Hard rule: this module only ever touches the guide
 * (#guide-content and ytd-guide-entry-renderer). The masthead,
 * the account menu and accessibility controls are never hidden
 * or moved. Class + variable toggles only; disable removes them.
 */
(function () {
  'use strict';

  // Clamp a number to the dashboard control's range (see
  // layout.js: a hand-edited import bypasses the dashboard
  // inputs). Non-numbers pass through unchanged.
  function clampNum(value, min, max) {
    if (typeof value !== 'number' || !isFinite(value)) return value;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function createNavigationModule(deps) {
    deps = deps || {};
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);

    function root() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function setClass(el, name, on) {
      if (on) el.classList.add(name);
      else el.classList.remove(name);
    }

    function cleanup() {
      var el = root();
      if (!el) return;
      setClass(el, 'oneyt-nav-hide-home', false);
      setClass(el, 'oneyt-nav-hide-shorts', false);
      setClass(el, 'oneyt-nav-hide-subscriptions', false);
      setClass(el, 'oneyt-nav-hide-library', false);
      setClass(el, 'oneyt-nav-hide-history', false);
      setClass(el, 'oneyt-nav-compact', false);
      setClass(el, 'oneyt-nav-wide', false);
      el.style.removeProperty('--oneyt-guide-width');
    }

    return {
      id: 'navigation',
      init: function () {},
      apply: function (settings) {
        var el = root();
        if (!el) return;
        if (!settings || !settings.navigation) {
          cleanup();
          return;
        }
        var nav = settings.navigation;
        setClass(el, 'oneyt-nav-hide-home', nav.hideHome === true);
        setClass(el, 'oneyt-nav-hide-shorts', nav.hideShorts === true);
        setClass(el, 'oneyt-nav-hide-subscriptions', nav.hideSubscriptions === true);
        setClass(el, 'oneyt-nav-hide-library', nav.hideLibrary === true);
        setClass(el, 'oneyt-nav-hide-history', nav.hideHistory === true);
        setClass(el, 'oneyt-nav-compact', nav.compact === true);
        // Compact wins over wide: the two CSS rules have equal
        // specificity and the wide rule comes later, so setting
        // both gave a 300px guide with hidden titles. A compact
        // guide is always 72px.
        var wide =
          nav.compact !== true && typeof nav.guideWidth === 'number' && nav.guideWidth >= 72;
        setClass(el, 'oneyt-nav-wide', wide);
        if (wide) {
          el.style.setProperty('--oneyt-guide-width', clampNum(nav.guideWidth, 72, 400) + 'px');
        } else {
          el.style.removeProperty('--oneyt-guide-width');
        }
      },
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
      },
    };
  }

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.navigation = { createNavigationModule: createNavigationModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createNavigationModule: createNavigationModule };
  }
})();
