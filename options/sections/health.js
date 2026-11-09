// OneYT — dashboard section: Health.
// No settings controls of its own: the health record is
// runtime state (shared/health.js), not a setting, and
// is rendered by options.js as a special block
// (renderHealthTools), exactly like the Profiles tools.
// The section exists so search, nav and the section
// count stay complete, and so its description documents
// what the three statuses mean (Phase 18, PL-18).
(function () {
  'use strict';

  var section = {
    id: 'health',
    title: 'Health',
    description:
      'Whether OneYT is actually working against the YouTube ' +
      'you are looking at. Working means the selector matched ' +
      'on the live page; Not working means it should be there ' +
      'and is not — YouTube may have changed its layout; Not ' +
      'seen means the element only appears sometimes (a shelf ' +
      'YouTube did not show, the endscreen before the end of ' +
      'a video), so nothing is wrong. Visit YouTube and the ' +
      'check runs again on its own.',
    controls: [],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.health = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
