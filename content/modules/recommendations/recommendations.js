/* OneYT — recommendations module (Phase 4).
 *
 * Watch-page sidebar recommendations: hide the sidebar, density,
 * card (thumbnail) size, metadata visibility. Class + variable
 * toggles only; disabling removes them.
 *
 * Section show/hide (e.g. hide a named shelf) has no settings
 * keys yet — it needs the dashboard's list UI (Phase 5), so it
 * is deliberately not guessed here.
 */
(function () {
  'use strict';

  function createRecommendationsModule(deps) {
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
      setClass(el, 'oneyt-rec-hide-sidebar', false);
      setClass(el, 'oneyt-rec-compact', false);
      setClass(el, 'oneyt-rec-card-sized', false);
      setClass(el, 'oneyt-rec-hide-meta', false);
      el.style.removeProperty('--oneyt-rec-card-size');
    }

    return {
      id: 'recommendations',
      init: function () {},
      apply: function (settings, page) {
        var el = root();
        if (!el) return;
        if (!settings || !settings.recommendations || page !== 'watch') {
          cleanup();
          return;
        }
        var rec = settings.recommendations;
        setClass(el, 'oneyt-rec-hide-sidebar', rec.hideSidebar === true);
        setClass(el, 'oneyt-rec-compact', rec.density === 'compact');
        var sized = typeof rec.cardSize === 'number' && rec.cardSize >= 80 && rec.cardSize <= 400;
        setClass(el, 'oneyt-rec-card-sized', sized);
        if (sized) el.style.setProperty('--oneyt-rec-card-size', rec.cardSize + 'px');
        else el.style.removeProperty('--oneyt-rec-card-size');
        setClass(el, 'oneyt-rec-hide-meta', rec.showMetadata === false);
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
  ns.modules.recommendations = { createRecommendationsModule: createRecommendationsModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createRecommendationsModule: createRecommendationsModule };
  }
})();
