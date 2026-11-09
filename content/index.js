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
    // eslint-disable-next-line no-console
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
    var eventBus = ns.eventBus
      ? ns.eventBus.createEventBus(logger)
      : null;

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
