// OneYT — dashboard section: Advanced.
// No settings controls of its own: import/export, reset and
// sync info are rendered by options.js as special blocks.
// The section exists so search, nav and the section count stay
// complete, and so its description documents the sync scope
// decided in AD-08.
(function () {
  'use strict';

  var section = {
    id: 'advanced',
    title: 'Advanced',
    description:
      'Import/export, reset and sync. Sync is opt-in (AD-08): when ' +
      'enabled, your settings sync across browsers except Custom CSS ' +
      '(too large for sync limits — it stays on this device) and ' +
      'remembered speed/volume (per-device by design). Local storage ' +
      'stays the source of truth if a sync write fails.',
    controls: [
      {
        key: 'sync.enabled',
        type: 'toggle',
        label: 'Sync settings across browsers',
        description:
          'Mirror your settings to Chrome sync so other browsers signed into the same account get them. Custom CSS and remembered speed/volume never sync.',
        keywords: ['sync', 'cloud', 'devices', 'chrome sync'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.advanced = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
