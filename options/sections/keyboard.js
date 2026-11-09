// OneYT — dashboard section: Keyboard.
// Configurable shortcuts. Duplicates and YouTube-native
// conflicts are warned about live by the renderer.
(function () {
  'use strict';

  var SHORTCUTS = [
    ['toggleFocus', 'Toggle Focus Mode', 'Focus Mode for the current tab only.'],
    ['toggleSidebar', 'Toggle sidebar', 'Show or hide the recommendations sidebar.'],
    ['togglePlayerPosition', 'Cycle player position', 'Default → sticky → fixed → absolute.'],
    ['speedUp', 'Speed up', 'Step to the next faster speed preset.'],
    ['speedDown', 'Speed down', 'Step to the next slower speed preset.'],
    ['resetSpeed', 'Reset speed', 'Back to the default speed.'],
    ['toggleTheater', 'Toggle theater mode', 'YouTube theater mode on/off.'],
  ].map(function (entry) {
    return {
      key: 'keyboard.shortcuts.' + entry[0],
      type: 'shortcut',
      label: entry[1],
      description: entry[2] + ' Click the field, then press the key combination. Empty = unbound.',
      keywords: ['keyboard', 'shortcut', 'key', entry[0]],
    };
  });

  var section = {
    id: 'keyboard',
    title: 'Keyboard',
    description: 'Custom keyboard shortcuts. Plain letters are YouTube-native keys — prefer Shift+ combinations.',
    controls: SHORTCUTS,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.keyboard = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
