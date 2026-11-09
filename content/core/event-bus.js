/* OneYT — content/core/event-bus.js
 *
 * Tiny pub/sub so modules can signal each other without importing
 * each other (Architecture.md §4). One bad listener must never
 * break the others — each listener runs in its own try/catch
 * and failures are reported to the logger.
 *
 * Events are plain strings, e.g. "settings:changed",
 * "page:changed", "focus:enabled". No event payload is trusted
 * to carry DOM nodes — pass ids / plain data only.
 */
(function () {
  'use strict';

  function createEventBus(logger) {
    var listeners = {};
    var log = logger || { error: function () {} };

    function on(event, fn) {
      if (typeof fn !== 'function') return function () {};
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
      var active = true;
      return function off() {
        if (!active) return;
        active = false;
        listeners[event] = (listeners[event] || []).filter(function (f) {
          return f !== fn;
        });
      };
    }

    function once(event, fn) {
      var off = on(event, function (data) {
        off();
        fn(data);
      });
      return off;
    }

    function emit(event, data) {
      var fns = (listeners[event] || []).slice();
      for (var i = 0; i < fns.length; i++) {
        try {
          fns[i](data);
        } catch (err) {
          log.error('event-bus: listener for "' + event + '" threw', err);
        }
      }
    }

    return { on: on, once: once, emit: emit };
  }

  var api = { createEventBus: createEventBus };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.eventBus = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
