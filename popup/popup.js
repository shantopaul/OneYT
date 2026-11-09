/* OneYT — popup/popup.js (final, Phase 5).
 *
 * Quick settings: master switch, page status, Focus Mode,
 * independent scroll, player module toggle, theme selector,
 * preset/profile picker, and the dashboard opener. Writes go straight to
 * chrome.storage.local, so open YouTube tabs apply them live
 * via storage.onChanged — no reload.
 *
 * Page status needs the active tab's URL, which is why the
 * manifest declares the "activeTab" permission (granted only
 * when the user opens the popup — nothing is read otherwise).
 */
(function () {
  'use strict';

  // Pure: describe a URL as a YouTube page (or not).
  function parsePageStatus(url) {
    if (typeof url !== 'string' || url === '') return { onYouTube: false, label: 'Not on YouTube' };
    var parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { onYouTube: false, label: 'Not on YouTube' };
    }
    var host = parsed.hostname || '';
    // Only a host the content script runs on counts — the
    // manifest covers *.youtube.com, so every YouTube
    // subdomain counts, not just www. The '.youtube.com'
    // suffix check (not a plain endsWith('youtube.com'))
    // keeps fakeyoutube.com out.
    var isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com');
    if (!isYouTube) {
      return { onYouTube: false, label: 'Not on YouTube' };
    }
    // YouTube Music is a different app: the extension runs
    // there, but OneYT's modules target youtube.com's DOM,
    // so the path labels below don't apply to it.
    if (host === 'music.youtube.com') {
      return { onYouTube: true, label: 'YouTube Music' };
    }
    var path = parsed.pathname || '/';
    if (path === '/watch') return { onYouTube: true, label: 'Watch page' };
    if (path === '/' || path === '') return { onYouTube: true, label: 'Home' };
    if (path.indexOf('/shorts') === 0) return { onYouTube: true, label: 'Shorts' };
    if (path.indexOf('/feed/subscriptions') === 0) {
      return { onYouTube: true, label: 'Subscriptions' };
    }
    if (path.indexOf('/feed/library') === 0 || path.indexOf('/feed/you') === 0) {
      return { onYouTube: true, label: 'Library' };
    }
    if (path.indexOf('/feed/history') === 0) return { onYouTube: true, label: 'History' };
    if (path.indexOf('/results') === 0) return { onYouTube: true, label: 'Search results' };
    return { onYouTube: true, label: 'YouTube' };
  }

  // Pure: resolve the dashboard theme setting to the
  // theme the popup actually shows. 'dark'/'light' force
  // one; anything else ('system' or a bad stored value)
  // follows the OS (prefers-color-scheme). Same logic as
  // the dashboard's resolveDashboardTheme and the
  // onboarding page's copy (Phase 19) — the codebase
  // keeps this 4-line function local rather than sharing
  // it across the three pages.
  function resolvePopupTheme(setting, prefersDark) {
    if (setting === 'dark') return 'dark';
    if (setting === 'light') return 'light';
    return prefersDark ? 'dark' : 'light';
  }

  var api = { parsePageStatus: parsePageStatus, resolvePopupTheme: resolvePopupTheme };
  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.popup = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // Browser wiring only.
  if (typeof document === 'undefined' || !document.getElementById('status')) {
    return;
  }

  var storage = ns.storage.createStorage();
  var defaultsApi = ns.defaults;
  var constants = ns.constants || {};
  var themes = ns.themes || {};
  var profilesApi = ns.profiles || null;
  var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';
  var PROFILES_KEY = constants.PROFILES_STORAGE_KEY || 'oneyt.profiles.v1';

  var statusEl = document.getElementById('status');
  var hintEl = document.getElementById('page-hint');
  var enabledEl = document.getElementById('enabled-toggle');
  var focusEl = document.getElementById('focus-toggle');
  var scrollEl = document.getElementById('scroll-toggle');
  var playerEl = document.getElementById('player-toggle');
  var themeEl = document.getElementById('theme-select');
  var presetEl = document.getElementById('preset-select');
  var savedProfiles = [];
  var dashboardBtn = document.getElementById('open-dashboard');

  (themes.THEME_NAMES || ['default']).forEach(function (name) {
    var option = document.createElement('option');
    option.value = name;
    option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    themeEl.appendChild(option);
  });

  // Apply the dashboard theme (Phase 19): the popup
  // follows ui.dashboardTheme, same as the dashboard.
  // Applied in render(), so it follows live storage
  // changes too (dashboard theme changed elsewhere).
  function applyPopupTheme(settings) {
    var theme = resolvePopupTheme(
      settings && settings.ui && settings.ui.dashboardTheme,
      typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function render(settings) {
    applyPopupTheme(settings);
    var enabled = !!settings.enabled;
    enabledEl.checked = enabled;
    focusEl.checked = !!(settings.productivity && settings.productivity.focusMode);
    scrollEl.checked = !!(settings.sidebar && settings.sidebar.independentScroll);
    playerEl.checked = !!(settings.modules && settings.modules.player);
    // An unknown stored theme (hand-edited import) used to
    // leave the select blank: fall back to 'default'
    // (appearance rendering already falls back the same way).
    var storedTheme = (settings.appearance && settings.appearance.theme) || 'default';
    var knownThemes = themes.THEME_NAMES || ['default'];
    themeEl.value = knownThemes.indexOf(storedTheme) !== -1 ? storedTheme : 'default';
    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.classList.toggle('on', enabled);
    statusEl.classList.toggle('off', !enabled);
    [focusEl, scrollEl, playerEl, themeEl, presetEl].forEach(function (control) {
      control.disabled = !enabled;
    });
  }

  // Preset / profile picker (Phase 16, PL-16). Values are
  // 'preset:<id>' for built-ins and 'profile:<name>' for
  // saved profiles; the select resets to the placeholder
  // after applying, so the same choice can be picked again.
  function renderPresetOptions() {
    if (!presetEl || !profilesApi) return;
    presetEl.textContent = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a preset or profile…';
    presetEl.appendChild(placeholder);
    profilesApi.BUILTIN_PRESETS.forEach(function (preset) {
      var option = document.createElement('option');
      option.value = 'preset:' + preset.id;
      option.textContent = preset.name;
      presetEl.appendChild(option);
    });
    savedProfiles.forEach(function (profile) {
      var option = document.createElement('option');
      option.value = 'profile:' + profile.name;
      option.textContent = profile.name + ' (profile)';
      presetEl.appendChild(option);
    });
    presetEl.value = '';
  }

  function loadProfiles() {
    if (!profilesApi) return Promise.resolve([]);
    return storage
      .get(PROFILES_KEY)
      .then(function (stored) {
        return profilesApi.validateProfiles(stored, defaultsApi);
      })
      .catch(function () {
        return [];
      });
  }

  function load() {
    return storage
      .get(STORAGE_KEY)
      .then(function (stored) {
        return defaultsApi.migrateSettings(stored);
      })
      .catch(function () {
        return defaultsApi.cloneDefaults();
      });
  }

  function update(path, value) {
    load()
      .then(function (settings) {
        var parts = path.split('.');
        var node = settings;
        for (var i = 0; i < parts.length - 1; i++) node = node[parts[i]];
        node[parts[parts.length - 1]] = value;
        return storage.set({ [STORAGE_KEY]: settings }).then(function () {
          render(settings);
        });
      })
      .catch(function () {
        load().then(render);
      });
  }

  enabledEl.addEventListener('change', function () {
    update('enabled', enabledEl.checked);
  });
  focusEl.addEventListener('change', function () {
    update('productivity.focusMode', focusEl.checked);
  });
  scrollEl.addEventListener('change', function () {
    update('sidebar.independentScroll', scrollEl.checked);
  });
  playerEl.addEventListener('change', function () {
    update('modules.player', playerEl.checked);
  });
  themeEl.addEventListener('change', function () {
    update('appearance.theme', themeEl.value);
  });
  presetEl.addEventListener('change', function () {
    var value = presetEl.value;
    if (!value || !profilesApi) return;
    load()
      .then(function (settings) {
        var next = settings;
        if (value.indexOf('preset:') === 0) {
          next = profilesApi.applyPreset(settings, value.slice(7), defaultsApi);
        } else if (value.indexOf('profile:') === 0) {
          var name = value.slice(8);
          var found = null;
          savedProfiles.forEach(function (profile) {
            if (profile.name === name) found = profile;
          });
          if (!found) return settings;
          next = profilesApi.applyProfile(settings, found, defaultsApi);
        }
        return storage.set({ [STORAGE_KEY]: next }).then(function () {
          render(next);
          return next;
        });
      })
      .catch(function () {
        return load().then(render);
      })
      .then(function () {
        presetEl.value = '';
      });
  });
  dashboardBtn.addEventListener('click', function () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  // Welcome setup (Phase 17): re-open the onboarding page
  // any time. If the setup was already finished, the page
  // shows its last step (open the dashboard) instead of
  // restarting.
  var onboardingBtn = document.getElementById('open-onboarding');
  if (onboardingBtn) {
    onboardingBtn.addEventListener('click', function () {
      if (
        typeof chrome !== 'undefined' &&
        chrome.tabs &&
        chrome.tabs.create &&
        chrome.runtime &&
        chrome.runtime.getURL
      ) {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;
      var change = changes && changes[STORAGE_KEY];
      if (change && change.newValue) {
        render(defaultsApi.migrateSettings(change.newValue));
      }
      if (changes && changes[PROFILES_KEY]) {
        loadProfiles().then(function (list) {
          savedProfiles = list;
          renderPresetOptions();
        });
      }
    });
  }

  // Follow the OS theme while the setting is 'system'
  // (Phase 19, same as the dashboard): if the user
  // flips the OS theme with the popup open, re-render.
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      load().then(render);
    });
  }

  // Page status from the active tab (activeTab permission).
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs && tabs[0];
      var status = parsePageStatus(tab && tab.url);
      hintEl.textContent = status.onYouTube
        ? 'OneYT is active here — ' + status.label + '.'
        : 'Open a YouTube page to see OneYT at work.';
    });
  }

  load().then(render);
  loadProfiles().then(function (list) {
    savedProfiles = list;
    renderPresetOptions();
  });
})();
