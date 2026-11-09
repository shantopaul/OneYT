// OneYT — Phase 4 productivity tests (node:test, fake DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const { createFakeDocument, createFakeElement, createFakeDom, quietLogger } = require('./fake-dom');
const { createFocusModule } = require('../content/modules/focus/focus');
const {
  createRecommendationsModule,
} = require('../content/modules/recommendations/recommendations');
const { createPlayerModule } = require('../content/modules/player/player');
const keyboardApi = require('../content/modules/keyboard/keyboard');
const { createNavigationModule } = require('../content/modules/navigation/navigation');

function settingsWith(patch) {
  const s = defaults.cloneDefaults();
  if (patch) {
    for (const [section, values] of Object.entries(patch)) {
      Object.assign(s[section], values);
    }
  }
  return s;
}

function fakeWindow() {
  const listeners = {};
  return {
    _listeners: listeners,
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
    },
    dispatch: (type, event) => {
      (listeners[type] || []).forEach((fn) => fn(event));
    },
  };
}

function keyEvent(key, extra) {
  return Object.assign(
    {
      key,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: { tagName: 'BODY' },
      preventDefault: () => {},
      stopPropagation: () => {},
    },
    extra || {}
  );
}

// ---------- Focus ----------

test('focus: global on adds all flag classes; off removes them', () => {
  const doc = createFakeDocument();
  const mod = createFocusModule({ logger: quietLogger, document: doc });
  mod.apply(settingsWith({}), 'watch');
  assert.equal(doc._root._classes.has('oneyt-focus'), false);
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
  assert.equal(doc._root._classes.has('oneyt-focus-hide-comments'), true);
  assert.equal(doc._root._classes.has('oneyt-focus-hide-nav'), true);
  assert.equal(mod.isEffective(), true);
  mod.apply(settingsWith({ productivity: { focusMode: true, focusHideComments: false } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-focus-hide-comments'), false);
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

test('focus: per-tab toggle overrides the global setting, both ways', () => {
  const doc = createFakeDocument();
  const mod = createFocusModule({ logger: quietLogger, document: doc });
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'watch');
  assert.equal(mod.toggleTab(), false);
  assert.equal(doc._root._classes.has('oneyt-focus'), false);
  assert.equal(mod.toggleTab(), true);
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'search');
  assert.equal(doc._root._classes.has('oneyt-focus'), false);
});

// ---------- Recommendations ----------

test('recommendations: watch applies, home clears, bad cardSize ignored', () => {
  const doc = createFakeDocument();
  const mod = createRecommendationsModule({ document: doc });
  mod.apply(
    settingsWith({
      recommendations: {
        hideSidebar: true,
        density: 'compact',
        cardSize: 200,
        showMetadata: false,
      },
    }),
    'watch'
  );
  assert.equal(doc._root._classes.has('oneyt-rec-hide-sidebar'), true);
  assert.equal(doc._root._classes.has('oneyt-rec-compact'), true);
  assert.equal(doc._root._classes.has('oneyt-rec-card-sized'), true);
  assert.equal(doc._root._vars.get('--oneyt-rec-card-size'), '200px');
  mod.apply(settingsWith({}), 'home');
  assert.equal(doc._root._classes.size, 0);
  mod.apply(settingsWith({ recommendations: { cardSize: 999 } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-rec-card-sized'), false);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

// ---------- Mini-player ----------

test('mini-player: applies on any page, defaults clear everything', () => {
  const doc = createFakeDocument();
  const dom = createFakeDom({
    watchFlexy: createFakeElement(),
    playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
    player: createFakeElement(),
    miniPlayer: createFakeElement(),
  });
  const mod = createPlayerModule({ dom, logger: quietLogger, document: doc });
  mod.apply(
    settingsWith({
      player: {
        miniPlayer: {
          size: 400,
          position: 'top-left',
          borderRadius: 16,
          shadow: '0 4px 20px black',
          offsetX: 24,
          offsetY: 24,
        },
      },
    }),
    'home'
  );
  assert.equal(doc._root._classes.has('oneyt-miniplayer-sized'), true);
  assert.equal(doc._root._classes.has('oneyt-miniplayer-pos-top-left'), true);
  assert.equal(doc._root._classes.has('oneyt-miniplayer-styled'), true);
  assert.equal(doc._root._vars.get('--oneyt-miniplayer-width'), '400px');
  mod.apply(settingsWith({}), 'home');
  assert.equal([...doc._root._classes].filter((c) => c.includes('mini')).length, 0);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
});

// ---------- Keyboard ----------

test('keyboard: parsing, duplicates, native conflicts', () => {
  assert.deepEqual(keyboardApi.normalizeShortcut('Shift+F'), {
    ctrl: false,
    alt: false,
    shift: true,
    meta: false,
    key: 'F',
  });
  assert.equal(keyboardApi.normalizeShortcut(''), null);
  assert.equal(keyboardApi.normalizeShortcut('Ctrl+Foo+Bar'), null);
  // Tab and Escape are browser navigation keys, not bindable
  // shortcuts (Phase 6 bug bash: an imported 'Tab' would have
  // been bound and swallowed focus movement on every page).
  assert.equal(keyboardApi.normalizeShortcut('Tab'), null);
  assert.equal(keyboardApi.normalizeShortcut('Shift+Tab'), null);
  assert.equal(keyboardApi.normalizeShortcut('Escape'), null);
  assert.deepEqual(
    keyboardApi.findDuplicateShortcuts({ toggleFocus: 'Shift+F', toggleSidebar: 'Shift+F' }),
    [{ shortcut: 'Shift+F', actions: ['toggleFocus', 'toggleSidebar'] }]
  );
  assert.deepEqual(keyboardApi.findNativeConflicts({ toggleFocus: 'f' }), [
    { action: 'toggleFocus', shortcut: 'f', key: 'f' },
  ]);
  assert.deepEqual(keyboardApi.findNativeConflicts(settingsWith().keyboard.shortcuts), []);
});

test('keyboard: defaults fire their actions; typing is never hijacked', () => {
  const win = fakeWindow();
  const video = createFakeElement();
  video.playbackRate = 1;
  const theaterBtn = createFakeElement();
  let theaterClicked = false;
  theaterBtn.click = () => {
    theaterClicked = true;
  };
  const dom = createFakeDom({ video, theaterButton: theaterBtn });
  const setCalls = [];
  const s = settingsWith();
  const settingsManager = {
    get: () => s,
    set: (p, v) => {
      setCalls.push([p, v]);
      const parts = p.split('.');
      let node = s;
      for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
      node[parts[parts.length - 1]] = v;
    },
  };
  let focusToggled = 0;
  const mod = keyboardApi.createKeyboardModule({
    dom,
    logger: quietLogger,
    window: win,
    settingsManager,
    actions: {
      toggleFocus: () => {
        focusToggled++;
      },
    },
  });
  mod.init();
  mod.apply(s, 'watch');
  win.dispatch('keydown', keyEvent('F', { shiftKey: true }));
  assert.equal(focusToggled, 1);
  win.dispatch('keydown', keyEvent('>', { shiftKey: true }));
  assert.equal(video.playbackRate, 1.25);
  win.dispatch('keydown', keyEvent('R', { shiftKey: true }));
  assert.equal(video.playbackRate, 1);
  win.dispatch('keydown', keyEvent('T', { shiftKey: true }));
  assert.equal(theaterClicked, true);
  win.dispatch('keydown', keyEvent('S', { shiftKey: true }));
  assert.deepEqual(setCalls[0], ['modules.sidebar', false]);
  win.dispatch('keydown', keyEvent('P', { shiftKey: true }));
  assert.deepEqual(
    setCalls.filter((c) => c[0] === 'player.position'),
    [['player.position', 'sticky']]
  );
  win.dispatch('keydown', keyEvent('f', { target: { tagName: 'INPUT' } }));
  assert.equal(focusToggled, 1);
  mod.disable();
  win.dispatch('keydown', keyEvent('F', { shiftKey: true }));
  assert.equal(focusToggled, 1);
});

test('keyboard: duplicate bindings — first action wins', () => {
  const win = fakeWindow();
  const dom = createFakeDom({ video: createFakeElement() });
  let focusToggled = 0;
  const s = settingsWith({
    keyboard: { shortcuts: { toggleFocus: 'Shift+F', toggleSidebar: 'Shift+F' } },
  });
  const mod = keyboardApi.createKeyboardModule({
    dom,
    logger: quietLogger,
    window: win,
    settingsManager: { get: () => s, set: () => {} },
    actions: {
      toggleFocus: () => {
        focusToggled++;
      },
    },
  });
  mod.init();
  mod.apply(s, 'watch');
  win.dispatch('keydown', keyEvent('F', { shiftKey: true }));
  assert.equal(focusToggled, 1);
});

// ---------- Navigation ----------

test('navigation: hide entries, compact, guide width; disable restores', () => {
  const doc = createFakeDocument();
  const mod = createNavigationModule({ logger: quietLogger, document: doc });
  mod.apply(
    settingsWith({
      navigation: { hideHome: true, hideShorts: true, compact: true, guideWidth: 300 },
    }),
    'home'
  );
  assert.equal(doc._root._classes.has('oneyt-nav-hide-home'), true);
  assert.equal(doc._root._classes.has('oneyt-nav-hide-shorts'), true);
  assert.equal(doc._root._classes.has('oneyt-nav-compact'), true);
  assert.equal(doc._root._vars.get('--oneyt-guide-width'), '300px');
  mod.apply(settingsWith({ navigation: { guideWidth: 50 } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-nav-wide'), false);
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
});

// ---------- Manager integration ----------

test('phase 4 modules register and run through the manager', () => {
  const doc = createFakeDocument();
  const dom = createFakeDom({
    video: createFakeElement(),
    player: createFakeElement(),
    watchFlexy: createFakeElement(),
    playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
    miniPlayer: createFakeElement(),
  });
  const win = fakeWindow();
  const { createModuleManager } = require('../content/core/module-manager');
  const { createPlaybackModule } = require('../content/modules/playback/playback');
  const store = new Map();
  const storage = {
    get: async (k) => store.get(k),
    set: async (items) => {
      for (const k in items) store.set(k, items[k]);
    },
  };
  const mm = createModuleManager({ logger: quietLogger });
  mm.register(createPlaybackModule({ dom, logger: quietLogger, document: doc, storage }));
  mm.register(createFocusModule({ logger: quietLogger, document: doc }));
  mm.register(createRecommendationsModule({ document: doc }));
  mm.register(createPlayerModule({ dom, logger: quietLogger, document: doc }));
  mm.register(
    keyboardApi.createKeyboardModule({
      dom,
      logger: quietLogger,
      window: win,
      settingsManager: { get: () => settingsWith(), set: () => {} },
      actions: { toggleFocus: () => {} },
    })
  );
  mm.register(createNavigationModule({ logger: quietLogger, document: doc }));
  assert.deepEqual(mm.listIds().sort(), [
    'focus',
    'keyboard',
    'navigation',
    'playback',
    'player',
    'recommendations',
  ]);
  mm.initAll({});
  mm.updateAll(
    settingsWith({
      productivity: { focusMode: true },
      player: { miniPlayer: { size: 400, position: 'bottom-left' } },
    }),
    'watch'
  );
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
  assert.equal(doc._root._classes.has('oneyt-miniplayer-sized'), true);
  mm.destroy();
});

test('focus: per-tab override resets on navigation', () => {
  const doc = createFakeDocument();
  const mod = createFocusModule({ logger: quietLogger, document: doc });
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'watch');
  assert.equal(mod.isEffective(), true);
  mod.toggleTab(); // per-tab off
  assert.equal(mod.isEffective(), false);
  assert.equal(doc._root._classes.has('oneyt-focus'), false);
  // Navigate to home: the override clears and the global
  // setting rules again.
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'home');
  assert.equal(mod.isEffective(), true);
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
  // Back to watch: still the global setting, not the stale
  // override.
  mod.apply(settingsWith({ productivity: { focusMode: true } }), 'watch');
  assert.equal(mod.isEffective(), true);
  assert.equal(doc._root._classes.has('oneyt-focus'), true);
});

test('keyboard: held toggle shortcut is swallowed on repeats, action runs once', () => {
  const win = fakeWindow();
  const dom = createFakeDom({ video: createFakeElement() });
  let focusToggled = 0;
  const s = settingsWith();
  const mod = keyboardApi.createKeyboardModule({
    dom,
    logger: quietLogger,
    window: win,
    settingsManager: { get: () => s, set: () => {} },
    actions: {
      toggleFocus: () => {
        focusToggled++;
      },
    },
  });
  mod.init();
  mod.apply(s, 'watch');
  let prevented = 0;
  let stopped = 0;
  const repeatEvent = () =>
    keyEvent('F', {
      shiftKey: true,
      repeat: true,
      preventDefault: () => {
        prevented++;
      },
      stopPropagation: () => {
        stopped++;
      },
    });
  win.dispatch('keydown', keyEvent('F', { shiftKey: true }));
  assert.equal(focusToggled, 1);
  // Holding the shortcut: the action must not re-run, but the
  // event must still be swallowed so YouTube never sees the
  // repeats (the old code returned before preventDefault).
  win.dispatch('keydown', repeatEvent());
  win.dispatch('keydown', repeatEvent());
  assert.equal(focusToggled, 1);
  assert.equal(prevented, 2);
  assert.equal(stopped, 2);
});
