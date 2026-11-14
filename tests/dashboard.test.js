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
  // + shared/layoutPresets.js (Phase 22).
  assert.equal(scripts.length, 23);
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
    src.includes("if (currentSection === 'layout') renderSection('layout');"),
    'open Layout section re-renders so the preview updates'
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
