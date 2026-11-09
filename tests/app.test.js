// OneYT — app wiring smoke test (node:test, fake DOM/storage).
// Proves init() loads settings, detects the page, marks the
// document, and reports state — with no feature modules yet.
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const constants = require('../shared/constants');
const { createStorage } = require('../shared/storage');
const { createSettingsManager } = require('../content/core/settings-manager');
const { createPageDetector } = require('../content/core/page-detector');
const { createModuleManager } = require('../content/core/module-manager');
const { createDomManager } = require('../content/core/dom-manager');
const { createEventBus } = require('../content/core/event-bus');
const { createApp } = require('../content/core/app');

function fakeArea() {
  const mem = {};
  return {
    get: (key) => Promise.resolve({ [key]: mem[key] }),
    set: (obj) => {
      Object.assign(mem, obj);
      return Promise.resolve();
    },
  };
}

function fakeDocument() {
  const classes = new Set();
  return {
    documentElement: {
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
    },
    _classes: classes,
  };
}

const quietLogger = {
  debug: () => {},
  info: () => {},
  error: () => {},
  warn: () => {},
};

test('app init loads defaults, starts, and marks the document enabled', async () => {
  const doc = fakeDocument();
  const app = createApp({
    logger: quietLogger,
    constants,
    settingsManager: createSettingsManager({
      storage: createStorage(fakeArea()),
      defaults,
      constants,
      logger: quietLogger,
    }),
    pageDetector: createPageDetector({ constants, logger: quietLogger }),
    moduleManager: createModuleManager({ logger: quietLogger }),
    domManager: createDomManager({
      selectors: require('../shared/selectors'),
      constants,
      logger: quietLogger,
      document: doc,
    }),
    eventBus: createEventBus(quietLogger),
    document: doc,
    window: { addEventListener: () => {}, removeEventListener: () => {} },
  });
  await app.init();
  const state = app.getState();
  assert.equal(state.started, true);
  assert.equal(state.enabled, true);
  assert.equal(state.page, 'home'); // no location in Node -> base URL
  assert.deepEqual(state.modules, []); // Phase 1: no feature modules yet
  assert.equal(doc._classes.has('oneyt-enabled'), true);
  app.destroy();
  assert.equal(doc._classes.has('oneyt-enabled'), false);
  assert.equal(app.getState().started, false);
});

test('app init with stored enabled=false leaves the document unmarked', async () => {
  const doc = fakeDocument();
  const area = fakeArea();
  const stored = defaults.cloneDefaults();
  stored.enabled = false;
  area.set({ [constants.STORAGE_KEY]: stored });
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
    domManager: createDomManager({
      selectors: require('../shared/selectors'),
      constants,
      logger: quietLogger,
      document: doc,
    }),
    eventBus: createEventBus(quietLogger),
    document: doc,
    window: { addEventListener: () => {}, removeEventListener: () => {} },
  });
  await app.init();
  assert.equal(app.getState().enabled, false);
  assert.equal(doc._classes.has('oneyt-enabled'), false);
  app.destroy();
});
