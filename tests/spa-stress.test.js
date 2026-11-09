// OneYT — Phase 6 SPA navigation stress test (node:test, fake DOM).
// 6.4: 20 navigations + back/forward + module toggling must not
// duplicate listeners, style tags, classes or variables.
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const constants = require('../shared/constants');
const { createFakeDocument, createFakeElement, createFakeDom, quietLogger } = require('./fake-dom');
const { createModuleManager } = require('../content/core/module-manager');
const { createSettingsManager } = require('../content/core/settings-manager');
const { createPageDetector } = require('../content/core/page-detector');
const { createEventBus } = require('../content/core/event-bus');
const { createApp } = require('../content/core/app');
const { createStorage } = require('../shared/storage');

const tick = (ms) => new Promise((resolve) => setTimeout(resolve, ms || 20));

function richSettings() {
  const s = defaults.cloneDefaults();
  s.player.customWidth = 900;
  s.player.miniPlayer = {
    size: 400,
    position: 'bottom-left',
    borderRadius: 12,
    shadow: 'none',
    offsetX: 10,
    offsetY: 10,
  };
  s.sidebar.independentScroll = true;
  s.layout.hideComments = true;
  s.layout.homeColumns = 4;
  s.appearance.theme = 'dark';
  s.appearance.customCSSEnabled = true;
  s.appearance.customCSS = 'ytd-rich-item-renderer { border: 1px solid red; }';
  s.productivity.focusMode = true;
  s.recommendations.density = 'compact';
  s.navigation.compact = true;
  s.playback.defaultSpeed = 1.5;
  s.playback.captionFontSize = 130;
  return s;
}

function buildModules(doc, dom, win, storage) {
  const mm = createModuleManager({ logger: quietLogger });
  const sidebar = require('../content/modules/sidebar/sidebar');
  const player = require('../content/modules/player/player');
  const layout = require('../content/modules/layout/layout');
  const appearance = require('../content/modules/appearance/appearance');
  const typography = require('../content/modules/typography/typography');
  const playback = require('../content/modules/playback/playback');
  const focus = require('../content/modules/focus/focus');
  const recommendations = require('../content/modules/recommendations/recommendations');
  const keyboard = require('../content/modules/keyboard/keyboard');
  const navigation = require('../content/modules/navigation/navigation');
  mm.register(sidebar.createSidebarModule({ dom, logger: quietLogger }));
  mm.register(player.createPlayerModule({ dom, logger: quietLogger, document: doc }));
  mm.register(layout.createLayoutModule({ logger: quietLogger, document: doc }));
  mm.register(appearance.createAppearanceModule({ dom, logger: quietLogger, document: doc }));
  mm.register(typography.createTypographyModule({ logger: quietLogger, document: doc }));
  mm.register(playback.createPlaybackModule({ dom, logger: quietLogger, document: doc, storage }));
  mm.register(focus.createFocusModule({ logger: quietLogger, document: doc }));
  mm.register(recommendations.createRecommendationsModule({ document: doc }));
  mm.register(
    keyboard.createKeyboardModule({
      dom,
      logger: quietLogger,
      window: win,
      settingsManager: { get: () => richSettings(), set: () => {} },
      actions: { toggleFocus: () => {} },
    })
  );
  mm.register(navigation.createNavigationModule({ logger: quietLogger, document: doc }));
  return mm;
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
  };
}

test('spa: 20 navigations leave no duplicate listeners, tags, classes or vars', async () => {
  const doc = createFakeDocument();
  const video = createFakeElement();
  video.playbackRate = 1;
  video.volume = 1;
  const player = createFakeElement();
  player.getAvailableQualityLevels = () => ['hd1080'];
  player.setPlaybackQuality = () => {};
  const styleTags = new Map();
  const baseDom = createFakeDom({
    video,
    player,
    watchFlexy: createFakeElement(),
    playerContainer: createFakeElement({ rect: { width: 800, height: 450, left: 0, top: 0 } }),
    miniPlayer: createFakeElement(),
    autonavToggle: createFakeElement({ attrs: { 'aria-pressed': 'true' } }),
    captionsButton: createFakeElement({ attrs: { 'aria-pressed': 'false' } }),
  });
  const dom = Object.assign({}, baseDom, {
    setStyle: (id, css) => {
      styleTags.set(id, css);
    },
    removeStyleTag: (id) => {
      styleTags.delete(id);
    },
  });
  const win = fakeWindow();
  const store = new Map();
  const storage = {
    get: async (key) => store.get(key),
    set: async (items) => {
      for (const key in items) store.set(key, items[key]);
    },
  };
  const mm = buildModules(doc, dom, win, storage);
  mm.initAll({});
  const settings = richSettings();

  const pages = [
    'watch',
    'home',
    'watch',
    'search',
    'watch',
    'shorts',
    'watch',
    'subscriptions',
    'watch',
    'home',
    'watch',
    'search',
    'watch',
    'home',
    'watch',
    'shorts',
    'watch',
    'home',
    'watch',
    'search',
  ];
  let firstWatchClasses = -1;
  let firstWatchVars = -1;
  for (let i = 0; i < pages.length; i++) {
    mm.updateAll(settings, pages[i]);
    await tick(10);
    if (pages[i] === 'watch' && firstWatchClasses === -1) {
      firstWatchClasses = doc._root._classes.size;
      firstWatchVars = doc._root._vars.size;
    }
    // Video listeners must never accumulate.
    assert.ok(
      (video._listeners.ratechange || []).length <= 1,
      'navigation ' + i + ': ratechange listeners = ' + (video._listeners.ratechange || []).length
    );
    assert.ok(
      (video._listeners.volumechange || []).length <= 1,
      'navigation ' +
        i +
        ': volumechange listeners = ' +
        (video._listeners.volumechange || []).length
    );
    // Style tags: one per module id, never duplicated.
    assert.ok(styleTags.size <= 2, 'navigation ' + i + ': style tags = ' + styleTags.size);
  }
  await tick(20);
  // Idempotent: returning to watch after 20 navigations looks
  // exactly like the 1st watch (same classes, same variables).
  mm.updateAll(settings, 'watch');
  await tick(20);
  assert.equal(doc._root._classes.size, firstWatchClasses);
  assert.equal(doc._root._vars.size, firstWatchVars);
  // Keyboard listener attached once.
  assert.equal((win._listeners.keydown || []).length, 1);

  // Back/forward: watch -> home -> watch restores watch state.
  mm.updateAll(settings, 'home');
  await tick(10);
  assert.equal(doc._root._classes.has('oneyt-caption-sized'), false);
  mm.updateAll(settings, 'watch');
  await tick(10);
  assert.equal(doc._root._classes.has('oneyt-caption-sized'), true);

  // Toggling modules off/on 10x: no growth after re-enable.
  const enabledClasses = doc._root._classes.size;
  const enabledVars = doc._root._vars.size;
  for (let i = 0; i < 10; i++) {
    const off = richSettings();
    off.enabled = false;
    mm.updateAll(off, 'watch');
    await tick(5);
    assert.equal(doc._root._classes.size, 0, 'toggle ' + i + ': classes not cleared');
    assert.equal(doc._root._vars.size, 0, 'toggle ' + i + ': vars not cleared');
    mm.updateAll(settings, 'watch');
    await tick(5);
  }
  assert.equal(doc._root._classes.size, enabledClasses);
  assert.equal(doc._root._vars.size, enabledVars);
  mm.destroy();
});

test('spa: app.init() twice attaches window listeners once', async () => {
  const doc = createFakeDocument();
  const win = fakeWindow();
  const area = (() => {
    const mem = {};
    return {
      get: (key) => Promise.resolve({ [key]: mem[key] }),
      set: (obj) => {
        Object.assign(mem, obj);
        return Promise.resolve();
      },
    };
  })();
  const app = createApp({
    logger: quietLogger,
    constants,
    settingsManager: createSettingsManager({
      storage: createStorage(area),
      defaults,
      constants,
      logger: quietLogger,
    }),
    pageDetector: createPageDetector({ constants, logger: quietLogger }),
    moduleManager: createModuleManager({ logger: quietLogger }),
    domManager: { query: () => null, queryAll: () => [], waitFor: async () => null },
    eventBus: createEventBus(quietLogger),
    document: doc,
    window: win,
  });
  await app.init();
  await app.init();
  assert.equal((win._listeners.resize || []).length, 1);
  assert.equal((win._listeners.fullscreenchange || []).length, 1);
  app.destroy();
  assert.equal((win._listeners.resize || []).length, 0);
  assert.equal((win._listeners.fullscreenchange || []).length, 0);
});
