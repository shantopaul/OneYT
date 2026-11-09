// OneYT — dashboard section: Profiles.
// No settings controls of its own: presets and custom
// profiles are rendered by options.js as a special block
// (renderProfilesTools), exactly like the Advanced tools.
// Profiles are not in DEFAULT_SETTINGS, so there is no
// control key to cover here — the section exists so
// search, nav and the section count stay complete, and so
// its description documents the preset/profile difference
// decided in Phase 16 (PL-16).
(function () {
  'use strict';

  var section = {
    id: 'profiles',
    title: 'Profiles',
    description:
      'One-click setups. A built-in preset changes only the ' +
      'settings it names — everything else you set stays. ' +
      'A custom profile saves your current settings as a ' +
      'snapshot and restores them exactly when you apply it. ' +
      'Profiles stay on this device and never sync.',
    controls: [],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.profiles = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
