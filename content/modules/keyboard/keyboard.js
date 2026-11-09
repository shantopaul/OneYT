/* OneYT — keyboard module (Phase 4).
 *
 * Configurable shortcuts for OneYT actions. The shortcut strings
 * live in settings.keyboard.shortcuts ("" = unbound).
 *
 * Safety rules:
 * - Typing is never hijacked: events whose target is an input,
 *   textarea, select or contenteditable element are ignored.
 * - Duplicates are detected on apply(): the first action in
 *   order wins, the rest are skipped and warned about.
 * - A modifier-less shortcut that collides with a YouTube-native
 *   key is warned about (the dashboard, Phase 5, surfaces these);
 *   Shift/Ctrl/Alt combos are safe by construction.
 * - The listener runs in the CAPTURE phase and stops propagation
 *   when a OneYT shortcut matches, so YouTube's own handler for
 *   the same key (e.g. '>' for speed) does not also fire.
 * - Held-key repeats are ignored for toggles; speed steps allow
 *   them (holding Shift+> steps through the presets).
 *
 * Resetting shortcuts to defaults is a dashboard operation
 * (Phase 5) — the module only reads settings.
 */
(function () {
  'use strict';

  // Single keys YouTube already uses (no modifier). A OneYT
  // shortcut without modifiers that matches one of these is a
  // conflict: both actions would fire.
  var NATIVE_KEYS = [
    ' ',
    'k',
    'j',
    'l',
    'f',
    't',
    'i',
    'm',
    'c',
    'n',
    'p',
    'b',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    '<',
    '>',
    ',',
    '.',
    '/',
    'Escape',
  ];

  var ACTION_ORDER = [
    'toggleFocus',
    'toggleSidebar',
    'togglePlayerPosition',
    'speedUp',
    'speedDown',
    'resetSpeed',
    'toggleTheater',
  ];

  var TOGGLE_ACTIONS = {
    toggleFocus: true,
    toggleSidebar: true,
    togglePlayerPosition: true,
    toggleTheater: true,
  };

  function normalizeShortcut(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    var parts = value.split('+').map(function (p) {
      return p.trim();
    });
    var out = { ctrl: false, alt: false, shift: false, meta: false, key: null };
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var low = p.toLowerCase();
      if (low === 'ctrl' || low === 'control') out.ctrl = true;
      else if (low === 'alt') out.alt = true;
      else if (low === 'shift') out.shift = true;
      else if (low === 'meta' || low === 'cmd' || low === 'command') out.meta = true;
      else if (i === parts.length - 1) out.key = p === 'Space' ? ' ' : p;
      else return null;
    }
    if (!out.key) return null;
    // Tab and Escape are browser navigation keys, not bindable
    // shortcuts. Binding Tab would swallow focus movement on
    // every YouTube page (keyboard trap); binding Escape would
    // swallow the key users press to get out of things. Found
    // in the Phase 6 bug bash: an imported 'Tab' shortcut parsed
    // fine and would have been bound.
    var lowKey = out.key.toLowerCase();
    if (lowKey === 'tab' || lowKey === 'escape' || lowKey === 'esc') return null;
    return out;
  }

  function shortcutId(parsed) {
    return (
      (parsed.ctrl ? 'ctrl+' : '') +
      (parsed.alt ? 'alt+' : '') +
      (parsed.shift ? 'shift+' : '') +
      (parsed.meta ? 'meta+' : '') +
      parsed.key.toLowerCase()
    );
  }

  // Returns [{ shortcut, actions[] }] for each normalized
  // shortcut bound to more than one action. "" (unbound) ignored.
  function findDuplicateShortcuts(shortcuts) {
    var byId = {};
    var order = [];
    ACTION_ORDER.forEach(function (action) {
      var parsed = normalizeShortcut(shortcuts[action]);
      if (!parsed) return;
      var id = shortcutId(parsed);
      if (!byId[id]) {
        byId[id] = { shortcut: shortcuts[action], actions: [] };
        order.push(id);
      }
      byId[id].actions.push(action);
    });
    return order
      .map(function (id) {
        return byId[id];
      })
      .filter(function (entry) {
        return entry.actions.length > 1;
      });
  }

  // Returns [{ action, shortcut, key }] for modifier-less
  // shortcuts that collide with a YouTube-native key.
  function findNativeConflicts(shortcuts) {
    var out = [];
    ACTION_ORDER.forEach(function (action) {
      var parsed = normalizeShortcut(shortcuts[action]);
      if (!parsed) return;
      if (parsed.ctrl || parsed.alt || parsed.meta || parsed.shift) return;
      var key = parsed.key;
      var hit = NATIVE_KEYS.some(function (native) {
        return native.length === 1 ? native.toLowerCase() === key.toLowerCase() : native === key;
      });
      if (hit) out.push({ action: action, shortcut: shortcuts[action], key: key });
    });
    return out;
  }

  function eventMatches(parsed, event) {
    if (!parsed) return false;
    if (!!event.ctrlKey !== parsed.ctrl) return false;
    if (!!event.altKey !== parsed.alt) return false;
    if (!!event.shiftKey !== parsed.shift) return false;
    if (!!event.metaKey !== parsed.meta) return false;
    var key = event.key;
    if (typeof key !== 'string') return false;
    if (parsed.key.length === 1) {
      return key.toLowerCase() === parsed.key.toLowerCase();
    }
    return key === parsed.key;
  }

  function createKeyboardModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || {
      debug: function () {},
      warn: function () {},
      error: function () {},
    };
    var settingsManager = deps.settingsManager || null;
    var actions = deps.actions || {};
    var win = deps.window || (typeof window !== 'undefined' ? window : null);

    var lastSettings = null;
    var listening = false;
    var handler = null;

    function getShortcuts() {
      return (lastSettings && lastSettings.keyboard && lastSettings.keyboard.shortcuts) || {};
    }

    function isTypingTarget(event) {
      var t = event.target;
      if (!t) return false;
      var tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t.isContentEditable;
    }

    function stepSpeed(direction) {
      var video = dom ? dom.query('video') : null;
      if (!video || typeof video.playbackRate !== 'number') return;
      var pb = (lastSettings && lastSettings.playback) || {};
      var presets = [1];
      if (typeof globalThis !== 'undefined' && globalThis.OneYT.validators) {
        var check = globalThis.OneYT.validators.validateSpeedPresets(pb.speedPresets);
        if (check.cleaned.length > 0) presets = check.cleaned;
      } else if (Array.isArray(pb.speedPresets) && pb.speedPresets.length > 0) {
        presets = pb.speedPresets;
      }
      var current = video.playbackRate;
      var next = direction > 0 ? presets[presets.length - 1] : presets[0];
      for (var i = 0; i < presets.length; i++) {
        if (direction > 0 && presets[i] > current + 0.001) {
          next = presets[i];
          break;
        }
        if (direction < 0 && presets[i] < current - 0.001) {
          next = presets[i];
        }
      }
      video.playbackRate = next;
    }

    function runAction(action) {
      if (action === 'toggleFocus') {
        if (typeof actions.toggleFocus === 'function') actions.toggleFocus();
        return;
      }
      if (action === 'toggleSidebar') {
        if (settingsManager && lastSettings) {
          var current = !!(lastSettings.modules && lastSettings.modules.sidebar);
          settingsManager.set('modules.sidebar', !current);
        }
        return;
      }
      if (action === 'togglePlayerPosition') {
        if (settingsManager && lastSettings) {
          var positions = ['default', 'sticky', 'fixed', 'absolute'];
          var pl = lastSettings.player || {};
          // The legacy sticky boolean is an alias for 'sticky'.
          var effective = pl.position;
          if (effective === 'default' && pl.sticky === true) effective = 'sticky';
          if (positions.indexOf(effective) === -1) effective = 'default';
          var nextPos = positions[(positions.indexOf(effective) + 1) % positions.length];
          settingsManager.set('player.position', nextPos);
          settingsManager.set('player.sticky', nextPos === 'sticky');
        }
        return;
      }
      if (action === 'speedUp') {
        stepSpeed(1);
        return;
      }
      if (action === 'speedDown') {
        stepSpeed(-1);
        return;
      }
      if (action === 'resetSpeed') {
        var video = dom ? dom.query('video') : null;
        if (video && typeof video.playbackRate === 'number') {
          var def = ((lastSettings && lastSettings.playback) || {}).defaultSpeed;
          video.playbackRate = typeof def === 'number' && def > 0 ? def : 1;
        }
        return;
      }
      if (action === 'toggleTheater') {
        var btn = dom ? dom.query('theaterButton') : null;
        if (btn && typeof btn.click === 'function') btn.click();
      }
    }

    function onKeyDown(event) {
      if (!lastSettings || isTypingTarget(event)) return;
      var shortcuts = getShortcuts();
      var seen = {};
      for (var i = 0; i < ACTION_ORDER.length; i++) {
        var action = ACTION_ORDER[i];
        var parsed = normalizeShortcut(shortcuts[action]);
        if (!parsed) continue;
        var id = shortcutId(parsed);
        if (seen[id]) continue; // duplicate: first binding wins
        seen[id] = true;
        if (eventMatches(parsed, event)) {
          // Swallow the event first, even on repeats: the
          // old code returned before preventDefault, so
          // holding a toggle shortcut let YouTube see the
          // repeats — and toggle fullscreen while the user
          // held Shift+F. Only the ACTION is skipped on
          // repeats.
          if (typeof event.preventDefault === 'function') event.preventDefault();
          if (typeof event.stopPropagation === 'function') event.stopPropagation();
          if (event.repeat && TOGGLE_ACTIONS[action]) return;
          runAction(action);
          return;
        }
      }
    }

    function attach() {
      if (listening || !win || typeof win.addEventListener !== 'function') return;
      handler = onKeyDown;
      win.addEventListener('keydown', handler, true);
      listening = true;
    }

    function detach() {
      if (!listening || !win || typeof win.removeEventListener !== 'function') return;
      win.removeEventListener('keydown', handler, true);
      listening = false;
      handler = null;
    }

    return {
      id: 'keyboard',
      init: function () {
        attach();
      },
      apply: function (settings) {
        lastSettings = settings;
        if (!settings || !settings.keyboard) return;
        var shortcuts = settings.keyboard.shortcuts || {};
        findDuplicateShortcuts(shortcuts).forEach(function (dup) {
          logger.warn(
            'keyboard: duplicate shortcut "' +
              dup.shortcut +
              '" bound to ' +
              dup.actions.join(', ') +
              ' — first binding wins'
          );
        });
        findNativeConflicts(shortcuts).forEach(function (conflict) {
          logger.warn(
            'keyboard: shortcut "' +
              conflict.shortcut +
              '" for ' +
              conflict.action +
              ' conflicts with a YouTube-native key'
          );
        });
      },
      enable: function () {
        attach();
      },
      disable: function () {
        detach();
      },
      destroy: function () {
        detach();
      },
    };
  }

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.keyboard = {
    createKeyboardModule: createKeyboardModule,
    normalizeShortcut: normalizeShortcut,
    findDuplicateShortcuts: findDuplicateShortcuts,
    findNativeConflicts: findNativeConflicts,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createKeyboardModule: createKeyboardModule,
      normalizeShortcut: normalizeShortcut,
      findDuplicateShortcuts: findDuplicateShortcuts,
      findNativeConflicts: findNativeConflicts,
    };
  }
})();
