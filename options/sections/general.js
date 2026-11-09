// OneYT — dashboard section: General.
// Master switch + per-module toggles. Disabling one module
// never affects the others (module-manager failure isolation).
(function () {
  'use strict';

  var section = {
    id: 'general',
    title: 'General',
    description: 'Master switch and per-module toggles.',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Extension enabled',
        description: 'Turn all OneYT customisation on or off. When off, YouTube is untouched.',
        keywords: ['enable', 'disable', 'on', 'off', 'master'],
      },
      {
        key: 'modules.player',
        type: 'toggle',
        label: 'Player module',
        description: 'Video player size, position and appearance.',
        keywords: ['player', 'video'],
      },
      {
        key: 'modules.sidebar',
        type: 'toggle',
        label: 'Sidebar module',
        description: 'Independent scrolling recommendation sidebar.',
        keywords: ['sidebar', 'recommendations', 'scroll'],
      },
      {
        key: 'modules.layout',
        type: 'toggle',
        label: 'Layout module',
        description: 'Watch-page and homepage layout tweaks.',
        keywords: ['layout', 'comments', 'spacing', 'grid'],
      },
      {
        key: 'modules.appearance',
        type: 'toggle',
        label: 'Appearance module',
        description: 'Themes, colours, radius and custom CSS.',
        keywords: ['theme', 'colour', 'color', 'appearance'],
      },
      {
        key: 'modules.typography',
        type: 'toggle',
        label: 'Typography module',
        description: 'Fonts for titles, descriptions and comments.',
        keywords: ['font', 'typography', 'text'],
      },
      {
        key: 'modules.playback',
        type: 'toggle',
        label: 'Playback module',
        description: 'Speed, volume, quality, autoplay and captions.',
        keywords: ['playback', 'speed', 'volume', 'quality'],
      },
      {
        key: 'modules.recommendations',
        type: 'toggle',
        label: 'Recommendations module',
        description: 'Sidebar recommendations: density, size, metadata.',
        keywords: ['recommendations', 'sidebar'],
      },
      {
        key: 'modules.focus',
        type: 'toggle',
        label: 'Focus Mode module',
        description: 'One-click distraction hiding.',
        keywords: ['focus', 'distraction'],
      },
      {
        key: 'modules.keyboard',
        type: 'toggle',
        label: 'Keyboard module',
        description: 'Custom keyboard shortcuts.',
        keywords: ['keyboard', 'shortcuts', 'keys'],
      },
      {
        key: 'modules.navigation',
        type: 'toggle',
        label: 'Navigation module',
        description: 'Guide entries, compact mode, guide width.',
        keywords: ['navigation', 'guide', 'menu'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.general = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
