// OneYT — dashboard section: Sidebar.
// Sidebar scrolling + recommendation sidebar controls.
(function () {
  'use strict';

  var section = {
    id: 'sidebar',
    title: 'Sidebar',
    description: 'Recommendation sidebar scrolling and sidebar videos.',
    controls: [
      {
        key: 'sidebar.independentScroll',
        type: 'toggle',
        label: 'Independent sidebar scroll',
        description: 'Scroll the recommendations without moving the player. The flagship feature.',
        keywords: ['sidebar', 'scroll', 'independent'],
      },
      {
        key: 'sidebar.customWidth',
        type: 'number',
        label: 'Sidebar width',
        description: 'Width in pixels. 0 = YouTube default.',
        min: 0,
        max: 800,
        step: 1,
        unit: 'px',
        keywords: ['sidebar', 'width'],
      },
      {
        key: 'sidebar.maxHeight',
        type: 'text',
        label: 'Sidebar max height',
        description: 'CSS height, e.g. calc(100vh - 100px).',
        placeholder: 'calc(100vh - 100px)',
        cssProperty: 'maxHeight',
        keywords: ['sidebar', 'height', 'max'],
      },
      {
        key: 'sidebar.scrollbarVisible',
        type: 'toggle',
        label: 'Show sidebar scrollbar',
        description: 'Untick to hide the sidebar scrollbar.',
        keywords: ['sidebar', 'scrollbar', 'show', 'hide'],
      },
      {
        key: 'sidebar.scrollbarWidth',
        type: 'number',
        label: 'Scrollbar width',
        description: 'Scrollbar width in pixels.',
        min: 0,
        max: 24,
        step: 1,
        unit: 'px',
        keywords: ['sidebar', 'scrollbar', 'width'],
      },
      {
        key: 'sidebar.smoothScroll',
        type: 'toggle',
        label: 'Smooth sidebar scrolling',
        description: 'Animate sidebar scrolling instead of jumping.',
        keywords: ['sidebar', 'smooth', 'scroll'],
      },
      {
        key: 'sidebar.scrollSensitivity',
        type: 'range',
        label: 'Scroll sensitivity',
        description: 'Wheel multiplier for the sidebar. 1 = YouTube default.',
        min: 0.5,
        max: 3,
        step: 0.1,
        keywords: ['sidebar', 'scroll', 'sensitivity', 'wheel'],
      },
      {
        key: 'sidebar.playerOffset',
        type: 'number',
        label: 'Player offset',
        description: 'Extra top offset in pixels for fixed/absolute player positioning.',
        min: 0,
        max: 200,
        step: 1,
        unit: 'px',
        keywords: ['sidebar', 'player', 'offset'],
      },
      {
        key: 'recommendations.hideSidebar',
        type: 'toggle',
        label: 'Hide recommendations sidebar',
        description: 'Hide the whole recommendations column on watch pages.',
        keywords: ['recommendations', 'hide', 'sidebar'],
      },
      {
        key: 'recommendations.density',
        type: 'select',
        label: 'Recommendation density',
        description: 'Spacing between sidebar videos.',
        source: 'densities',
        keywords: ['recommendations', 'density', 'compact', 'comfortable'],
      },
      {
        key: 'recommendations.cardSize',
        type: 'number',
        label: 'Recommendation thumbnail width',
        description: 'Thumbnail width in pixels. 0 = YouTube default.',
        min: 0,
        max: 400,
        step: 1,
        unit: 'px',
        keywords: ['recommendations', 'thumbnail', 'card', 'size'],
      },
      {
        key: 'recommendations.showMetadata',
        type: 'toggle',
        label: 'Show recommendation metadata',
        description: 'Titles, channel and view counts under sidebar videos.',
        keywords: ['recommendations', 'metadata', 'titles'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.sidebar = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
