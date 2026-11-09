/* OneYT — shared/onboarding.js
 *
 * Onboarding step machine (Phase 17, PL-17). Pure: no
 * chrome.* here, so unit tests can run it in Node.
 *
 * The welcome setup has three steps:
 *   1. 'preset' — pick a built-in preset (or keep YouTube
 *      as it is, which applies nothing).
 *   2. 'theme'  — pick the dashboard theme (System / Dark /
 *      Light). A theme choice is applied immediately, so the
 *      page itself re-themes as the user picks.
 *   3. 'done'   — finished; the page offers the full
 *      dashboard and closes itself.
 *
 * Skip and Finish both mark the setup done (ui.onboarded),
 * so the page never opens on its own again. The page JS
 * applies presets/themes through the existing pure
 * helpers (profiles.applyPreset, themes.resolveThemeVars)
 * and writes through the storage wrapper — this module
 * only decides what step comes next and when the setup is
 * complete.
 */
(function () {
  'use strict';

  var ONBOARDING_STEPS = ['preset', 'theme', 'done'];

  // The step after `step`, or null when the setup is over.
  // Unknown steps are treated as the start (never crash on
  // a bad value — the page just restarts the setup).
  function nextOnboardingStep(step) {
    var index = ONBOARDING_STEPS.indexOf(step);
    if (index === -1) return 'preset';
    if (index + 1 >= ONBOARDING_STEPS.length) return null;
    return ONBOARDING_STEPS[index + 1];
  }

  // True when the welcome setup is finished or skipped:
  // either the settings flag is set, or the page is
  // already past the last step.
  function isOnboardingComplete(settings, step) {
    if (settings && settings.ui && settings.ui.onboarded === true) return true;
    return step === 'done' || nextOnboardingStep(step) === null;
  }

  // The preset choice a step-1 click applies. 'keep' means
  // "Keep YouTube as it is" — no preset, nothing changes.
  // Unknown ids are treated as 'keep' (never apply a
  // preset the page does not know). The known ids come from
  // the presets module when the caller passes it, so a
  // renamed/added preset cannot silently go stale here;
  // the literal list is only the fallback for callers
  // (tests) that do not pass the API.
  function onboardingPresetId(choice, profilesApi) {
    if (choice === 'keep') return null;
    var known =
      profilesApi && Array.isArray(profilesApi.BUILTIN_PRESETS)
        ? profilesApi.BUILTIN_PRESETS.map(function (preset) {
            return preset.id;
          })
        : ['stock', 'focus', 'clean', 'cinema'];
    if (known.indexOf(choice) !== -1) return choice;
    return null;
  }

  // The dashboard theme a step-2 click applies. Unknown
  // values fall back to 'system' (the default).
  function onboardingTheme(choice) {
    if (choice === 'dark' || choice === 'light' || choice === 'system') return choice;
    return 'system';
  }

  var api = {
    ONBOARDING_STEPS: ONBOARDING_STEPS,
    nextOnboardingStep: nextOnboardingStep,
    isOnboardingComplete: isOnboardingComplete,
    onboardingPresetId: onboardingPresetId,
    onboardingTheme: onboardingTheme,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.onboarding = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
