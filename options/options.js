/* OneYT — options/options.js (dashboard engine, Phase 5).
 *
 * The dashboard is data-driven: options/sections/*.js declare
 * controls (key, type, label, description, keywords) and this
 * file renders them, binds them to chrome.storage.local and
 * keeps them in sync. No framework, no build step.
 *
 * Live preview is free: content scripts watch storage.onChanged
 * (settings-manager.watchExternalChanges), so every save here
 * applies on open YouTube tabs without a reload.
 *
 * Pure helpers (getPath/setPath/diffSettings/search) are exported
 * for Node tests. The DOM wiring only runs in the browser.
 */
/* global Blob, FileReader, URL */
(function () {
  'use strict';

  // ---------- Pure helpers (no DOM, no chrome) ----------

  function getPath(obj, path) {
    var parts = String(path).split('.');
    var node = obj;
    for (var i = 0; i < parts.length; i++) {
      if (node === null || typeof node !== 'object') return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function setPath(obj, path, value) {
    var parts = String(path).split('.');
    var node = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (node[parts[i]] === null || typeof node[parts[i]] !== 'object') {
        node[parts[i]] = {};
      }
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
    return obj;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Recursive diff: [{ key, oldValue, newValue }] for leaf changes.
  function diffSettings(oldSettings, newSettings, prefix, out) {
    out = out || [];
    prefix = prefix || '';
    var keys = {};
    var key;
    for (key in oldSettings || {}) keys[key] = true;
    for (key in newSettings || {}) keys[key] = true;
    for (key in keys) {
      var path = prefix ? prefix + '.' + key : key;
      var a = oldSettings ? oldSettings[key] : undefined;
      var b = newSettings ? newSettings[key] : undefined;
      if (isPlainObject(a) && isPlainObject(b)) {
        diffSettings(a, b, path, out);
      } else if (JSON.stringify(a) !== JSON.stringify(b)) {
        out.push({ key: path, oldValue: a, newValue: b });
      }
    }
    return out;
  }

  function formatValue(value) {
    if (value === undefined) return '—';
    if (value === null) return 'YouTube default';
    if (typeof value === 'string' && value === '') return '(empty)';
    return JSON.stringify(value);
  }

  // Select option sources. `settings` supplies dynamic lists
  // (speed presets); `apis` supplies themes/font data.
  function resolveSelectOptions(source, settings, apis) {
    var list = [];
    var push = function (value, label) {
      list.push({ value: value, label: label });
    };
    switch (source) {
      case 'alignments':
        push('left', 'Left');
        push('center', 'Center');
        push('right', 'Right');
        break;
      case 'positions':
        push('default', 'Default');
        push('sticky', 'Sticky');
        push('fixed', 'Fixed');
        push('absolute', 'Absolute');
        break;
      case 'miniPositions':
        push('default', 'Default (bottom right)');
        push('bottom-right', 'Bottom right');
        push('bottom-left', 'Bottom left');
        push('top-right', 'Top right');
        push('top-left', 'Top left');
        break;
      case 'densities':
        push('comfortable', 'Comfortable');
        push('compact', 'Compact');
        break;
      case 'themes': {
        var names = (apis.themes && apis.themes.THEME_NAMES) || ['default'];
        names.forEach(function (name) {
          push(name, name.charAt(0).toUpperCase() + name.slice(1));
        });
        break;
      }
      case 'dashboardThemes':
        push('system', 'System');
        push('dark', 'Dark');
        push('light', 'Light');
        break;
      case 'fontFamilies': {
        push('', 'YouTube default');
        var stacks = (apis.themes && apis.themes.FONT_STACKS) || {};
        Object.keys(stacks).forEach(function (name) {
          push(name, name.charAt(0).toUpperCase() + name.slice(1));
        });
        break;
      }
      case 'fontWeights':
        push(0, 'YouTube default');
        [400, 500, 600, 700].forEach(function (w) {
          push(w, String(w));
        });
        break;
      case 'speedPresets': {
        var presets = getPath(settings, 'playback.speedPresets') || [1];
        var seen = {};
        presets.concat([getPath(settings, 'playback.defaultSpeed') || 1]).forEach(function (v) {
          if (typeof v !== 'number' || seen[v]) return;
          seen[v] = true;
          push(v, v + 'x');
        });
        list.sort(function (a, b) {
          return a.value - b.value;
        });
        break;
      }
      case 'qualities':
        ['auto', '1080p', '720p', '480p', '360p', '240p', '144p'].forEach(function (q) {
          push(q, q === 'auto' ? 'Auto (YouTube default)' : q);
        });
        break;
      case 'triState':
        push('default', 'YouTube default');
        push('on', 'On');
        push('off', 'Off');
        break;
      default:
        break;
    }
    return list;
  }

  // Tri-state select values ('default'/'on'/'off') <-> settings
  // values (null/true/false). Plain selects pass through.
  function selectToSetting(source, value) {
    if (source === 'triState') {
      if (value === 'on') return true;
      if (value === 'off') return false;
      return null;
    }
    return value;
  }

  function settingToSelect(source, value) {
    if (source === 'triState') {
      if (value === true) return 'on';
      if (value === false) return 'off';
      return 'default';
    }
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function buildSearchIndex(sections) {
    var index = [];
    sections.forEach(function (section) {
      (section.controls || []).forEach(function (control) {
        index.push({
          key: control.key,
          sectionId: section.id,
          sectionTitle: section.title,
          label: control.label,
          description: control.description || '',
          haystack: [
            control.key,
            section.title,
            control.label,
            control.description || '',
            (control.keywords || []).join(' '),
          ]
            .join(' ')
            .toLowerCase(),
        });
      });
    });
    return index;
  }

  function searchSettings(index, query) {
    var words = String(query || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return [];
    var scored = [];
    index.forEach(function (entry, pos) {
      var ok = words.every(function (word) {
        return entry.haystack.indexOf(word) !== -1;
      });
      if (!ok) return;
      // Rank: a word in the label beats a word in the key or
      // section title, which beats a word only in the
      // description/keywords. Ties keep index order.
      var score = 0;
      var where = (entry.key + ' ' + entry.sectionTitle).toLowerCase();
      var label = entry.label.toLowerCase();
      words.forEach(function (word) {
        if (label.indexOf(word) !== -1) score += 2;
        else if (where.indexOf(word) !== -1) score += 1;
      });
      scored.push({ entry: entry, score: score, pos: pos });
    });
    scored.sort(function (a, b) {
      return b.score - a.score || a.pos - b.pos;
    });
    return scored.map(function (s) {
      return s.entry;
    });
  }

  // Pure: split text into { text, match } segments around the
  // query words (case-insensitive, longest word first so
  // 'theme' wins over 'the'). Used to <mark> matches in
  // search results.
  function splitHighlight(text, words) {
    var clean = (words || [])
      .filter(Boolean)
      .map(function (w) {
        return String(w).toLowerCase();
      })
      .sort(function (a, b) {
        return b.length - a.length;
      });
    if (!text || clean.length === 0) return [{ text: text || '', match: false }];
    var lower = String(text).toLowerCase();
    var out = [];
    var plain = '';
    var i = 0;
    while (i < text.length) {
      var hitLen = 0;
      for (var w = 0; w < clean.length; w++) {
        var word = clean[w];
        if (word && lower.indexOf(word, i) === i && word.length > hitLen) {
          hitLen = word.length;
        }
      }
      if (hitLen > 0) {
        if (plain) out.push({ text: plain, match: false });
        plain = '';
        out.push({ text: text.slice(i, i + hitLen), match: true });
        i += hitLen;
      } else {
        plain += text[i];
        i++;
      }
    }
    if (plain) out.push({ text: plain, match: false });
    return out;
  }

  // Pure: resolve the effective dashboard theme. 'dark'/'light'
  // force one; anything else ('system' or a bad stored value)
  // follows the OS (prefers-color-scheme).
  function resolveDashboardTheme(setting, prefersDark) {
    if (setting === 'dark') return 'dark';
    if (setting === 'light') return 'light';
    return prefersDark ? 'dark' : 'light';
  }

  // Pure: what an ArrowDown/ArrowUp/Enter/Escape keypress means
  // for the search dropdown. Returns { action, index } where
  // action is 'move' | 'activate' | 'close' | 'clear' | 'none'.
  // count is the number of visible results, isOpen whether the
  // dropdown is showing.
  function searchKeyAction(key, activeIndex, count, isOpen) {
    if (key === 'Escape') {
      if (isOpen) return { action: 'close', index: -1 };
      return { action: 'clear', index: -1 };
    }
    if (!isOpen || count === 0) return { action: 'none', index: activeIndex };
    if (key === 'ArrowDown') {
      return { action: 'move', index: activeIndex < count - 1 ? activeIndex + 1 : 0 };
    }
    if (key === 'ArrowUp') {
      return { action: 'move', index: activeIndex > 0 ? activeIndex - 1 : count - 1 };
    }
    if (key === 'Enter') {
      if (activeIndex >= 0) return { action: 'activate', index: activeIndex };
      return { action: 'activate', index: 0 };
    }
    return { action: 'none', index: activeIndex };
  }

  // ---------- DOM app ----------

  function el(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      for (var name in attrs) {
        if (name === 'text') node.textContent = attrs[name];
        else if (name === 'class') node.className = attrs[name];
        else node.setAttribute(name, attrs[name]);
      }
    }
    (children || []).forEach(function (child) {
      if (typeof child === 'string') node.appendChild(doc.createTextNode(child));
      else if (child) node.appendChild(child);
    });
    return node;
  }

  function createOptionsApp(deps) {
    var doc = deps.document;
    var storage = deps.storage;
    var defaultsApi = deps.defaultsApi;
    var validators = deps.validators;
    var apis = { themes: deps.themes || null };
    var keyboardApi = deps.keyboardApi || null;
    var sections = deps.sections || [];
    var constants = deps.constants || {};
    var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';

    var state = defaultsApi.cloneDefaults();
    var saveTimer = null;
    var navEl = doc.getElementById('options-nav');
    var mainEl = doc.getElementById('options-main');
    var searchEl = doc.getElementById('options-search');
    var resultsEl = doc.getElementById('search-results');
    var clearEl = doc.getElementById('search-clear');
    var savedEl = doc.getElementById('saved-indicator');
    var searchIndex = buildSearchIndex(sections);
    var currentSection = sections.length > 0 ? sections[0].id : null;
    var inputsByKey = {};

    function sectionById(id) {
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].id === id) return sections[i];
      }
      return null;
    }

    function getDefault(key) {
      return getPath(defaultsApi.DEFAULT_SETTINGS, key);
    }

    function markSaved() {
      if (savedEl) savedEl.textContent = 'Saved — live on YouTube tabs';
    }

    function saveNow() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      return storage
        .set({ [STORAGE_KEY]: state })
        .then(markSaved)
        .catch(function () {
          if (savedEl) savedEl.textContent = 'Save failed — try again';
        });
    }

    function saveSoon(delay) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, delay || 150);
    }

    function setValue(key, value, delay) {
      setPath(state, key, value);
      if (key === 'ui.dashboardTheme') applyDashboardTheme();
      saveSoon(delay);
    }

    function systemPrefersDark() {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply the dashboard theme as a data-theme attribute on
    // <html>. CSS carries the tokens; the attribute is the one
    // source of truth (the prefers-color-scheme media query in
    // the CSS is only the pre-JS fallback).
    function applyDashboardTheme() {
      var theme = resolveDashboardTheme(getPath(state, 'ui.dashboardTheme'), systemPrefersDark());
      if (doc.documentElement) doc.documentElement.setAttribute('data-theme', theme);
    }

    function refreshValues() {
      sections.forEach(function (section) {
        (section.controls || []).forEach(function (control) {
          var input = inputsByKey[control.key];
          if (!input || !input.set) return;
          input.set(getPath(state, control.key));
        });
      });
    }

    function showWarning(row, message) {
      var warn = row.querySelector('.control-warning');
      if (!warn) return;
      warn.textContent = message || '';
      warn.style.display = message ? 'block' : 'none';
    }

    function checkShortcutWarnings() {
      if (!keyboardApi) return;
      var shortcuts = getPath(state, 'keyboard.shortcuts') || {};
      var dups = keyboardApi.findDuplicateShortcuts(shortcuts);
      var conflicts = keyboardApi.findNativeConflicts(shortcuts);
      var dupKeys = {};
      dups.forEach(function (dup) {
        dup.actions.forEach(function (action) {
          dupKeys['keyboard.shortcuts.' + action] =
            'Duplicate shortcut "' + dup.shortcut + '" — first binding wins.';
        });
      });
      conflicts.forEach(function (c) {
        dupKeys['keyboard.shortcuts.' + c.action] =
          'Conflicts with a YouTube-native key — use a Shift+ combination.';
      });
      sections.forEach(function (section) {
        (section.controls || []).forEach(function (control) {
          var row = doc.querySelector('[data-control-key="' + control.key + '"]');
          if (row) showWarning(row, dupKeys[control.key] || '');
        });
      });
    }

    // ----- control inputs -----

    function makeToggle(control) {
      var input = el(doc, 'input', { type: 'checkbox', class: 'control-input' });
      return {
        node: input,
        set: function (value) {
          input.checked = !!value;
        },
        bind: function () {
          input.addEventListener('change', function () {
            setValue(control.key, input.checked, 0);
          });
        },
      };
    }

    function makeSelect(control) {
      var input = el(doc, 'select', { class: 'control-input' });
      var options = resolveSelectOptions(control.source, state, apis);
      options.forEach(function (opt) {
        input.appendChild(el(doc, 'option', { value: String(opt.value), text: opt.label }));
      });
      return {
        node: input,
        set: function (value) {
          input.value = settingToSelect(control.source, value);
        },
        bind: function () {
          input.addEventListener('change', function () {
            var raw = input.value;
            var value = raw;
            if (control.source !== 'triState' && !isNaN(Number(raw)) && raw !== '') {
              var num = Number(raw);
              if (String(num) === raw) value = num;
            }
            setValue(control.key, selectToSetting(control.source, value), 0);
            if (control.key === 'appearance.theme') refreshValues();
          });
        },
      };
    }

    function makeNumber(control, isRange) {
      var wrap = el(doc, 'span', { class: 'control-number-wrap' });
      var input = el(doc, 'input', {
        type: isRange ? 'range' : 'number',
        class: 'control-input',
        min: control.min !== undefined ? String(control.min) : '',
        max: control.max !== undefined ? String(control.max) : '',
        step: control.step !== undefined ? String(control.step) : '',
      });
      var out = el(doc, 'output', { class: 'control-value' });
      wrap.appendChild(input);
      wrap.appendChild(out);
      var updateOut = function () {
        out.textContent = input.value + (control.unit ? ' ' + control.unit : '');
      };
      return {
        node: wrap,
        set: function (value) {
          input.value = value === undefined || value === null ? '' : String(value);
          updateOut();
        },
        bind: function (row) {
          var commit = function () {
            var num = Number(input.value);
            if (input.value === '' || isNaN(num)) {
              showWarning(row, 'Enter a number.');
              input.value = String(getPath(state, control.key));
              updateOut();
              return;
            }
            if (control.min !== undefined && num < control.min) num = control.min;
            if (control.max !== undefined && num > control.max) num = control.max;
            showWarning(row, '');
            input.value = String(num);
            updateOut();
            setValue(control.key, num, isRange ? 150 : 0);
          };
          input.addEventListener('change', commit);
          input.addEventListener('input', function () {
            updateOut();
            if (isRange) commit();
          });
        },
      };
    }

    function makeText(control) {
      var input = el(doc, 'input', {
        type: 'text',
        class: 'control-input',
        placeholder: control.placeholder || '',
      });
      return {
        node: input,
        set: function (value) {
          input.value = value === undefined || value === null ? '' : String(value);
        },
        bind: function () {
          input.addEventListener('change', function () {
            setValue(control.key, input.value, 0);
          });
        },
      };
    }

    function makeColor(control) {
      var wrap = el(doc, 'span', { class: 'control-color-wrap' });
      var picker = el(doc, 'input', { type: 'color', class: 'control-color' });
      var text = el(doc, 'input', {
        type: 'text',
        class: 'control-input control-color-text',
        placeholder: '#rrggbb or empty',
      });
      var clear = el(doc, 'button', { type: 'button', class: 'btn btn-small', text: 'Clear' });
      wrap.appendChild(picker);
      wrap.appendChild(text);
      wrap.appendChild(clear);
      var apply = function (hex) {
        setValue(control.key, hex, 0);
      };
      return {
        node: wrap,
        set: function (value) {
          var hex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '';
          text.value = hex;
          picker.value = hex || '#000000';
        },
        bind: function (row) {
          picker.addEventListener('input', function () {
            text.value = picker.value;
            apply(picker.value);
          });
          text.addEventListener('change', function () {
            var v = text.value.trim();
            if (v !== '' && !/^#[0-9a-fA-F]{6}$/.test(v)) {
              showWarning(row, 'Colour must be #rrggbb or empty.');
              text.value = getPath(state, control.key) || '';
              return;
            }
            showWarning(row, '');
            picker.value = v || '#000000';
            apply(v);
          });
          clear.addEventListener('click', function () {
            apply('');
            text.value = '';
            picker.value = '#000000';
          });
        },
      };
    }

    function makeTextarea(control) {
      var input = el(doc, 'textarea', {
        class: 'control-input control-textarea',
        rows: String(control.rows || 6),
        placeholder: control.placeholder || '',
      });
      return {
        node: input,
        set: function (value) {
          input.value = value === undefined || value === null ? '' : String(value);
        },
        bind: function (row) {
          input.addEventListener('change', function () {
            if (control.key === 'appearance.customCSS' && validators) {
              var check = validators.validateCustomCSS(input.value);
              if (!check.valid) {
                showWarning(row, 'Custom CSS rejected: ' + check.errors.join(' '));
                input.value = getPath(state, control.key) || '';
                return;
              }
              showWarning(row, '');
            }
            setValue(control.key, input.value, 0);
          });
        },
      };
    }

    function makeSpeedList(control) {
      var wrap = el(doc, 'div', { class: 'control-speed-list' });
      var listEl = el(doc, 'div', { class: 'speed-chips' });
      var addInput = el(doc, 'input', {
        type: 'number',
        class: 'control-input speed-add-input',
        min: '0.25',
        max: '4',
        step: '0.25',
        placeholder: 'e.g. 1.75',
      });
      var addBtn = el(doc, 'button', { type: 'button', class: 'btn btn-small', text: 'Add speed' });
      wrap.appendChild(listEl);
      wrap.appendChild(addInput);
      wrap.appendChild(addBtn);
      var render = function (values) {
        listEl.textContent = '';
        (values || []).forEach(function (v) {
          var chip = el(doc, 'span', { class: 'speed-chip', text: v + 'x ' });
          var x = el(doc, 'button', { type: 'button', class: 'speed-remove', text: '×' });
          x.addEventListener('click', function () {
            var next = (getPath(state, control.key) || []).filter(function (n) {
              return n !== v;
            });
            setValue(control.key, next, 0);
            render(next);
          });
          chip.appendChild(x);
          listEl.appendChild(chip);
        });
      };
      return {
        node: wrap,
        set: function (value) {
          render(Array.isArray(value) ? value : []);
        },
        bind: function (row) {
          addBtn.addEventListener('click', function () {
            var num = Number(addInput.value);
            if (!validators) return;
            var check = validators.validateSpeedPresets([num]);
            if (check.cleaned.length !== 1) {
              showWarning(row, 'Speed must be a number between 0.25x and 4x.');
              return;
            }
            var current = getPath(state, control.key) || [];
            if (current.indexOf(num) !== -1) {
              showWarning(row, 'That speed is already in the list.');
              return;
            }
            showWarning(row, '');
            var next = validators.validateSpeedPresets(current.concat([num])).cleaned;
            setValue(control.key, next, 0);
            render(next);
            addInput.value = '';
          });
        },
      };
    }

    function makeShortcut(control) {
      var input = el(doc, 'input', {
        type: 'text',
        class: 'control-input control-shortcut',
        readonly: 'readonly',
        placeholder: 'Click, then press keys',
      });
      var capturing = false;
      var onKey = function (event) {
        // Escape cancels; Tab cancels too and must keep moving
        // focus — binding 'Tab' as a shortcut would trap keyboard
        // users in the field (Phase 6 accessibility pass).
        if (event.key === 'Escape' || event.key === 'Tab') {
          capturing = false;
          input.value = getPath(state, control.key) || '';
          input.classList.remove('capturing');
          doc.removeEventListener('keydown', onKey, true);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (['Control', 'Shift', 'Alt', 'Meta'].indexOf(event.key) !== -1) return;
        var parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        if (event.metaKey) parts.push('Meta');
        var key = event.key === ' ' ? 'Space' : event.key;
        parts.push(key.length === 1 ? key.toUpperCase() : key);
        var combo = parts.join('+');
        capturing = false;
        input.classList.remove('capturing');
        doc.removeEventListener('keydown', onKey, true);
        if (keyboardApi) {
          var parsed = keyboardApi.normalizeShortcut(combo);
          if (!parsed) {
            input.value = getPath(state, control.key) || '';
            return;
          }
        }
        input.value = combo;
        setValue(control.key, combo, 0);
        checkShortcutWarnings();
      };
      return {
        node: input,
        set: function (value) {
          if (!capturing) input.value = value || '';
        },
        bind: function () {
          input.addEventListener('focus', function () {
            input.value = '';
          });
          input.addEventListener('click', function () {
            if (capturing) return;
            capturing = true;
            input.classList.add('capturing');
            input.value = 'Press keys… (Esc to cancel)';
            doc.addEventListener('keydown', onKey, true);
          });
          input.addEventListener('keydown', function (event) {
            if ((event.key === 'Backspace' || event.key === 'Delete') && !capturing) {
              event.preventDefault();
              setValue(control.key, '', 0);
              input.value = '';
              checkShortcutWarnings();
            }
          });
        },
      };
    }

    function makeInput(control) {
      switch (control.type) {
        case 'toggle':
          return makeToggle(control);
        case 'select':
          return makeSelect(control);
        case 'number':
          return makeNumber(control, false);
        case 'range':
          return makeNumber(control, true);
        case 'text':
          return makeText(control);
        case 'color':
          return makeColor(control);
        case 'textarea':
          return makeTextarea(control);
        case 'speedList':
          return makeSpeedList(control);
        case 'shortcut':
          return makeShortcut(control);
        default:
          return makeText(control);
      }
    }

    // ----- sections -----

    function renderControlRow(control) {
      var row = el(doc, 'div', { class: 'control-row', 'data-control-key': control.key });
      var head = el(doc, 'div', { class: 'control-head' });
      head.appendChild(el(doc, 'span', { class: 'control-label', text: control.label }));
      var resetBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-small control-reset',
        text: 'Reset',
        title: 'Restore default: ' + formatValue(getDefault(control.key)),
      });
      resetBtn.addEventListener('click', function () {
        var def = defaultsApi.deepClone(getDefault(control.key));
        setValue(control.key, def, 0);
        var input = inputsByKey[control.key];
        if (input) input.set(def);
        if (control.key.indexOf('keyboard.shortcuts.') === 0) checkShortcutWarnings();
      });
      head.appendChild(resetBtn);
      row.appendChild(head);
      if (control.description) {
        row.appendChild(el(doc, 'p', { class: 'control-desc', text: control.description }));
      }
      var input = makeInput(control);
      inputsByKey[control.key] = input;
      row.appendChild(input.node);
      row.appendChild(
        el(doc, 'p', {
          class: 'control-default',
          text: 'Default: ' + formatValue(getDefault(control.key)),
        })
      );
      row.appendChild(el(doc, 'p', { class: 'control-warning', text: '' }));
      input.bind(row);
      input.set(getPath(state, control.key));
      return row;
    }

    function renderAdvancedTools(sectionEl) {
      // Import / export.
      var importBox = el(doc, 'div', { class: 'tool-box' });
      importBox.appendChild(el(doc, 'h3', { text: 'Import / Export' }));
      importBox.appendChild(
        el(doc, 'p', {
          text: 'Export downloads your settings as JSON. Import validates the file first, shows what would change, and only applies it when you confirm.',
        })
      );
      var exportBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn',
        text: 'Export settings (JSON)',
      });
      var importFile = el(doc, 'input', { type: 'file', accept: '.json,application/json' });
      var importText = el(doc, 'textarea', {
        class: 'control-input control-textarea',
        rows: '6',
        placeholder: '…or paste exported JSON here',
      });
      var importMsg = el(doc, 'p', { class: 'control-warning', text: '' });
      var previewEl = el(doc, 'div', { class: 'import-preview' });
      var applyBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-primary',
        text: 'Apply import',
      });
      applyBtn.style.display = 'none';
      var pendingImport = null;
      exportBtn.addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = doc.createElement('a');
        a.href = url;
        a.download = 'oneyt-settings.json';
        a.click();
        URL.revokeObjectURL(url);
      });
      var handleImportText = function (text) {
        importMsg.textContent = '';
        previewEl.textContent = '';
        applyBtn.style.display = 'none';
        pendingImport = null;
        var maxBytes = (constants && constants.MAX_IMPORT_BYTES) || 200000;
        if (text.length > maxBytes) {
          importMsg.textContent =
            'Import is too large (' + text.length + ' characters, max ' + maxBytes + ').';
          importMsg.style.display = 'block';
          return;
        }
        var data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          importMsg.textContent = 'Not valid JSON: ' + err.message;
          importMsg.style.display = 'block';
          return;
        }
        var result = validators ? validators.validateSettings(data, defaultsApi) : null;
        if (!result || !result.valid) {
          var errors = result ? result.errors : ['Validator unavailable.'];
          importMsg.textContent = 'Import rejected: ' + errors.join(' ');
          importMsg.style.display = 'block';
          return;
        }
        // Imports bypass the dashboard's own number inputs, so
        // clamp numeric values to the controls' min/max here
        // (Phase 6 bug bash) and report the repairs in the preview.
        var clamped = clampSettingsToControls(result.cleaned, sections);
        result.cleaned = clamped.settings;
        if (clamped.clamped.length > 0) {
          result.warnings = (result.warnings || []).concat(
            clamped.clamped.map(function (c) {
              return c.key + ' was out of range (' + c.from + ') and was clamped to ' + c.to + '.';
            })
          );
        }
        var diff = diffSettings(state, result.cleaned);
        pendingImport = result.cleaned;
        if (result.warnings && result.warnings.length > 0) {
          previewEl.appendChild(
            el(doc, 'p', {
              class: 'control-warning',
              text: 'Warnings: ' + result.warnings.join(' '),
            })
          );
          previewEl.lastChild.style.display = 'block';
        }
        if (diff.length === 0) {
          previewEl.textContent = 'No changes — the file matches your current settings.';
        } else {
          var list = el(doc, 'ul', {});
          diff.forEach(function (change) {
            list.appendChild(
              el(doc, 'li', {
                text:
                  change.key +
                  ': ' +
                  formatValue(change.oldValue) +
                  ' → ' +
                  formatValue(change.newValue),
              })
            );
          });
          previewEl.appendChild(el(doc, 'p', { text: diff.length + ' setting(s) would change:' }));
          previewEl.appendChild(list);
        }
        applyBtn.style.display = 'inline-block';
      };
      importFile.addEventListener('change', function () {
        var file = importFile.files && importFile.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          handleImportText(String(reader.result || ''));
        };
        reader.readAsText(file);
      });
      var importBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn',
        text: 'Validate & preview',
      });
      importBtn.addEventListener('click', function () {
        handleImportText(importText.value);
      });
      applyBtn.addEventListener('click', function () {
        if (!pendingImport) return;
        state = defaultsApi.deepClone(pendingImport);
        saveNow().then(function () {
          renderSection(currentSection);
          importMsg.textContent = 'Import applied.';
          importMsg.style.display = 'block';
        });
      });
      importBox.appendChild(exportBtn);
      importBox.appendChild(el(doc, 'p', { text: 'Import from a file:' }));
      importBox.appendChild(importFile);
      importBox.appendChild(el(doc, 'p', { text: 'Import from pasted JSON:' }));
      importBox.appendChild(importText);
      importBox.appendChild(importBtn);
      importBox.appendChild(importMsg);
      importBox.appendChild(previewEl);
      importBox.appendChild(applyBtn);
      sectionEl.appendChild(importBox);

      // Reset all.
      var resetBox = el(doc, 'div', { class: 'tool-box' });
      resetBox.appendChild(el(doc, 'h3', { text: 'Reset everything' }));
      resetBox.appendChild(
        el(doc, 'p', { text: 'Restore every setting to its default. This cannot be undone.' })
      );
      var resetAllBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-danger',
        text: 'Reset all settings',
      });
      resetAllBtn.addEventListener('click', function () {
        if (!window.confirm('Reset ALL OneYT settings to defaults?')) return;
        state = defaultsApi.cloneDefaults();
        saveNow().then(function () {
          renderSection(currentSection);
        });
      });
      resetBox.appendChild(resetAllBtn);
      sectionEl.appendChild(resetBox);

      // Version info.
      var infoBox = el(doc, 'div', { class: 'tool-box' });
      infoBox.appendChild(el(doc, 'h3', { text: 'About' }));
      var version = '0.1.0';
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
          version = chrome.runtime.getManifest().version || version;
        }
      } catch {
        // Non-Chrome context (tests): keep the fallback.
      }
      infoBox.appendChild(
        el(doc, 'p', {
          text:
            'OneYT version ' +
            version +
            ' · Settings schema v' +
            state.schemaVersion +
            ' · All settings are stored locally on this device.',
        })
      );
      sectionEl.appendChild(infoBox);
    }

    function renderSection(sectionId) {
      var section = sectionById(sectionId);
      if (!section) return;
      currentSection = sectionId;
      navEl.querySelectorAll('.nav-item').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-section') === sectionId);
      });
      mainEl.textContent = '';
      var header = el(doc, 'div', { class: 'section-header' });
      header.appendChild(el(doc, 'h2', { text: section.title }));
      if (section.description) {
        header.appendChild(el(doc, 'p', { class: 'section-desc', text: section.description }));
      }
      if ((section.controls || []).length > 0) {
        var resetSectionBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn btn-small',
          text: 'Reset this section',
        });
        resetSectionBtn.addEventListener('click', function () {
          section.controls.forEach(function (control) {
            setPath(state, control.key, defaultsApi.deepClone(getDefault(control.key)));
          });
          saveNow().then(function () {
            renderSection(sectionId);
          });
        });
        header.appendChild(resetSectionBtn);
      }
      mainEl.appendChild(header);
      (section.controls || []).forEach(function (control) {
        mainEl.appendChild(renderControlRow(control));
      });
      if (section.id === 'advanced') renderAdvancedTools(mainEl);
      checkShortcutWarnings();
    }

    function renderNav() {
      navEl.textContent = '';
      sections.forEach(function (section) {
        var btn = el(doc, 'button', {
          type: 'button',
          class: 'nav-item',
          'data-section': section.id,
          text: section.title,
        });
        btn.addEventListener('click', function () {
          renderSection(section.id);
        });
        navEl.appendChild(btn);
      });
    }

    function appendHighlighted(parent, text, words) {
      splitHighlight(text, words).forEach(function (seg) {
        if (seg.match) {
          parent.appendChild(el(doc, 'mark', { text: seg.text }));
        } else {
          parent.appendChild(doc.createTextNode(seg.text));
        }
      });
    }

    function bindSearch() {
      if (!searchEl || !resultsEl) return;
      var MAX_RESULTS = 8;
      var activeIndex = -1;
      var currentResults = [];
      var resultItems = [];

      function closeResults() {
        activeIndex = -1;
        resultsEl.style.display = 'none';
        searchEl.setAttribute('aria-expanded', 'false');
        searchEl.removeAttribute('aria-activedescendant');
      }

      function setActive(index) {
        activeIndex = index;
        resultItems.forEach(function (item, i) {
          if (i === index) {
            item.classList.add('active');
            searchEl.setAttribute('aria-activedescendant', item.getAttribute('id'));
          } else {
            item.classList.remove('active');
          }
        });
        if (index < 0) searchEl.removeAttribute('aria-activedescendant');
      }

      function activate(entry) {
        renderSection(entry.sectionId);
        searchEl.value = '';
        closeResults();
        if (clearEl) clearEl.hidden = true;
        var row = mainEl.querySelector('[data-control-key="' + entry.key + '"]');
        if (row) {
          row.scrollIntoView({ block: 'center' });
          row.classList.add('highlight');
          setTimeout(function () {
            row.classList.remove('highlight');
          }, 2000);
        }
      }

      function renderResults() {
        var query = searchEl.value;
        var words = String(query || '')
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);
        currentResults = searchSettings(searchIndex, query);
        resultItems = [];
        activeIndex = -1;
        resultsEl.textContent = '';
        searchEl.removeAttribute('aria-activedescendant');
        if (clearEl) clearEl.hidden = query.length === 0;
        if (words.length === 0) {
          closeResults();
          return;
        }
        if (currentResults.length === 0) {
          resultsEl.appendChild(
            el(doc, 'div', {
              class: 'search-no-results',
              text: 'No settings match "' + query + '".',
            })
          );
          resultsEl.style.display = 'block';
          searchEl.setAttribute('aria-expanded', 'true');
          return;
        }
        currentResults.slice(0, MAX_RESULTS).forEach(function (entry, i) {
          var item = el(doc, 'button', { type: 'button', class: 'search-result' });
          item.setAttribute('role', 'option');
          item.setAttribute('id', 'search-result-' + i);
          item.appendChild(doc.createTextNode(entry.sectionTitle + ' — '));
          appendHighlighted(item, entry.label, words);
          item.addEventListener('click', function () {
            activate(entry);
          });
          item.addEventListener('mousemove', function () {
            setActive(i);
          });
          resultsEl.appendChild(item);
          resultItems.push(item);
        });
        if (currentResults.length > MAX_RESULTS) {
          resultsEl.appendChild(
            el(doc, 'div', {
              class: 'search-count',
              text:
                'Showing ' +
                MAX_RESULTS +
                ' of ' +
                currentResults.length +
                ' results — refine your search to see more.',
            })
          );
        }
        resultsEl.style.display = 'block';
        searchEl.setAttribute('aria-expanded', 'true');
      }

      searchEl.addEventListener('input', renderResults);
      searchEl.addEventListener('focus', function () {
        if (searchEl.value) renderResults();
      });
      searchEl.addEventListener('keydown', function (event) {
        var isOpen = resultsEl.style.display === 'block';
        var visible = Math.min(currentResults.length, MAX_RESULTS);
        var decision = searchKeyAction(event.key, activeIndex, visible, isOpen);
        if (decision.action === 'none') return;
        event.preventDefault();
        if (decision.action === 'move') setActive(decision.index);
        else if (decision.action === 'activate') activate(currentResults[decision.index]);
        else if (decision.action === 'close') closeResults();
        else if (decision.action === 'clear') {
          searchEl.value = '';
          renderResults();
        }
      });
      if (clearEl) {
        clearEl.addEventListener('click', function () {
          searchEl.value = '';
          renderResults();
          searchEl.focus();
        });
      }
      doc.addEventListener('click', function (event) {
        if (resultsEl && !resultsEl.contains(event.target) && event.target !== searchEl) {
          closeResults();
        }
      });
    }

    function load() {
      return storage
        .get(STORAGE_KEY)
        .then(function (stored) {
          state = defaultsApi.migrateSettings(stored);
        })
        .catch(function () {
          state = defaultsApi.cloneDefaults();
        });
    }

    function init() {
      renderNav();
      bindSearch();
      return load().then(function () {
        applyDashboardTheme();
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if (getPath(state, 'ui.dashboardTheme') === 'system') applyDashboardTheme();
          });
        }
        renderSection(currentSection);
        if (storage.onChanged) {
          storage.onChanged(function (changes, areaName) {
            if (areaName !== 'local') return;
            var change = changes && changes[STORAGE_KEY];
            if (!change || !change.newValue) return;
            var next = defaultsApi.migrateSettings(change.newValue);
            if (JSON.stringify(next) === JSON.stringify(state)) return;
            state = next;
            applyDashboardTheme();
            refreshValues();
          });
        }
      });
    }

    return {
      init: init,
      renderSection: renderSection,
      getState: function () {
        return state;
      },
    };
  }

  // Clamps numeric settings to the min/max of the matching
  // dashboard controls (number/range types). The dashboard's
  // own inputs already clamp on commit, but an import bypasses
  // them — a hand-edited file could otherwise store
  // player.customWidth 99999 or captionFontSize 999. Returns
  // { settings (a clone), clamped: [{ key, from, to }] }.
  // Non-numeric values are left alone for migration to repair.
  function clampSettingsToControls(settings, sections) {
    var copy = JSON.parse(JSON.stringify(settings || {}));
    var clamped = [];
    (sections || []).forEach(function (section) {
      (section.controls || []).forEach(function (control) {
        if (
          (control.type !== 'number' && control.type !== 'range') ||
          control.min === undefined ||
          control.max === undefined
        ) {
          return;
        }
        var value = getPath(copy, control.key);
        if (typeof value !== 'number' || !isFinite(value)) return;
        var next = value;
        if (value < control.min) next = control.min;
        if (value > control.max) next = control.max;
        if (next !== value) {
          setPath(copy, control.key, next);
          clamped.push({ key: control.key, from: value, to: next });
        }
      });
    });
    return { settings: copy, clamped: clamped };
  }

  var api = {
    getPath: getPath,
    setPath: setPath,
    clampSettingsToControls: clampSettingsToControls,
    diffSettings: diffSettings,
    formatValue: formatValue,
    resolveSelectOptions: resolveSelectOptions,
    selectToSetting: selectToSetting,
    settingToSelect: settingToSelect,
    buildSearchIndex: buildSearchIndex,
    searchSettings: searchSettings,
    splitHighlight: splitHighlight,
    searchKeyAction: searchKeyAction,
    resolveDashboardTheme: resolveDashboardTheme,
    createOptionsApp: createOptionsApp,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.options = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // Bootstrap in the browser only.
  if (
    typeof document !== 'undefined' &&
    document.getElementById &&
    document.getElementById('options-root')
  ) {
    var sections = [];
    var order = [
      'general',
      'player',
      'sidebar',
      'layout',
      'appearance',
      'playback',
      'productivity',
      'keyboard',
      'advanced',
    ];
    order.forEach(function (id) {
      if (ns.optionsSections && ns.optionsSections[id]) sections.push(ns.optionsSections[id]);
    });
    var app = createOptionsApp({
      document: document,
      storage: ns.storage.createStorage(),
      defaultsApi: ns.defaults,
      validators: ns.validators,
      themes: ns.themes,
      keyboardApi: ns.modules && ns.modules.keyboard,
      sections: sections,
      constants: ns.constants,
    });
    app.init();
  }
})();
