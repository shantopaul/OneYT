// OneYT — Phase 4 playback + speed-preset tests (node:test, fake DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../shared/defaults');
const validators = require('../shared/validators');
const { createFakeDocument, createFakeElement, createFakeDom, quietLogger } = require('./fake-dom');
const { createPlaybackModule } = require('../content/modules/playback/playback');

function settingsWith(patch) {
  const s = defaults.cloneDefaults();
  if (patch) {
    for (const [section, values] of Object.entries(patch)) {
      Object.assign(s[section], values);
    }
  }
  return s;
}

function mapStorage() {
  const store = new Map();
  return {
    store,
    get: async (k) => store.get(k),
    set: async (items) => {
      for (const k in items) store.set(k, items[k]);
    },
  };
}

function playbackSetup(storage) {
  const doc = createFakeDocument();
  const video = createFakeElement();
  video.playbackRate = 1;
  video.volume = 1;
  const player = createFakeElement();
  let qualitySet = null;
  player.getAvailableQualityLevels = () => ['hd1080', 'hd720', 'large'];
  player.setPlaybackQuality = (q) => {
    qualitySet = q;
  };
  const autonav = createFakeElement({ attrs: { 'aria-pressed': 'true' } });
  let autonavClicked = false;
  autonav.click = () => {
    autonavClicked = true;
  };
  const cc = createFakeElement({ attrs: { 'aria-pressed': 'false' } });
  let ccClicked = false;
  cc.click = () => {
    ccClicked = true;
  };
  const dom = createFakeDom({ video, player, autonavToggle: autonav, captionsButton: cc });
  const mod = createPlaybackModule({ dom, logger: quietLogger, document: doc, storage });
  return {
    doc,
    video,
    player,
    mod,
    quality: () => qualitySet,
    autonavClicked: () => autonavClicked,
    ccClicked: () => ccClicked,
  };
}

const tick = (ms) => new Promise((r) => setTimeout(r, ms || 20));

test('validators: speed presets — valid list cleaned, invalid dropped', () => {
  const ok = validators.validateSpeedPresets([2, 0.5, 1, 2]);
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.cleaned, [0.5, 1, 2]);
  const bad = validators.validateSpeedPresets([8, 'x', 0.1, 1.5]);
  assert.equal(bad.valid, false);
  assert.equal(bad.errors.length, 3);
  assert.deepEqual(bad.cleaned, [1.5]);
  assert.deepEqual(validators.validateSpeedPresets('nope').cleaned, []);
});

test('playback: defaults applied — speed, volume, quality, toggles', async () => {
  const storage = mapStorage();
  const t = playbackSetup(storage);
  t.mod.apply(
    settingsWith({
      playback: {
        defaultSpeed: 1.5,
        defaultVolume: 50,
        defaultQuality: '720p',
        autoplay: false,
        captions: true,
        captionFontSize: 130,
      },
    }),
    'watch'
  );
  await tick(30);
  assert.equal(t.video.playbackRate, 1.5);
  assert.equal(t.video.volume, 0.5);
  assert.equal(t.quality(), 'hd720');
  assert.equal(t.autonavClicked(), true);
  assert.equal(t.ccClicked(), true);
  assert.equal(t.doc._root._classes.has('oneyt-caption-sized'), true);
  assert.equal(t.doc._root._vars.get('--oneyt-caption-font-size'), '130%');
});

test('playback: unreadable toggle is never clicked blind', async () => {
  const storage = mapStorage();
  const doc = createFakeDocument();
  const video = createFakeElement();
  video.playbackRate = 1;
  video.volume = 1;
  const noState = createFakeElement();
  let clicked = false;
  noState.click = () => {
    clicked = true;
  };
  const dom = createFakeDom({ video, autonavToggle: noState, captionsButton: noState });
  const mod = createPlaybackModule({ dom, logger: quietLogger, document: doc, storage });
  mod.apply(settingsWith({ playback: { autoplay: false, captions: true } }), 'watch');
  await tick(30);
  assert.equal(clicked, false);
});

test('playback: quality falls back silently when the level is unavailable', async () => {
  const storage = mapStorage();
  const doc = createFakeDocument();
  const video = createFakeElement();
  video.playbackRate = 1;
  video.volume = 1;
  const player = createFakeElement();
  let qualitySet = null;
  player.getAvailableQualityLevels = () => ['hd720'];
  player.setPlaybackQuality = (q) => {
    qualitySet = q;
  };
  const dom = createFakeDom({ video, player });
  const mod = createPlaybackModule({ dom, logger: quietLogger, document: doc, storage });
  mod.apply(settingsWith({ playback: { defaultQuality: '1080p' } }), 'watch');
  await tick(30);
  assert.equal(qualitySet, null);
});

test('playback: remembered speed/volume survive to the next video', async () => {
  const storage = mapStorage();
  const t = playbackSetup(storage);
  t.mod.apply(settingsWith({ playback: { defaultSpeed: 1, defaultVolume: 100 } }), 'watch');
  await tick(30);
  // The user changes speed/volume by hand in the YouTube UI.
  t.video.playbackRate = 2;
  t.video.dispatch('ratechange');
  t.video.volume = 0.3;
  t.video.dispatch('volumechange');
  await tick(10);
  assert.equal(storage.store.get('oneyt.playback.lastSpeed'), 2);
  assert.equal(storage.store.get('oneyt.playback.lastVolume'), 30);

  // A new video element (next video): remembered values win.
  const doc2 = createFakeDocument();
  const video2 = createFakeElement();
  video2.playbackRate = 1;
  video2.volume = 1;
  const dom2 = createFakeDom({ video: video2 });
  const mod2 = createPlaybackModule({
    dom: dom2,
    logger: quietLogger,
    document: doc2,
    storage,
  });
  mod2.apply(settingsWith({ playback: { defaultSpeed: 1, defaultVolume: 100 } }), 'watch');
  await tick(30);
  assert.equal(video2.playbackRate, 2);
  assert.equal(video2.volume, 0.3);
});

test('playback: non-watch pages detach everything', async () => {
  const storage = mapStorage();
  const t = playbackSetup(storage);
  t.mod.apply(settingsWith({ playback: { captionFontSize: 130 } }), 'watch');
  await tick(30);
  assert.equal(t.doc._root._classes.has('oneyt-caption-sized'), true);
  t.mod.apply(settingsWith({}), 'home');
  assert.equal(t.doc._root._classes.has('oneyt-caption-sized'), false);
  t.mod.disable();
});
