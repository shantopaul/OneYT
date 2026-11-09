/* OneYT — playback module (Phase 4).
 *
 * Watch page only. Applies the user's playback preferences to
 * the <video> element and remembers speed/volume across videos
 * and restarts (chrome.storage.local, separate keys — never in
 * the settings object, so a settings import can't clobber them).
 *
 * Rules that keep this safe:
 * - Preferences are applied from apply() only (navigation or a
 *   settings change). The module NEVER re-applies on 'playing',
 *   so a speed the user set by hand is never fought over.
 * - 'ratechange' / 'volumechange' listeners only STORE what the
 *   user (or YouTube) chose; they never set anything back.
 * - Quality is best-effort: it goes through YouTube's own
 *   player API and only when the requested level is actually
 *   available; otherwise it logs and leaves YouTube alone.
 * - Autoplay and captions go through YouTube's own toggle
 *   buttons, read via aria-pressed, and are clicked ONLY when
 *   the current state differs from the desired one. If the
 *   state can't be read, nothing is clicked — never toggle blind.
 */
(function () {
  'use strict';

  var LAST_SPEED_KEY = 'oneyt.playback.lastSpeed';
  var LAST_VOLUME_KEY = 'oneyt.playback.lastVolume';

  // settings.playback.defaultQuality -> YouTube quality level.
  var QUALITY_MAP = {
    '1080p': 'hd1080',
    '720p': 'hd720',
    '480p': 'large',
    '360p': 'medium',
    '240p': 'small',
    '144p': 'tiny',
  };

  function createPlaybackModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || {
      debug: function () {},
      warn: function () {},
      error: function () {},
    };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var storage = deps.storage || null;

    var video = null;
    var lastSettings = null;
    var lastApplied = '';
    var remembered = { speed: undefined, volume: undefined };
    var rememberedLoaded = false;
    var rememberedPromise = null;
    var waitPending = false;

    function root() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function isValidSpeed(value) {
      return typeof value === 'number' && isFinite(value) && value >= 0.25 && value <= 4;
    }

    function loadRemembered() {
      if (rememberedLoaded) return Promise.resolve();
      if (rememberedPromise) return rememberedPromise;
      if (!storage) {
        rememberedLoaded = true;
        return Promise.resolve();
      }
      rememberedPromise = Promise.all([
        storage.get(LAST_SPEED_KEY).catch(function () {
          return undefined;
        }),
        storage.get(LAST_VOLUME_KEY).catch(function () {
          return undefined;
        }),
      ])
        .then(function (values) {
          if (isValidSpeed(values[0])) remembered.speed = values[0];
          if (
            typeof values[1] === 'number' &&
            isFinite(values[1]) &&
            values[1] >= 0 &&
            values[1] <= 100
          ) {
            remembered.volume = values[1];
          }
          rememberedLoaded = true;
        })
        .catch(function () {
          rememberedLoaded = true;
        });
      return rememberedPromise;
    }

    function storeSpeed(value) {
      remembered.speed = value;
      if (storage) {
        storage.set({ [LAST_SPEED_KEY]: value }).catch(function () {});
      }
    }

    function storeVolume(value) {
      remembered.volume = value;
      if (storage) {
        storage.set({ [LAST_VOLUME_KEY]: value }).catch(function () {});
      }
    }

    function onRateChange() {
      if (!video || !lastSettings) return;
      var pb = lastSettings.playback || {};
      if (pb.rememberSpeed && isValidSpeed(video.playbackRate)) {
        storeSpeed(video.playbackRate);
      }
    }

    function onVolumeChange() {
      if (!video || !lastSettings) return;
      var pb = lastSettings.playback || {};
      if (pb.rememberVolume && typeof video.volume === 'number') {
        storeVolume(Math.round(video.volume * 100));
      }
    }

    function attachListeners(el) {
      if (el.addEventListener) {
        el.addEventListener('ratechange', onRateChange);
        el.addEventListener('volumechange', onVolumeChange);
      }
    }

    function detachListeners(el) {
      if (el.removeEventListener) {
        el.removeEventListener('ratechange', onRateChange);
        el.removeEventListener('volumechange', onVolumeChange);
      }
    }

    // Click a YouTube toggle button only when its aria-pressed
    // state is readable and differs from what the user wants.
    // A non-boolean desired value (e.g. "yes" from a
    // hand-edited import that predates the migration
    // repair) must never click: (pressed === 'true') !==
    // "yes" is always true, so without this guard the
    // module would flip the toggle on every apply.
    function applyToggle(key, desired) {
      if (desired === null || desired === undefined) return;
      if (typeof desired !== 'boolean') return;
      var btn = dom ? dom.query(key) : null;
      if (!btn || typeof btn.getAttribute !== 'function') return;
      var pressed = btn.getAttribute('aria-pressed');
      if (pressed !== 'true' && pressed !== 'false') {
        logger.debug('playback: ' + key + ' state unreadable, left alone');
        return;
      }
      if ((pressed === 'true') !== desired) {
        if (typeof btn.click === 'function') btn.click();
      }
    }

    function applyQuality(settings) {
      var pb = settings.playback || {};
      if (!pb.defaultQuality || pb.defaultQuality === 'auto') return;
      var target = QUALITY_MAP[pb.defaultQuality];
      if (!target) return;
      var player = dom ? dom.query('player') : null;
      if (!player) return;
      try {
        if (
          typeof player.getAvailableQualityLevels !== 'function' ||
          typeof player.setPlaybackQuality !== 'function'
        ) {
          return;
        }
        var levels = player.getAvailableQualityLevels() || [];
        if (levels.indexOf(target) !== -1) {
          player.setPlaybackQuality(target);
        } else {
          logger.debug('playback: quality ' + pb.defaultQuality + ' not available');
        }
      } catch {
        logger.debug('playback: quality apply failed');
      }
    }

    function applyCaptionSize(settings) {
      var el = root();
      if (!el) return;
      var size = (settings.playback || {}).captionFontSize;
      if (typeof size === 'number' && size > 0) {
        // Clamp to the dashboard control's max (200%): a
        // hand-edited import bypasses the dashboard inputs,
        // and 10000% captions would fill the screen.
        var clamped = size > 200 ? 200 : size;
        el.classList.add('oneyt-caption-sized');
        el.style.setProperty('--oneyt-caption-font-size', clamped + '%');
      } else {
        el.classList.remove('oneyt-caption-sized');
        el.style.removeProperty('--oneyt-caption-font-size');
      }
    }

    function applyPrefs(el, settings) {
      var pb = settings.playback || {};
      var signature = JSON.stringify([
        pb.defaultSpeed,
        pb.rememberSpeed,
        remembered.speed,
        pb.defaultVolume,
        pb.rememberVolume,
        remembered.volume,
        pb.defaultQuality,
        pb.autoplay,
        pb.captions,
      ]);
      if (signature === lastApplied) return;
      lastApplied = signature;

      var speed =
        pb.rememberSpeed && isValidSpeed(remembered.speed) ? remembered.speed : pb.defaultSpeed;
      if (isValidSpeed(speed) && typeof el.playbackRate !== 'undefined') {
        el.playbackRate = speed;
      }
      var volume =
        pb.rememberVolume && typeof remembered.volume === 'number'
          ? remembered.volume
          : pb.defaultVolume;
      if (
        typeof volume === 'number' &&
        volume >= 0 &&
        volume <= 100 &&
        typeof el.volume !== 'undefined'
      ) {
        el.volume = volume / 100;
      }
      applyQuality(settings);
      applyToggle('autonavToggle', pb.autoplay);
      applyToggle('captionsButton', pb.captions);
    }

    function attach(el, settings) {
      if (video && video !== el) detachListeners(video);
      var isNew = video !== el;
      video = el;
      if (isNew) attachListeners(el);
      applyPrefs(el, settings);
    }

    function cleanup() {
      if (video) detachListeners(video);
      video = null;
      lastApplied = '';
      var el = root();
      if (el) {
        el.classList.remove('oneyt-caption-sized');
        el.style.removeProperty('--oneyt-caption-font-size');
      }
    }

    return {
      id: 'playback',
      init: function () {},
      apply: function (settings, page) {
        lastSettings = settings;
        if (!settings || !settings.playback || page !== 'watch') {
          cleanup();
          return;
        }
        applyCaptionSize(settings);
        if (!dom || video) {
          if (video) {
            loadRemembered().then(function () {
              if (video) applyPrefs(video, lastSettings);
            });
          }
          return;
        }
        if (waitPending) return;
        waitPending = true;
        dom
          .waitFor('video')
          .then(function (el) {
            waitPending = false;
            if (!el) return;
            loadRemembered().then(function () {
              attach(el, lastSettings);
            });
          })
          .catch(function () {
            waitPending = false;
          });
      },
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
      },
    };
  }

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.playback = { createPlaybackModule: createPlaybackModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPlaybackModule: createPlaybackModule };
  }
})();
