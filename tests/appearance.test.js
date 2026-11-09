// OneYT — Phase 3 module tests (node:test, fake DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const themes = require('../shared/themes');
const validators = require('../shared/validators');
const { createFakeDocument, quietLogger } = require('./fake-dom');
const { createAppearanceModule } = require('../content/modules/appearance/appearance');
const { createTypographyModule } = require('../content/modules/typography/typography');
const { createLayoutModule } = require('../content/modules/layout/layout');

function settingsWith(patch) {
  const s = defaults.cloneDefaults();
  if (patch) {
    for (const [section, values] of Object.entries(patch)) {
      Object.assign(s[section], values);
    }
  }
  return s;
}

function appearanceSetup() {
  const doc = createFakeDocument();
  const styleCalls = { set: [], removed: [] };
  const dom = {
    setStyle: (id, css) => styleCalls.set.push({ id, css }),
    removeStyleTag: (id) => styleCalls.removed.push(id),
  };
  const warnings = [];
  const logger = {
    debug: () => {},
    info: () => {},
    warn: (m) => warnings.push(m),
    error: () => {},
  };
  const mod = createAppearanceModule({
    dom,
    logger,
    document: doc,
    themes,
    validators,
  });
  return { doc, styleCalls, warnings, mod };
}

// ---------- Appearance ----------

test('appearance: midnight theme sets OneYT + YouTube spec vars', () => {
  const { doc, mod } = appearanceSetup();
  mod.apply(settingsWith({ appearance: { theme: 'midnight' } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-themed'), true);
  assert.equal(doc._root._classes.has('oneyt-theme-midnight'), true);
  assert.equal(doc._root._vars.get('--oneyt-bg'), '#0a0e1a');
  assert.equal(doc._root._vars.get('--yt-spec-base-background'), '#0a0e1a');
  assert.equal(doc._root._vars.get('--oneyt-radius'), '12px');
});

test('appearance: switching themes removes the old theme class and vars', () => {
  const { doc, mod } = appearanceSetup();
  mod.apply(settingsWith({ appearance: { theme: 'midnight' } }), 'home');
  mod.apply(settingsWith({ appearance: { theme: 'light' } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-theme-midnight'), false);
  assert.equal(doc._root._classes.has('oneyt-theme-light'), true);
  assert.equal(doc._root._vars.get('--oneyt-bg'), '#ffffff');
  mod.apply(settingsWith({ appearance: { theme: 'default' } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-themed'), false);
  assert.equal(doc._root._vars.has('--oneyt-bg'), false);
  assert.equal(doc._root._vars.has('--yt-spec-base-background'), false);
});

test('appearance: custom colours override the preset, low contrast warns', () => {
  const { doc, warnings, mod } = appearanceSetup();
  mod.apply(
    settingsWith({
      appearance: { theme: 'dark', colors: { accent: '#00ff00' } },
    }),
    'home'
  );
  assert.equal(doc._root._vars.get('--oneyt-accent'), '#00ff00');
  assert.equal(doc._root._vars.get('--oneyt-bg'), '#0f0f0f');
  assert.equal(warnings.length, 0);
  mod.apply(
    settingsWith({
      appearance: {
        theme: 'custom',
        colors: { text: '#777777', background: '#888888' },
      },
    }),
    'home'
  );
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /contrast/);
});

test('appearance: custom CSS applied when valid, rejected when invalid', () => {
  const { styleCalls, mod } = appearanceSetup();
  mod.apply(
    settingsWith({
      appearance: { customCSSEnabled: true, customCSS: 'body { color: red; }' },
    }),
    'home'
  );
  assert.equal(styleCalls.set.length, 1);
  assert.equal(styleCalls.set[0].id, 'oneyt-custom-css');
  mod.apply(
    settingsWith({
      appearance: { customCSSEnabled: true, customCSS: '<script>alert(1)</script>' },
    }),
    'home'
  );
  assert.equal(styleCalls.set.length, 1);
  assert.equal(styleCalls.removed.includes('oneyt-custom-css'), true);
});

test('appearance: disable removes theme, radius and custom CSS', () => {
  const { doc, styleCalls, mod } = appearanceSetup();
  mod.apply(
    settingsWith({
      appearance: {
        theme: 'dark',
        customCSSEnabled: true,
        customCSS: 'body { color: red; }',
      },
    }),
    'home'
  );
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
  assert.equal(styleCalls.removed.includes('oneyt-custom-css'), true);
});

// ---------- Typography ----------

test('typography: family/size/weight/line-height set vars and class', () => {
  const doc = createFakeDocument();
  const mod = createTypographyModule({ logger: quietLogger, document: doc, themes });
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', fontSize: 120, fontWeight: 600, lineHeight: 1.6 },
      },
    }),
    'watch'
  );
  assert.equal(doc._root._classes.has('oneyt-typography'), true);
  assert.match(doc._root._vars.get('--oneyt-font-family'), /Georgia/);
  assert.equal(doc._root._vars.get('--oneyt-font-scale'), '1.2');
  assert.equal(doc._root._vars.get('--oneyt-font-weight'), '600');
  assert.equal(doc._root._vars.get('--oneyt-line-height'), '1.6');
});

test('typography: bad values are removed, never left stale', () => {
  const doc = createFakeDocument();
  const mod = createTypographyModule({ logger: quietLogger, document: doc, themes });
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', fontSize: 120, fontWeight: 600, lineHeight: 1.6 },
      },
    }),
    'watch'
  );
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Nope', fontSize: 500, fontWeight: 999, lineHeight: 9 },
      },
    }),
    'watch'
  );
  assert.equal(doc._root._classes.has('oneyt-typography'), false);
  assert.equal(doc._root._vars.size, 0);
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', fontSize: 120, fontWeight: 600, lineHeight: 1.6 },
      },
    }),
    'watch'
  );
  mod.disable();
  assert.equal(doc._root._classes.size, 0);
  assert.equal(doc._root._vars.size, 0);
});

test('typography: customFont wins over fontFamily, empty falls back to it', () => {
  const doc = createFakeDocument();
  const mod = createTypographyModule({ logger: quietLogger, document: doc, themes });
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', customFont: 'Hind Siliguri' },
      },
    }),
    'watch'
  );
  assert.equal(doc._root._vars.get('--oneyt-font-family'), '"Hind Siliguri", sans-serif');
  // Empty custom falls back to the select.
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', customFont: '' },
      },
    }),
    'watch'
  );
  assert.match(doc._root._vars.get('--oneyt-font-family'), /Georgia/);
});

test('typography: invalid customFont falls back to fontFamily, never applies raw', () => {
  const doc = createFakeDocument();
  const mod = createTypographyModule({ logger: quietLogger, document: doc, themes });
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Georgia', customFont: 'red; } body { color: red' },
      },
    }),
    'watch'
  );
  // Falls back to Georgia — the injected text never reaches the page.
  assert.match(doc._root._vars.get('--oneyt-font-family'), /Georgia/);
  assert.equal(doc._root._vars.get('--oneyt-font-family').includes('red;'), false);
  // Invalid custom + unknown family = YouTube default, nothing stale.
  mod.apply(
    settingsWith({
      appearance: {
        typography: { fontFamily: 'Nope', customFont: 'a,b' },
      },
    }),
    'watch'
  );
  assert.equal(doc._root._classes.has('oneyt-typography'), false);
  assert.equal(doc._root._vars.has('--oneyt-font-family'), false);
});

// ---------- Layout part 2 ----------

test('layout part 2: home columns/spacing/thumbnail/Shorts on home', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  mod.apply(
    settingsWith({
      layout: { homeColumns: 4, cardSpacing: 12, thumbnailSize: 320, hideShortsHome: true },
    }),
    'home'
  );
  assert.equal(doc._root._classes.has('oneyt-home-columns'), true);
  assert.equal(doc._root._classes.has('oneyt-card-spaced'), true);
  assert.equal(doc._root._classes.has('oneyt-thumb-sized'), true);
  assert.equal(doc._root._classes.has('oneyt-hide-shorts-home'), true);
  assert.equal(doc._root._vars.get('--oneyt-home-columns'), '4');
  assert.equal(doc._root._vars.get('--oneyt-card-spacing'), '12px');
  assert.equal(doc._root._vars.get('--oneyt-thumb-width'), '320px');
});

test('layout part 2: watch clears home rules, bad values ignored', () => {
  const doc = createFakeDocument();
  const mod = createLayoutModule({ document: doc });
  mod.apply(settingsWith({ layout: { homeColumns: 4, hideShortsHome: true } }), 'home');
  mod.apply(settingsWith({ layout: { hideComments: true, hideShortsWatch: true } }), 'watch');
  assert.equal(doc._root._classes.has('oneyt-home-columns'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-shorts-home'), false);
  assert.equal(doc._root._classes.has('oneyt-hide-comments'), true);
  assert.equal(doc._root._classes.has('oneyt-hide-shorts-watch'), true);
  mod.apply(settingsWith({ layout: { homeColumns: 99, thumbnailSize: 50 } }), 'home');
  assert.equal(doc._root._classes.has('oneyt-home-columns'), false);
  assert.equal(doc._root._classes.has('oneyt-thumb-sized'), false);
});

// ---------- Manager integration ----------

test('phase 3 modules register and run through the manager', () => {
  const doc = createFakeDocument();
  const styleCalls = { set: [], removed: [] };
  const fakeDom = {
    query: () => null,
    queryAll: () => [],
    waitFor: () => Promise.resolve(null),
    setStyle: (id) => styleCalls.set.push(id),
    removeStyleTag: (id) => styleCalls.removed.push(id),
  };
  const { createModuleManager } = require('../content/core/module-manager');
  const mm = createModuleManager({ logger: quietLogger });
  mm.register(
    createAppearanceModule({ dom: fakeDom, logger: quietLogger, document: doc, themes, validators })
  );
  mm.register(createTypographyModule({ logger: quietLogger, document: doc, themes }));
  mm.register(createLayoutModule({ document: doc }));
  assert.deepEqual(mm.listIds().sort(), ['appearance', 'layout', 'typography']);
  mm.initAll({});
  mm.updateAll(
    settingsWith({
      appearance: { theme: 'dark' },
      layout: { homeColumns: 3 },
    }),
    'home'
  );
  assert.equal(doc._root._classes.has('oneyt-themed'), true);
  assert.equal(doc._root._classes.has('oneyt-home-columns'), true);
  mm.destroy();
  assert.equal(doc._root._classes.size, 0);
});
