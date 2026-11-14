// OneYT — Phase 5 dashboard tests (node:test, no DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const defaults = require('../shared/defaults');
const validators = require('../shared/validators');
const themes = require('../shared/themes');
const options = require('../options/options');
const popup = require('../popup/popup');

const SECTION_FILES = [
  'general',
  'profiles',
  'health',
  'player',
  'sidebar',
  'home',
  'layout',
  'appearance',
  'playback',
  'productivity',
  'keyboard',
  'advanced',
];

function loadSections() {
  return SECTION_FILES.map(function (id) {
    return require('../options/sections/' + id);
  });
}

function leafPaths(obj, prefix, out) {
  out = out || [];
  prefix = prefix || '';
  for (const key in obj) {
    const p = prefix ? prefix + '.' + key : key;
    const v = obj[key];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      leafPaths(v, p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

// ---------- Section coverage ----------

test('dashboard: every setting is reachable from a section control', () => {
  const sections = loadSections();
  const controlKeys = new Set();
  sections.forEach(function (section) {
    assert.equal(typeof section.id, 'string');
    assert.equal(typeof section.title, 'string');
    assert.ok(Array.isArray(section.controls));
    section.controls.forEach(function (control) {
      assert.ok(!controlKeys.has(control.key), 'duplicate control key: ' + control.key);
      controlKeys.add(control.key);
      assert.equal(typeof control.label, 'string');
      assert.ok(control.label.length > 0);
      assert.ok(
        [
          'toggle',
          'select',
          'number',
          'range',
          'text',
          'color',
          'textarea',
          'speedList',
          'shortcut',
        ].includes(control.type),
        'unknown control type: ' + control.type
      );
      if (control.type === 'select') {
        assert.ok(typeof control.source === 'string', control.key + ' needs a select source');
      }
    });
  });

  // Every leaf in defaults (except schemaVersion, which is not
  // user-editable, and ui.onboarded, which the welcome page
  // sets itself — Phase 17) must have a control — except
  // appearance.colors.*, whose ten keys are covered by the
  // ten colour controls.
  const leaves = leafPaths(defaults.DEFAULT_SETTINGS).filter(
    (p) => p !== 'schemaVersion' && p !== 'ui.onboarded'
  );
  const colorKeys = Object.keys(themes.CUSTOM_COLOR_KEYS);
  const missing = leaves.filter(function (p) {
    if (p.indexOf('appearance.colors.') === 0) {
      return !colorKeys.includes(p.split('.').pop());
    }
    return !controlKeys.has(p);
  });
  assert.deepEqual(missing, []);

  // Every control key must exist in defaults (or be a colour key).
  const bad = [...controlKeys].filter(function (p) {
    if (p.indexOf('appearance.colors.') === 0) {
      return !colorKeys.includes(p.split('.').pop());
    }
    return options.getPath(defaults.DEFAULT_SETTINGS, p) === undefined;
  });
  assert.deepEqual(bad, []);
});

test('dashboard: colour controls match CUSTOM_COLOR_KEYS exactly', () => {
  const appearance = require('../options/sections/appearance');
  const colorKeys = appearance.controls
    .filter((c) => c.type === 'color')
    .map((c) => c.key.split('.').pop())
    .sort();
  assert.deepEqual(colorKeys, Object.keys(themes.CUSTOM_COLOR_KEYS).sort());
});

// ---------- options.js pure helpers ----------

test('options: diffSettings finds leaf changes only', () => {
  const a = defaults.cloneDefaults();
  const b = defaults.cloneDefaults();
  b.player.customWidth = 900;
  b.playback.speedPresets = [1, 2];
  b.productivity.focusMode = true;
  const diff = options.diffSettings(a, b);
  assert.deepEqual(diff.map((d) => d.key).sort(), [
    'playback.speedPresets',
    'player.customWidth',
    'productivity.focusMode',
  ]);
  const change = diff.find((d) => d.key === 'player.customWidth');
  assert.equal(change.oldValue, 0);
  assert.equal(change.newValue, 900);
  assert.deepEqual(options.diffSettings(a, a), []);
});

test('options: search matches label, description, keywords and key', () => {
  const sections = loadSections();
  const index = options.buildSearchIndex(sections);
  assert.ok(index.length >= 90, 'index has ' + index.length + ' entries');
  const focus = options.searchSettings(index, 'focus mode');
  assert.ok(focus.length >= 1);
  assert.ok(focus.every((e) => e.haystack.includes('focus')));
  const speed = options.searchSettings(index, 'SPEED preset');
  assert.ok(speed.some((e) => e.key === 'playback.speedPresets'));
  assert.deepEqual(options.searchSettings(index, 'zzzqqq'), []);
  assert.deepEqual(options.searchSettings(index, ''), []);
});

test('options: select sources resolve for every declared source', () => {
  const settings = defaults.cloneDefaults();
  const sources = new Set();
  loadSections().forEach(function (section) {
    section.controls.forEach(function (c) {
      if (c.type === 'select') sources.add(c.source);
    });
  });
  assert.deepEqual([...sources].sort(), [
    'alignments',
    'dashboardThemes',
    'densities',
    'fontFamilies',
    'fontWeights',
    'miniPositions',
    'positions',
    'qualities',
    'speedPresets',
    'themes',
    'triState',
  ]);
  sources.forEach(function (source) {
    const opts = options.resolveSelectOptions(source, settings, { themes: themes });
    assert.ok(opts.length > 0, source + ' has no options');
    opts.forEach(function (o) {
      assert.equal(typeof o.label, 'string');
    });
  });
  // Speed presets come from settings and stay sorted.
  const speedOpts = options.resolveSelectOptions('speedPresets', settings, { themes: themes });
  assert.deepEqual(
    speedOpts.map((o) => o.value),
    [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  );
  // Tri-state round-trips.
  assert.equal(options.selectToSetting('triState', 'on'), true);
  assert.equal(options.selectToSetting('triState', 'off'), false);
  assert.equal(options.selectToSetting('triState', 'default'), null);
  assert.equal(options.settingToSelect('triState', true), 'on');
  assert.equal(options.settingToSelect('triState', null), 'default');
});

test('options: getPath/setPath round-trip', () => {
  const s = defaults.cloneDefaults();
  options.setPath(s, 'player.miniPlayer.offsetX', 24);
  assert.equal(options.getPath(s, 'player.miniPlayer.offsetX'), 24);
  assert.equal(options.getPath(s, 'no.such.key'), undefined);
});

// ---------- Import / export ----------

test('options: clampSettingsToControls clamps imports to control ranges', () => {
  const settings = defaults.cloneDefaults();
  settings.player.customWidth = 99999;
  settings.playback.captionFontSize = 999;
  settings.player.maxWidth = -50;
  settings.sidebar.customWidth = 500; // in range: untouched
  const result = options.clampSettingsToControls(settings, loadSections());
  assert.equal(result.settings.player.customWidth, 2000);
  assert.equal(result.settings.playback.captionFontSize, 200);
  assert.equal(result.settings.player.maxWidth, 0);
  assert.equal(result.settings.sidebar.customWidth, 500);
  assert.deepEqual(result.clamped.map((c) => c.key).sort(), [
    'playback.captionFontSize',
    'player.customWidth',
    'player.maxWidth',
  ]);
  // The input is not mutated.
  assert.equal(settings.player.customWidth, 99999);
});

test('dashboard: export → import round-trip reproduces the same settings', () => {
  const settings = defaults.cloneDefaults();
  settings.player.customWidth = 900;
  settings.appearance.theme = 'midnight';
  settings.playback.speedPresets = [1, 1.5, 2];
  const exported = JSON.stringify(settings);
  const parsed = JSON.parse(exported);
  const result = validators.validateSettings(parsed, defaults);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.cleaned, settings);
});

test('dashboard: invalid import is rejected with field errors', () => {
  const bad = defaults.cloneDefaults();
  bad.enabled = 'yes';
  bad.player = 'not-an-object';
  const result = validators.validateSettings(bad, defaults);
  assert.equal(result.valid, false);
  assert.equal(result.cleaned, null);
  assert.ok(result.errors.length >= 2);
  assert.ok(result.errors.some((e) => e.includes('enabled')));
  const notObject = validators.validateSettings('nope', defaults);
  assert.equal(notObject.valid, false);
  assert.ok(notObject.errors[0].includes('JSON object'));
});

// ---------- Popup page status ----------

test('popup: parsePageStatus labels YouTube pages, rejects the rest', () => {
  const cases = [
    ['https://www.youtube.com/watch?v=x', 'Watch page'],
    ['https://www.youtube.com/', 'Home'],
    ['https://www.youtube.com/shorts/abc', 'Shorts'],
    ['https://www.youtube.com/feed/subscriptions', 'Subscriptions'],
    ['https://www.youtube.com/feed/you', 'Library'],
    ['https://www.youtube.com/feed/history', 'History'],
    ['https://www.youtube.com/results?search_query=x', 'Search results'],
    ['https://youtube.com/watch?v=x', 'Watch page'],
    ['https://m.youtube.com/', 'Home'],
    ['https://m.youtube.com/results?search_query=x', 'Search results'],
    ['https://music.youtube.com/', 'YouTube Music'],
    ['https://music.youtube.com/watch?v=x', 'YouTube Music'],
    ['https://www.google.com/', 'Not on YouTube'],
    ['https://fakeyoutube.com/', 'Not on YouTube'],
    ['https://youtube.com.evil.com/', 'Not on YouTube'],
    ['', 'Not on YouTube'],
    [null, 'Not on YouTube'],
  ];
  cases.forEach(function ([url, label]) {
    assert.equal(popup.parsePageStatus(url).label, label, String(url));
  });
});

// ---------- Manifest / shell ----------

test('dashboard: manifest declares the options page and every script exists', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.equal(manifest.options_page, 'options/options.html');
  assert.ok(manifest.permissions.includes('activeTab'));
  assert.ok(manifest.permissions.includes('storage'));
  const html = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  // 16 scripts before Phase 16 + shared/profiles.js + sections/profiles.js
  // + shared/health.js + sections/health.js (Phase 18)
  // + shared/cssTemplates.js (Phase 20)
  // + shared/savedThemes.js (Phase 21)
  // + shared/layoutPresets.js (Phase 22)
  // + sections/home.js (dedicated Home section).
  assert.equal(scripts.length, 24);
  scripts.forEach(function (src) {
    const resolved = path.normalize(path.join(__dirname, '..', 'options', src));
    assert.ok(fs.existsSync(resolved), 'missing script: ' + src);
  });
  [
    'options-root',
    'options-nav',
    'options-main',
    'options-search',
    'search-results',
    'saved-indicator',
  ].forEach(function (id) {
    assert.ok(html.includes('id="' + id + '"'), 'missing id: ' + id);
  });
});

test('dashboard: state-replacing actions go through replaceState (theme follows)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(src.includes('function replaceState(next)'), 'replaceState helper exists');
  assert.ok(src.includes('replaceState(defaultsApi.cloneDefaults())'), 'reset all uses it');
  assert.ok(src.includes('replaceState(defaultsApi.deepClone(pendingImport))'), 'import uses it');
  assert.ok(src.includes('replaceState(profilesApi.applyPreset('), 'preset apply uses it');
  assert.ok(src.includes('replaceState(profilesApi.applyProfile('), 'profile apply uses it');
  // load()'s catch legitimately falls back to cloneDefaults;
  // the reset-all path must not assign state directly.
  assert.ok(
    !src.includes('state = defaultsApi.deepClone(pendingImport);'),
    'no direct import bypass'
  );
  assert.ok(!src.includes('state = profilesApi.applyPreset('), 'no direct preset bypass');
  assert.ok(!src.includes('state = profilesApi.applyProfile('), 'no direct profile bypass');
  // saveNow resolves a boolean so success notices are gated on a real write.
  assert.ok(src.includes('return true;'), 'saveNow resolves true on success');
  assert.ok(src.includes('return false;'), 'saveNow resolves false on failure');
  assert.ok(src.includes('.then(function (saved)'), 'callers receive the boolean');
});

test('dashboard: control fixes — shortcut blur restore, colour reset, speed options, theme clamp', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  // B3: blur restores the stored shortcut when not capturing.
  assert.ok(src.includes("input.addEventListener('blur', function () {"));
  assert.ok(src.includes("if (!capturing) input.value = getPath(state, control.key) || '';"));
  // B5: getDefault returns '' for appearance.colors.* (defaults are {}).
  assert.ok(src.includes("key.indexOf('appearance.colors.') === 0"));
  // B4: speedPresets options are rebuilt in set().
  assert.ok(src.includes("if (control.source === 'speedPresets')"));
  // B7: unknown theme falls back to 'default' in makeSelect set().
  assert.ok(src.includes("if (control.source === 'themes')"));
  assert.ok(src.includes("if (names.indexOf(String(value)) === -1) v = 'default';"));
});

test('dashboard: deletes confirm, loads fail independently, import size is bytes', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  // B10: profile and saved-theme deletes confirm first, like reset-all.
  assert.ok(src.includes('Delete profile "'), 'profile delete confirms');
  assert.ok(src.includes('Delete theme "'), 'saved-theme delete confirms');
  // B11: each storage read in load() has its own catch.
  assert.ok(
    src.includes('storage.get(STORAGE_KEY).catch(function () {'),
    'settings read fails independently'
  );
  assert.ok(
    src.includes('storage.get(PROFILES_KEY).catch(function () {'),
    'profiles read fails independently'
  );
  assert.ok(
    src.includes('storage.get(HEALTH_KEY).catch(function () {'),
    'health read fails independently'
  );
  assert.ok(
    src.includes('storage.get(SAVED_THEMES_KEY).catch(function () {'),
    'themes read fails independently'
  );
  // B13: import size is measured in bytes, not UTF-16 units.
  assert.ok(src.includes('utf8ByteLength(text)'), 'byte length measured via helper');
  assert.ok(src.includes('new globalThis.TextEncoder().encode(text).length'), 'UTF-8 encoder used');
  assert.ok(!src.includes('text.length > maxBytes'), 'no UTF-16 length check remains');
  assert.ok(src.includes("' bytes, max '"), 'message reports bytes');
});

test('dashboard: onChanged refreshes profiles, themes and the layout preview', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(src.includes('changes[PROFILES_KEY]'), 'profiles key handled in onChanged');
  assert.ok(
    src.includes("if (currentSection === 'profiles') renderSection('profiles');"),
    'open Profiles section re-renders'
  );
  assert.ok(src.includes('changes[SAVED_THEMES_KEY]'), 'saved-themes key handled in onChanged');
  assert.ok(
    src.includes("if (currentSection === 'appearance') renderSection('appearance');"),
    'open Appearance section re-renders'
  );
  assert.ok(
    src.includes("if (currentSection === 'home') renderSection('home');"),
    'open Home section re-renders so the preview updates'
  );
});

test('dashboard: free-text CSS controls carry a cssProperty for probe validation', () => {
  const player = require('../options/sections/player');
  const sidebar = require('../options/sections/sidebar');
  const byKey = {};
  player.controls.concat(sidebar.controls).forEach(function (c) {
    byKey[c.key] = c;
  });
  assert.equal(byKey['player.border'].cssProperty, 'border');
  assert.equal(byKey['player.shadow'].cssProperty, 'boxShadow');
  assert.equal(byKey['player.miniPlayer.shadow'].cssProperty, 'boxShadow');
  assert.equal(byKey['sidebar.maxHeight'].cssProperty, 'maxHeight');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(src.includes('probe.style[control.cssProperty] = value'), 'probe assignment exists');
  assert.ok(
    src.includes("showWarning(row, 'Not a valid CSS ' + control.cssProperty + ' value.');"),
    'invalid CSS warns and reverts'
  );
});

test('dashboard: countHealthStatuses tallies all status buckets accurately', () => {
  assert.deepEqual(options.countHealthStatuses([]), {
    total: 0,
    working: 0,
    broken: 0,
    'not-seen': 0,
    unchecked: 0,
  });
  assert.deepEqual(
    options.countHealthStatuses([
      { feature: 'Video player', status: 'working' },
      { feature: 'Watch page layout', status: 'working' },
      { feature: 'Recommendations sidebar', status: 'broken' },
      { feature: 'Live shelf', status: 'not-seen' },
      { feature: 'Home feed grid', status: 'unchecked' },
    ]),
    {
      total: 5,
      working: 2,
      broken: 1,
      'not-seen': 1,
      unchecked: 1,
    }
  );
});

test('dashboard: UI/UX enhancements — responsive nav icons, Health grid, reactive preview & speed sync', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(html.includes('class="options-topbar-inner"'), 'topbar inner wrapper centers header');
  assert.ok(html.includes('aria-live="polite"'), 'saved indicator announces politely');
  assert.ok(css.includes('.toggle-switch'), 'accessible pill switch styling present');
  assert.ok(css.includes('.toggle-input:focus-visible + .toggle-track'), 'switch focus ring');
  assert.ok(css.includes('.health-stat-card:focus-visible'), 'health filter cards focus ring');
  assert.ok(css.includes('.health-grid'), 'health features use responsive grid');
  assert.ok(src.includes('doc.createElementNS(SVG_NS'), 'nav icons use SVG createElementNS');
  assert.ok(src.includes('updateLayoutPreview()'), 'layout numbers update live preview');
  assert.ok(
    src.includes("inputsByKey['playback.defaultSpeed']"),
    'speedPresets updates defaultSpeed select'
  );
  assert.ok(src.includes('health-stat-card'), 'health filter chips rendered');
});

test('dashboard: isControlModified, formatValue, and General MODULE_SECTION_MAP cover modules', () => {
  assert.equal(options.formatValue(true), 'On');
  assert.equal(options.formatValue(false), 'Off');
  assert.equal(options.formatValue(null), 'YouTube default');
  assert.equal(options.formatValue(''), '(empty)');
  assert.equal(options.formatValue('system'), 'system');
  assert.equal(options.isControlModified(true, true), false);
  assert.equal(options.isControlModified(false, true), true);
  assert.equal(options.isControlModified(undefined, ''), false);
  assert.equal(options.isControlModified([1, 1.5], [1, 1.5]), false);
  assert.equal(options.isControlModified([1, 2], [1, 1.5]), true);

  const general = require('../options/sections/general');
  const sectionIds = new Set(SECTION_FILES);
  const moduleKeys = general.controls
    .filter((c) => c.key.indexOf('modules.') === 0)
    .map((c) => c.key);
  moduleKeys.forEach((key) => {
    const target = options.MODULE_SECTION_MAP[key];
    assert.ok(target, 'missing MODULE_SECTION_MAP target for ' + key);
    assert.ok(sectionIds.has(target.id), 'unknown target section ' + target.id);
  });
});

test('dashboard: preset card grids, semantic notices, theme swatches & Enter submit exist', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(css.includes('.preset-grid'), 'preset grid layout present');
  assert.ok(css.includes('.preset-card'), 'preset card layout present');
  assert.ok(css.includes('.control-warning.notice-success'), 'success notice variant styled');
  assert.ok(css.includes('.control-warning.notice-error'), 'error notice variant styled');
  assert.ok(css.includes('.theme-swatch-dot'), 'saved theme swatches styled');
  assert.ok(src.includes('function createToolNoticeEl('), 'tool notices routed through helper');
  assert.ok(src.includes('function bindEnterSubmit('), 'Enter key form submission helper exists');
  assert.ok(src.includes('theme-swatch-dot'), 'saved theme color swatch dots rendered');
});

test('dashboard: inline control rows, number units, section sub-groups & module deps match schemas', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  assert.ok(css.includes('.control-row-grid'), '2-sided compact control row grid styled');
  assert.ok(css.includes('.control-number-unit'), 'unit pill styled next to number input');
  assert.ok(css.includes('.module-status-banner'), 'disabled module warning banner styled');
  assert.ok(src.includes('control-row-inline'), 'inline class applied to compact controls');
  assert.ok(src.includes('renderModuleStatusBanner('), 'module status banner helper rendered');

  const sections = loadSections();
  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));
  Object.entries(options.SECTION_GROUPS).forEach(([sectionId, groups]) => {
    const sec = byId[sectionId];
    assert.ok(sec, 'SECTION_GROUPS references real section ' + sectionId);
    const controlKeys = new Set(sec.controls.map((c) => c.key));
    Object.keys(groups).forEach((key) => {
      assert.ok(controlKeys.has(key), 'SECTION_GROUPS key ' + key + ' missing in ' + sectionId);
    });
  });

  const allDefaults = new Set(leafPaths(defaults.DEFAULT_SETTINGS));
  Object.entries(options.SECTION_MODULE_DEPS).forEach(([sectionId, deps]) => {
    assert.ok(byId[sectionId], 'SECTION_MODULE_DEPS references real section ' + sectionId);
    assert.ok(Array.isArray(deps) && deps.length > 0, 'non-empty deps for ' + sectionId);
    deps.forEach((dep) => {
      assert.ok(allDefaults.has(dep.key), 'module key ' + dep.key + ' exists in DEFAULT_SETTINGS');
    });
  });
});

test('dashboard: formatDefaultValue, CONTROL_DEPENDENCIES, quick presets & Sidebar live preview', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const sidebar = require('../options/sections/sidebar');

  assert.equal(options.formatDefaultValue(402, { unit: 'px' }), '402 px');
  assert.equal(options.formatDefaultValue(true, {}), 'On');
  assert.equal(options.formatDefaultValue('', {}), '(empty)');

  const maxHeightControl = sidebar.controls.find((c) => c.key === 'sidebar.maxHeight');
  assert.ok(Array.isArray(maxHeightControl.presets) && maxHeightControl.presets.length >= 3);

  const stateHidden = defaults.cloneDefaults();
  stateHidden.recommendations.hideSidebar = true;
  assert.ok(
    options.getControlInactiveReason('sidebar.customWidth', stateHidden).length > 0,
    'sidebar.customWidth dims when recommendations sidebar is hidden'
  );
  const stateNoBar = defaults.cloneDefaults();
  stateNoBar.sidebar.scrollbarVisible = false;
  assert.ok(
    options.getControlInactiveReason('sidebar.scrollbarWidth', stateNoBar).length > 0,
    'sidebar.scrollbarWidth dims when scrollbar is hidden'
  );
  assert.equal(
    options.getControlInactiveReason('sidebar.scrollbarWidth', defaults.cloneDefaults()),
    '',
    'active dependencies return empty reason'
  );

  const allDefaults = new Set(leafPaths(defaults.DEFAULT_SETTINGS));
  Object.entries(options.CONTROL_DEPENDENCIES).forEach(([targetKey, rules]) => {
    assert.ok(allDefaults.has(targetKey), 'dependent key exists in DEFAULT_SETTINGS: ' + targetKey);
    rules.forEach((r) => {
      assert.ok(allDefaults.has(r.key), 'rule parent exists in DEFAULT_SETTINGS: ' + r.key);
      assert.ok(typeof r.reason === 'string' && r.reason.length > 0);
    });
  });

  assert.ok(css.includes('.control-dep-badge'), 'dependency badge styled');
  assert.ok(css.includes('.control-preset-chip'), 'quick-preset chips styled');
  assert.ok(css.includes('.sidebar-preview-stage'), 'sidebar preview schematic styled');
  assert.ok(src.includes('renderSidebarPreviewTools('), 'sidebar preview rendered');
});

test('dashboard: 2-col toggle grids, Layout Shorts deps, quick-picks & active preset preview', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const home = require('../options/sections/home');

  const allDefaults = new Set(leafPaths(defaults.DEFAULT_SETTINGS));
  Object.keys(options.TOGGLE_GRID_KEYS).forEach((key) => {
    assert.ok(allDefaults.has(key), 'TOGGLE_GRID_KEYS key exists in DEFAULT_SETTINGS: ' + key);
  });

  const blockState = defaults.cloneDefaults();
  blockState.layout.blockShorts = true;
  assert.ok(
    options.getControlInactiveReason('layout.hideShortsHome', blockState).length > 0,
    'hideShortsHome notes redundancy when blockShorts is On'
  );
  assert.ok(
    options.getControlInactiveReason('navigation.hideShorts', blockState).length > 0,
    'navigation.hideShorts notes redundancy when blockShorts is On'
  );

  const compactNav = defaults.cloneDefaults();
  compactNav.navigation.compact = true;
  assert.ok(
    options.getControlInactiveReason('navigation.guideWidth', compactNav).length > 0,
    'guideWidth notes compact mode override when compact is On'
  );

  const homeColsControl = home.controls.find((c) => c.key === 'layout.homeColumns');
  const homeMaxWidthControl = home.controls.find((c) => c.key === 'layout.homeMaxWidth');
  assert.ok(Array.isArray(homeColsControl.presets) && homeColsControl.presets.length >= 4);
  assert.ok(Array.isArray(homeMaxWidthControl.presets) && homeMaxWidthControl.presets.length >= 3);

  assert.ok(css.includes('.control-grid-toggles'), '2-column toggle grid styled');
  assert.ok(css.includes('.preset-card.is-active'), 'active preset highlight styled');
  assert.ok(css.includes('.layout-preview-thumb'), 'layout preview card thumbs styled');
  assert.ok(src.includes('isLayoutPresetMatches('), 'layout preset matching helper exists');
});

test('dashboard: Appearance swatches, contrast preview, 2-col colour grid & typography presets', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const appearance = require('../options/sections/appearance');

  const sizeCtrl = appearance.controls.find((c) => c.key === 'appearance.typography.fontSize');
  const radiusCtrl = appearance.controls.find((c) => c.key === 'appearance.borderRadius');
  const spacingCtrl = appearance.controls.find((c) => c.key === 'appearance.spacing');
  assert.ok(Array.isArray(sizeCtrl.presets) && sizeCtrl.presets.length >= 4);
  assert.ok(Array.isArray(radiusCtrl.presets) && radiusCtrl.presets.length >= 3);
  assert.ok(Array.isArray(spacingCtrl.presets) && spacingCtrl.presets.length >= 3);

  assert.ok(css.includes('.control-grid-colors'), '2-column custom colour grid styled');
  assert.ok(css.includes('.theme-preset-pill'), 'visual theme preset pills styled');
  assert.ok(css.includes('.theme-contrast-ratio.is-pass'), 'contrast AA pass badge styled');
  assert.ok(css.includes('.theme-contrast-ratio.is-warn'), 'low contrast warning badge styled');
  assert.ok(src.includes('renderThemeVisualPanel('), 'theme visual swatch panel exists');
  assert.ok(src.includes('updateThemeContrastPreview('), 'live theme contrast updater exists');
  assert.ok(src.includes('updateColorClearAllBtn('), 'bulk colour clear button helper exists');
});

test('dashboard: Playback speed chips, precedence hints, captions dep & quick-picks', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const playback = require('../options/sections/playback');

  assert.equal(options.formatDefaultValue(1, { source: 'speedPresets' }), '1x');

  const captionsOff = defaults.cloneDefaults();
  captionsOff.playback.captions = false;
  assert.ok(
    options.getControlInactiveReason('playback.captionFontSize', captionsOff).length > 0,
    'captionFontSize dims when captions are forced Off'
  );
  const captionsAuto = defaults.cloneDefaults();
  captionsAuto.playback.captions = null;
  assert.equal(options.getControlInactiveReason('playback.captionFontSize', captionsAuto), '');
  const captionsOn = defaults.cloneDefaults();
  captionsOn.playback.captions = true;
  assert.equal(options.getControlInactiveReason('playback.captionFontSize', captionsOn), '');

  const rememberState = defaults.cloneDefaults();
  rememberState.playback.rememberSpeed = true;
  rememberState.playback.rememberVolume = true;
  assert.ok(options.getControlHint('playback.defaultSpeed', rememberState).length > 0);
  assert.ok(options.getControlHint('playback.defaultVolume', rememberState).length > 0);
  rememberState.playback.rememberSpeed = false;
  rememberState.playback.rememberVolume = false;
  assert.equal(options.getControlHint('playback.defaultSpeed', rememberState), '');
  assert.equal(options.getControlHint('playback.defaultVolume', rememberState), '');

  const allDefaults = new Set(leafPaths(defaults.DEFAULT_SETTINGS));
  Object.entries(options.CONTROL_HINTS).forEach(([targetKey, rules]) => {
    assert.ok(allDefaults.has(targetKey), 'hint key exists in DEFAULT_SETTINGS: ' + targetKey);
    rules.forEach((r) => {
      assert.ok(allDefaults.has(r.key), 'hint parent exists in DEFAULT_SETTINGS: ' + r.key);
      assert.ok(typeof r.hint === 'string' && r.hint.length > 0);
    });
  });

  const volCtrl = playback.controls.find((c) => c.key === 'playback.defaultVolume');
  const capSizeCtrl = playback.controls.find((c) => c.key === 'playback.captionFontSize');
  assert.ok(Array.isArray(volCtrl.presets) && volCtrl.presets.length >= 4);
  assert.ok(Array.isArray(capSizeCtrl.presets) && capSizeCtrl.presets.length >= 4);

  assert.ok(css.includes('.speed-chip.is-default'), 'active default speed chip styled');
  assert.ok(css.includes('.speed-chip-select'), 'clickable speed chip selector styled');
  assert.ok(css.includes('.control-hint-badge'), 'subtle non-dimming precedence badge styled');
  assert.ok(src.includes('Keep at least one speed preset.'), 'guards against deleting last speed preset');
});

test('dashboard: Productivity hidden counter, focus presets, shortcut status & interactive diagram', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const allDefaults = new Set(leafPaths(defaults.DEFAULT_SETTINGS));

  assert.equal(options.FOCUS_HIDE_KEYS.length, 7);
  options.FOCUS_HIDE_KEYS.forEach((k) => {
    assert.ok(allDefaults.has(k), 'focus hide key exists in DEFAULT_SETTINGS: ' + k);
  });

  assert.equal(options.FOCUS_PRESETS.length, 3);
  const deep = options.FOCUS_PRESETS.find((p) => p.id === 'deep');
  const study = options.FOCUS_PRESETS.find((p) => p.id === 'study');
  assert.ok(deep && study);
  const baseState = defaults.cloneDefaults();
  assert.equal(options.isFocusPresetMatches(baseState, deep), true);
  assert.equal(options.isFocusPresetMatches(baseState, study), false);
  baseState.productivity.focusHideComments = false;
  baseState.productivity.focusHideButtons = false;
  baseState.productivity.focusHideMetadata = false;
  assert.equal(options.isFocusPresetMatches(baseState, study), true);
  assert.equal(options.isFocusPresetMatches(baseState, deep), false);

  assert.ok(css.includes('.focus-hidden-count'), 'focus hidden counter badge styled');
  assert.ok(css.includes('.focus-quick-actions'), 'Hide all / Show all quick actions styled');
  assert.ok(css.includes('.focus-status-pill.is-on'), 'focus active status pill styled');
  assert.ok(css.includes('.focus-preset-pill.is-active'), 'focus preset pill active state styled');
  assert.ok(css.includes('.focus-stage-tile.is-masked'), 'focus diagram masked tile state styled');
  assert.ok(src.includes('renderFocusVisualPanel('), 'focus interactive preview helper exists');
  assert.ok(src.includes('updateProductivitySummary('), 'focus live summary updater exists');
});

test('dashboard: Keyboard groups, Unbind button, conflict pill & summary', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const keyboard = require('../options/sections/keyboard');

  assert.equal(keyboard.controls.length, 7);
  keyboard.controls.forEach((c) => {
    assert.ok(!c.description.includes('Click the field, then press'), 'concise per-row copy');
  });
  assert.ok(options.SECTION_GROUPS.keyboard['keyboard.shortcuts.toggleFocus']);
  assert.ok(options.SECTION_GROUPS.keyboard['keyboard.shortcuts.speedUp']);

  assert.ok(css.includes('.control-shortcut-wrap'), 'shortcut + Unbind wrapper styled');
  assert.ok(css.includes('.control-shortcut.is-unbound'), 'unbound keycap state styled');
  assert.ok(css.includes('.keyboard-bound-count'), 'bound shortcut counter badge styled');
  assert.ok(css.includes('.keyboard-health-pill.is-ok'), 'keyboard conflict status pill styled');
  assert.ok(src.includes('updateKeyboardSummary('), 'live keyboard summary helper exists');
  assert.ok(src.includes("event.key === 'Enter' || event.key === ' '"), 'Enter/Space starts recording');
  assert.ok(src.includes('keyboard-unbind-all-btn'), 'Unbind all button exists');
});

test('dashboard: Advanced notice, file picker, Copy JSON, danger zone & live storage pills', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.css'), 'utf8');
  const src = fs.readFileSync(path.join(__dirname, '..', 'options', 'options.js'), 'utf8');
  const advanced = require('../options/sections/advanced');

  assert.ok(!advanced.description.includes('AD-08'), 'internal doc codes removed from user copy');
  assert.ok(src.includes('advancedNotice'), 'persistent notice survives renderSection after import/reset');
  assert.ok(src.includes("msg.indexOf('Restored ') === 0"), 'Restored prefix triggers green success notice');
  assert.ok(src.includes('updateAdvancedSummary('), 'live advanced diff & storage summary helper exists');
  assert.ok(src.includes('advanced-copy-btn'), 'Copy JSON button rendered');
  assert.ok(src.includes('advanced-clear-import-btn'), 'Clear import button rendered');

  assert.ok(css.includes('.file-picker-row'), 'custom file picker styled');
  assert.ok(css.includes('.import-preview:not(:empty)'), 'import diff preview panel framed');
  assert.ok(css.includes('.reset-danger-box'), 'danger zone emphasis styled');
  assert.ok(css.includes('.about-storage-pill.is-synced'), 'synced storage pill state styled');
});

test('dashboard: row-fixer parity — Home section, feed rows, responsive columns, avatars, titles and channel layout', () => {
  const homeSection = require('../options/sections/home');
  const layoutSection = require('../options/sections/layout');
  const layoutCss = fs.readFileSync(
    path.join(__dirname, '..', 'content', 'modules', 'layout', 'layout.css'),
    'utf8'
  );

  const homeExpected = [
    'homeColumns',
    'responsiveColumns',
    'postsPerRow',
    'shelfItemsPerRow',
    'hideChannelProfile',
    'fullVideoTitles',
    'hideShortsHome',
    'hideTopicChips',
    'hideLiveShelf',
    'hideMixesShelf',
    'hideNewsShelf',
  ];
  homeExpected.forEach((k) => {
    assert.ok(Object.prototype.hasOwnProperty.call(defaults.DEFAULT_SETTINGS.layout, k), k);
    assert.ok(
      homeSection.controls.some((c) => c.key === 'layout.' + k),
      'home section has control for layout.' + k
    );
  });

  const channelExpected = ['channelWide', 'channelColumns', 'channelShelfItemsPerRow'];
  channelExpected.forEach((k) => {
    assert.ok(Object.prototype.hasOwnProperty.call(defaults.DEFAULT_SETTINGS.layout, k), k);
    assert.ok(
      layoutSection.controls.some((c) => c.key === 'layout.' + k),
      'layout section has control for layout.' + k
    );
  });

  const homeCols = homeSection.controls.find((c) => c.key === 'layout.homeColumns');
  assert.equal(homeCols.max, 15);
  assert.ok(homeCols.description.toLowerCase().includes('skeleton'));
  assert.equal(options.SECTION_GROUPS.home['layout.homeColumns'], 'Feed grid & row counts');
  assert.equal(options.SECTION_GROUPS.layout['layout.channelWide'], 'Channel page');
  assert.equal(options.TOGGLE_GRID_KEYS['layout.hideChannelProfile'], true);
  assert.equal(options.TOGGLE_GRID_KEYS['layout.fullVideoTitles'], true);

  const blockState = defaults.cloneDefaults();
  blockState.layout.blockShorts = true;
  assert.ok(options.getControlHint('layout.shelfItemsPerRow', blockState).length > 0);

  assert.ok(layoutCss.includes('--oneyt-effective-home-columns'));
  assert.ok(layoutCss.includes('ytd-rich-item-renderer[is-post]'));
  assert.ok(layoutCss.includes('.yt-lockup-metadata-view-model__avatar'));
  assert.ok(layoutCss.includes('oneyt-full-video-titles'));
  assert.ok(layoutCss.includes('oneyt-channel-wide'));
});
