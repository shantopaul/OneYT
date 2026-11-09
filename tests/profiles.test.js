// OneYT — Phase 16 profiles tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const profiles = require('../shared/profiles');

function customSettings() {
  const s = defaults.cloneDefaults();
  s.appearance.theme = 'midnight';
  s.playback.defaultSpeed = 1.5;
  s.layout.hideComments = true;
  return s;
}

test('profiles: four built-ins exist with unique ids and overrides', () => {
  assert.equal(profiles.BUILTIN_PRESETS.length, 4);
  const ids = profiles.BUILTIN_PRESETS.map((p) => p.id);
  assert.deepEqual(ids, ['stock', 'focus', 'clean', 'cinema']);
  profiles.BUILTIN_PRESETS.forEach((preset) => {
    assert.ok(preset.name.length > 0);
    assert.ok(preset.description.length > 0);
    assert.equal(typeof preset.overrides, 'object');
  });
  assert.equal(profiles.getPreset('focus').name, 'Focus');
  assert.equal(profiles.getPreset('nope'), null);
});

test('profiles: Focus preset turns focus on and hides distractions', () => {
  const next = profiles.applyPreset(defaults.cloneDefaults(), 'focus', defaults);
  assert.equal(next.productivity.focusMode, true);
  assert.equal(next.productivity.focusHideComments, true);
  assert.equal(next.recommendations.hideSidebar, true);
  assert.equal(next.layout.blockShorts, true);
  assert.equal(next.layout.hideTopicChips, true);
  assert.equal(next.layout.hideLiveShelf, true);
  assert.equal(next.layout.hideMixesShelf, true);
  assert.equal(next.layout.hideNewsShelf, true);
  assert.equal(next.layout.hideComments, true);
  assert.equal(next.player.hideEndscreen, true);
});

test('profiles: Clean preset hides counts and switches to the minimal theme', () => {
  const next = profiles.applyPreset(defaults.cloneDefaults(), 'clean', defaults);
  assert.equal(next.player.hideLikeCount, true);
  assert.equal(next.player.hideViewCount, true);
  assert.equal(next.player.hideSubscriberCount, true);
  assert.equal(next.appearance.theme, 'minimal');
  assert.equal(next.recommendations.density, 'compact');
  assert.equal(next.layout.blockShorts, true);
});

test('profiles: Cinema preset opens theater on a full-width player', () => {
  const next = profiles.applyPreset(defaults.cloneDefaults(), 'cinema', defaults);
  assert.equal(next.player.defaultTheater, true);
  assert.equal(next.player.maxWidth, 0);
  assert.equal(next.player.customWidth, 0);
  assert.equal(next.sidebar.independentScroll, true);
});

test('profiles: Stock preset resets hiding to YouTube defaults', () => {
  const current = customSettings();
  current.layout.blockShorts = true;
  current.productivity.focusMode = true;
  current.player.hideEndscreen = true;
  const next = profiles.applyPreset(current, 'stock', defaults);
  assert.equal(next.layout.blockShorts, false);
  assert.equal(next.productivity.focusMode, false);
  assert.equal(next.player.hideEndscreen, false);
  assert.equal(next.appearance.theme, 'default');
});

test('profiles: a preset changes only what it names', () => {
  const current = customSettings();
  const next = profiles.applyPreset(current, 'focus', defaults);
  assert.equal(next.appearance.theme, 'midnight');
  assert.equal(next.playback.defaultSpeed, 1.5);
  assert.equal(next.playback.speedPresets.length, 7);
  assert.equal(next.keyboard.shortcuts.toggleFocus, 'Shift+F');
});

test('profiles: unknown preset id returns the current settings unchanged', () => {
  const current = customSettings();
  const next = profiles.applyPreset(current, 'nope', defaults);
  assert.deepEqual(next, current);
  assert.notEqual(next, current);
});

test('profiles: createProfile saves a migrated snapshot', () => {
  const current = customSettings();
  const result = profiles.createProfile('My Setup', current, [], defaults, 1234);
  assert.equal(result.error, undefined);
  assert.equal(result.profiles.length, 1);
  assert.equal(result.profiles[0].name, 'My Setup');
  assert.equal(result.profiles[0].createdAt, 1234);
  assert.equal(result.profiles[0].settings.appearance.theme, 'midnight');
  assert.equal(result.profiles[0].settings.playback.defaultSpeed, 1.5);
});

test('profiles: createProfile rejects empty, long, duplicate and built-in names', () => {
  const current = defaults.cloneDefaults();
  assert.match(profiles.createProfile('', current, [], defaults).error, /empty/);
  assert.match(profiles.createProfile('   ', current, [], defaults).error, /empty/);
  assert.match(profiles.createProfile('x'.repeat(41), current, [], defaults).error, /too long/);
  assert.match(profiles.createProfile('Focus', current, [], defaults).error, /built-in/);
  assert.match(profiles.createProfile('focus', current, [], defaults).error, /built-in/);
  const one = profiles.createProfile('Work', current, [], defaults).profiles;
  assert.match(profiles.createProfile('work', current, one, defaults).error, /already exists/);
  const trimmed = profiles.createProfile('  Work  ', current, one, defaults);
  assert.match(trimmed.error, /already exists/);
});

test('profiles: at most ten profiles can be saved', () => {
  const current = defaults.cloneDefaults();
  let list = [];
  for (let i = 0; i < profiles.MAX_PROFILES; i++) {
    const result = profiles.createProfile('P' + i, current, list, defaults);
    assert.equal(result.error, undefined);
    list = result.profiles;
  }
  assert.equal(list.length, 10);
  assert.match(profiles.createProfile('P10', current, list, defaults).error, /10/);
});

test('profiles: createProfile never mutates the input list', () => {
  const current = defaults.cloneDefaults();
  const one = profiles.createProfile('A', current, [], defaults).profiles;
  const two = profiles.createProfile('B', current, one, defaults).profiles;
  assert.equal(one.length, 1);
  assert.equal(two.length, 2);
});

test('profiles: applyProfile restores the snapshot exactly', () => {
  const saved = customSettings();
  const stored = profiles.createProfile('Mine', saved, [], defaults).profiles;
  const other = defaults.cloneDefaults();
  other.appearance.theme = 'light';
  other.playback.defaultSpeed = 2;
  const next = profiles.applyProfile(other, stored[0], defaults);
  assert.equal(next.appearance.theme, 'midnight');
  assert.equal(next.playback.defaultSpeed, 1.5);
  assert.equal(next.layout.hideComments, true);
});

test('profiles: applyProfile with a corrupt snapshot keeps current settings', () => {
  const current = customSettings();
  assert.deepEqual(profiles.applyProfile(current, null, defaults), current);
  assert.deepEqual(profiles.applyProfile(current, { settings: 'nope' }, defaults), current);
  assert.deepEqual(profiles.applyProfile(current, {}, defaults), current);
});

test('profiles: validateProfiles repairs stored data', () => {
  assert.deepEqual(profiles.validateProfiles('junk', defaults), []);
  assert.deepEqual(profiles.validateProfiles(null, defaults), []);
  const cleaned = profiles.validateProfiles(
    [
      { name: '  A  ', createdAt: 5, settings: { enabled: false } },
      { name: 'a', createdAt: 6, settings: {} },
      { name: '', settings: {} },
      { name: 'B', settings: 'nope' },
      { name: 'C', createdAt: 'soon', settings: { layout: { hideComments: 'yes' } } },
    ],
    defaults
  );
  assert.deepEqual(
    cleaned.map((p) => p.name),
    ['A', 'C']
  );
  assert.equal(cleaned[0].settings.enabled, false);
  assert.equal(cleaned[1].createdAt, 0);
  // A corrupt leaf type in the snapshot is repaired by migration.
  assert.equal(cleaned[1].settings.layout.hideComments, false);
});

test('profiles: renameProfile renames and rejects bad names', () => {
  const current = defaults.cloneDefaults();
  let list = profiles.createProfile('Old', current, [], defaults).profiles;
  list = profiles.createProfile('Other', current, list, defaults).profiles;
  const renamed = profiles.renameProfile(list, 'old', 'New Name', defaults);
  assert.equal(renamed.error, undefined);
  assert.deepEqual(
    renamed.profiles.map((p) => p.name),
    ['New Name', 'Other']
  );
  assert.match(profiles.renameProfile(list, 'Old', 'Other', defaults).error, /already exists/);
  assert.match(profiles.renameProfile(list, 'Old', '', defaults).error, /empty/);
  assert.match(profiles.renameProfile(list, 'Missing', 'X', defaults).error, /No profile/);
});

test('profiles: deleteProfile removes by name, case-insensitively', () => {
  const current = defaults.cloneDefaults();
  let list = profiles.createProfile('A', current, [], defaults).profiles;
  list = profiles.createProfile('B', current, list, defaults).profiles;
  assert.deepEqual(
    profiles.deleteProfile(list, 'a', defaults).map((p) => p.name),
    ['B']
  );
  assert.equal(profiles.deleteProfile(list, 'Missing', defaults).length, 2);
});

test('profiles: validateProfiles drops names that shadow built-in presets', () => {
  const cleaned = profiles.validateProfiles(
    [
      { name: 'Focus', createdAt: 1, settings: {} },
      { name: 'cinema', createdAt: 2, settings: {} },
      { name: 'My setup', createdAt: 3, settings: {} },
    ],
    defaults
  );
  assert.deepEqual(
    cleaned.map((p) => p.name),
    ['My setup']
  );
});

test('profiles: applyProfile keeps the current onboarded flag', () => {
  const saved = customSettings();
  saved.ui.onboarded = false;
  const stored = profiles.createProfile('Mine', saved, [], defaults).profiles;
  const current = defaults.cloneDefaults();
  current.ui.onboarded = true;
  const next = profiles.applyProfile(current, stored[0], defaults);
  assert.equal(next.ui.onboarded, true);
  // And the other way: a finished snapshot does not mark an
  // unfinished setup as done.
  const current2 = defaults.cloneDefaults();
  current2.ui.onboarded = false;
  const saved2 = customSettings();
  saved2.ui.onboarded = true;
  const stored2 = profiles.createProfile('Done', saved2, [], defaults).profiles;
  assert.equal(profiles.applyProfile(current2, stored2[0], defaults).ui.onboarded, false);
});
