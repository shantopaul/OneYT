/* OneYT — content/core/app.js
 *
 * Wires the core together (Architecture.md §2.1):
 *   settings -> page detection -> module manager -> listeners
 *
 * Startup:
 *   1. SettingsManager.load() (migrates if needed)
 *   2. Detect the current page
 *   3. ModuleManager.initAll(ctx) + updateAll(settings, page)
 *      (Phase 1: no feature modules registered yet, so this is
 *      a no-op that proves the wiring works)
 *   4. Listen: yt-navigate-finish, storage changes (popup /
 *      dashboard), debounced resize, fullscreenchange.
 *   5. Mark the page: <html class="oneyt-enabled"> while the
 *      extension is enabled; remove it when disabled, so all
 *      injected CSS (scoped under that class) switches off
 *      in one step.
 *
 * All dependencies are injected (factory args) with a fallback
 * to the global OneYT namespace, so the app can be constructed
 * in Node tests with fakes.
 */
(function () {
  'use strict';

  function createApp(deps) {
    deps = deps || {};
    var ns = globalThis.OneYT || {};
    var logger = deps.logger || ns.logger || { debug: function () {}, info: function () {}, error: function () {} };
    var constants = deps.constants || ns.constants || {};
    var settingsManager = deps.settingsManager;
    var pageDetector = deps.pageDetector;
    var moduleManager = deps.moduleManager;
    var domManager = deps.domManager;
    var eventBus = deps.eventBus;
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var win = deps.window || (typeof window !== 'undefined' ? window : null);

    var DEBOUNCE_MS =
      (constants.DEBOUNCE && constants.DEBOUNCE.RESIZE) || 150;

    var started = false;
    var currentPage = 'other';
    var unsubscribers = [];
    var resizeTimer = null;

    function getSettings() {
      return settingsManager.get();
    }

    function applyEnabledClass(enabled) {
      if (!doc || !doc.documentElement) return;
      if (enabled) {
        doc.documentElement.classList.add('oneyt-enabled');
      } else {
        doc.documentElement.classList.remove('oneyt-enabled');
      }
    }

    function updateModules() {
      var settings = getSettings();
      applyEnabledClass(settings.enabled);
      moduleManager.updateAll(settings, currentPage);
      if (eventBus) eventBus.emit('page:updated', { page: currentPage });
    }

    function onNavigate(page) {
      currentPage = page;
      logger.debug('app: navigated to', page);
      updateModules();
      if (eventBus) eventBus.emit('page:changed', { page: page });
    }

    function onSettingsChanged(settings) {
      logger.debug('app: settings changed');
      updateModules();
      if (eventBus) eventBus.emit('settings:changed', { settings: settings });
    }

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        updateModules();
      }, DEBOUNCE_MS);
    }

    function onFullscreenChange() {
      // Player/sidebar positioning suspends in fullscreen
      // (Phase 2 modules handle it); re-applying is enough here.
      updateModules();
    }

    function init() {
      if (started) return Promise.resolve();
      started = true;
      return settingsManager
        .load()
        .then(function () {
          var settings = getSettings();
          currentPage = pageDetector.detect();
          logger.debug('app: starting on page', currentPage);

          var ctx = {
            settings: settings,
            dom: domManager,
            bus: eventBus,
            page: currentPage,
            logger: logger,
          };
          moduleManager.initAll(ctx);
          updateModules();

          if (settingsManager.watchExternalChanges) {
            settingsManager.watchExternalChanges();
          }
          unsubscribers.push(settingsManager.onChange(onSettingsChanged));
          unsubscribers.push(pageDetector.onNavigate(onNavigate));

          if (win && win.addEventListener) {
            win.addEventListener('resize', onResize);
            win.addEventListener('fullscreenchange', onFullscreenChange);
            unsubscribers.push(function () {
              win.removeEventListener('resize', onResize);
              win.removeEventListener('fullscreenchange', onFullscreenChange);
            });
          }
          return undefined;
        })
        .catch(function (err) {
          logger.error('app: init failed', err);
          started = false;
          throw err;
        });
    }

    function destroy() {
      unsubscribers.forEach(function (fn) {
        try {
          fn();
        } catch (err) {
          logger.error('app: destroy listener threw', err);
        }
      });
      unsubscribers = [];
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      moduleManager.destroy();
      applyEnabledClass(false);
      started = false;
    }

    function getState() {
      var settings = getSettings();
      return {
        enabled: settings.enabled,
        page: currentPage,
        modules: moduleManager.listIds(),
        started: started,
      };
    }

    return {
      init: init,
      destroy: destroy,
      getState: getState,
      // Exposed for tests only.
      _updateModules: updateModules,
    };
  }

  var api = { createApp: createApp };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.app = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
