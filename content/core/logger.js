/* OneYT — content/core/logger.js
 *
 * Debug-gated logging. Silent by default in production:
 * debug/info do nothing unless setDebug(true) was called.
 * warn/error always go to the console (errors must be visible).
 *
 * Never use console.log directly in modules — use this.
 */
(function () {
  'use strict';

  var debugEnabled = false;

  function prefix(level) {
    return '[OneYT:' + level + ']';
  }

  var logger = {
    setDebug: function (enabled) {
      debugEnabled = !!enabled;
    },
    isDebug: function () {
      return debugEnabled;
    },
    debug: function () {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console
      console.log.apply(console, [prefix('debug')].concat(Array.prototype.slice.call(arguments)));
    },
    info: function () {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console
      console.info.apply(console, [prefix('info')].concat(Array.prototype.slice.call(arguments)));
    },
    warn: function () {
      // eslint-disable-next-line no-console
      console.warn.apply(console, [prefix('warn')].concat(Array.prototype.slice.call(arguments)));
    },
    error: function () {
      // eslint-disable-next-line no-console
      console.error.apply(console, [prefix('error')].concat(Array.prototype.slice.call(arguments)));
    },
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.logger = logger;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
  }
})();
