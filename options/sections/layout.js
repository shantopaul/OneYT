// OneYT — dashboard section: Layout.
// Watch/homepage layout + guide navigation controls.
(function () {
  'use strict';

  var section = {
    id: 'layout',
    title: 'Layout',
    description: 'Watch page, homepage grid and guide navigation.',
    controls: [
      {
        key: 'layout.blockShorts',
        type: 'toggle',
        label: 'Block Shorts everywhere',
        description:
          'Hide Shorts shelves on every page, remove Shorts from the guide, hide Shorts videos in grids and search, and open Shorts links as normal videos instead.',
        keywords: ['shorts', 'block', 'hide', 'remove'],
      },
      {
        key: 'layout.hideShortsHome',
        type: 'toggle',
        label: 'Hide Shorts on Home',
        description: 'Hide the Shorts shelf on the homepage.',
        keywords: ['shorts', 'hide', 'home'],
      },
      {
        key: 'layout.hideShortsWatch',
        type: 'toggle',
        label: 'Hide Shorts on Watch',
        description: 'Hide the Shorts shelf on watch pages.',
        keywords: ['shorts', 'hide', 'watch'],
      },
      {
        key: 'layout.homeColumns',
        type: 'number',
        label: 'Homepage columns',
        description: 'Videos per row on the homepage. 0 = YouTube default.',
        min: 0,
        max: 12,
        step: 1,
        keywords: ['home', 'columns', 'grid'],
      },
      {
        key: 'layout.cardSpacing',
        type: 'number',
        label: 'Homepage card spacing',
        description: 'Gap between homepage cards in pixels. 0 = YouTube default.',
        min: 0,
        max: 60,
        step: 1,
        unit: 'px',
        keywords: ['home', 'card', 'spacing', 'gap'],
      },
      {
        key: 'layout.thumbnailSize',
        type: 'number',
        label: 'Homepage thumbnail width',
        description: 'Thumbnail width in pixels. 0 = YouTube default.',
        min: 0,
        max: 800,
        step: 1,
        unit: 'px',
        keywords: ['home', 'thumbnail', 'size'],
      },
      {
        key: 'layout.hideComments',
        type: 'toggle',
        label: 'Hide comments',
        description: 'Hide the comments section on watch pages.',
        keywords: ['comments', 'hide', 'watch'],
      },
      {
        key: 'layout.watchSpacing',
        type: 'number',
        label: 'Watch spacing',
        description: 'Gap between the player and the area below it, in pixels.',
        min: 0,
        max: 200,
        step: 1,
        unit: 'px',
        keywords: ['watch', 'spacing', 'gap'],
      },
      {
        key: 'navigation.hideHome',
        type: 'toggle',
        label: 'Hide Home from guide',
        description: 'Hide the Home entry in the left guide.',
        keywords: ['navigation', 'guide', 'home', 'hide'],
      },
      {
        key: 'navigation.hideShorts',
        type: 'toggle',
        label: 'Hide Shorts from guide',
        description: 'Hide the Shorts entry in the left guide.',
        keywords: ['navigation', 'guide', 'shorts', 'hide'],
      },
      {
        key: 'navigation.hideSubscriptions',
        type: 'toggle',
        label: 'Hide Subscriptions from guide',
        description: 'Hide the Subscriptions entry in the left guide.',
        keywords: ['navigation', 'guide', 'subscriptions', 'hide'],
      },
      {
        key: 'navigation.hideLibrary',
        type: 'toggle',
        label: 'Hide Library from guide',
        description: 'Hide the Library / You entry in the left guide.',
        keywords: ['navigation', 'guide', 'library', 'you', 'hide'],
      },
      {
        key: 'navigation.hideHistory',
        type: 'toggle',
        label: 'Hide History from guide',
        description: 'Hide the History entry in the left guide.',
        keywords: ['navigation', 'guide', 'history', 'hide'],
      },
      {
        key: 'navigation.compact',
        type: 'toggle',
        label: 'Compact guide',
        description: 'Mini guide: icons only, no labels.',
        keywords: ['navigation', 'guide', 'compact', 'mini'],
      },
      {
        key: 'navigation.guideWidth',
        type: 'number',
        label: 'Guide width',
        description: 'Guide width in pixels. 0 = YouTube default (min 72).',
        min: 0,
        max: 400,
        step: 1,
        unit: 'px',
        keywords: ['navigation', 'guide', 'width'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.layout = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
