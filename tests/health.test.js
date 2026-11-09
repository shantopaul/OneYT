// OneYT — Phase 18 selector health tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const health = require('../shared/health');
const selectors = require('../shared/selectors');
const { createHealthModule, CHECK_DELAY_MS } = require('../content/modules/health/health');

function fakeExists(foundKeys) {
  const set = new Set(foundKeys);
  return function (key) {
    return set.has(key);
  };
}

test('health: every selector has metadata, and every metadata key is a real selector', () => {
  assert.deepEqual(
    Object.keys(health.SELECTOR_HEALTH).sort(),
    Object.keys(selectors.SELECTORS).sort()
  );
  Object.values(health.SELECTOR_HEALTH).forEach(function (meta) {
    assert.ok(Array.isArray(meta.pages) && meta.pages.length > 0);
    assert.equal(typeof meta.feature, 'string');
    assert.ok(meta.feature.length > 0);
    assert.ok(meta.presence === 'always' || meta.presence === 'sometimes');
  });
});

test('health: selectorsForPage returns the keys that live on that page', () => {
  const watch = health.selectorsForPage('watch');
  assert.ok(watch.includes('player'));
  assert.ok(watch.includes('theaterButton'));
  assert.ok(!watch.includes('topicChips'));
  const home = health.selectorsForPage('home');
  assert.ok(home.includes('topicChips'));
  assert.ok(home.includes('richGrid'));
  assert.ok(!home.includes('player'));
  assert.deepEqual(health.selectorsForPage('other'), []);
  assert.deepEqual(health.selectorsForPage('shorts'), []);
  assert.deepEqual(health.selectorsForPage('bogus'), []);
});

test('health: checkHealth marks each key ok or missing', () => {
  const record = health.checkHealth('watch', fakeExists(['player', 'video']), 1000);
  assert.equal(record.checkedAt, 1000);
  assert.equal(record.results.player, 'ok');
  assert.equal(record.results.video, 'ok');
  assert.equal(record.results.theaterButton, 'missing');
  // A throwing exists() counts as missing, never a crash.
  const throwing = health.checkHealth('home', function () {
    throw new Error('boom');
  });
  assert.equal(throwing.results.topicChips, 'missing');
});

test('health: validateHealthRecord repairs a stored record', () => {
  const now = Date.now();
  const clean = health.validateHealthRecord(
    {
      watch: { checkedAt: now, results: { player: 'ok', bogus: 'ok', theaterButton: 'weird' } },
      home: { checkedAt: now, results: { topicChips: 'missing' } },
      broken: 'not an object',
      stale: { checkedAt: 0, results: { player: 'ok' } },
      dateless: { results: { player: 'ok' } },
    },
    now
  );
  assert.deepEqual(clean, {
    watch: { checkedAt: now, results: { player: 'ok' } },
    home: { checkedAt: now, results: { topicChips: 'missing' } },
  });
  assert.deepEqual(health.validateHealthRecord(null), {});
  assert.deepEqual(health.validateHealthRecord('nope'), {});
});

test('health: summarizeHealth — unknown with no record, ok when all always-selectors match', () => {
  assert.equal(health.summarizeHealth({}).status, 'unknown');
  const now = Date.now();
  const allOk = health.checkHealth('watch', () => true, now);
  const summary = health.summarizeHealth({ watch: allOk });
  assert.equal(summary.status, 'ok');
  assert.equal(summary.checked.watch, now);
  assert.equal(summary.features.find((f) => f.feature === 'Video player').status, 'working');
  assert.equal(summary.features.find((f) => f.feature === 'Topic chips bar').status, 'unchecked');
});

test('health: summarizeHealth — a missing always-selector is broken, a missing sometimes-selector is not', () => {
  const now = Date.now();
  const broken = health.checkHealth('home', (key) => key !== 'topicChips', now);
  const summary = health.summarizeHealth({ home: broken });
  assert.equal(summary.status, 'broken');
  assert.equal(summary.features.find((f) => f.feature === 'Topic chips bar').status, 'broken');
  assert.equal(summary.features.find((f) => f.feature === 'Home feed grid').status, 'working');

  // Only sometimes-selectors missing: no alarm.
  const sometimesOnly = health.checkHealth(
    'home',
    (key) => key !== 'liveShelf' && key !== 'mixesShelf' && key !== 'newsShelf',
    now
  );
  const calm = health.summarizeHealth({ home: sometimesOnly });
  assert.equal(calm.status, 'ok');
  assert.equal(calm.features.find((f) => f.feature === 'Live shelf').status, 'not-seen');
  assert.equal(calm.features.find((f) => f.feature === 'Mixes shelf').status, 'not-seen');
});

test('health: module schedules one delayed check; same-page re-apply keeps the timer', async () => {
  const timers = [];
  let cleared = 0;
  const written = [];
  const store = {
    get: () => Promise.resolve(undefined),
    set: (items) => {
      written.push(items);
      return Promise.resolve();
    },
  };
  const dom = { query: (key) => (key === 'player' ? {} : null) };
  const mod = createHealthModule({
    dom,
    storage: store,
    health,
    constants: { HEALTH_STORAGE_KEY: 'oneyt.health.v1' },
    setTimeout: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
    clearTimeout: () => {
      cleared++;
    },
    now: () => 5000,
  });
  assert.equal(mod.id, 'health');
  mod.apply({}, 'watch');
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, CHECK_DELAY_MS);
  // Same page again (resize, slider drag): the pending timer
  // is kept, not restarted — otherwise continuous re-applies
  // would starve the check forever.
  mod.apply({}, 'watch');
  assert.equal(timers.length, 1);
  assert.equal(cleared, 0);
  // Navigation to another page reschedules for that page.
  mod.apply({}, 'home');
  assert.equal(timers.length, 2);
  assert.equal(cleared, 1);
  await timers[1].fn();
  // Flush the promise chain (get → validate → set).
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(written.length, 1);
  const record = written[0]['oneyt.health.v1'];
  assert.equal(record.home.checkedAt, 5000);
  assert.equal(record.home.results.topicChips, 'missing');
});

test('health: module skips pages with nothing to check and survives a failed write', async () => {
  const timers = [];
  const mod = createHealthModule({
    dom: { query: () => ({}) },
    storage: {
      get: () => Promise.resolve(undefined),
      set: () => Promise.reject(new Error('disk full')),
    },
    health,
    constants: { HEALTH_STORAGE_KEY: 'oneyt.health.v1' },
    setTimeout: (fn) => {
      timers.push(fn);
      return 1;
    },
    clearTimeout: () => {},
    now: () => 6000,
  });
  mod.apply({}, 'other');
  assert.equal(timers.length, 0);
  mod.apply({}, 'shorts');
  assert.equal(timers.length, 0);
  mod.apply({}, 'watch');
  assert.equal(timers.length, 1);
  await timers[0]();
  await Promise.resolve();
  await Promise.resolve();
  // No throw: a failed write is logged, never fatal.
  mod.disable();
});

test('health: wiring — manifest, index, dashboard section and scripts', () => {
  const root = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const js = manifest.content_scripts[0].js;
  assert.ok(js.includes('shared/health.js'));
  assert.ok(js.includes('content/modules/health/health.js'));
  assert.ok(js.indexOf('shared/health.js') < js.indexOf('content/modules/health/health.js'));
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
  const index = fs.readFileSync(path.join(root, 'content', 'index.js'), 'utf8');
  assert.ok(index.includes('ns.modules.health.createHealthModule'));
  const html = fs.readFileSync(path.join(root, 'options', 'options.html'), 'utf8');
  assert.ok(html.includes('src="../shared/health.js"'));
  assert.ok(html.includes('src="sections/health.js"'));
  const optionsJs = fs.readFileSync(path.join(root, 'options', 'options.js'), 'utf8');
  assert.ok(optionsJs.includes('renderHealthTools'));
  assert.ok(optionsJs.includes("'health'"));
  assert.ok(optionsJs.includes('healthApi: ns.health'));
  const section = require('../options/sections/health');
  assert.equal(section.id, 'health');
  assert.equal(section.title, 'Health');
  assert.deepEqual(section.controls, []);
});

test('health: validateHealthRecord drops unknown page types', () => {
  const now = Date.now();
  const clean = health.validateHealthRecord(
    {
      watch: { checkedAt: now, results: { player: 'ok' } },
      nowhere: { checkedAt: now, results: { player: 'ok' } },
    },
    now
  );
  assert.deepEqual(clean, { watch: { checkedAt: now, results: { player: 'ok' } } });
});
