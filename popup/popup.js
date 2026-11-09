/* OneYT — popup/popup.js (final, Phase 5).
 *
 * Quick settings: master switch, page status, Focus Mode,
 * independent scroll, player module toggle, theme selector,
 * and the dashboard opener. Writes go straight to
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
    } catch (err) {
      return { onYouTube: false, label: 'Not on YouTube' };
    }
    var host = parsed.hostname || '';
    // Only the host the content script runs on counts — e.g.
    // music.youtube.com is not a OneYT page.
    if (host !== 'www.youtube.com' && host !== 'youtube.com') {
      return { onYouTube: false, label: 'Not on YouTube' };
    }
    var path = parsed.pathname || '/';
    if (path === '/watch') return { onYouTube: true, label: 'Watch page' };
    if (path === '/' || path === '') return { onYouTube: true, label: 'Home' };
    if (path.indexOf('/shorts') === 0) return { onYouTube: true, label: 'Shorts' };
    if (path.indexOf('/feed/subscriptions') === 0)
      return { onYouTube: true, label: 'Subscriptions' };
    if (path.indexOf('/feed/library') === 0 || path.indexOf('/feed/you') === 0) {
      return { onYouTube: true, label: 'Library' };
    }
    if (path.indexOf('/feed/history') === 0) return { onYouTube: true, label: 'History' };
    if (path.indexOf('/results') === 0) return { onYouTube: true, label: 'Search results' };
    return { onYouTube: true, label: 'YouTube' };
  }

  var api = { parsePageStatus: parsePageStatus };
  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.popup = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // Browser wiring only.
  if (typeof document === 'undefined' || !document.getElementById('status')) return;

  var storage = ns.storage.createStorage();
  var defaultsApi = ns.defaults;
  var constants = ns.constants || {};
  var themes = ns.themes || {};
  var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';

  var statusEl = document.getElementById('status');
  var hintEl = document.getElementById('page-hint');
  var enabledEl = document.getElementById('enabled-toggle');
  var focusEl = document.getElementById('focus-toggle');
  var scrollEl = document.getElementById('scroll-toggle');
  var playerEl = document.getElementById('player-toggle');
  var themeEl = document.getElementById('theme-select');
  var dashboardBtn = document.getElementById('open-dashboard');

  (themes.THEME_NAMES || ['default']).forEach(function (name) {
    var option = document.createElement('option');
    option.value = name;
    option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    themeEl.appendChild(option);
  });

  function render(settings) {
    var enabled = !!settings.enabled;
    enabledEl.checked = enabled;
    focusEl.checked = !!(settings.productivity && settings.productivity.focusMode);
    scrollEl.checked = !!(settings.sidebar && settings.sidebar.independentScroll);
    playerEl.checked = !!(settings.modules && settings.modules.player);
    themeEl.value = (settings.appearance && settings.appearance.theme) || 'default';
    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.classList.toggle('on', enabled);
    statusEl.classList.toggle('off', !enabled);
    [focusEl, scrollEl, playerEl, themeEl].forEach(function (control) {
      control.disabled = !enabled;
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
  dashboardBtn.addEventListener('click', function () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;
      var change = changes && changes[STORAGE_KEY];
      if (change && change.newValue) {
        render(defaultsApi.migrateSettings(change.newValue));
      }
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
})();
