/* OneYT — content/core/module-manager.js
 *
 * Registry + lifecycle for feature modules (Architecture.md §4).
 * Every module has the same shape:
 *   { id, init(ctx), apply(settings, page), update(settings, page),
 *     enable(), disable(), destroy() }
 * All lifecycle methods except `id` are optional — missing ones
 * are treated as no-ops — but a module with no apply/enable at
 * all is useless and rejected at registration.
 *
 * Hard rules enforced here:
 * - A module that throws is caught at this boundary, disabled,
 *   and logged. Other modules keep running.
 * - disable() must restore YouTube for that module's scope;
 *   the manager calls it and then forgets the module's state.
 * - apply() is expected to be idempotent; the manager may call
 *   it any number of times (navigation, resize, settings change).
 *
 * Phase 1 ships with NO feature modules registered — the manager
 * itself, its registration validation and its failure isolation
 * are the deliverable. Phase 2 registers player + sidebar.
 */
(function () {
  'use strict';

  function createModuleManager(deps) {
    var logger = (deps && deps.logger) ||
      (globalThis.OneYT && globalThis.OneYT.logger) || {
        debug: function () {},
        error: function () {},
      };
    var modules = new Map();
    var enabledIds = new Set();
    var ctx = null;

    function isValidModule(mod) {
      if (!mod || typeof mod.id !== 'string' || mod.id.length === 0) return false;
      return (
        typeof mod.apply === 'function' ||
        typeof mod.enable === 'function' ||
        typeof mod.init === 'function'
      );
    }

    function register(mod) {
      if (!isValidModule(mod)) {
        logger.error('module-manager: rejected invalid module', mod && mod.id);
        return false;
      }
      if (modules.has(mod.id)) {
        logger.error('module-manager: duplicate module id "' + mod.id + '"');
        return false;
      }
      modules.set(mod.id, mod);
      logger.debug('module-manager: registered "' + mod.id + '"');
      return true;
    }

    function callSafely(mod, method, args) {
      if (typeof mod[method] !== 'function') return true;
      try {
        mod[method].apply(mod, args);
        return true;
      } catch (err) {
        logger.error('module-manager: "' + mod.id + '.' + method + '" threw', err);
        return false;
      }
    }

    function initAll(context) {
      ctx = context || ctx;
      modules.forEach(function (mod) {
        if (!callSafely(mod, 'init', [ctx])) {
          disable(mod.id);
        }
      });
    }

    function shouldBeEnabled(id, settings) {
      if (!settings || settings.enabled === false) return false;
      if (!settings.modules) return true;
      // A module not listed in settings.modules defaults to on.
      if (!(id in settings.modules)) return true;
      return settings.modules[id] === true;
    }

    function enable(id, settings, page) {
      var mod = modules.get(id);
      if (!mod) return false;
      if (enabledIds.has(id)) {
        // Already enabled: re-apply (idempotent) instead of
        // double-initialising.
        update(id, settings, page);
        return true;
      }
      if (!callSafely(mod, 'enable', [ctx])) {
        return false;
      }
      enabledIds.add(id);
      update(id, settings, page);
      return true;
    }

    function disable(id) {
      var mod = modules.get(id);
      if (!mod) return false;
      if (!enabledIds.has(id)) {
        // Still call disable() — a module may hold state even
        // when the manager thinks it is off.
        callSafely(mod, 'disable', [ctx]);
        return true;
      }
      enabledIds.delete(id);
      if (!callSafely(mod, 'disable', [ctx])) {
        // disable() itself threw: the module is still marked off,
        // and the error is already logged. Nothing else to do.
      }
      return true;
    }

    function update(id, settings, page) {
      var mod = modules.get(id);
      if (!mod || !enabledIds.has(id)) return false;
      if (!callSafely(mod, 'update', [settings, page]) && typeof mod.apply === 'function') {
        // update() failed; apply() is the fallback path.
        if (!callSafely(mod, 'apply', [settings, page])) {
          disable(id);
          return false;
        }
      } else if (typeof mod.update !== 'function' && typeof mod.apply === 'function') {
        if (!callSafely(mod, 'apply', [settings, page])) {
          disable(id);
          return false;
        }
      }
      return true;
    }

    function updateAll(settings, page) {
      modules.forEach(function (mod, id) {
        if (shouldBeEnabled(id, settings)) {
          enable(id, settings, page);
        } else {
          disable(id);
        }
      });
    }

    function destroy() {
      modules.forEach(function (mod, id) {
        callSafely(mod, 'destroy', [ctx]);
        enabledIds.delete(id);
      });
      modules.clear();
    }

    function listIds() {
      return Array.from(modules.keys());
    }

    function isEnabled(id) {
      return enabledIds.has(id);
    }

    return {
      register: register,
      initAll: initAll,
      enable: enable,
      disable: disable,
      update: update,
      updateAll: updateAll,
      destroy: destroy,
      listIds: listIds,
      isEnabled: isEnabled,
    };
  }

  var api = { createModuleManager: createModuleManager };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.moduleManager = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
