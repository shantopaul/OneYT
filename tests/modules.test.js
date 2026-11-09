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

// Default theater (Phase 14): a theater button with a click
// spy, and a mutable location so tests can navigate to a new
// video URL. The flexy starts without the theater attribute;
// tests set/remove it to simulate YouTube entering/exiting
// theater (the fake DOM has no MutationObserver, so the
// theater observer never fires here — apply() is called
// directly, which is exactly the re-apply path under test).
function theaterSetup(options) {
  const opts = options || {};
  const doc = createFakeDocument();
  const flexy = createFakeElement({ attrs: opts.theater ? { theater: '' } : {} });
  const container = createFakeElement({
    rect: { width: 800, height: 450, left: 100, top: 60 },
  });
  const moviePlayer = createFakeElement();
  const clicks = [];
  const theaterBtn = createFakeElement();
  theaterBtn.click = () => clicks.push('click');
  const loc = { href: opts.href || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
  const mod = createPlayerModule({
    dom: createFakeDom({
      watchFlexy: flexy,
      playerContainer: container,
      player: moviePlayer,
      theaterButton: theaterBtn,
    }),
    logger: quietLogger,
    document: doc,
    location: loc,
  });
  return { doc, flexy, loc, clicks, theaterBtn, mod };
}

// Late-button harness for the waitFor path: the theater
// button starts absent; the test decides when it arrives
// (state.btn) and when the wait resolves (state.resolveWait).
function lateButtonSetup() {
  const doc = createFakeDocument();
  const flexy = createFakeElement();
  const container = createFakeElement({
    rect: { width: 800, height: 450, left: 100, top: 60 },
  });
  const moviePlayer = createFakeElement();
  const clicks = [];
  const theaterBtn = createFakeElement();
  theaterBtn.click = () => clicks.push('click');
  const state = { btn: null, resolveWait: null };
  const dom = {
    query: (key) => {
      if (key === 'watchFlexy') return flexy;
      if (key === 'playerContainer') return container;
      if (key === 'player') return moviePlayer;
      if (key === 'theaterButton') return state.btn;
      return null;
    },
    waitFor: () =>
      new Promise((resolve) => {
        state.resolveWait = resolve;
      }),
  };
  const loc = { href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
  const mod = createPlayerModule({ dom, logger: quietLogger, document: doc, location: loc });
  return { doc, flexy, loc, clicks, theaterBtn, mod, state };
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

test('player: hide-count classes on/off on watch, in theater too', () => {
  const { doc, mod } = playerSetup();
  const on = settingsWith({
    player: { hideLikeCount: true, hideViewCount: true, hideSubscriberCount: true },
  });
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-like-count'), true);
  assert.equal(doc._root._classes.has('oneyt-player-hide-view-count'), true);
  assert.equal(doc._root._classes.has('oneyt-player-hide-subscriber-count'), true);
  // Off again restores everything — class-only hiding.
  mod.apply(settingsWith({ player: {} }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-like-count'), false);
  assert.equal(doc._root._classes.has('oneyt-player-hide-view-count'), false);
  assert.equal(doc._root._classes.has('oneyt-player-hide-subscriber-count'), false);
  // Theater: the counts live below the player, so the classes
  // stay set in theater just like the appearance classes.
  const theater = playerSetup({ theater: true });
  theater.mod.apply(on, 'watch');
  assert.equal(theater.doc._root._classes.has('oneyt-player-hide-like-count'), true);
  assert.equal(theater.doc._root._classes.has('oneyt-player-hide-view-count'), true);
  assert.equal(theater.doc._root._classes.has('oneyt-player-hide-subscriber-count'), true);
});

test('player: hide-count classes cleared off watch and in fullscreen', () => {
  const { doc, mod } = playerSetup();
  const on = settingsWith({
    player: { hideLikeCount: true, hideViewCount: true, hideSubscriberCount: true },
  });
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-hide-like-count'), true);
  mod.apply(on, 'home');
  assert.equal(doc._root._classes.has('oneyt-player-hide-like-count'), false);
  assert.equal(doc._root._classes.has('oneyt-player-hide-view-count'), false);
  assert.equal(doc._root._classes.has('oneyt-player-hide-subscriber-count'), false);
  mod.apply(on, 'watch');
  doc.fullscreenElement = createFakeElement();
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.size, 0);
});

test('player: accentColor sets the class + var on watch, in theater too', () => {
  const { doc, mod } = playerSetup();
  mod.apply(settingsWith({ player: { accentColor: '#00aaff' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-accent'), true);
  assert.equal(doc._root._vars.get('--oneyt-player-accent'), '#00aaff');
  // Clearing the colour restores YouTube red — no stale var.
  mod.apply(settingsWith({ player: { accentColor: '' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-accent'), false);
  assert.equal(doc._root._vars.has('--oneyt-player-accent'), false);
  // Theater: colour is appearance, not layout, so it stays.
  const theater = playerSetup({ theater: true });
  theater.mod.apply(settingsWith({ player: { accentColor: '#00aaff' } }), 'watch');
  assert.equal(theater.doc._root._classes.has('oneyt-player-accent'), true);
  assert.equal(theater.doc._root._vars.get('--oneyt-player-accent'), '#00aaff');
});

test('player: accentColor is cleared off watch pages and in fullscreen', () => {
  const { doc, mod } = playerSetup();
  const on = settingsWith({ player: { accentColor: '#00aaff' } });
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-accent'), true);
  mod.apply(on, 'home');
  assert.equal(doc._root._classes.has('oneyt-player-accent'), false);
  assert.equal(doc._root._vars.has('--oneyt-player-accent'), false);
  mod.apply(on, 'watch');
  doc.fullscreenElement = createFakeElement();
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.has('--oneyt-player-accent'), false);
});

test('player: invalid accentColor is treated as empty (YouTube red)', () => {
  const { doc, mod } = playerSetup();
  for (const bad of ['red', '#fff', '#gggggg', ' #00aaff ', 42]) {
    mod.apply(settingsWith({ player: { accentColor: bad } }), 'watch');
    assert.equal(doc._root._classes.has('oneyt-player-accent'), false, String(bad));
    assert.equal(doc._root._vars.has('--oneyt-player-accent'), false, String(bad));
  }
  // A valid colour after a bad one applies, and disable clears it.
  mod.apply(settingsWith({ player: { accentColor: '#00aaff' } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-player-accent'), true);
  mod.disable();
  assert.equal(doc._root._classes.has('oneyt-player-accent'), false);
  assert.equal(doc._root._vars.has('--oneyt-player-accent'), false);
});

test('player: defaultTheater clicks once on fresh watch entry, never twice', () => {
  const { flexy, mod, clicks } = theaterSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
  // YouTube enters theater after the click; re-applying
  // (settings change, theater observer) must not click again.
  flexy.setAttribute('theater', '');
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
});

test('player: defaultTheater does not click when already in theater', () => {
  const { mod, clicks } = theaterSetup({ theater: true });
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 0);
});

test('player: defaultTheater does not click off watch or in fullscreen', () => {
  const { doc, mod, clicks } = theaterSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'home');
  assert.equal(clicks.length, 0);
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'search');
  assert.equal(clicks.length, 0);
  doc.fullscreenElement = createFakeElement();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 0);
});

test('player: defaultTheater does not re-click after a manual exit', () => {
  const { flexy, mod, clicks } = theaterSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
  // YouTube enters theater, then the user exits it manually.
  flexy.setAttribute('theater', '');
  flexy.removeAttribute('theater');
  // The theater observer's re-apply must not click again.
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
});

test('player: defaultTheater clicks again for a new video URL', () => {
  const { loc, mod, clicks } = theaterSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
  // Same video again: no re-click.
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
  // New video (watch -> watch SPA navigation): clicks once more.
  loc.href = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 2);
});

test('player: defaultTheater applies immediately when turned on mid-video; off never exits theater', () => {
  const { flexy, mod, clicks } = theaterSetup();
  mod.apply(settingsWith({ player: { defaultTheater: false } }), 'watch');
  assert.equal(clicks.length, 0);
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 1);
  // Turning it off never exits theater: the attribute stays,
  // and no click happens on that path.
  flexy.setAttribute('theater', '');
  mod.apply(settingsWith({ player: { defaultTheater: false } }), 'watch');
  assert.equal(clicks.length, 1);
  assert.equal(flexy.hasAttribute('theater'), true);
});

test('player: defaultTheater clicks the button when it arrives late', async () => {
  const { loc, clicks, theaterBtn, mod, state } = lateButtonSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 0); // not there yet
  assert.notEqual(state.resolveWait, null); // a wait is pending
  state.btn = theaterBtn; // the button arrives
  state.resolveWait();
  await Promise.resolve(); // flush the waitFor .then
  await Promise.resolve();
  assert.equal(clicks.length, 1);
  assert.equal(loc.href, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('player: defaultTheater does not click a late button after navigating away', async () => {
  const { loc, clicks, theaterBtn, mod, state } = lateButtonSetup();
  mod.apply(settingsWith({ player: { defaultTheater: true } }), 'watch');
  assert.equal(clicks.length, 0);
  // The user navigates to another video before the button arrives.
  loc.href = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
  state.btn = theaterBtn;
  state.resolveWait();
  await Promise.resolve(); // flush the waitFor .then
  await Promise.resolve();
  assert.equal(clicks.length, 0);
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

test('layout: hideTopicChips sets the class on home only', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  mod.apply(settingsWith({ layout: { hideTopicChips: true } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-hide-topic-chips'), true);
  // Off again restores the bar — class-only hiding.
  mod.apply(settingsWith({ layout: { hideTopicChips: false } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-hide-topic-chips'), false);
  // Leaving home clears the class: watch and search never hide it.
  mod.apply(settingsWith({ layout: { hideTopicChips: true } }), 'home');
  mod.apply(settingsWith({ layout: { hideTopicChips: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-hide-topic-chips'), false);
  mod.apply(settingsWith({ layout: { hideTopicChips: true } }), 'home');
  mod.apply(settingsWith({ layout: { hideTopicChips: true } }), 'search');
  assert.equal(doc._root._classes.has('oneyt-hide-topic-chips'), false);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

test('layout: hideLiveShelf / hideMixesShelf / hideNewsShelf set the classes on home only', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  const on = settingsWith({
    layout: { hideLiveShelf: true, hideMixesShelf: true, hideNewsShelf: true },
  });
  mod.apply(on, 'home');
  assert.equal(doc._root._classes.has('oneyt-hide-live-shelf'), true);
  assert.equal(doc._root._classes.has('oneyt-hide-mixes-shelf'), true);
  assert.equal(doc._root._classes.has('oneyt-hide-news-shelf'), true);
  // Off again restores the rows — class-only hiding.
  mod.apply(settingsWith({ layout: {} }), 'home');
  assert.equal(doc._root._classes.has('oneyt-hide-live-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-mixes-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-news-shelf'), false);
  // Leaving home clears the classes: watch and search never hide them.
  mod.apply(on, 'home');
  mod.apply(on, 'watch');
  assert.equal(doc._root._classes.has('oneyt-hide-live-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-mixes-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-news-shelf'), false);
  mod.apply(on, 'home');
  mod.apply(on, 'search');
  assert.equal(doc._root._classes.has('oneyt-hide-live-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-mixes-shelf'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-news-shelf'), false);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

test('layout: homeMaxWidth sets the class + variable on home only', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  mod.apply(settingsWith({ layout: { homeMaxWidth: 1600 } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-home-max-width'), true);
  assert.equal(doc._root._vars.get('--oneyt-home-max-width'), '1600px');
  // 0 means YouTube default — no class, no variable.
  mod.apply(settingsWith({ layout: { homeMaxWidth: 0 } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-home-max-width'), false);
  assert.equal(doc._root._vars.has('--oneyt-home-max-width'), false);
  // Leaving home clears it: watch and search never cap the grid.
  mod.apply(settingsWith({ layout: { homeMaxWidth: 1600 } }), 'home');
  mod.apply(settingsWith({ layout: { homeMaxWidth: 1600 } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-home-max-width'), false);
  assert.equal(doc._root._vars.has('--oneyt-home-max-width'), false);
  mod.apply(settingsWith({ layout: { homeMaxWidth: 1600 } }), 'home');
  mod.apply(settingsWith({ layout: { homeMaxWidth: 1600 } }), 'search');
  assert.equal(doc._root._classes.has('oneyt-home-max-width'), false);
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

test('base.css must not define the "0 = default" width variables', () => {
  // The player/sidebar modules remove the inline variable when
  // the setting is 0, and their CSS rules fall back to none /
  // auto. A base value here would silently re-apply (maxWidth 0
  // used to cap the player at 1280px, customWidth 0 forced the
  // sidebar to 402px) — the documented promise would be a lie.
  const fs = require('node:fs');
  const path = require('node:path');
  const text = fs.readFileSync(
    path.join(__dirname, '..', 'content', 'styles', 'base.css'),
    'utf8'
  );
  assert.equal(text.includes('--oneyt-player-max-width:'), false);
  assert.equal(text.includes('--oneyt-sidebar-width:'), false);
});

test('player: mini-player config clears when it closes, re-applies on reopen', () => {
  const doc = createFakeDocument();
  const flexy = createFakeElement();
  const container = createFakeElement({
    rect: { width: 800, height: 450, left: 100, top: 60 },
  });
  const moviePlayer = createFakeElement();
  const state = { mini: null };
  const dom = {
    query: (key) => {
      if (key === 'watchFlexy') return flexy;
      if (key === 'playerContainer') return container;
      if (key === 'player') return moviePlayer;
      if (key === 'miniPlayer') return state.mini;
      return null;
    },
  };
  const mod = createPlayerModule({ dom, logger: quietLogger, document: doc });
  const settings = settingsWith();
  settings.player.miniPlayer = {
    size: 400,
    position: 'default',
    borderRadius: 0,
    shadow: 'none',
    offsetX: 0,
    offsetY: 0,
  };
  // Opens with size 400.
  state.mini = createFakeElement();
  mod.apply(settings, 'watch');
  assert.equal(doc._root._classes.has('oneyt-miniplayer-sized'), true);
  assert.equal(doc._root._vars.get('--oneyt-miniplayer-width'), '400px');
  // Closes: the same settings must not leave stale classes/vars
  // behind (the old code returned early here, so the reopen
  // observer saw no change and never re-applied).
  state.mini = null;
  mod.apply(settings, 'watch');
  assert.equal(doc._root._classes.has('oneyt-miniplayer-sized'), false);
  assert.equal(doc._root._vars.has('--oneyt-miniplayer-width'), false);
  // Reopens with a new size: the current config applies.
  state.mini = createFakeElement();
  settings.player.miniPlayer.size = 300;
  mod.apply(settings, 'watch');
  assert.equal(doc._root._classes.has('oneyt-miniplayer-sized'), true);
  assert.equal(doc._root._vars.get('--oneyt-miniplayer-width'), '300px');
});
