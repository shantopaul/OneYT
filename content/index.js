/* OneYT — content/index.js
 *
 * Entry point. Nothing else lives here: create the app from the
 * already-loaded core files (manifest.json lists them in
 * dependency order) and start it.
 *
 * Runs only on youtube.com (manifest match). If any core file
 * failed to load, log once and stop — never break the page.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var ns = globalThis.OneYT || {};
  var logger = ns.logger;

  function fail(message) {
    if (logger) logger.error(message);
    else console.error('[OneYT:error]', message);
  }

  if (!ns.app || !ns.settingsManager || !ns.pageDetector || !ns.moduleManager) {
    fail('content: core files missing (load order broken?) — OneYT not started');
    return;
  }

  try {
    var storage = ns.storage.createStorage();
    var settingsManager = ns.settingsManager.createSettingsManager({
      storage: storage,
      defaults: ns.defaults,
      constants: ns.constants,
      logger: logger,
    });
    var pageDetector = ns.pageDetector.createPageDetector({
      constants: ns.constants,
      logger: logger,
    });
    var moduleManager = ns.moduleManager.createModuleManager({ logger: logger });
    var domManager = ns.domManager.createDomManager({
      selectors: ns.selectors,
      constants: ns.constants,
      logger: logger,
    });
    var eventBus = ns.eventBus ? ns.eventBus.createEventBus(logger) : null;

    // Register feature modules (each guards itself by page/settings).
    if (ns.modules && ns.modules.sidebar) {
      moduleManager.register(
        ns.modules.sidebar.createSidebarModule({ dom: domManager, logger: logger })
      );
    }
    if (ns.modules && ns.modules.player) {
      moduleManager.register(
        ns.modules.player.createPlayerModule({ dom: domManager, logger: logger })
      );
    }
    if (ns.modules && ns.modules.layout) {
      moduleManager.register(ns.modules.layout.createLayoutModule({}));
    }
    if (ns.modules && ns.modules.appearance) {
      moduleManager.register(
        ns.modules.appearance.createAppearanceModule({ dom: domManager, logger: logger })
      );
    }
    if (ns.modules && ns.modules.typography) {
      moduleManager.register(ns.modules.typography.createTypographyModule({ logger: logger }));
    }
    if (ns.modules && ns.modules.playback) {
      moduleManager.register(
        ns.modules.playback.createPlaybackModule({
          dom: domManager,
          logger: logger,
          storage: storage,
        })
      );
    }
    // Kept in a variable: the keyboard module's toggleFocus action
    // calls focusModule.toggleTab() (wired below).
    var focusModule = null;
    if (ns.modules && ns.modules.focus) {
      focusModule = ns.modules.focus.createFocusModule({ logger: logger });
      moduleManager.register(focusModule);
    }
    if (ns.modules && ns.modules.recommendations) {
      moduleManager.register(
        ns.modules.recommendations.createRecommendationsModule({ logger: logger })
      );
    }
    if (ns.modules && ns.modules.keyboard) {
      moduleManager.register(
        ns.modules.keyboard.createKeyboardModule({
          dom: domManager,
          logger: logger,
          settingsManager: settingsManager,
          actions: {
            toggleFocus: function () {
              if (focusModule) focusModule.toggleTab();
            },
          },
        })
      );
    }

    var app = ns.app.createApp({
      logger: logger,
      constants: ns.constants,
      settingsManager: settingsManager,
      pageDetector: pageDetector,
      moduleManager: moduleManager,
      domManager: domManager,
      eventBus: eventBus,
    });

    // Kept for debugging from the page console only.
    ns.__app = app;

    app.init().catch(function (err) {
      fail('content: app init failed');
      if (logger) logger.error(err);
    });
  } catch (err) {
    fail('content: failed to start OneYT');
    if (logger) logger.error(err);
  }
})();
