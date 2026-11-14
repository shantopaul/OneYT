// OneYT — dashboard section: Layout.
// Global Shorts blocking, Channel page grid, Watch page and guide navigation.
(function () {
  'use strict';

  var section = {
    id: 'layout',
    title: 'Layout',
    description: 'Global Shorts blocking, Channel page grid, Watch page and guide navigation.',
    controls: [
      {
        key: 'layout.blockShorts',
        type: 'toggle',
        label: 'Block Shorts everywhere',
        description:
          'Hide Shorts shelves on every page, remove Shorts from the guide, hide Shorts videos in grids and search, hide the Shorts tab on channel pages, and open Shorts links as normal videos instead.',
        keywords: ['shorts', 'block', 'hide', 'remove'],
      },
      {
        key: 'layout.hideShortsWatch',
        type: 'toggle',
        label: 'Hide Shorts on Watch',
        description: 'Hide the Shorts shelf on watch pages.',
        keywords: ['shorts', 'hide', 'watch'],
      },
      {
        key: 'layout.channelWide',
        type: 'toggle',
        label: 'Wide channel layout',
        description: 'Expand channel video grids to full available width instead of YouTube’s narrow column.',
        keywords: ['channel', 'wide', 'full width', 'layout'],
      },
      {
        key: 'layout.channelColumns',
        type: 'number',
        label: 'Channel videos per row',
        description: 'Videos per row on channel pages (1–15). 0 = YouTube default.',
        min: 0,
        max: 15,
        step: 1,
        presets: [
          { label: 'YouTube auto (0)', value: 0 },
          { label: '4 columns', value: 4 },
          { label: '5 columns', value: 5 },
          { label: '6 columns', value: 6 },
          { label: '8 columns', value: 8 },
        ],
        keywords: ['channel', 'columns', 'row', 'videos'],
      },
      {
        key: 'layout.channelShelfItemsPerRow',
        type: 'number',
        label: 'Channel Shorts & shelf per row',
        description: 'Shorts and shelf cards per row on channel pages (1–15). 0 = YouTube default.',
        min: 0,
        max: 15,
        step: 1,
        presets: [
          { label: 'YouTube auto (0)', value: 0 },
          { label: '6 items', value: 6 },
          { label: '8 items', value: 8 },
          { label: '10 items', value: 10 },
        ],
        keywords: ['channel', 'shorts', 'shelf', 'row', 'items'],
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
