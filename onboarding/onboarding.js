/* OneYT — onboarding/onboarding.js (welcome setup page, Phase 17).
 *
 * A 3-step wizard on a dedicated extension page:
 *   1. 'preset' — pick a built-in preset (or keep YouTube
 *      as it is). The choice applies immediately, so the
 *      user can open YouTube mid-setup and see it.
 *   2. 'theme'  — pick the dashboard theme. Applied
 *      immediately too — this page re-themes as they pick.
 *   3. 'done'   — finished; the button opens the full
 *      dashboard and closes this page.
 *
 * Skip (any step) and Finish both set ui.onboarded: true
 * and close the page, so it never opens on its own again.
 * The Continue button stays disabled until a card is
 * picked on steps 1–2 — a click with no choice would
 * silently apply nothing, and that is exactly the kind
 * of silent no-op this extension avoids.
 *
 * Storage writes go through the shared wrapper
 * (createStorage), the same one the dashboard uses; the
 * pure flow decisions live in shared/onboarding.js.
 * No chrome.* is touched at module load — the page only
 * runs when the DOM is ready.
 */
(function () {
  'use strict';

  var ns = globalThis.OneYT || {};
  var defaultsApi = ns.defaults;
  var profilesApi = ns.profiles;
  var onboardingApi = ns.onboarding;
  var constants = ns.constants || {};
  var STORAGE_KEY = constants.STORAGE_KEY || 'oneyt.settings.v1';

  function storage() {
    return ns.storage.createStorage();
  }

  function resolveDashboardTheme(setting, prefersDark) {
    if (setting === 'dark') return 'dark';
    if (setting === 'light') return 'light';
    return prefersDark ? 'dark' : 'light';
  }

  function systemPrefersDark() {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  function init() {
    var doc = document;
    if (!doc) return;
    if (!defaultsApi || !profilesApi || !onboardingApi || !ns.storage) {
      // A failed script load used to leave a blank page with
      // no explanation: say so in plain text.
      var errorEl = doc.getElementById('onboarding-steps');
      if (errorEl) {
        errorEl.textContent = 'OneYT could not load its setup scripts — please reload this page.';
      }
      return;
    }

    var step = 'preset';
    var settings = defaultsApi.cloneDefaults();
    var presetChoice = null;
    var themeChoice = null;

    var stepsEl = doc.getElementById('onboarding-steps');
    var nextBtn = doc.getElementById('onboarding-next');
    var skipBtn = doc.getElementById('onboarding-skip');
    var stepEls = {
      preset: doc.getElementById('step-preset'),
      theme: doc.getElementById('step-theme'),
      done: doc.getElementById('step-done'),
    };

    function applyTheme() {
      var theme = resolveDashboardTheme(settings.ui.dashboardTheme, systemPrefersDark());
      if (doc.documentElement) doc.documentElement.setAttribute('data-theme', theme);
    }

    function showStep(next) {
      step = next;
      var index = onboardingApi.ONBOARDING_STEPS.indexOf(step);
      if (stepsEl) stepsEl.textContent = 'Step ' + (index + 1) + ' of 3';
      Object.keys(stepEls).forEach(function (key) {
        if (stepEls[key]) stepEls[key].hidden = key !== step;
      });
      if (nextBtn) {
        // Continue stays disabled until a card is picked on
        // steps 1–2; on 'done' it always works.
        nextBtn.disabled =
          step === 'preset'
            ? presetChoice === null
            : step === 'theme'
              ? themeChoice === null
              : false;
        nextBtn.textContent =
          step === 'done' ? 'Open full dashboard' : step === 'theme' ? 'Finish' : 'Continue';
      }
      if (skipBtn) skipBtn.hidden = step === 'done';
    }

    function markChecked(group, el) {
      var cards = group.querySelectorAll('.onboarding-card');
      cards.forEach(function (card) {
        card.setAttribute('aria-checked', card === el ? 'true' : 'false');
      });
    }

    function save() {
      return storage().set({ [STORAGE_KEY]: settings });
    }

    function finish() {
      settings.ui.onboarded = true;
      save()
        .catch(function () {
          // Local remains the source of truth: a failed
          // write must not trap the user on this page.
        })
        .then(function () {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.getCurrent) {
            chrome.tabs.getCurrent(function (tab) {
              if (tab && tab.id !== undefined && chrome.tabs.remove) {
                chrome.tabs.remove(tab.id);
              } else if (typeof window !== 'undefined') {
                window.close();
              }
            });
          } else if (typeof window !== 'undefined') {
            window.close();
          }
        });
    }

    function openDashboard() {
      finish();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    }

    var presetCards = doc.getElementById('preset-cards');
    if (presetCards) {
      presetCards.addEventListener('click', function (event) {
        var card = event.target.closest ? event.target.closest('.onboarding-card') : null;
        if (!card) return;
        markChecked(presetCards, card);
        presetChoice = card.getAttribute('data-preset');
        var presetId = onboardingApi.onboardingPresetId(presetChoice, profilesApi);
        if (presetId) {
          settings = profilesApi.applyPreset(settings, presetId, defaultsApi);
        }
        save().catch(function () {});
        if (nextBtn) nextBtn.disabled = false;
      });
    }

    var themeCards = doc.getElementById('theme-cards');
    if (themeCards) {
      themeCards.addEventListener('click', function (event) {
        var card = event.target.closest ? event.target.closest('.onboarding-card') : null;
        if (!card) return;
        markChecked(themeCards, card);
        themeChoice = onboardingApi.onboardingTheme(card.getAttribute('data-theme'));
        settings.ui.dashboardTheme = themeChoice;
        applyTheme();
        save().catch(function () {});
        if (nextBtn) nextBtn.disabled = false;
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (step === 'done') {
          openDashboard();
          return;
        }
        var next = onboardingApi.nextOnboardingStep(step);
        if (next) showStep(next);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        finish();
      });
    }

    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)')
    ) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    }

    storage()
      .get(STORAGE_KEY)
      .then(function (stored) {
        settings = defaultsApi.migrateSettings(stored);
        if (onboardingApi.isOnboardingComplete(settings, 'preset')) {
          // Already finished or skipped (e.g. the popup
          // re-opened the page): show the last step, where
          // the button opens the dashboard. The theme must
          // be applied first — the old code returned before
          // applyTheme(), so the page stayed on the
          // pre-JS fallback theme.
          applyTheme();
          showStep('done');
          return;
        }
        applyTheme();
        showStep('preset');
      })
      .catch(function () {
        applyTheme();
        showStep('preset');
      });
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else if (typeof document !== 'undefined') {
    init();
  }
})();
