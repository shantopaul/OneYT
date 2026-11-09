// OneYT — Phase 19 popup theme + channel Shorts tab tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const popup = require('../popup/popup');
const health = require('../shared/health');
const themes = require('../shared/themes');

test('popup theme: resolvePopupTheme forces dark/light, otherwise follows the OS', () => {
  assert.equal(popup.resolvePopupTheme('dark', false), 'dark');
  assert.equal(popup.resolvePopupTheme('dark', true), 'dark');
  assert.equal(popup.resolvePopupTheme('light', true), 'light');
  assert.equal(popup.resolvePopupTheme('light', false), 'light');
  assert.equal(popup.resolvePopupTheme('system', true), 'dark');
  assert.equal(popup.resolvePopupTheme('system', false), 'light');
  // A bad stored value follows the OS, never crashes.
  assert.equal(popup.resolvePopupTheme('bogus', true), 'dark');
  assert.equal(popup.resolvePopupTheme(null, false), 'light');
  assert.equal(popup.resolvePopupTheme(undefined, true), 'dark');
});

test('popup theme: popup.css carries the same light tokens as the dashboard', () => {
  const root = path.join(__dirname, '..');
  const popupCss = fs.readFileSync(path.join(root, 'popup', 'popup.css'), 'utf8');
  const optionsCss = fs.readFileSync(path.join(root, 'options', 'options.css'), 'utf8');
  // Every light token the dashboard pins must appear in
  // the popup too — in the pre-JS fallback AND in the
  // [data-theme='light'] block (so the two stay in sync).
  const tokens = [
    '#ffffff',
    '#f9f9f9',
    '#f0f0f0',
    '#e5e5e5',
    '#cccccc',
    '#0f0f0f',
    '#606060',
    '#6b6b6b',
    '#e6002e',
    '#cc0027',
    '#15803d',
  ];
  tokens.forEach(function (token) {
    const count = popupCss.split(token).length - 1;
    assert.ok(count >= 2, 'popup.css should carry ' + token + ' twice, found ' + count);
  });
  // The dark tokens stay too.
  [
    '#0f0f0f',
    '#181818',
    '#212121',
    '#2a2a2a',
    '#3d3d3d',
    '#f1f1f1',
    '#aaaaaa',
    '#9a9a9a',
    '#ff0033',
    '#22c55e',
  ].forEach(function (token) {
    assert.ok(popupCss.includes(token), 'popup.css lost dark token ' + token);
  });
  assert.ok(popupCss.includes(":root[data-theme='light']"));
  assert.ok(popupCss.includes('color-scheme: light'));
  assert.ok(popupCss.includes('color-scheme: dark'));
  // No hardcoded dark colour survives outside the token
  // blocks: body, rows, buttons all use var(--ui-*).
  assert.ok(!popupCss.includes('background: #0f0f0f;'));
  assert.ok(!popupCss.includes('background: #181818;'));
  // The popup uses the dashboard theme setting, not a new one.
  const popupJs = fs.readFileSync(path.join(root, 'popup', 'popup.js'), 'utf8');
  assert.ok(popupJs.includes('ui.dashboardTheme'));
  assert.ok(popupJs.includes("setAttribute('data-theme'"));
  assert.ok(popupJs.includes("matchMedia('(prefers-color-scheme: dark)')"));
  // The dashboard theme tokens in the popup match the
  // dashboard's own measured values (same source).
  assert.ok(optionsCss.includes('--ui-accent: #e6002e;'));
  assert.ok(popupCss.includes('--ui-accent: #e6002e;'));
});

test('popup theme: the dashboard theme select still resolves the same three values', () => {
  // The popup follows the setting the dashboard writes;
  // the setting itself is unchanged by this phase.
  const options = require('../options/options');
  const resolved = options.resolveSelectOptions('dashboardThemes', themes);
  assert.deepEqual(
    resolved.map((o) => o.value),
    ['system', 'dark', 'light']
  );
});

test('channel Shorts tab: selector, CSS rule, toggle copy and health metadata', () => {
  const root = path.join(__dirname, '..');
  const selectors = require('../shared/selectors');
  assert.equal(selectors.SELECTORS.channelShortsTab, "yt-tab-shape[tab-title='Shorts']");
  assert.equal(Object.keys(selectors.SELECTORS).length, 33); // 31 in v1.14 + playProgress + scrubberButton (v1.15 player accent)
  const css = fs.readFileSync(
    path.join(root, 'content', 'modules', 'layout', 'layout.css'),
    'utf8'
  );
  assert.ok(css.includes("yt-tab-shape[tab-title='Shorts']"));
  assert.ok(css.includes('html.oneyt-enabled.oneyt-block-shorts yt-tab-shape'));
  // The rule lives under the Block Shorts class — no new
  // setting, no new class, no module change.
  const layoutJs = fs.readFileSync(
    path.join(root, 'content', 'modules', 'layout', 'layout.js'),
    'utf8'
  );
  assert.ok(!layoutJs.includes('channelShortsTab'));
  const section = require('../options/sections/layout');
  const blockShorts = section.controls.find((c) => c.key === 'layout.blockShorts');
  assert.ok(blockShorts.description.includes('channel pages'));
  // Health: the tab is checked on channel pages only, and
  // only sometimes (not every channel has a Shorts tab),
  // so a missing tab never alarms.
  const meta = health.SELECTOR_HEALTH.channelShortsTab;
  assert.deepEqual(meta.pages, ['channel']);
  assert.equal(meta.presence, 'sometimes');
  assert.equal(meta.feature, 'Shorts tab (channel)');
  assert.deepEqual(health.selectorsForPage('channel'), ['channelShortsTab']);
  const now = Date.now();
  const record = health.checkHealth('channel', () => false, now);
  assert.equal(record.results.channelShortsTab, 'missing');
  const summary = health.summarizeHealth({ channel: record }, now);
  // A sometimes-only record cannot say "all OK" —
  // nothing was actually verified there (this is the
  // Phase 19 fix to the Phase 18 rule).
  assert.equal(summary.status, 'unknown');
  assert.equal(
    summary.features.find((f) => f.feature === 'Shorts tab (channel)').status,
    'not-seen'
  );
});
