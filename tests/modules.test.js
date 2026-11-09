// OneYT — Phase 2 module tests (node:test, fake DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const { createFakeElement, createFakeDocument, createFakeDom, quietLogger } = require('./fake-dom');
const { createSidebarModule } = require('../content/modules/sidebar/sidebar');
const { createPlayerModule } = require('../content/modules/player/player');
const { createLayoutModule, shortsWatchUrl } = require('../content/modules/layout/layout');

function settingsWith(patch) {
  const s = defaults.cloneDefaults();
  if (patch) {
    for (const [section, values] of Object.entries(patch)) {
      Object.assign(s[section], values);
    }
  }
  return s;
}

// ---------- Sidebar ----------

test('sidebar: watch + independent scroll sets classes and vars', () => {
  const doc = createFakeDocument();
  const secondary = createFakeElement();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary }),
    logger: quietLogger,
    document: doc,
  });
  mod.apply(settingsWith(), 'watch');
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), true);
  assert.equal(doc._root._vars.get('--oneyt-sidebar-width'), '402px');
  assert.equal(doc._root._vars.get('--oneyt-sidebar-max-height'), 'calc(100vh - 100px)');
});

test('sidebar: wheel sensitivity is clamped to 0.5–3 at apply time', () => {
  const doc = createFakeDocument();
  const secondary = createFakeElement();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary }),
    logger: quietLogger,
    document: doc,
  });
  // Stored 99 (e.g. from a hand-edited import) must not multiply
  // wheel deltas by 99 — it clamps to 3.
  mod.apply(settingsWith({ sidebar: { scrollSensitivity: 99 } }), 'watch');
  secondary.scrollTop = 0;
  secondary.dispatch('wheel', { deltaY: 10, preventDefault: () => {} });
  assert.equal(secondary.scrollTop, 30);
  // And a tiny value clamps up to 0.5.
  mod.apply(settingsWith({ sidebar: { scrollSensitivity: 0.01 } }), 'watch');
  secondary.scrollTop = 0;
  secondary.dispatch('wheel', { deltaY: 10, preventDefault: () => {} });
  assert.equal(secondary.scrollTop, 5);
});

test('sidebar: customWidth 0 removes the width var; non-watch removes classes', () => {
  const doc = createFakeDocument();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary: createFakeElement() }),
    logger: quietLogger,
    document: doc,
  });
  mod.apply(settingsWith({ sidebar: { customWidth: 0 } }), 'watch');
  assert.equal(doc._root._vars.has('--oneyt-sidebar-width'), false);
  mod.apply(settingsWith(), 'home');
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), false);
});

test('sidebar: fullscreen suspends scrolling; disable restores everything', () => {
  const doc = createFakeDocument();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary: createFakeElement() }),
    logger: quietLogger,
    document: doc,
  });
  mod.apply(settingsWith(), 'watch');
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), true);
  doc.fullscreenElement = createFakeElement();
  mod.apply(settingsWith(), 'watch');
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), false);
  doc.fullscreenElement = null;
  mod.apply(settingsWith(), 'watch');
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
});

test('sidebar: scrollbar hidden class; smooth class', () => {
  const doc = createFakeDocument();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary: createFakeElement() }),
    logger: quietLogger,
    document: doc,
  });
  mod.apply(settingsWith({ sidebar: { scrollbarVisible: false, smoothScroll: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-sidebar-hide-scrollbar'), true);
  assert.equal(doc._root._classes.has('oneyt-sidebar-smooth'), true);
});

test('sidebar: wheel handler scales scroll only when sensitivity != 1', () => {
  const doc = createFakeDocument();
  const secondary = createFakeElement();
  const mod = createSidebarModule({
    dom: createFakeDom({ secondary }),
    logger: quietLogger,
    document: doc,
  });
  mod.apply(settingsWith({ sidebar: { scrollSensitivity: 2 } }), 'watch');
  assert.equal((secondary._listeners.wheel || []).length, 1);
  let prevented = false;
  secondary.dispatch('wheel', {
    deltaY: 100,
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(secondary.scrollTop, 200);

  mod.apply(settingsWith({ sidebar: { scrollSensitivity: 1 } }), 'watch');
  assert.equal((secondary._listeners.wheel || []).length, 0);
});

// ---------- Player ----------

function playerSetup(options) {
  const opts = options || {};
  const doc = createFakeDocument();
  const flexy = createFakeElement({ attrs: opts.theater ? { theater: '' } : {} });
  const container = createFakeElement({
    rect: { width: 800, height: 450, left: 100, top: 60 },
  });
  const moviePlayer = createFakeElement();
  const mod = createPlayerModule({
    dom: createFakeDom({ watchFlexy: flexy, playerContainer: container, player: moviePlayer }),
    logger: quietLogger,
    document: doc,
  });
  return { doc, flexy, container, moviePlayer, mod };
}

test('player: custom width + right alignment set classes and vars', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { customWidth: 800, alignment: 'right' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-sized'), true);
  assert.equal(doc._root._classes.has('oneyt-player-align-right'), true);
  assert.equal(doc._root._vars.get('--oneyt-player-width'), '800px');
  assert.equal(doc._root._vars.get('--oneyt-player-max-width'), '1280px');
  assert.equal(doc._root._classes.has('oneyt-player-styled'), true);
});

test('player: absolute position measures the container', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { position: 'absolute' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-absolute'), true);
  assert.equal(doc._root._vars.get('--oneyt-player-fixed-width'), '800px');
  assert.equal(doc._root._vars.get('--oneyt-player-height'), '450px');
});

test('player: legacy sticky boolean maps to sticky position', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { sticky: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-sticky'), true);
});

test('player: theater skips sizing/position but keeps appearance', () => {
  const { doc, mod } = playerSetup({ theater: true });
  mod.apply(settingsWith({ player: { customWidth: 800, position: 'fixed' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-sized'), false);
  assert.equal(doc._root._classes.has('oneyt-player-fixed'), false);
  assert.equal(doc._root._classes.has('oneyt-player-styled'), true);
});

test('player: hideEndscreen sets the class on watch, in theater too', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-endscreen'), true);
  mod.apply(settingsWith({ player: { hideEndscreen: false } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-endscreen'), false);
  const theater = playerSetup({ theater: true });
  theater.mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'watch');
  assert.equal(theater.doc._root._classes.has('oneyt-player-hide-endscreen'), true);
});

test('player: hideEndscreen is cleared off watch pages and in fullscreen', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-endscreen'), true);
  mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-player-hide-endscreen'), false);
  mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'watch');
  doc.fullscreenElement = createFakeElement();
  mod.apply(settingsWith({ player: { hideEndscreen: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-endscreen'), false);
});

test('player: fullscreen removes all classes; disable restores everything', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { customWidth: 800, position: 'sticky' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-sticky'), true);
  doc.fullscreenElement = createFakeElement();
  mod.apply(settingsWith({ player: { customWidth: 800, position: 'sticky' } }), 'watch');
  assert.equal(doc._root._classes.size, 0);
  doc.fullscreenElement = null;
  mod.apply(settingsWith({ player: { customWidth: 800 } }), 'watch');
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
});

test('player: non-watch page applies nothing', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { customWidth: 800 } }), 'home');
  assert.equal(doc._root._classes.size, 0);
});

// ---------- Layout ----------

test('layout: shortsWatchUrl maps /shorts/VIDEOID to watch, nothing else', () => {
  assert.equal(shortsWatchUrl('/shorts/dQw4w9WgXcQ'), '/watch?v=dQw4w9WgXcQ');
  assert.equal(shortsWatchUrl('/shorts/dQw4w9WgXcQ/'), '/watch?v=dQw4w9WgXcQ');
  assert.equal(shortsWatchUrl('/shorts'), null);
  assert.equal(shortsWatchUrl('/shorts/'), null);
  assert.equal(shortsWatchUrl('/shorts/abc'), null); // not an 11-char video ID
  assert.equal(shortsWatchUrl('/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(shortsWatchUrl('/'), null);
  assert.equal(shortsWatchUrl(null), null);
});

test('layout: blockShorts sets the class on every page type and redirects off /shorts/', () => {
  const doc = createFakeDocument();
  const redirected = [];
  const mod = createLayoutModule({
    document: doc,
    location: { pathname: '/shorts/dQw4w9WgXcQ' },
    redirect: (url) => redirected.push(url),
  });
  // On a search page (the cleanup branch) the block class still applies.
  mod.apply(settingsWith({ layout: { blockShorts: true } }), 'search');
  assert.equal(doc._root._classes.has('oneyt-block-shorts'), true);
  assert.deepEqual(redirected, []); // not a shorts page: no redirect
  // On a shorts page it redirects to the normal watch URL.
  mod.apply(settingsWith({ layout: { blockShorts: true } }), 'shorts');
  assert.deepEqual(redirected, ['/watch?v=dQw4w9WgXcQ']);
  assert.equal(doc._root._classes.has('oneyt-block-shorts'), true);
  // Off: no class, no redirect.
  mod.apply(settingsWith({ layout: { blockShorts: false } }), 'shorts');
  assert.equal(doc._root._classes.has('oneyt-block-shorts'), false);
  assert.deepEqual(redirected, ['/watch?v=dQw4w9WgXcQ']);
  // disable() removes the class.
  mod.apply(settingsWith({ layout: { blockShorts: true } }), 'watch');
  mod.disable();
  assert.equal(doc._root._classes.has('oneyt-block-shorts'), false);
});

test('layout: hide comments + watch spacing on watch; cleanup elsewhere', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  mod.apply(settingsWith({ layout: { hideComments: true, watchSpacing: 24 } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-hide-comments'), true);
  assert.equal(doc._root._classes.has('oneyt-watch-spaced'), true);
  assert.equal(doc._root._vars.get('--oneyt-watch-spacing'), '24px');
  mod.apply(settingsWith(), 'home');
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
  mod.apply(settingsWith({ layout: { hideComments: true, watchSpacing: 24 } }), 'watch');
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

// ---------- Registration / manager integration ----------

test('all three Phase 2 modules register and run through the manager', () => {
  const doc = createFakeDocument();
  const dom = createFakeDom({
    secondary: createFakeElement(),
    watchFlexy: createFakeElement(),
    playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
    player: createFakeElement(),
  });
  const { createModuleManager } = require('../content/core/module-manager');
  const mm = createModuleManager({ logger: quietLogger });
  mm.register(createSidebarModule({ dom, logger: quietLogger, document: doc }));
  mm.register(createPlayerModule({ dom, logger: quietLogger, document: doc }));
  mm.register(createLayoutModule({ document: doc }));
  assert.deepEqual(mm.listIds().sort(), ['layout', 'player', 'sidebar']);
  mm.initAll({});
  mm.updateAll(settingsWith(), 'watch');
  assert.equal(mm.isEnabled('sidebar'), true);
  assert.equal(mm.isEnabled('player'), true);
  assert.equal(mm.isEnabled('layout'), true);
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), true);
  assert.equal(doc._root._classes.has('oneyt-player-styled'), true);
  mm.updateAll(settingsWith(), 'home');
  assert.equal(doc._root._classes.has('oneyt-sidebar-scroll'), false);
  mm.destroy();
});
