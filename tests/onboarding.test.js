// OneYT — Phase 17 onboarding tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const profiles = require('../shared/profiles');
const onboarding = require('../shared/onboarding');

test('onboarding: steps are preset → theme → done, and done has no next step', () => {
  assert.deepEqual(onboarding.ONBOARDING_STEPS, ['preset', 'theme', 'done']);
  assert.equal(onboarding.nextOnboardingStep('preset'), 'theme');
  assert.equal(onboarding.nextOnboardingStep('theme'), 'done');
  assert.equal(onboarding.nextOnboardingStep('done'), null);
  assert.equal(onboarding.nextOnboardingStep('bogus'), 'preset');
});

test('onboarding: complete when the flag is set, or when past the last step', () => {
  const done = defaults.cloneDefaults();
  done.ui.onboarded = true;
  assert.equal(onboarding.isOnboardingComplete(done, 'preset'), true);
  const fresh = defaults.cloneDefaults();
  assert.equal(onboarding.isOnboardingComplete(fresh, 'preset'), false);
  assert.equal(onboarding.isOnboardingComplete(fresh, 'theme'), false);
  assert.equal(onboarding.isOnboardingComplete(fresh, 'done'), true);
  assert.equal(onboarding.isOnboardingComplete(null, 'preset'), false);
});

test('onboarding: preset choice resolves to a known id, or null for keep/unknown', () => {
  assert.equal(onboarding.onboardingPresetId('focus'), 'focus');
  assert.equal(onboarding.onboardingPresetId('stock'), 'stock');
  assert.equal(onboarding.onboardingPresetId('clean'), 'clean');
  assert.equal(onboarding.onboardingPresetId('cinema'), 'cinema');
  assert.equal(onboarding.onboardingPresetId('keep'), null);
  assert.equal(onboarding.onboardingPresetId('bogus'), null);
  assert.equal(onboarding.onboardingPresetId(null), null);
});

test('onboarding: theme choice resolves, unknown falls back to system', () => {
  assert.equal(onboarding.onboardingTheme('dark'), 'dark');
  assert.equal(onboarding.onboardingTheme('light'), 'light');
  assert.equal(onboarding.onboardingTheme('system'), 'system');
  assert.equal(onboarding.onboardingTheme('bogus'), 'system');
  assert.equal(onboarding.onboardingTheme(null), 'system');
});

test('onboarding: applying the chosen preset changes only what it names', () => {
  const current = defaults.cloneDefaults();
  current.appearance.theme = 'midnight';
  current.playback.defaultSpeed = 1.5;
  const next = profiles.applyPreset(current, onboarding.onboardingPresetId('focus'), defaults);
  assert.equal(next.productivity.focusMode, true);
  assert.equal(next.layout.blockShorts, true);
  // Untouched by the Focus preset: the user's own choices stay.
  assert.equal(next.appearance.theme, 'midnight');
  assert.equal(next.playback.defaultSpeed, 1.5);
});

test('onboarding: the welcome page opens on install only, never on update', () => {
  const fs = require('node:fs');
  const sw = fs.readFileSync(__dirname + '/../background/service-worker.js', 'utf8');
  assert.equal(sw.includes("details.reason !== 'install'"), true);
  assert.equal(sw.includes('onboarding/onboarding.html'), true);
  assert.equal(sw.includes('chrome.tabs.create'), true);
});

test('onboarding: the popup re-opens the welcome page', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(__dirname + '/../popup/popup.html', 'utf8');
  const js = fs.readFileSync(__dirname + '/../popup/popup.js', 'utf8');
  assert.equal(html.includes('id="open-onboarding"'), true);
  assert.equal(html.includes('Welcome setup'), true);
  assert.equal(js.includes('open-onboarding'), true);
  assert.equal(js.includes('onboarding/onboarding.html'), true);
});

test('onboarding: the welcome page reuses the preset copy from profiles', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(__dirname + '/../onboarding/onboarding.html', 'utf8');
  profiles.BUILTIN_PRESETS.forEach(function (preset) {
    assert.equal(html.includes('data-preset="' + preset.id + '"'), true);
    assert.equal(html.includes(preset.name), true);
  });
  assert.equal(html.includes('data-preset="keep"'), true);
  assert.equal(html.includes('data-theme="system"'), true);
  assert.equal(html.includes('data-theme="dark"'), true);
  assert.equal(html.includes('data-theme="light"'), true);
});
