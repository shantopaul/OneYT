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

  function countHealthStatuses(features) {
    var counts = { total: 0, working: 0, broken: 0, 'not-seen': 0, unchecked: 0 };
    (features || []).forEach(function (item) {
      counts.total++;
      if (counts[item.status] !== undefined) counts[item.status]++;
    });
    return counts;
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
    if (typeof value === 'boolean') return value ? 'On' : 'Off';
    if (typeof value === 'string') return value === '' ? '(empty)' : value;
    if (Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value);
  }

  function formatDefaultValue(value, control) {
    var base = formatValue(value);
    if (typeof value === 'number' && control) {
      if (control.unit) return base + ' ' + control.unit;
      if (control.source === 'speedPresets') return base + 'x';
    }
    return base;
  }

  function isControlModified(currentValue, defaultValue) {
    if (currentValue === undefined && defaultValue === '') return false;
    if (Array.isArray(currentValue) || Array.isArray(defaultValue)) {
      return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
    }
    return currentValue !== defaultValue;
  }

  var MODULE_SECTION_MAP = {
    'modules.player': { id: 'player', label: 'Player' },
    'modules.sidebar': { id: 'sidebar', label: 'Sidebar' },
    'modules.layout': { id: 'layout', label: 'Layout' },
    'modules.appearance': { id: 'appearance', label: 'Appearance' },
    'modules.typography': { id: 'appearance', label: 'Appearance' },
    'modules.playback': { id: 'playback', label: 'Playback' },
    'modules.recommendations': { id: 'sidebar', label: 'Sidebar' },
    'modules.focus': { id: 'productivity', label: 'Productivity' },
    'modules.keyboard': { id: 'keyboard', label: 'Keyboard' },
    'modules.navigation': { id: 'layout', label: 'Layout' },
  };

  var SECTION_MODULE_DEPS = {
    player: [{ key: 'modules.player', label: 'Player' }],
    sidebar: [
      { key: 'modules.sidebar', label: 'Sidebar' },
      { key: 'modules.recommendations', label: 'Recommendations' },
    ],
    layout: [
      { key: 'modules.layout', label: 'Layout' },
      { key: 'modules.navigation', label: 'Navigation' },
    ],
    appearance: [
      { key: 'modules.appearance', label: 'Appearance' },
      { key: 'modules.typography', label: 'Typography' },
    ],
    playback: [{ key: 'modules.playback', label: 'Playback' }],
    productivity: [{ key: 'modules.focus', label: 'Focus' }],
    keyboard: [{ key: 'modules.keyboard', label: 'Keyboard' }],
  };

  var CONTROL_DEPENDENCIES = {
    'sidebar.customWidth': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'sidebar.maxHeight': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'sidebar.scrollbarVisible': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'sidebar.scrollbarWidth': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
      {
        key: 'sidebar.scrollbarVisible',
        equals: true,
        reason: 'Requires "Show sidebar scrollbar" On',
      },
    ],
    'sidebar.smoothScroll': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
      {
        key: 'sidebar.independentScroll',
        equals: true,
        reason: 'Requires "Independent sidebar scroll" On',
      },
    ],
    'sidebar.scrollSensitivity': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
      {
        key: 'sidebar.independentScroll',
        equals: true,
        reason: 'Requires "Independent sidebar scroll" On',
      },
    ],
    'sidebar.playerOffset': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
      {
        key: 'sidebar.independentScroll',
        equals: true,
        reason: 'Requires "Independent sidebar scroll" On',
      },
    ],
    'recommendations.density': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'recommendations.cardSize': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'recommendations.showMetadata': [
      {
        key: 'recommendations.hideSidebar',
        equals: false,
        reason: 'Hidden while recommendations sidebar is hidden',
      },
    ],
    'appearance.customCSS': [
      {
        key: 'appearance.customCSSEnabled',
        equals: true,
        reason: 'Turn on "Use custom CSS" to apply',
      },
    ],
    'productivity.focusHideComments': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideChat': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideRecommendations': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideShorts': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideButtons': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideMetadata': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'productivity.focusHideNav': [
      {
        key: 'productivity.focusMode',
        equals: true,
        reason: 'Applies when Focus Mode or tab shortcut is active',
      },
    ],
    'layout.hideShortsHome': [
      {
        key: 'layout.blockShorts',
        equals: false,
        reason: 'Already hidden by "Block Shorts everywhere"',
      },
    ],
    'layout.hideShortsWatch': [
      {
        key: 'layout.blockShorts',
        equals: false,
        reason: 'Already hidden by "Block Shorts everywhere"',
      },
    ],
    'navigation.hideShorts': [
      {
        key: 'layout.blockShorts',
        equals: false,
        reason: 'Already hidden by "Block Shorts everywhere"',
      },
    ],
    'navigation.guideWidth': [
      {
        key: 'navigation.compact',
        equals: false,
        reason: 'Overridden while "Compact guide" is On',
      },
    ],
    'playback.captionFontSize': [
      {
        key: 'playback.captions',
        notEquals: false,
        reason: 'Captions are forced Off',
      },
    ],
  };

  function getControlInactiveReason(key, currentState) {
    var rules = CONTROL_DEPENDENCIES[key];
    if (!rules || !currentState) return '';
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var val = getPath(currentState, rule.key);
      if (rule.notEquals !== undefined) {
        if (val === rule.notEquals) return rule.reason;
      } else if (val !== rule.equals) {
        return rule.reason;
      }
    }
    return '';
  }

  var CONTROL_HINTS = {
    'playback.defaultSpeed': [
      {
        key: 'playback.rememberSpeed',
        equals: true,
        hint: 'Remember speed is On — takes over once changed on YouTube',
      },
    ],
    'playback.defaultVolume': [
      {
        key: 'playback.rememberVolume',
        equals: true,
        hint: 'Remember volume is On — takes over once changed on YouTube',
      },
    ],
  };

  function getControlHint(key, currentState) {
    var rules = CONTROL_HINTS[key];
    if (!rules || !currentState) return '';
    for (var i = 0; i < rules.length; i++) {
      if (getPath(currentState, rules[i].key) === rules[i].equals) {
        return rules[i].hint;
      }
    }
    return '';
  }

  var FOCUS_HIDE_KEYS = [
    'productivity.focusHideComments',
    'productivity.focusHideChat',
    'productivity.focusHideRecommendations',
    'productivity.focusHideShorts',
    'productivity.focusHideButtons',
    'productivity.focusHideMetadata',
    'productivity.focusHideNav',
  ];

  var SECTION_GROUPS = {
    player: {
      'player.customWidth': 'Size & positioning',
      'player.borderRadius': 'Frame & spacing',
      'player.hideEndscreen': 'Clean watch overlay',
      'player.miniPlayer.size': 'Mini-player',
    },
    sidebar: {
      'sidebar.independentScroll': 'Sidebar layout & scroll',
      'sidebar.scrollbarVisible': 'Scrollbar & scroll behaviour',
      'recommendations.hideSidebar': 'Recommendations feed',
    },
    layout: {
      'layout.blockShorts': 'Shorts & feed shelves',
      'layout.homeColumns': 'Home grid & cards',
      'layout.hideComments': 'Watch page',
      'navigation.hideHome': 'Left navigation & guide',
    },
    appearance: {
      'appearance.theme': 'Theme preset',
      'appearance.colors.accent': 'Custom colours',
      'appearance.typography.fontFamily': 'Typography',
      'appearance.borderRadius': 'Radius & spacing',
      'appearance.customCSSEnabled': 'Custom CSS',
    },
    playback: {
      'playback.defaultSpeed': 'Speed & volume',
      'playback.autoplay': 'Quality, autoplay & captions',
    },
    productivity: {
      'productivity.focusMode': 'Focus mode',
      'productivity.focusHideComments': 'Hidden elements in focus mode',
    },
  };

  var TOGGLE_GRID_KEYS = {
    'layout.hideShortsHome': true,
    'layout.hideShortsWatch': true,
    'layout.hideTopicChips': true,
    'layout.hideLiveShelf': true,
    'layout.hideMixesShelf': true,
    'layout.hideNewsShelf': true,
    'navigation.hideHome': true,
    'navigation.hideShorts': true,
    'navigation.hideSubscriptions': true,
    'navigation.hideLibrary': true,
    'navigation.hideHistory': true,
    'navigation.compact': true,
    'player.hideEndscreen': true,
    'player.hideLikeCount': true,
    'player.hideViewCount': true,
    'player.hideSubscriberCount': true,
    'productivity.focusHideComments': true,
    'productivity.focusHideChat': true,
    'productivity.focusHideRecommendations': true,
    'productivity.focusHideShorts': true,
    'productivity.focusHideButtons': true,
    'productivity.focusHideMetadata': true,
    'productivity.focusHideNav': true,
  };

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

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Vector paths (24x24 viewBox) built with createElementNS —
  // never innerHTML — so section nav stays CSP/security-clean.
  var SECTION_ICONS = {
    general: [
      ['circle', { cx: '12', cy: '12', r: '3' }],
      [
        'path',
        {
          d: 'M12 2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12',
        },
      ],
    ],
    profiles: [['path', { d: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }]],
    health: [['path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' }]],
    player: [
      ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }],
      ['polygon', { points: '10 9 16 12 10 15 10 9' }],
    ],
    sidebar: [
      ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }],
      ['path', { d: 'M9 3v18' }],
    ],
    layout: [
      ['rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' }],
      ['rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' }],
      ['rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' }],
      ['rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' }],
    ],
    appearance: [
      [
        'path',
        {
          d: 'M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 2-2v-.5a1.5 1.5 0 0 1 1.5-1.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z',
        },
      ],
      ['circle', { cx: '8', cy: '11', r: '1' }],
      ['circle', { cx: '11', cy: '7.5', r: '1' }],
      ['circle', { cx: '15', cy: '8.5', r: '1' }],
    ],
    playback: [
      ['polygon', { points: '13 19 22 12 13 5 13 19' }],
      ['polygon', { points: '2 19 11 12 2 5 2 19' }],
    ],
    productivity: [
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['circle', { cx: '12', cy: '12', r: '5' }],
      ['circle', { cx: '12', cy: '12', r: '1' }],
    ],
    keyboard: [
      ['rect', { x: '2', y: '5', width: '20', height: '14', rx: '2' }],
      ['path', { d: 'M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10' }],
    ],
    advanced: [
      ['path', { d: 'M16 18l6-6-6-6' }],
      ['path', { d: 'M8 6l-6 6 6 6' }],
    ],
  };

  function svgIcon(doc, sectionId, className) {
    if (typeof doc.createElementNS !== 'function') return null;
    var shapes = SECTION_ICONS[sectionId] || SECTION_ICONS.general;
    var svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (className) svg.setAttribute('class', className);
    shapes.forEach(function (spec) {
      var child = doc.createElementNS(SVG_NS, spec[0]);
      var attrs = spec[1];
      for (var key in attrs) {
        child.setAttribute(key, attrs[key]);
      }
      svg.appendChild(child);
    });
    return svg;
  }

  function createOptionsApp(deps) {
    var doc = deps.document;

    function createToolNoticeEl(text) {
      var msg = text || '';
      var cls = 'control-warning';
      if (
        msg.indexOf('Applied ') === 0 ||
        msg.indexOf('Saved ') === 0 ||
        msg.indexOf('Added ') === 0 ||
        msg.indexOf('Renamed ') === 0 ||
        msg.indexOf('Deleted ') === 0
      ) {
        cls += ' notice-success';
      } else if (msg.indexOf('Could not') !== -1 || msg.indexOf('rejected') !== -1) {
        cls += ' notice-error';
      }
      var node = el(doc, 'p', { class: cls, text: msg });
      if (msg) node.style.display = 'block';
      return node;
    }

    function bindEnterSubmit(inputEl, btnEl) {
      inputEl.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          btnEl.click();
        }
      });
    }
    var storage = deps.storage;
    var defaultsApi = deps.defaultsApi;
    var validators = deps.validators;
    var apis = { themes: deps.themes || null };
    var keyboardApi = deps.keyboardApi || null;
    var sections = deps.sections || [];
    var constants = deps.constants || {};
    var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';
    var profilesApi = deps.profilesApi || null;
    var PROFILES_KEY = constants.PROFILES_STORAGE_KEY || 'oneyt.profiles.v1';
    var healthApi = deps.healthApi || null;
    var HEALTH_KEY = constants.HEALTH_STORAGE_KEY || 'oneyt.health.v1';
    var cssTemplatesApi = deps.cssTemplatesApi || null;
    var savedThemesApi = deps.savedThemesApi || null;
    var SAVED_THEMES_KEY = constants.SAVED_THEMES_STORAGE_KEY || 'oneyt.themes.v1';
    var layoutPresetsApi = deps.layoutPresetsApi || null;
    var layoutEditorNotice = '';

    var state = defaultsApi.cloneDefaults();
    var profiles = [];
    var profilesNotice = '';
    var templatesNotice = '';
    var savedThemes = [];
    var savedThemesNotice = '';
    var healthRecord = {};
    var healthFilter = 'all';
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
      var value = getPath(defaultsApi.DEFAULT_SETTINGS, key);
      // appearance.colors.* has no per-colour default (the
      // defaults object is {}); a per-setting Reset stored
      // undefined and the button title showed
      // 'Restore default: —'. Empty means "no override",
      // which the colour control already renders as empty.
      if (value === undefined && key.indexOf('appearance.colors.') === 0) return '';
      return value;
    }

    function markSaved() {
      if (savedEl) {
        savedEl.textContent = 'Saved — live on YouTube tabs';
        savedEl.classList.remove('error');
      }
    }

    // Resolves true on a successful write, false on failure.
    // Callers that claim success (import applied, preset
    // applied) must gate their notice on the boolean — the
    // old code resolved either way, so a failed write still
    // showed a success message.
    function saveNow() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      return storage
        .set({ [STORAGE_KEY]: state })
        .then(function () {
          markSaved();
          return true;
        })
        .catch(function () {
          if (savedEl) {
            savedEl.textContent = 'Save failed — try again';
            savedEl.classList.add('error');
          }
          return false;
        });
    }

    function saveSoon(delay) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, delay || 150);
    }

    // State-replacing paths (import, reset all, preset/profile
    // apply, per-section reset) all go through here so the
    // dashboard theme follows the new state: a profile that
    // sets ui.dashboardTheme to 'light' used to leave the
    // dashboard on the old theme until reload.
    function replaceState(next) {
      state = next;
      applyDashboardTheme();
      return saveNow();
    }

    function isLayoutPresetMatches(preset) {
      if (!preset || !preset.overrides || !preset.overrides.layout) return false;
      var lo = preset.overrides.layout;
      var cur = (state && state.layout) || {};
      return Object.keys(lo).every(function (k) {
        return cur[k] === lo[k];
      });
    }

    function updateLayoutPreview() {
      if (!layoutPresetsApi || !mainEl) return;
      var summaryEl = mainEl.querySelector('.layout-preview-summary');
      var gridEl = mainEl.querySelector('.layout-preview-grid');
      if (!summaryEl || !gridEl) return;
      var summary = layoutPresetsApi.layoutPreviewSummary(state);
      var thumbSize = (state && state.layout && Number(state.layout.thumbnailSize)) || 0;
      summaryEl.textContent =
        summary.columns +
        ' columns · ' +
        summary.gap +
        ' px gap · ' +
        (thumbSize > 0 ? thumbSize + ' px thumb · ' : '') +
        (summary.maxWidth > 0 ? 'max-width ' + summary.maxWidth + ' px' : 'full width') +
        '.';
      var widthCap = summary.maxWidth > 0 ? Math.max(58, Math.min(96, Math.round((summary.maxWidth / 2000) * 100))) : 100;
      gridEl.setAttribute(
        'style',
        'display: flex; gap: ' +
          Math.min(summary.gap, 24) +
          'px; margin: 10px auto 0; max-width: ' +
          widthCap +
          '%;'
      );
      gridEl.textContent = '';
      for (var i = 0; i < summary.columns; i++) {
        var cell = el(doc, 'div', { class: 'layout-preview-cell' });
        cell.appendChild(el(doc, 'div', { class: 'layout-preview-thumb' }));
        cell.appendChild(el(doc, 'span', { class: 'layout-preview-title' }));
        cell.appendChild(el(doc, 'span', { class: 'layout-preview-sub' }));
        gridEl.appendChild(cell);
      }
      if (layoutPresetsApi.LAYOUT_PRESETS) {
        layoutPresetsApi.LAYOUT_PRESETS.forEach(function (preset) {
          var card = mainEl.querySelector('.preset-card[data-preset-id="' + preset.id + '"]');
          if (!card) return;
          var active = isLayoutPresetMatches(preset);
          card.classList.toggle('is-active', active);
          var badge = card.querySelector('.preset-active-pill');
          if (badge) badge.hidden = !active;
        });
      }
    }

    function updateSidebarPreview() {
      if (!mainEl) return;
      var summaryEl = mainEl.querySelector('.sidebar-preview-summary');
      var stageEl = mainEl.querySelector('.sidebar-preview-stage');
      if (!summaryEl || !stageEl) return;
      var sb = getPath(state, 'sidebar') || {};
      var rec = getPath(state, 'recommendations') || {};
      var hideSidebar = !!rec.hideSidebar;
      var customWidth = Number(sb.customWidth) || 0;
      var sbWidthLabel = customWidth > 0 ? customWidth + ' px' : 'YouTube default';
      var scrollLabel = sb.independentScroll ? 'Independent scroll' : 'Normal scroll';
      var scrollbarLabel = sb.scrollbarVisible
        ? 'Scrollbar ' + (Number(sb.scrollbarWidth) || 8) + ' px'
        : 'Scrollbar hidden';
      summaryEl.textContent = hideSidebar
        ? 'Recommendations sidebar is hidden on watch pages.'
        : sbWidthLabel +
          ' · ' +
          scrollLabel +
          ' · ' +
          scrollbarLabel +
          ' · Density: ' +
          (rec.density || 'default');

      stageEl.textContent = '';
      var playerBox = el(doc, 'div', { class: 'sidebar-preview-player' });
      var offset = Math.min(Math.max(Number(sb.playerOffset) || 0, 0), 40);
      if (sb.independentScroll && offset > 0) {
        playerBox.style.marginTop = Math.round(offset / 2) + 'px';
      }
      playerBox.appendChild(el(doc, 'span', { class: 'sidebar-preview-tag', text: 'Video player' }));
      stageEl.appendChild(playerBox);

      var colWidthPx = customWidth > 0 ? Math.max(120, Math.min(240, Math.round(customWidth * 0.42))) : 168;
      var colBox = el(doc, 'div', {
        class: 'sidebar-preview-col' + (hideSidebar ? ' is-hidden' : ''),
      });
      colBox.style.width = colWidthPx + 'px';
      if (hideSidebar) {
        colBox.appendChild(el(doc, 'span', { class: 'sidebar-preview-tag', text: 'Sidebar hidden' }));
        stageEl.appendChild(colBox);
        return;
      }

      var list = el(doc, 'div', {
        class: 'sidebar-preview-list is-density-' + (rec.density || 'default'),
      });
      var cardWidth = Number(rec.cardSize) || 0;
      var thumbPx = cardWidth > 0 ? Math.max(36, Math.min(80, Math.round(cardWidth * 0.3))) : 56;
      var showMeta = rec.showMetadata !== false;
      for (var i = 0; i < 4; i++) {
        var item = el(doc, 'div', { class: 'sidebar-preview-item' });
        var thumb = el(doc, 'div', { class: 'sidebar-preview-thumb' });
        thumb.style.width = thumbPx + 'px';
        item.appendChild(thumb);
        if (showMeta) {
          var meta = el(doc, 'div', { class: 'sidebar-preview-meta' });
          meta.appendChild(el(doc, 'span', { class: 'sidebar-preview-line is-title' }));
          meta.appendChild(el(doc, 'span', { class: 'sidebar-preview-line is-sub' }));
          item.appendChild(meta);
        }
        list.appendChild(item);
      }
      colBox.appendChild(list);

      if (sb.scrollbarVisible) {
        var barW = Math.max(3, Math.min(12, Number(sb.scrollbarWidth) || 8));
        var track = el(doc, 'div', { class: 'sidebar-preview-scrollbar' });
        track.style.width = barW + 'px';
        var thumbBar = el(doc, 'div', {
          class:
            'sidebar-preview-scrollthumb' + (sb.independentScroll ? ' is-active' : ''),
        });
        track.appendChild(thumbBar);
        colBox.appendChild(track);
      }
      stageEl.appendChild(colBox);
    }

    function renderSidebarPreviewTools(sectionEl) {
      var box = el(doc, 'div', { class: 'tool-box sidebar-preview-box' });
      box.appendChild(el(doc, 'h3', { text: 'Watch page preview' }));
      box.appendChild(
        el(doc, 'p', {
          class: 'sidebar-preview-summary',
          text: '',
        })
      );
      box.appendChild(el(doc, 'div', { class: 'sidebar-preview-stage' }));
      sectionEl.appendChild(box);
      updateSidebarPreview();
    }

    function updateThemeContrastPreview() {
      if (!apis.themes || !mainEl) return;
      var activeTheme = String(getPath(state, 'appearance.theme') || 'default');
      mainEl.querySelectorAll('.theme-preset-pill').forEach(function (pill) {
        pill.classList.toggle('is-active', pill.getAttribute('data-theme-name') === activeTheme);
      });
      var card = mainEl.querySelector('.theme-contrast-card');
      if (!card) return;
      var customColors = getPath(state, 'appearance.colors') || {};
      var vars = apis.themes.resolveThemeVars(activeTheme, customColors);
      var hasTokens = vars && vars.bg && vars.text;
      var surface = card.querySelector('.theme-preview-surface');
      var sampleTitle = card.querySelector('.theme-preview-title');
      var sampleSub = card.querySelector('.theme-preview-sub');
      var sampleAccent = card.querySelector('.theme-preview-accent');
      var ratioBadge = card.querySelector('.theme-contrast-ratio');
      if (!hasTokens) {
        if (surface) surface.removeAttribute('style');
        if (sampleTitle) sampleTitle.removeAttribute('style');
        if (sampleSub) sampleSub.removeAttribute('style');
        if (sampleAccent) sampleAccent.removeAttribute('style');
        if (ratioBadge) {
          ratioBadge.textContent = "YouTube's native theme";
          ratioBadge.className = 'theme-contrast-ratio';
        }
        return;
      }
      if (surface) {
        surface.setAttribute(
          'style',
          'background: ' +
            vars.bg +
            '; border-color: ' +
            (vars.border || '#2a2a2a') +
            ';'
        );
      }
      if (sampleTitle) sampleTitle.setAttribute('style', 'color: ' + vars.text + ';');
      if (sampleSub && vars.textSecondary) {
        sampleSub.setAttribute('style', 'color: ' + vars.textSecondary + ';');
      }
      if (sampleAccent && vars.accent) {
        sampleAccent.setAttribute('style', 'background: ' + vars.accent + ';');
      }
      if (ratioBadge) {
        var ratio = apis.themes.contrastRatio(vars.text, vars.bg);
        var ok = apis.themes.textContrastOk(vars);
        if (ratio === null) {
          ratioBadge.textContent = '';
          ratioBadge.className = 'theme-contrast-ratio';
        } else if (ok) {
          ratioBadge.textContent = 'Text contrast ' + ratio.toFixed(1) + ':1 · AA Pass';
          ratioBadge.className = 'theme-contrast-ratio is-pass';
        } else {
          ratioBadge.textContent =
            'Low contrast ' + ratio.toFixed(1) + ':1 (< 4.5:1) — hard to read';
          ratioBadge.className = 'theme-contrast-ratio is-warn';
        }
      }
    }

    function renderThemeVisualPanel(sectionEl) {
      if (!apis.themes) return;
      var box = el(doc, 'div', { class: 'tool-box theme-visual-box' });
      var pillsWrap = el(doc, 'div', { class: 'theme-preset-pills' });
      var names = apis.themes.THEME_NAMES || [];
      names.forEach(function (name) {
        var vars = apis.themes.resolveThemeVars(name, name === 'custom' ? getPath(state, 'appearance.colors') : {});
        var label =
          name === 'amoled'
            ? 'AMOLED'
            : name.charAt(0).toUpperCase() + name.slice(1);
        var pill = el(doc, 'button', {
          type: 'button',
          class: 'theme-preset-pill',
          'data-theme-name': name,
        });
        var dots = el(doc, 'span', { class: 'theme-pill-dots' });
        var palette =
          vars && vars.bg
            ? [vars.bg, vars.surface || vars.bg, vars.accent || '#ff0033']
            : ['#202020', '#484848', '#ff0033'];
        palette.forEach(function (hex) {
          var dot = el(doc, 'span', { class: 'theme-pill-dot' });
          dot.setAttribute('style', 'background: ' + hex + ';');
          dots.appendChild(dot);
        });
        pill.appendChild(dots);
        pill.appendChild(el(doc, 'span', { class: 'theme-pill-name', text: label }));
        pill.addEventListener('click', function () {
          if (inputsByKey['appearance.theme']) {
            inputsByKey['appearance.theme'].set(name);
          }
          setValue('appearance.theme', name, 0);
          refreshValues();
        });
        pillsWrap.appendChild(pill);
      });
      box.appendChild(pillsWrap);

      var card = el(doc, 'div', { class: 'theme-contrast-card' });
      var surface = el(doc, 'div', { class: 'theme-preview-surface' });
      surface.appendChild(el(doc, 'span', { class: 'theme-preview-accent' }));
      var copy = el(doc, 'div', { class: 'theme-preview-copy' });
      copy.appendChild(
        el(doc, 'strong', { class: 'theme-preview-title', text: 'Sample video title' })
      );
      copy.appendChild(
        el(doc, 'span', {
          class: 'theme-preview-sub',
          text: 'Channel name · 12K views',
        })
      );
      surface.appendChild(copy);
      card.appendChild(surface);
      card.appendChild(el(doc, 'span', { class: 'theme-contrast-ratio', text: '' }));
      box.appendChild(card);

      sectionEl.appendChild(box);
      updateThemeContrastPreview();
    }

    function updateColorClearAllBtn() {
      if (!mainEl) return;
      var btn = mainEl.querySelector('.colors-clear-all-btn');
      if (!btn) return;
      var colors = getPath(state, 'appearance.colors') || {};
      var count = Object.keys(colors).filter(function (k) {
        return typeof colors[k] === 'string' && colors[k] !== '';
      }).length;
      btn.disabled = count === 0;
      btn.textContent = count > 0 ? 'Clear all (' + count + ')' : 'Clear all';
    }

    function updateProductivitySummary() {
      if (currentSection !== 'productivity' || !mainEl) return;
      var hiddenCount = FOCUS_HIDE_KEYS.filter(function (k) {
        return !!getPath(state, k);
      }).length;
      var countEl = mainEl.querySelector('.focus-hidden-count');
      if (countEl) countEl.textContent = hiddenCount + ' of ' + FOCUS_HIDE_KEYS.length + ' hidden';
      var hideAllBtn = mainEl.querySelector('.focus-hide-all-btn');
      if (hideAllBtn) hideAllBtn.disabled = hiddenCount === FOCUS_HIDE_KEYS.length;
      var showAllBtn = mainEl.querySelector('.focus-show-all-btn');
      if (showAllBtn) showAllBtn.disabled = hiddenCount === 0;
    }

    function updateControlModifiedState(key) {
      if (!mainEl) return;
      var row = mainEl.querySelector('[data-control-key="' + key + '"]');
      if (!row) return;
      var modified = isControlModified(getPath(state, key), getDefault(key));
      row.classList.toggle('is-modified', modified);
      var badge = row.querySelector('.control-modified-badge');
      if (badge) badge.hidden = !modified;
    }

    function updateModulesSummary() {
      if (currentSection !== 'general' || !mainEl) return;
      var general = sectionById('general');
      if (!general) return;
      var moduleControls = (general.controls || []).filter(function (c) {
        return c.key.indexOf('modules.') === 0;
      });
      var active = moduleControls.filter(function (c) {
        return !!getPath(state, c.key);
      }).length;
      var countEl = mainEl.querySelector('.modules-active-count');
      if (countEl) countEl.textContent = active + ' of ' + moduleControls.length + ' active';
      var pausedEl = mainEl.querySelector('.modules-paused-pill');
      var gridEl = mainEl.querySelector('.control-grid-modules');
      var isMasterOn = !!getPath(state, 'enabled');
      if (pausedEl) pausedEl.hidden = isMasterOn;
      if (gridEl) gridEl.classList.toggle('is-master-paused', !isMasterOn);
    }

    function updateControlDependencies() {
      if (!mainEl) return;
      mainEl.querySelectorAll('[data-control-key]').forEach(function (row) {
        var key = row.getAttribute('data-control-key');
        var reason = getControlInactiveReason(key, state);
        row.classList.toggle('is-inactive-dep', !!reason);
        var depBadge = row.querySelector('.control-dep-badge');
        if (depBadge) {
          depBadge.textContent = reason;
          depBadge.hidden = !reason;
        }
        var hint = getControlHint(key, state);
        var hintBadge = row.querySelector('.control-hint-badge');
        if (hintBadge) {
          hintBadge.textContent = hint;
          hintBadge.hidden = !hint;
        }
      });
    }

    function setValue(key, value, delay) {
      setPath(state, key, value);
      if (key === 'ui.dashboardTheme') applyDashboardTheme();
      if (key === 'playback.speedPresets' && inputsByKey['playback.defaultSpeed']) {
        inputsByKey['playback.defaultSpeed'].set(getPath(state, 'playback.defaultSpeed'));
      }
      if (currentSection === 'layout' && key.indexOf('layout.') === 0) {
        updateLayoutPreview();
      }
      if (
        currentSection === 'sidebar' &&
        (key.indexOf('sidebar.') === 0 || key.indexOf('recommendations.') === 0)
      ) {
        updateSidebarPreview();
      }
      if (currentSection === 'appearance' && key.indexOf('appearance.') === 0) {
        updateThemeContrastPreview();
        updateColorClearAllBtn();
      }
      if (key === 'enabled' || key.indexOf('modules.') === 0) {
        updateModulesSummary();
      }
      if (
        currentSection === 'productivity' &&
        (key.indexOf('productivity.') === 0 || key === 'keyboard.shortcuts.toggleFocus')
      ) {
        updateProductivitySummary();
      }
      updateControlModifiedState(key);
      updateControlPresetChips(key);
      updateControlDependencies();
      saveSoon(delay);
    }

    function updateControlPresetChips(key) {
      if (!mainEl) return;
      var row = mainEl.querySelector('[data-control-key="' + key + '"]');
      if (!row) return;
      var raw = getPath(state, key);
      var cur = raw === undefined || raw === null ? '' : String(raw).trim();
      row.querySelectorAll('.control-preset-chip').forEach(function (chip) {
        chip.classList.toggle('is-active', chip.getAttribute('data-preset-value') === cur);
      });
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
          updateControlModifiedState(control.key);
          updateControlPresetChips(control.key);
        });
      });
      updateModulesSummary();
      updateProductivitySummary();
      updateSidebarPreview();
      updateThemeContrastPreview();
      updateColorClearAllBtn();
      updateControlDependencies();
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
      var wrap = el(doc, 'label', { class: 'toggle-switch' });
      var input = el(doc, 'input', {
        type: 'checkbox',
        class: 'control-input toggle-input',
        'aria-label': control.label,
      });
      var track = el(doc, 'span', { class: 'toggle-track', 'aria-hidden': 'true' }, [
        el(doc, 'span', { class: 'toggle-thumb' }),
      ]);
      wrap.appendChild(input);
      wrap.appendChild(track);
      return {
        node: wrap,
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
          if (control.source === 'speedPresets') {
            // The option list is built from the current
            // presets: editing the preset list must refresh
            // it, or the default-speed select keeps showing
            // speeds that no longer exist.
            input.textContent = '';
            resolveSelectOptions(control.source, state, apis).forEach(function (opt) {
              input.appendChild(el(doc, 'option', { value: String(opt.value), text: opt.label }));
            });
          }
          var v = value;
          if (control.source === 'themes') {
            // An unknown stored theme (hand-edited import)
            // used to leave the select blank: fall back to
            // 'default' (appearance rendering already falls
            // back the same way).
            var names = (apis.themes && apis.themes.THEME_NAMES) || ['default'];
            if (names.indexOf(String(value)) === -1) v = 'default';
          }
          input.value = settingToSelect(control.source, v);
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
            if (control.key === 'playback.defaultSpeed' && inputsByKey['playback.speedPresets']) {
              inputsByKey['playback.speedPresets'].set(getPath(state, 'playback.speedPresets'));
            }
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
      var out = null;
      var updateOut = function () {
        if (out) out.textContent = input.value + (control.unit ? ' ' + control.unit : '');
      };
      wrap.appendChild(input);
      if (isRange) {
        out = el(doc, 'output', { class: 'control-value' });
        wrap.appendChild(out);
      } else if (control.unit) {
        wrap.appendChild(el(doc, 'span', { class: 'control-number-unit', text: control.unit }));
      }
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
        bind: function (row) {
          input.addEventListener('change', function () {
            var value = input.value;
            if (control.cssProperty) {
              // Probe-validate free-text CSS against a dummy
              // element: the browser's CSSOM rejects invalid
              // values by leaving the property empty. An
              // invalid value is warned about and reverted
              // instead of being stored (the content side
              // already drops it, but the dashboard used to
              // save it silently).
              var probe = doc.createElement('div');
              probe.style[control.cssProperty] = value;
              if (value.trim() !== '' && probe.style[control.cssProperty] === '') {
                showWarning(row, 'Not a valid CSS ' + control.cssProperty + ' value.');
                input.value = getPath(state, control.key) || '';
                return;
              }
              showWarning(row, '');
            }
            setValue(control.key, value, 0);
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
      var fallbackHex = function () {
        if (control.key.indexOf('appearance.colors.') === 0 && apis.themes) {
          var cname = control.key.slice('appearance.colors.'.length);
          var tok = apis.themes.CUSTOM_COLOR_KEYS && apis.themes.CUSTOM_COLOR_KEYS[cname];
          if (tok) {
            var themeName = getPath(state, 'appearance.theme');
            var resolved = apis.themes.resolveThemeVars(themeName, {});
            if (resolved[tok]) return resolved[tok];
            if (apis.themes.THEMES && apis.themes.THEMES.dark && apis.themes.THEMES.dark[tok]) {
              return apis.themes.THEMES.dark[tok];
            }
          }
        }
        return '#000000';
      };
      var syncEmptyUi = function (hex) {
        var fb = fallbackHex();
        picker.value = hex || fb;
        text.placeholder = fb !== '#000000' ? 'Preset (' + fb + ')' : '#rrggbb or empty';
      };
      var apply = function (hex) {
        setValue(control.key, hex, 0);
      };
      return {
        node: wrap,
        set: function (value) {
          var hex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '';
          text.value = hex;
          syncEmptyUi(hex);
        },
        bind: function (row) {
          picker.addEventListener('input', function () {
            showWarning(row, '');
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
            syncEmptyUi(v);
            apply(v);
          });
          clear.addEventListener('click', function () {
            showWarning(row, '');
            apply('');
            text.value = '';
            syncEmptyUi('');
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
      var addRow = el(doc, 'div', { class: 'tool-inline-form' });
      addRow.appendChild(addInput);
      addRow.appendChild(addBtn);
      wrap.appendChild(listEl);
      wrap.appendChild(addRow);
      var rowRef = null;
      var render = function (values) {
        listEl.textContent = '';
        var list = values || [];
        var defSpeed = Number(getPath(state, 'playback.defaultSpeed'));
        list.forEach(function (v) {
          var isDefault = v === defSpeed;
          var chip = el(doc, 'span', {
            class: 'speed-chip' + (isDefault ? ' is-default' : ''),
          });
          var selectBtn = el(doc, 'button', {
            type: 'button',
            class: 'speed-chip-select',
            text: v + 'x',
            title: isDefault ? 'Current default speed' : 'Set ' + v + 'x as default speed',
          });
          selectBtn.addEventListener('click', function () {
            if (rowRef) showWarning(rowRef, '');
            setValue('playback.defaultSpeed', v, 0);
            if (inputsByKey['playback.defaultSpeed']) {
              inputsByKey['playback.defaultSpeed'].set(v);
            }
            render(getPath(state, control.key) || list);
          });
          var x = el(doc, 'button', {
            type: 'button',
            class: 'speed-remove',
            text: '×',
            'aria-label': 'Remove ' + v + 'x speed',
          });
          x.disabled = list.length <= 1;
          x.addEventListener('click', function () {
            var currentList = getPath(state, control.key) || [];
            if (currentList.length <= 1) {
              if (rowRef) showWarning(rowRef, 'Keep at least one speed preset.');
              return;
            }
            if (rowRef) showWarning(rowRef, '');
            var next = currentList.filter(function (n) {
              return n !== v;
            });
            setValue(control.key, next, 0);
            render(next);
          });
          chip.appendChild(selectBtn);
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
          rowRef = row;
          var addSpeed = function () {
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
          };
          addBtn.addEventListener('click', addSpeed);
          addInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
              event.preventDefault();
              addSpeed();
            }
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
          input.addEventListener('blur', function () {
            // Focus without capturing (keyboard tab-through)
            // blanked the field with no restore: put the
            // stored shortcut back.
            if (!capturing) input.value = getPath(state, control.key) || '';
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
      var isToggle = control.type === 'toggle';
      var isStacked = control.type === 'textarea' || control.type === 'speedList';
      var isInline = !isToggle && !isStacked;
      var classes = ['control-row'];
      if (isToggle) classes.push('control-row-toggle');
      if (isInline) classes.push('control-row-inline');
      if (control.key === 'enabled') classes.push('control-row-master');
      var row = el(doc, 'div', {
        class: classes.join(' '),
        'data-control-key': control.key,
      });
      var resetBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-small control-reset',
        text: 'Reset',
        title: 'Restore default: ' + formatDefaultValue(getDefault(control.key), control),
      });
      resetBtn.addEventListener('click', function () {
        var def = defaultsApi.deepClone(getDefault(control.key));
        setValue(control.key, def, 0);
        var input = inputsByKey[control.key];
        if (input) input.set(def);
        if (control.key.indexOf('keyboard.shortcuts.') === 0) checkShortcutWarnings();
      });
      var input = makeInput(control);
      inputsByKey[control.key] = input;
      if (isToggle) {
        var head = el(doc, 'div', { class: 'control-head' });
        head.appendChild(el(doc, 'span', { class: 'control-label', text: control.label }));
        var toggleActions = el(doc, 'div', { class: 'control-actions' });
        toggleActions.appendChild(resetBtn);
        toggleActions.appendChild(input.node);
        head.appendChild(toggleActions);
        row.appendChild(head);
        if (control.description) {
          row.appendChild(el(doc, 'p', { class: 'control-desc', text: control.description }));
        }
      } else if (isInline) {
        var grid = el(doc, 'div', { class: 'control-row-grid' });
        var copy = el(doc, 'div', { class: 'control-copy' });
        copy.appendChild(el(doc, 'span', { class: 'control-label', text: control.label }));
        if (control.description) {
          copy.appendChild(el(doc, 'p', { class: 'control-desc', text: control.description }));
        }
        var inlineActions = el(doc, 'div', { class: 'control-actions' });
        inlineActions.appendChild(input.node);
        inlineActions.appendChild(resetBtn);
        grid.appendChild(copy);
        grid.appendChild(inlineActions);
        row.appendChild(grid);
      } else {
        var stackHead = el(doc, 'div', { class: 'control-head' });
        stackHead.appendChild(el(doc, 'span', { class: 'control-label', text: control.label }));
        stackHead.appendChild(resetBtn);
        row.appendChild(stackHead);
        if (control.description) {
          row.appendChild(el(doc, 'p', { class: 'control-desc', text: control.description }));
        }
        row.appendChild(input.node);
      }
      if (Array.isArray(control.presets) && control.presets.length > 0) {
        var presetBar = el(doc, 'div', { class: 'control-preset-bar' });
        presetBar.appendChild(el(doc, 'span', { class: 'control-preset-label', text: 'Quick pick:' }));
        var rawPresetVal = getPath(state, control.key);
        var curPresetVal =
          rawPresetVal === undefined || rawPresetVal === null ? '' : String(rawPresetVal).trim();
        control.presets.forEach(function (preset) {
          var presetStr = String(preset.value);
          var chip = el(doc, 'button', {
            type: 'button',
            class:
              'control-preset-chip' + (presetStr === curPresetVal ? ' is-active' : ''),
            text: preset.label,
            'data-preset-value': presetStr,
          });
          chip.addEventListener('click', function () {
            showWarning(row, '');
            if (input.set) input.set(preset.value);
            setValue(control.key, preset.value, 0);
          });
          presetBar.appendChild(chip);
        });
        row.appendChild(presetBar);
      }
      var foot = el(doc, 'div', { class: 'control-foot' });
      foot.appendChild(
        el(doc, 'span', {
          class: 'control-default',
          text: 'Default: ' + formatDefaultValue(getDefault(control.key), control),
        })
      );
      var modBadge = el(doc, 'span', {
        class: 'control-modified-badge',
        text: 'Modified',
      });
      modBadge.hidden = !isControlModified(getPath(state, control.key), getDefault(control.key));
      foot.appendChild(modBadge);
      var depBadge = el(doc, 'span', {
        class: 'control-dep-badge',
        text: '',
      });
      depBadge.hidden = true;
      foot.appendChild(depBadge);
      var hintBadge = el(doc, 'span', {
        class: 'control-hint-badge',
        text: '',
      });
      hintBadge.hidden = true;
      foot.appendChild(hintBadge);
      var targetSection = MODULE_SECTION_MAP[control.key];
      if (targetSection) {
        var jumpBtn = el(doc, 'button', {
          type: 'button',
          class: 'control-jump-btn',
          text: 'Configure ' + targetSection.label + ' →',
        });
        jumpBtn.addEventListener('click', function () {
          renderSection(targetSection.id);
        });
        foot.appendChild(jumpBtn);
      }
      row.appendChild(foot);
      row.appendChild(el(doc, 'p', { class: 'control-warning', text: '' }));
      input.bind(row);
      input.set(getPath(state, control.key));
      row.classList.toggle(
        'is-modified',
        isControlModified(getPath(state, control.key), getDefault(control.key))
      );
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
        // text.length counts UTF-16 units, not bytes: a file
        // of 200k emoji is ~400k bytes. Measure real bytes.
        var byteLength = utf8ByteLength(text);
        if (byteLength > maxBytes) {
          importMsg.textContent =
            'Import is too large (' + byteLength + ' bytes, max ' + maxBytes + ' bytes).';
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
        replaceState(defaultsApi.deepClone(pendingImport)).then(function (saved) {
          renderSection(currentSection);
          if (saved) {
            importMsg.textContent = 'Import applied.';
            importMsg.style.display = 'block';
          }
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
        replaceState(defaultsApi.cloneDefaults()).then(function () {
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

    // Profiles (Phase 16, PL-16). Mirrors renderAdvancedTools:
    // one tool-box per group, built with el(), no innerHTML.
    // A preset changes only the settings it names; a profile
    // restores its snapshot exactly (see shared/profiles.js).
    function renderProfilesTools(sectionEl) {
      var msgEl = createToolNoticeEl(profilesNotice);
      if (profilesNotice) profilesNotice = '';
      sectionEl.appendChild(msgEl);
      if (!profilesApi) {
        sectionEl.appendChild(
          el(doc, 'p', { text: 'Profiles are unavailable — the profiles module did not load.' })
        );
        return;
      }

      // Built-in presets.
      var presetBox = el(doc, 'div', { class: 'tool-box' });
      presetBox.appendChild(el(doc, 'h3', { text: 'Built-in presets' }));
      presetBox.appendChild(
        el(doc, 'p', {
          text: 'One click applies a whole setup. A preset changes only the settings it names — everything else you set stays as it is.',
        })
      );
      var presetGrid = el(doc, 'div', { class: 'preset-grid' });
      profilesApi.BUILTIN_PRESETS.forEach(function (preset) {
        var card = el(doc, 'div', { class: 'preset-card' });
        card.appendChild(el(doc, 'strong', { class: 'preset-card-title', text: preset.name }));
        card.appendChild(el(doc, 'p', { class: 'preset-card-desc', text: preset.description }));
        var applyBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn',
          text: 'Apply ' + preset.name,
        });
        applyBtn.addEventListener('click', function () {
          replaceState(profilesApi.applyPreset(state, preset.id, defaultsApi)).then(
            function (saved) {
              refreshValues();
              if (saved) profilesNotice = 'Applied preset "' + preset.name + '".';
              renderSection(currentSection);
            }
          );
        });
        var cardFoot = el(doc, 'div', { class: 'preset-card-foot' });
        cardFoot.appendChild(applyBtn);
        card.appendChild(cardFoot);
        presetGrid.appendChild(card);
      });
      presetBox.appendChild(presetGrid);
      sectionEl.appendChild(presetBox);

      // Save the current settings as a profile.
      var saveBox = el(doc, 'div', { class: 'tool-box' });
      saveBox.appendChild(el(doc, 'h3', { text: 'Save current settings as a profile' }));
      saveBox.appendChild(
        el(doc, 'p', {
          text:
            'Saves everything as it is right now — up to ' +
            profilesApi.MAX_PROFILES +
            ' profiles. Applying one later restores this exact setup.',
        })
      );
      var nameInput = el(doc, 'input', {
        type: 'text',
        class: 'control-input',
        placeholder: 'Profile name',
        maxlength: String(profilesApi.MAX_PROFILE_NAME_LENGTH),
      });
      nameInput.setAttribute('aria-label', 'Profile name');
      var saveBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-primary',
        text: 'Save profile',
      });
        saveBtn.addEventListener('click', function () {
          var result = profilesApi.createProfile(nameInput.value, state, profiles, defaultsApi);
          if (result.error) {
            msgEl.textContent = result.error;
            msgEl.style.display = 'block';
            return;
          }
          profiles = result.profiles;
          saveProfiles().then(function (saved) {
            if (saved) profilesNotice = 'Saved profile "' + nameInput.value.trim() + '".';
            renderSection(currentSection);
          });
        });
        var saveForm = el(doc, 'div', { class: 'tool-inline-form' });
        saveForm.appendChild(nameInput);
        saveForm.appendChild(saveBtn);
        bindEnterSubmit(nameInput, saveBtn);
        saveBox.appendChild(saveForm);
        sectionEl.appendChild(saveBox);

        // Saved profiles.
        var listBox = el(doc, 'div', { class: 'tool-box' });
        listBox.appendChild(
          el(doc, 'h3', {
            text: 'Your profiles (' + profiles.length + '/' + profilesApi.MAX_PROFILES + ')',
          })
        );
        if (profiles.length === 0) {
          listBox.appendChild(
            el(doc, 'p', { text: 'No saved profiles yet — save one above to restore it later.' })
          );
        }
        profiles.forEach(function (profile) {
          var row = el(doc, 'div', { class: 'profile-row' });
          row.appendChild(el(doc, 'strong', { text: profile.name }));
          var saved = profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString()
            : 'date unknown';
          row.appendChild(el(doc, 'p', { text: 'Saved ' + saved + '.' }));
          var applyBtn = el(doc, 'button', {
            type: 'button',
            class: 'btn btn-primary',
            text: 'Apply',
          });
          applyBtn.addEventListener('click', function () {
            replaceState(profilesApi.applyProfile(state, profile, defaultsApi)).then(
              function (applied) {
                refreshValues();
                if (applied) {
                  profilesNotice =
                    'Applied profile "' + profile.name + '" — your settings now match the snapshot.';
                }
                renderSection(currentSection);
              }
            );
          });
          var renameBtn = el(doc, 'button', { type: 'button', class: 'btn', text: 'Rename' });
          renameBtn.addEventListener('click', function () {
            row.textContent = '';
            var editInput = el(doc, 'input', {
              type: 'text',
              class: 'control-input',
              maxlength: String(profilesApi.MAX_PROFILE_NAME_LENGTH),
            });
            editInput.value = profile.name;
            editInput.setAttribute('aria-label', 'New profile name');
            var confirmBtn = el(doc, 'button', {
              type: 'button',
              class: 'btn btn-primary',
              text: 'Save name',
            });
            confirmBtn.addEventListener('click', function () {
              var result = profilesApi.renameProfile(
                profiles,
                profile.name,
                editInput.value,
                defaultsApi
              );
              if (result.error) {
                profilesNotice = result.error;
                renderSection(currentSection);
                return;
              }
              profiles = result.profiles;
              saveProfiles().then(function (ok) {
                if (ok) profilesNotice = 'Renamed profile to "' + editInput.value.trim() + '".';
                renderSection(currentSection);
              });
            });
            var cancelBtn = el(doc, 'button', { type: 'button', class: 'btn', text: 'Cancel' });
            cancelBtn.addEventListener('click', function () {
              renderSection(currentSection);
            });
            var renameForm = el(doc, 'div', { class: 'tool-inline-form' });
            renameForm.appendChild(editInput);
            renameForm.appendChild(confirmBtn);
            renameForm.appendChild(cancelBtn);
            bindEnterSubmit(editInput, confirmBtn);
            row.appendChild(renameForm);
          });
          var deleteBtn = el(doc, 'button', {
            type: 'button',
            class: 'btn btn-danger',
            text: 'Delete',
          });
          deleteBtn.addEventListener('click', function () {
            if (!window.confirm('Delete profile "' + profile.name + '"?')) return;
            profiles = profilesApi.deleteProfile(profiles, profile.name, defaultsApi);
            saveProfiles().then(function (ok) {
              if (ok) profilesNotice = 'Deleted profile "' + profile.name + '".';
              renderSection(currentSection);
            });
          });
          var actions = el(doc, 'div', { class: 'tool-actions' });
          actions.appendChild(applyBtn);
          actions.appendChild(renameBtn);
          actions.appendChild(deleteBtn);
          row.appendChild(actions);
          listBox.appendChild(row);
        });
      sectionEl.appendChild(listBox);
    }

    // CSS templates (Phase 20, PL-20). Mirrors
    // renderProfilesTools: one tool-box, built with el(),
    // no innerHTML. A template appends its CSS to the
    // Custom CSS box below and turns custom CSS on;
    // applying twice is a no-op — the engine checks the
    // marker comment (see shared/cssTemplates.js).
    // Removal is manual: delete the template's block
    // from the Custom CSS box.
    function renderCssTemplateTools(sectionEl) {
      var msgEl = createToolNoticeEl(templatesNotice);
      if (templatesNotice) templatesNotice = '';
      sectionEl.appendChild(msgEl);
      if (!cssTemplatesApi) {
        sectionEl.appendChild(
          el(doc, 'p', {
            text: 'CSS templates are unavailable — the templates module did not load.',
          })
        );
        return;
      }
      var box = el(doc, 'div', { class: 'tool-box' });
      box.appendChild(el(doc, 'h3', { text: 'CSS templates' }));
      box.appendChild(
        el(doc, 'p', {
          text: 'Ready-made CSS snippets. Applying one adds it to the Custom CSS box below and turns custom CSS on. Applying the same template twice does nothing — to remove one, delete its block from the Custom CSS box.',
        })
      );
      var currentCss = getPath(state, 'appearance.customCSS') || '';
      var templateGrid = el(doc, 'div', { class: 'preset-grid' });
      cssTemplatesApi.listCssTemplates().forEach(function (template) {
        var card = el(doc, 'div', { class: 'preset-card' });
        card.appendChild(el(doc, 'strong', { class: 'preset-card-title', text: template.name }));
        card.appendChild(el(doc, 'p', { class: 'preset-card-desc', text: template.description }));
        var applied = cssTemplatesApi.isCssTemplateApplied(currentCss, template.id);
        var applyBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn',
          text: applied ? 'Applied' : 'Apply',
        });
        if (applied) applyBtn.disabled = true;
        applyBtn.addEventListener('click', function () {
          var result = cssTemplatesApi.applyCssTemplate(
            getPath(state, 'appearance.customCSS') || '',
            template.id
          );
          if (!result.applied) {
            templatesNotice = 'Template "' + template.name + '" is already applied.';
            renderSection(currentSection);
            return;
          }
          setValue('appearance.customCSS', result.css);
          setValue('appearance.customCSSEnabled', true);
          saveNow().then(function (saved) {
            refreshValues();
            if (saved) {
              templatesNotice = 'Applied template "' + template.name + '" — custom CSS is now on.';
            }
            renderSection(currentSection);
          });
        });
        var cardFoot = el(doc, 'div', { class: 'preset-card-foot' });
        cardFoot.appendChild(applyBtn);
        card.appendChild(cardFoot);
        templateGrid.appendChild(card);
      });
      box.appendChild(templateGrid);
      sectionEl.appendChild(box);
    }

    // Saved themes (Phase 21, PL-21). Mirrors
    // renderProfilesTools: tool-boxes built with el(),
    // no innerHTML. A saved theme is theme-only — base
    // preset + custom colours — so applying one writes
    // appearance.theme + appearance.colors and nothing
    // else (see shared/savedThemes.js). Export downloads
    // the theme as JSON; import validates first and only
    // adds it when you confirm (mirroring the Advanced
    // import flow).
    function renderSavedThemeTools(sectionEl) {
      var msgEl = createToolNoticeEl(savedThemesNotice);
      if (savedThemesNotice) savedThemesNotice = '';
      sectionEl.appendChild(msgEl);
      if (!savedThemesApi) {
        sectionEl.appendChild(
          el(doc, 'p', {
            text: 'Saved themes are unavailable — the saved-themes module did not load.',
          })
        );
        return;
      }
      var themesApi = apis.themes;

      // Save the current theme.
      var saveBox = el(doc, 'div', { class: 'tool-box' });
      saveBox.appendChild(el(doc, 'h3', { text: 'Save current theme' }));
      saveBox.appendChild(
        el(doc, 'p', {
          text:
            'Saves the theme preset and colours as they are right now — up to ' +
            savedThemesApi.MAX_SAVED_THEMES +
            ' saved themes. Applying one later changes only the theme and colours, nothing else.',
        })
      );
      var nameInput = el(doc, 'input', {
        type: 'text',
        class: 'control-input',
        placeholder: 'Theme name',
        maxlength: String(savedThemesApi.MAX_SAVED_THEME_NAME_LENGTH),
      });
      nameInput.setAttribute('aria-label', 'Theme name');
      var saveBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-primary',
        text: 'Save theme',
      });
      saveBtn.addEventListener('click', function () {
        var result = savedThemesApi.createSavedTheme(
          nameInput.value,
          state,
          savedThemes,
          defaultsApi,
          themesApi
        );
        if (result.error) {
          msgEl.textContent = result.error;
          msgEl.style.display = 'block';
          return;
        }
        savedThemes = result.themes;
        saveSavedThemes().then(function (saved) {
          if (saved) savedThemesNotice = 'Saved theme "' + nameInput.value.trim() + '".';
          renderSection(currentSection);
        });
      });
      var saveForm = el(doc, 'div', { class: 'tool-inline-form' });
      saveForm.appendChild(nameInput);
      saveForm.appendChild(saveBtn);
      bindEnterSubmit(nameInput, saveBtn);
      saveBox.appendChild(saveForm);
      sectionEl.appendChild(saveBox);

      // Saved themes.
      var listBox = el(doc, 'div', { class: 'tool-box' });
      listBox.appendChild(
        el(doc, 'h3', {
          text:
            'Your saved themes (' +
            savedThemes.length +
            '/' +
            savedThemesApi.MAX_SAVED_THEMES +
            ')',
        })
      );
      if (savedThemes.length === 0) {
        listBox.appendChild(
          el(doc, 'p', { text: 'No saved themes yet — save one above to apply it later.' })
        );
      }
      savedThemes.forEach(function (savedTheme) {
        var row = el(doc, 'div', { class: 'profile-row' });
        var titleRow = el(doc, 'div', { class: 'theme-title-row' });
        titleRow.appendChild(el(doc, 'strong', { text: savedTheme.name }));
        var swatchHexes = Object.values(savedTheme.colors || {}).slice(0, 4);
        if (swatchHexes.length > 0) {
          var swatches = el(doc, 'span', { class: 'theme-swatches', 'aria-hidden': 'true' });
          swatchHexes.forEach(function (hex) {
            var dot = el(doc, 'span', { class: 'theme-swatch-dot' });
            dot.style.backgroundColor = hex;
            swatches.appendChild(dot);
          });
          titleRow.appendChild(swatches);
        }
        row.appendChild(titleRow);
        var colourCount = Object.keys(savedTheme.colors || {}).length;
        row.appendChild(
          el(doc, 'p', {
            text:
              'Base: ' +
              savedTheme.theme +
              ' · ' +
              colourCount +
              ' custom colour' +
              (colourCount === 1 ? '' : 's') +
              '.',
          })
        );
        var applyBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn btn-primary',
          text: 'Apply',
        });
        applyBtn.addEventListener('click', function () {
          state = savedThemesApi.applySavedTheme(state, savedTheme, defaultsApi, themesApi);
          saveNow().then(function (saved) {
            refreshValues();
            if (saved) savedThemesNotice = 'Applied theme "' + savedTheme.name + '".';
            renderSection(currentSection);
          });
        });
        var exportBtn = el(doc, 'button', { type: 'button', class: 'btn', text: 'Export' });
        exportBtn.addEventListener('click', function () {
          var exported = savedThemesApi.exportSavedTheme(savedTheme);
          var blob = new Blob([exported.json], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = doc.createElement('a');
          a.href = url;
          a.download = exported.filename;
          a.click();
          URL.revokeObjectURL(url);
        });
        var renameBtn = el(doc, 'button', { type: 'button', class: 'btn', text: 'Rename' });
        renameBtn.addEventListener('click', function () {
          row.textContent = '';
          var editInput = el(doc, 'input', {
            type: 'text',
            class: 'control-input',
            maxlength: String(savedThemesApi.MAX_SAVED_THEME_NAME_LENGTH),
          });
          editInput.value = savedTheme.name;
          editInput.setAttribute('aria-label', 'New theme name');
          var confirmBtn = el(doc, 'button', {
            type: 'button',
            class: 'btn btn-primary',
            text: 'Save name',
          });
          confirmBtn.addEventListener('click', function () {
            var result = savedThemesApi.renameSavedTheme(
              savedThemes,
              savedTheme.name,
              editInput.value,
              themesApi
            );
            if (result.error) {
              savedThemesNotice = result.error;
              renderSection(currentSection);
              return;
            }
            savedThemes = result.themes;
            saveSavedThemes().then(function (ok) {
              if (ok) savedThemesNotice = 'Renamed theme to "' + editInput.value.trim() + '".';
              renderSection(currentSection);
            });
          });
          var cancelBtn = el(doc, 'button', { type: 'button', class: 'btn', text: 'Cancel' });
          cancelBtn.addEventListener('click', function () {
            renderSection(currentSection);
          });
          var renameForm = el(doc, 'div', { class: 'tool-inline-form' });
          renameForm.appendChild(editInput);
          renameForm.appendChild(confirmBtn);
          renameForm.appendChild(cancelBtn);
          bindEnterSubmit(editInput, confirmBtn);
          row.appendChild(renameForm);
        });
        var deleteBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn btn-danger',
          text: 'Delete',
        });
        deleteBtn.addEventListener('click', function () {
          if (!window.confirm('Delete theme "' + savedTheme.name + '"?')) return;
          savedThemes = savedThemesApi.deleteSavedTheme(savedThemes, savedTheme.name, themesApi);
          saveSavedThemes().then(function (ok) {
            if (ok) savedThemesNotice = 'Deleted theme "' + savedTheme.name + '".';
            renderSection(currentSection);
          });
        });
        var actions = el(doc, 'div', { class: 'tool-actions' });
        actions.appendChild(applyBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        row.appendChild(actions);
        listBox.appendChild(row);
      });
      sectionEl.appendChild(listBox);

      // Import a shared theme file.
      var importBox = el(doc, 'div', { class: 'tool-box' });
      importBox.appendChild(el(doc, 'h3', { text: 'Import a shared theme' }));
      importBox.appendChild(
        el(doc, 'p', {
          text: 'Import validates the file first and shows what it holds — the theme is only added when you confirm.',
        })
      );
      var importFile = el(doc, 'input', { type: 'file', accept: '.json,application/json' });
      var importText = el(doc, 'textarea', {
        class: 'control-input control-textarea',
        rows: '6',
        placeholder: '…or paste exported theme JSON here',
      });
      var importMsg = el(doc, 'p', { class: 'control-warning', text: '' });
      var previewEl = el(doc, 'div', { class: 'import-preview' });
      var addBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-primary',
        text: 'Add theme',
      });
      addBtn.style.display = 'none';
      var pendingTheme = null;
      var handleImportText = function (text) {
        importMsg.textContent = '';
        previewEl.textContent = '';
        addBtn.style.display = 'none';
        pendingTheme = null;
        var maxBytes = (constants && constants.MAX_IMPORT_BYTES) || 200000;
        // text.length counts UTF-16 units, not bytes: measure
        // real bytes (see the settings import above).
        var byteLength = utf8ByteLength(text);
        if (byteLength > maxBytes) {
          importMsg.textContent =
            'Import is too large (' + byteLength + ' bytes, max ' + maxBytes + ' bytes).';
          importMsg.style.display = 'block';
          return;
        }
        var result = savedThemesApi.parseSavedThemeImport(text, savedThemes, themesApi);
        if (result.error) {
          importMsg.textContent = 'Import rejected: ' + result.error;
          importMsg.style.display = 'block';
          return;
        }
        pendingTheme = result.theme;
        var count = Object.keys(result.theme.colors || {}).length;
        previewEl.appendChild(
          el(doc, 'p', {
            text:
              'Theme "' +
              result.theme.name +
              '" — base ' +
              result.theme.theme +
              ', ' +
              count +
              ' custom colour' +
              (count === 1 ? '' : 's') +
              '.',
          })
        );
        addBtn.style.display = 'inline-block';
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
      addBtn.addEventListener('click', function () {
        if (!pendingTheme) return;
        if (savedThemes.length >= savedThemesApi.MAX_SAVED_THEMES) {
          importMsg.textContent =
            'You already have ' +
            savedThemesApi.MAX_SAVED_THEMES +
            ' saved themes — delete one first.';
          importMsg.style.display = 'block';
          return;
        }
        savedThemes = savedThemes.concat([pendingTheme]);
        saveSavedThemes().then(function (saved) {
          if (saved) savedThemesNotice = 'Added theme "' + pendingTheme.name + '".';
          renderSection(currentSection);
        });
      });
      importBox.appendChild(el(doc, 'p', { text: 'Import from a file:' }));
      importBox.appendChild(importFile);
      importBox.appendChild(el(doc, 'p', { text: 'Import from pasted JSON:' }));
      importBox.appendChild(importText);
      importBox.appendChild(importBtn);
      importBox.appendChild(importMsg);
      importBox.appendChild(previewEl);
      importBox.appendChild(addBtn);
      sectionEl.appendChild(importBox);
    }

    function renderModuleStatusBanner(sectionEl, sectionId) {
      var deps = SECTION_MODULE_DEPS[sectionId];
      if (!deps || deps.length === 0) return;
      var masterOff = !getPath(state, 'enabled');
      var disabledDeps = deps.filter(function (dep) {
        return !getPath(state, dep.key);
      });
      if (!masterOff && disabledDeps.length === 0) return;
      var banner = el(doc, 'div', { class: 'module-status-banner', role: 'status' });
      var msg;
      var btnText;
      if (masterOff) {
        msg =
          'OneYT is turned off in General — these settings are saved but will not run on YouTube until enabled.';
        btnText = 'Turn on OneYT';
      } else {
        var names = disabledDeps
          .map(function (dep) {
            return dep.label;
          })
          .join(' & ');
        msg =
          names +
          (disabledDeps.length === 1 ? ' module is' : ' modules are') +
          ' disabled in General — turn ' +
          (disabledDeps.length === 1 ? 'it' : 'them') +
          ' on for changes here to apply.';
        btnText = 'Enable ' + names;
      }
      banner.appendChild(el(doc, 'span', { class: 'module-status-text', text: msg }));
      var enableBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-small',
        text: btnText,
      });
      enableBtn.addEventListener('click', function () {
        var next = defaultsApi.deepClone(state);
        if (masterOff) setPath(next, 'enabled', true);
        disabledDeps.forEach(function (dep) {
          setPath(next, dep.key, true);
        });
        replaceState(next).then(function () {
          renderSection(sectionId);
        });
      });
      banner.appendChild(enableBtn);
      sectionEl.appendChild(banner);
    }

    function renderSection(sectionId) {
      var section = sectionById(sectionId);
      if (!section) return;
      currentSection = sectionId;
      // Drop the old inputs: renderControlRow rebuilds them
      // below, and a stale entry would point refreshValues
      // at a detached node.
      inputsByKey = {};
      navEl.querySelectorAll('.nav-item').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-section') === sectionId);
      });
      mainEl.textContent = '';
      var header = el(doc, 'div', { class: 'section-header' });
      var headerCopy = el(doc, 'div', { class: 'section-header-copy' });
      headerCopy.appendChild(el(doc, 'h2', { text: section.title }));
      if (section.description) {
        headerCopy.appendChild(el(doc, 'p', { class: 'section-desc', text: section.description }));
      }
      header.appendChild(headerCopy);
      if ((section.controls || []).length > 0) {
        var resetSectionBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn btn-small section-reset-btn',
          text: 'Reset section',
        });
        resetSectionBtn.addEventListener('click', function () {
          var next = defaultsApi.deepClone(state);
          section.controls.forEach(function (control) {
            setPath(next, control.key, defaultsApi.deepClone(getDefault(control.key)));
          });
          replaceState(next).then(function () {
            renderSection(sectionId);
          });
        });
        header.appendChild(resetSectionBtn);
      }
      mainEl.appendChild(header);
      if (section.id !== 'general') renderModuleStatusBanner(mainEl, section.id);
      if (section.id === 'general') {
        var coreControls = (section.controls || []).filter(function (c) {
          return c.key.indexOf('modules.') !== 0;
        });
        var moduleControls = (section.controls || []).filter(function (c) {
          return c.key.indexOf('modules.') === 0;
        });
        coreControls.forEach(function (control) {
          mainEl.appendChild(renderControlRow(control));
        });
        if (moduleControls.length > 0) {
          var groupHead = el(doc, 'div', { class: 'section-group-head' });
          var groupTitle = el(doc, 'div', { class: 'section-group-title' });
          groupTitle.appendChild(el(doc, 'h3', { text: 'Feature modules' }));
          groupTitle.appendChild(el(doc, 'span', { class: 'modules-active-count', text: '' }));
          groupHead.appendChild(groupTitle);
          var pausedPill = el(doc, 'span', {
            class: 'modules-paused-pill',
            text: 'Master switch is off — modules paused on YouTube',
          });
          pausedPill.hidden = !!getPath(state, 'enabled');
          groupHead.appendChild(pausedPill);
          mainEl.appendChild(groupHead);
          var modulesGrid = el(doc, 'div', { class: 'control-grid-modules' });
          moduleControls.forEach(function (control) {
            modulesGrid.appendChild(renderControlRow(control));
          });
          mainEl.appendChild(modulesGrid);
          updateModulesSummary();
        }
      } else {
        var groups = SECTION_GROUPS[section.id] || {};
        var gridRun = null;
        var gridRunKind = '';
        var flushGridRun = function () {
          if (gridRun) {
            mainEl.appendChild(gridRun);
            gridRun = null;
            gridRunKind = '';
          }
        };
        (section.controls || []).forEach(function (control) {
          var groupTitleText = groups[control.key];
          if (groupTitleText) {
            flushGridRun();
            var subHead = el(doc, 'div', { class: 'section-group-head' });
            var subTitle = el(doc, 'div', { class: 'section-group-title' });
            subTitle.appendChild(el(doc, 'h3', { text: groupTitleText }));
            subHead.appendChild(subTitle);
            if (control.key === 'appearance.colors.accent') {
              var clearAllBtn = el(doc, 'button', {
                type: 'button',
                class: 'btn btn-small colors-clear-all-btn',
                text: 'Clear all',
              });
              clearAllBtn.addEventListener('click', function () {
                var next = defaultsApi.deepClone(state);
                setPath(next, 'appearance.colors', {});
                replaceState(next).then(function () {
                  refreshValues();
                });
              });
              subHead.appendChild(clearAllBtn);
            } else if (control.key === 'productivity.focusHideComments') {
              subTitle.appendChild(el(doc, 'span', { class: 'focus-hidden-count', text: '' }));
              var quickWrap = el(doc, 'div', { class: 'focus-quick-actions' });
              var setAllFocusHidden = function (val) {
                var next = defaultsApi.deepClone(state);
                FOCUS_HIDE_KEYS.forEach(function (k) {
                  setPath(next, k, val);
                });
                replaceState(next).then(function () {
                  refreshValues();
                });
              };
              var hideAllBtn = el(doc, 'button', {
                type: 'button',
                class: 'btn btn-small focus-hide-all-btn',
                text: 'Hide all',
              });
              hideAllBtn.addEventListener('click', function () {
                setAllFocusHidden(true);
              });
              var showAllBtn = el(doc, 'button', {
                type: 'button',
                class: 'btn btn-small focus-show-all-btn',
                text: 'Show all',
              });
              showAllBtn.addEventListener('click', function () {
                setAllFocusHidden(false);
              });
              quickWrap.appendChild(hideAllBtn);
              quickWrap.appendChild(showAllBtn);
              subHead.appendChild(quickWrap);
            }
            mainEl.appendChild(subHead);
          }
          var desiredGrid = '';
          if (control.type === 'toggle' && TOGGLE_GRID_KEYS[control.key]) {
            desiredGrid = 'control-grid-toggles';
          } else if (control.type === 'color' && control.key.indexOf('appearance.colors.') === 0) {
            desiredGrid = 'control-grid-colors';
          }
          if (desiredGrid) {
            if (!gridRun || gridRunKind !== desiredGrid) {
              flushGridRun();
              gridRun = el(doc, 'div', { class: desiredGrid });
              gridRunKind = desiredGrid;
            }
            gridRun.appendChild(renderControlRow(control));
          } else {
            flushGridRun();
            mainEl.appendChild(renderControlRow(control));
            if (section.id === 'appearance' && control.key === 'appearance.theme') {
              renderThemeVisualPanel(mainEl);
            }
          }
        });
        flushGridRun();
        updateColorClearAllBtn();
        updateProductivitySummary();
      }
      if (section.id === 'advanced') renderAdvancedTools(mainEl);
      if (section.id === 'profiles') renderProfilesTools(mainEl);
      if (section.id === 'health') renderHealthTools(mainEl);
      if (section.id === 'appearance') renderCssTemplateTools(mainEl);
      if (section.id === 'appearance') renderSavedThemeTools(mainEl);
      if (section.id === 'layout') renderLayoutEditorTools(mainEl);
      if (section.id === 'sidebar') renderSidebarPreviewTools(mainEl);
      updateControlDependencies();
      checkShortcutWarnings();
    }

    // Advanced layout editor (Phase 22, PL-22). Mirrors
    // renderProfilesTools: tool-boxes built with el(),
    // no innerHTML. One row per layout preset (apply
    // writes only the five layout numbers) plus a live
    // preview — a mini grid drawn from the current
    // values, so applying a preset visibly changes it.
    // The preview is a diagram of the numbers, not a
    // screenshot of YouTube.
    function renderLayoutEditorTools(sectionEl) {
      var msgEl = createToolNoticeEl(layoutEditorNotice);
      if (layoutEditorNotice) layoutEditorNotice = '';
      sectionEl.appendChild(msgEl);
      if (!layoutPresetsApi) {
        sectionEl.appendChild(
          el(doc, 'p', {
            text: 'Layout editor is unavailable — the layout-presets module did not load.',
          })
        );
        return;
      }
      var previewBox = el(doc, 'div', { class: 'tool-box' });
      previewBox.appendChild(el(doc, 'h3', { text: 'Preview' }));
      previewBox.appendChild(
        el(doc, 'p', {
          class: 'layout-preview-summary',
          text: '',
        })
      );
      previewBox.appendChild(el(doc, 'div', { class: 'layout-preview-grid' }));
      sectionEl.appendChild(previewBox);
      updateLayoutPreview();

      var presetBox = el(doc, 'div', { class: 'tool-box' });
      presetBox.appendChild(el(doc, 'h3', { text: 'Layout presets' }));
      presetBox.appendChild(
        el(doc, 'p', {
          text: 'One click sets the home grid numbers together. A preset changes only the layout numbers — hiding toggles, theme and everything else stay as they are. Fine-tune the numbers above afterwards.',
        })
      );
      var layoutGrid = el(doc, 'div', { class: 'preset-grid' });
      layoutPresetsApi.LAYOUT_PRESETS.forEach(function (preset) {
        var active = isLayoutPresetMatches(preset);
        var card = el(doc, 'div', {
          class: 'preset-card' + (active ? ' is-active' : ''),
          'data-preset-id': preset.id,
        });
        var head = el(doc, 'div', { class: 'preset-card-head' });
        head.appendChild(el(doc, 'strong', { class: 'preset-card-title', text: preset.name }));
        if (preset.overrides && preset.overrides.layout) {
          var lo = preset.overrides.layout;
          head.appendChild(
            el(doc, 'span', {
              class: 'preset-card-meta',
              text: lo.homeColumns + ' cols · ' + lo.cardSpacing + ' px',
            })
          );
        }
        card.appendChild(head);
        card.appendChild(el(doc, 'p', { class: 'preset-card-desc', text: preset.description }));
        var applyBtn = el(doc, 'button', {
          type: 'button',
          class: 'btn',
          text: 'Apply ' + preset.name,
        });
        applyBtn.addEventListener('click', function () {
          state = layoutPresetsApi.applyLayoutPreset(state, preset.id, defaultsApi);
          saveNow().then(function (saved) {
            refreshValues();
            if (saved) layoutEditorNotice = 'Applied layout preset "' + preset.name + '".';
            renderSection(currentSection);
          });
        });
        var cardFoot = el(doc, 'div', { class: 'preset-card-foot' });
        cardFoot.appendChild(applyBtn);
        var activePill = el(doc, 'span', { class: 'preset-active-pill', text: 'Active' });
        activePill.hidden = !active;
        cardFoot.appendChild(activePill);
        card.appendChild(cardFoot);
        layoutGrid.appendChild(card);
      });
      presetBox.appendChild(layoutGrid);
      sectionEl.appendChild(presetBox);
    }

    // Health (Phase 18, PL-18). Mirrors renderProfilesTools:
    // tool-boxes built with el(), no innerHTML. The overall
    // status comes from healthApi.summarizeHealth on the
    // stored record; the per-feature rows carry the same
    // three statuses the section description explains.
    // "Check again" re-reads storage (the health module
    // writes it from YouTube tabs — the dashboard never
    // queries YouTube itself).
    function renderHealthTools(sectionEl) {
      if (!healthApi) {
        sectionEl.appendChild(
          el(doc, 'p', { text: 'Health is unavailable — the health module did not load.' })
        );
        return;
      }
      var summary = healthApi.summarizeHealth(healthRecord);
      var counts = countHealthStatuses(summary.features);

      var statusMeta = {
        ok: {
          badge: 'Healthy',
          message: 'All checked features are working.',
        },
        broken: {
          badge: 'Attention needed',
          message:
            'Some features are not working — YouTube may have changed its layout. Nothing is disabled; the features below simply cannot find what they look for.',
        },
        unknown: {
          badge: 'Waiting for data',
          message: 'No health data yet — open YouTube, wait a few seconds, then come back here.',
        },
      };
      var bannerMeta = statusMeta[summary.status] || statusMeta.unknown;

      var statusBox = el(doc, 'div', {
        class: 'tool-box health-banner health-status-' + summary.status,
      });
      var bannerHead = el(doc, 'div', { class: 'health-banner-head' });
      var bannerTitleGroup = el(doc, 'div', { class: 'health-banner-title' });
      bannerTitleGroup.appendChild(
        el(doc, 'span', {
          class: 'health-badge health-badge--' + (summary.status === 'ok' ? 'working' : summary.status === 'broken' ? 'broken' : 'unchecked'),
          text: bannerMeta.badge,
        })
      );
      bannerTitleGroup.appendChild(el(doc, 'h3', { text: 'Overview' }));
      bannerHead.appendChild(bannerTitleGroup);

      var refreshBtn = el(doc, 'button', {
        type: 'button',
        class: 'btn btn-small',
        text: 'Check again',
      });
      refreshBtn.addEventListener('click', function () {
        refreshHealth();
      });
      bannerHead.appendChild(refreshBtn);
      statusBox.appendChild(bannerHead);
      statusBox.appendChild(el(doc, 'p', { class: 'health-banner-desc', text: bannerMeta.message }));

      var checkedPages = Object.keys(summary.checked);
      if (checkedPages.length > 0) {
        var checkedWrap = el(doc, 'div', { class: 'health-checked-list' });
        checkedPages.forEach(function (pageType) {
          checkedWrap.appendChild(
            el(doc, 'span', {
              class: 'health-checked-pill',
              text:
                pageType +
                ' checked ' +
                new Date(summary.checked[pageType]).toLocaleString(),
            })
          );
        });
        statusBox.appendChild(checkedWrap);
      }
      sectionEl.appendChild(statusBox);

      // Summary stat & filter chips.
      var statsBar = el(doc, 'div', {
        class: 'health-stats',
        role: 'group',
        'aria-label': 'Filter features by status',
      });
      var filterSpecs = [
        { id: 'all', label: 'All', count: counts.total },
        { id: 'working', label: 'Working', count: counts.working },
        { id: 'broken', label: 'Not working', count: counts.broken },
        { id: 'not-seen', label: 'Not seen', count: counts['not-seen'] },
        { id: 'unchecked', label: 'Not checked', count: counts.unchecked },
      ];
      var filterButtons = [];

      var listBox = el(doc, 'div', { class: 'tool-box health-list-box' });
      var listHead = el(doc, 'div', { class: 'health-list-head' });
      listHead.appendChild(el(doc, 'h3', { text: 'Features' }));
      var showingEl = el(doc, 'span', { class: 'health-showing' });
      listHead.appendChild(showingEl);
      listBox.appendChild(listHead);

      var grid = el(doc, 'div', { class: 'health-grid' });
      listBox.appendChild(grid);

      var statusLabels = {
        working: 'Working',
        broken: 'Not working',
        'not-seen': 'Not seen',
        unchecked: 'Not checked',
      };

      function renderFeatureCards() {
        var filtered = summary.features.filter(function (row) {
          return healthFilter === 'all' || row.status === healthFilter;
        });
        showingEl.textContent =
          'Showing ' + filtered.length + ' of ' + summary.features.length;
        grid.textContent = '';
        if (filtered.length === 0) {
          grid.appendChild(
            el(doc, 'p', {
              class: 'health-empty',
              text: 'No features match this status filter.',
            })
          );
          return;
        }
        filtered.forEach(function (row) {
          var card = el(doc, 'div', {
            class: 'health-card health-card--' + row.status,
          });
          card.appendChild(el(doc, 'span', { class: 'health-card-name', text: row.feature }));
          var badge = el(doc, 'span', { class: 'health-badge health-badge--' + row.status }, [
            el(doc, 'span', { class: 'health-dot', 'aria-hidden': 'true' }),
            statusLabels[row.status] || row.status,
          ]);
          card.appendChild(badge);
          grid.appendChild(card);
        });
      }

      filterSpecs.forEach(function (spec) {
        var btn = el(doc, 'button', {
          type: 'button',
          class:
            'health-stat-card health-stat-' +
            spec.id +
            (healthFilter === spec.id ? ' active' : ''),
          'aria-pressed': healthFilter === spec.id ? 'true' : 'false',
        });
        btn.appendChild(el(doc, 'span', { class: 'health-stat-count', text: String(spec.count) }));
        btn.appendChild(el(doc, 'span', { class: 'health-stat-label', text: spec.label }));
        btn.addEventListener('click', function () {
          healthFilter = spec.id;
          filterButtons.forEach(function (entry) {
            var isActive = entry.id === healthFilter;
            entry.btn.classList.toggle('active', isActive);
            entry.btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
          renderFeatureCards();
        });
        filterButtons.push({ id: spec.id, btn: btn });
        statsBar.appendChild(btn);
      });

      sectionEl.appendChild(statsBar);
      renderFeatureCards();
      sectionEl.appendChild(listBox);
    }

    function updateHealthNavBadge() {
      if (!navEl) return;
      var healthBtn = navEl.querySelector('.nav-item[data-section="health"]');
      if (!healthBtn) return;
      var dot = healthBtn.querySelector('.nav-status-dot');
      if (!dot) return;
      var broken =
        healthApi &&
        healthApi.summarizeHealth &&
        healthApi.summarizeHealth(healthRecord).status === 'broken';
      dot.style.display = broken ? 'inline-block' : 'none';
      if (broken) dot.setAttribute('title', 'Some features need attention');
      else dot.removeAttribute('title');
    }

    function renderNav() {
      navEl.textContent = '';
      sections.forEach(function (section) {
        var btn = el(doc, 'button', {
          type: 'button',
          class: 'nav-item',
          'data-section': section.id,
        });
        var icon = svgIcon(doc, section.id, 'nav-icon');
        if (icon) btn.appendChild(icon);
        btn.appendChild(el(doc, 'span', { class: 'nav-label', text: section.title }));
        if (section.id === 'health') {
          var dot = el(doc, 'span', { class: 'nav-status-dot', 'aria-hidden': 'true' });
          dot.style.display = 'none';
          btn.appendChild(dot);
        }
        btn.addEventListener('click', function () {
          renderSection(section.id);
        });
        navEl.appendChild(btn);
      });
      updateHealthNavBadge();
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

    // Tool-box items have no control row, so they are not in
    // buildSearchIndex's static section list. They are
    // appended at search time (profiles and saved themes are
    // dynamic): activating one switches to its section, with
    // no row to scroll to.
    function dynamicSearchEntries() {
      var entries = [];
      var add = function (sectionId, sectionTitle, label, description, keywords) {
        entries.push({
          key: '',
          sectionId: sectionId,
          sectionTitle: sectionTitle,
          label: label,
          description: description,
          haystack: [sectionTitle, label, description, keywords].join(' ').toLowerCase(),
        });
      };
      if (cssTemplatesApi && cssTemplatesApi.CSS_TEMPLATES) {
        cssTemplatesApi.CSS_TEMPLATES.forEach(function (t) {
          add(
            'appearance',
            'Appearance',
            'CSS template: ' + t.name,
            t.description || '',
            'css template'
          );
        });
      }
      if (layoutPresetsApi && layoutPresetsApi.LAYOUT_PRESETS) {
        layoutPresetsApi.LAYOUT_PRESETS.forEach(function (p) {
          add('layout', 'Layout', 'Layout preset: ' + p.name, p.description || '', 'layout preset');
        });
      }
      profiles.forEach(function (profile) {
        add('profiles', 'Profiles', 'Profile: ' + profile.name, 'Saved profile', 'profile');
      });
      savedThemes.forEach(function (theme) {
        add('appearance', 'Appearance', 'Saved theme: ' + theme.name, 'Saved theme', 'theme');
      });
      return entries;
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
          row.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
        currentResults = searchSettings(searchIndex.concat(dynamicSearchEntries()), query);
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
          var head = el(doc, 'div', { class: 'search-result-head' });
          var labelEl = el(doc, 'span', { class: 'search-result-label' });
          appendHighlighted(labelEl, entry.label, words);
          head.appendChild(labelEl);
          head.appendChild(
            el(doc, 'span', { class: 'search-result-section', text: entry.sectionTitle })
          );
          item.appendChild(head);
          if (entry.description) {
            var descEl = el(doc, 'span', { class: 'search-result-desc' });
            appendHighlighted(descEl, entry.description, words);
            item.appendChild(descEl);
          }
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
      doc.addEventListener('keydown', function (event) {
        if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
        var target = event.target;
        var tag = target && target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          (target && target.isContentEditable) ||
          doc.querySelector('.control-shortcut.capturing')
        ) {
          return;
        }
        event.preventDefault();
        searchEl.focus();
        if (typeof searchEl.select === 'function') searchEl.select();
      });
    }

    function load() {
      // Each read fails independently: one failing get used
      // to reset ALL state (settings, profiles, health,
      // themes) to defaults. The migrate/validate functions
      // already treat undefined as "use defaults".
      return Promise.all([
        storage.get(STORAGE_KEY).catch(function () {
          return undefined;
        }),
        storage.get(PROFILES_KEY).catch(function () {
          return undefined;
        }),
        storage.get(HEALTH_KEY).catch(function () {
          return undefined;
        }),
        storage.get(SAVED_THEMES_KEY).catch(function () {
          return undefined;
        }),
      ])
        .then(function (results) {
          state = defaultsApi.migrateSettings(results[0]);
          profiles = profilesApi ? profilesApi.validateProfiles(results[1], defaultsApi) : [];
          healthRecord = healthApi ? healthApi.validateHealthRecord(results[2]) : {};
          savedThemes = savedThemesApi
            ? savedThemesApi.validateSavedThemes(results[3], apis.themes)
            : [];
        })
        .catch(function () {
          state = defaultsApi.cloneDefaults();
          profiles = [];
          healthRecord = {};
          savedThemes = [];
        });
    }

    // Re-read the stored health record (the health module
    // writes it from YouTube tabs) and re-render the Health
    // section if it is the one open. A failed read keeps
    // the last record — never blank the section on a
    // transient failure.
    function refreshHealth() {
      return storage
        .get(HEALTH_KEY)
        .then(function (stored) {
          healthRecord = healthApi ? healthApi.validateHealthRecord(stored) : {};
          updateHealthNavBadge();
          if (currentSection === 'health') renderSection('health');
        })
        .catch(function () {});
    }

    // Persist the profiles list (local only — never synced).
    // A failure never touches the settings; the notice is
    // shown the next time the Profiles section renders.
    function saveProfiles() {
      return storage
        .set({ [PROFILES_KEY]: profiles })
        .then(function () {
          return true;
        })
        .catch(function () {
          profilesNotice = 'Could not save profiles — please try again.';
          return false;
        });
    }

    // Persist the saved-themes list (local only — never
    // synced). Same failure shape as saveProfiles.
    function saveSavedThemes() {
      return storage
        .set({ [SAVED_THEMES_KEY]: savedThemes })
        .then(function () {
          return true;
        })
        .catch(function () {
          savedThemesNotice = 'Could not save themes — please try again.';
          return false;
        });
    }

    function init() {
      renderNav();
      bindSearch();
      return load().then(function () {
        applyDashboardTheme();
        updateHealthNavBadge();
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if (getPath(state, 'ui.dashboardTheme') === 'system') applyDashboardTheme();
          });
        }
        renderSection(currentSection);
        if (storage.onChanged) {
          storage.onChanged(function (changes, areaName) {
            if (areaName !== 'local') return;
            // The health module writes its record from
            // YouTube tabs; refresh the Health section
            // when it changes (independent of settings).
            if (changes && changes[HEALTH_KEY]) {
              refreshHealth();
            }
            // Profiles and saved themes can change from
            // another dashboard tab: re-read them and
            // re-render the open section if it shows them.
            // The handler used to ignore both keys, so an
            // open Profiles/Appearance section went stale.
            if (changes && changes[PROFILES_KEY] && changes[PROFILES_KEY].newValue !== undefined) {
              profiles = profilesApi
                ? profilesApi.validateProfiles(changes[PROFILES_KEY].newValue, defaultsApi)
                : [];
              if (currentSection === 'profiles') renderSection('profiles');
            }
            if (
              changes &&
              changes[SAVED_THEMES_KEY] &&
              changes[SAVED_THEMES_KEY].newValue !== undefined
            ) {
              savedThemes = savedThemesApi
                ? savedThemesApi.validateSavedThemes(
                    changes[SAVED_THEMES_KEY].newValue,
                    apis.themes
                  )
                : [];
              if (currentSection === 'appearance') renderSection('appearance');
            }
            var change = changes && changes[STORAGE_KEY];
            if (!change || !change.newValue) return;
            var next = defaultsApi.migrateSettings(change.newValue);
            if (JSON.stringify(next) === JSON.stringify(state)) return;
            state = next;
            applyDashboardTheme();
            refreshValues();
            // The layout preview is drawn in renderSection,
            // not in refreshValues: re-render the Layout
            // section so an external change visibly updates
            // the preview instead of leaving stale numbers.
            if (currentSection === 'layout') renderSection('layout');
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

  // Byte length of a string (UTF-8): text.length counts
  // UTF-16 units, so a file of 200k emoji is ~400k bytes.
  // globalThis.TextEncoder keeps ESLint's no-undef happy
  // (TextEncoder is not in its globals list).
  function utf8ByteLength(text) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.TextEncoder === 'function') {
      return new globalThis.TextEncoder().encode(text).length;
    }
    return String(text).length;
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
    formatDefaultValue: formatDefaultValue,
    isControlModified: isControlModified,
    getControlInactiveReason: getControlInactiveReason,
    CONTROL_DEPENDENCIES: CONTROL_DEPENDENCIES,
    getControlHint: getControlHint,
    CONTROL_HINTS: CONTROL_HINTS,
    resolveSelectOptions: resolveSelectOptions,
    selectToSetting: selectToSetting,
    settingToSelect: settingToSelect,
    buildSearchIndex: buildSearchIndex,
    searchSettings: searchSettings,
    splitHighlight: splitHighlight,
    searchKeyAction: searchKeyAction,
    resolveDashboardTheme: resolveDashboardTheme,
    countHealthStatuses: countHealthStatuses,
    MODULE_SECTION_MAP: MODULE_SECTION_MAP,
    SECTION_GROUPS: SECTION_GROUPS,
    TOGGLE_GRID_KEYS: TOGGLE_GRID_KEYS,
    SECTION_MODULE_DEPS: SECTION_MODULE_DEPS,
    FOCUS_HIDE_KEYS: FOCUS_HIDE_KEYS,
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
      'profiles',
      'health',
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
      profilesApi: ns.profiles,
      healthApi: ns.health,
      cssTemplatesApi: ns.cssTemplates,
      savedThemesApi: ns.savedThemes,
      layoutPresetsApi: ns.layoutPresets,
      keyboardApi: ns.modules && ns.modules.keyboard,
      sections: sections,
      constants: ns.constants,
    });
    app.init();
  }
})();
