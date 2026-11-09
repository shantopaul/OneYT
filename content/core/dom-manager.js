/* OneYT — content/core/dom-manager.js
 *
 * The ONLY place that resolves YouTube selectors into elements.
 * Selectors come from shared/selectors.js — never hard-coded here
 * or in any module.
 *
 * Defensive rules (Architecture.md §5):
 * - query() returns null instead of throwing.
 * - waitFor() uses ONE scoped MutationObserver, disconnects on
 *   success or after OBSERVER_TIMEOUT (10 s), then gives up
 *   silently (resolves null). No polling, ever.
 * - Style-tag helper: one <style data-oneyt-module="id"> per
 *   module, created once, removed on disable.
 */
(function () {
  'use strict';

  function createDomManager(deps) {
    var selectors = (deps && deps.selectors) || (globalThis.OneYT && globalThis.OneYT.selectors);
    var constants = (deps && deps.constants) || (globalThis.OneYT && globalThis.OneYT.constants);
    var logger = (deps && deps.logger) || (globalThis.OneYT && globalThis.OneYT.logger) || { debug: function () {}, error: function () {} };
    var doc = (deps && deps.document) || (typeof document !== 'undefined' ? document : null);
    var SELECTORS = selectors ? selectors.SELECTORS : {};
    var OBSERVER_TIMEOUT =
      (constants && constants.OBSERVER_TIMEOUT) || 10000;

    function resolveSelector(keyOrSelector) {
      return SELECTORS[keyOrSelector] || keyOrSelector;
    }

    function query(keyOrSelector, root) {
      if (!doc) return null;
      try {
        var scope = root || doc;
        return scope.querySelector(resolveSelector(keyOrSelector));
      } catch (err) {
        logger.debug('dom: bad selector', keyOrSelector, err);
        return null;
      }
    }

    function queryAll(keyOrSelector, root) {
      if (!doc) return [];
      try {
        var scope = root || doc;
        return Array.prototype.slice.call(
          scope.querySelectorAll(resolveSelector(keyOrSelector))
        );
      } catch (err) {
        logger.debug('dom: bad selector', keyOrSelector, err);
        return [];
      }
    }

    // Waits for an element to appear. Resolves with the element,
    // or null on timeout. Never rejects, never polls.
    function waitFor(keyOrSelector, options) {
      var opts = options || {};
      var timeout = typeof opts.timeout === 'number' ? opts.timeout : OBSERVER_TIMEOUT;
      var root = opts.root || (doc && doc.body) || doc;
      var existing = query(keyOrSelector, root && root !== doc ? root : undefined);
      if (existing) return Promise.resolve(existing);
      if (!doc || typeof MutationObserver === 'undefined' || !root) {
        return Promise.resolve(null);
      }
      return new Promise(function (resolve) {
        var done = false;
        var timer = setTimeout(function () {
          finish(null);
        }, timeout);
        var observer = new MutationObserver(function () {
          var el = query(keyOrSelector);
          if (el) finish(el);
        });
        function finish(value) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          observer.disconnect();
          resolve(value);
        }
        observer.observe(root, { childList: true, subtree: true });
      });
    }

    // One style tag per module. Returns the tag (creating it once),
    // or null when there is no document (Node tests).
    function ensureStyleTag(moduleId) {
      if (!doc) return null;
      var existing = doc.querySelector(
        'style[data-oneyt-module="' + moduleId + '"]'
      );
      if (existing) return existing;
      var tag = doc.createElement('style');
      tag.setAttribute('data-oneyt-module', moduleId);
      (doc.head || doc.documentElement).appendChild(tag);
      return tag;
    }

    function removeStyleTag(moduleId) {
      if (!doc) return;
      var tag = doc.querySelector('style[data-oneyt-module="' + moduleId + '"]');
      if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
    }

    function setStyle(moduleId, css) {
      var tag = ensureStyleTag(moduleId);
      if (tag) tag.textContent = css || '';
    }

    return {
      query: query,
      queryAll: queryAll,
      waitFor: waitFor,
      ensureStyleTag: ensureStyleTag,
      removeStyleTag: removeStyleTag,
      setStyle: setStyle,
      resolveSelector: resolveSelector,
    };
  }

  var api = { createDomManager: createDomManager };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.domManager = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
