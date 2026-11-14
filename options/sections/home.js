// OneYT — dashboard section: Home.
// Homepage & feed grid, skeleton sizing, row counts, card appearance and home shelves.
(function () {
  'use strict';

  var section = {
    id: 'home',
    title: 'Home',
    description:
      'Homepage & Subscriptions feed grid, videos per row (including skeleton loaders), posts, Shorts rows and home shelves.',
    controls: [
      {
        key: 'layout.homeColumns',
        type: 'number',
        label: 'Videos per row',
        description:
          'Videos per row on Home and Subscriptions (1–15), also applied to loading skeleton cards to prevent layout jump. 0 = YouTube default.',
        min: 0,
        max: 15,
        step: 1,
        presets: [
          { label: 'YouTube auto (0)', value: 0 },
          { label: '3 columns', value: 3 },
          { label: '4 columns', value: 4 },
          { label: '5 columns', value: 5 },
          { label: '6 columns', value: 6 },
          { label: '8 columns', value: 8 },
        ],
        keywords: ['home', 'subscriptions', 'columns', 'grid', 'row', 'videos', 'skeleton'],
      },
      {
        key: 'layout.postsPerRow',
        type: 'number',
        label: 'Posts per row',
        description: 'Community posts per row on Home and Subscriptions (1–6). 0 = YouTube default.',
        min: 0,
        max: 6,
        step: 1,
        presets: [
          { label: 'YouTube auto (0)', value: 0 },
          { label: '2 posts', value: 2 },
          { label: '3 posts', value: 3 },
          { label: '4 posts', value: 4 },
        ],
        keywords: ['home', 'posts', 'community', 'row', 'columns', 'feed'],
      },
      {
        key: 'layout.shelfItemsPerRow',
        type: 'number',
        label: 'Shorts & shelf items per row',
        description: 'Shorts and slim shelf cards per row on Home and Subscriptions (1–15). 0 = YouTube default.',
        min: 0,
        max: 15,
        step: 1,
        presets: [
          { label: 'YouTube auto (0)', value: 0 },
          { label: '5 items', value: 5 },
          { label: '8 items', value: 8 },
          { label: '10 items', value: 10 },
          { label: '12 items', value: 12 },
        ],
        keywords: ['home', 'shorts', 'shelf', 'row', 'slim', 'items', 'playables'],
      },
      {
        key: 'layout.responsiveColumns',
        type: 'toggle',
        label: 'Auto-adjust columns on resize',
        description:
          'Automatically step down custom row counts on narrower browser windows (<= 1000 px, 768 px, 640 px) so cards stay legible.',
        keywords: ['home', 'responsive', 'dynamic', 'resize', 'auto', 'columns', 'viewport'],
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
        key: 'layout.homeMaxWidth',
        type: 'number',
        label: 'Homepage max width',
        description:
          'Cap the homepage feed width in pixels and centre it — the ultrawide fix. 0 = YouTube default (full width).',
        min: 0,
        max: 2560,
        step: 1,
        unit: 'px',
        presets: [
          { label: 'Full width (0)', value: 0 },
          { label: '1280 px', value: 1280 },
          { label: '1600 px', value: 1600 },
          { label: '1920 px', value: 1920 },
        ],
        keywords: ['home', 'max', 'width', 'ultrawide', 'centre', 'center'],
      },
      {
        key: 'layout.hideChannelProfile',
        type: 'toggle',
        label: 'Hide channel avatars',
        description: 'Hide channel profile icons under video thumbnails in feeds and search.',
        keywords: ['home', 'channel', 'avatar', 'profile', 'icon', 'hide'],
      },
      {
        key: 'layout.fullVideoTitles',
        type: 'toggle',
        label: 'Show full video titles',
        description: 'Remove line-clamping truncation so full multi-line video titles are visible.',
        keywords: ['home', 'title', 'full', 'truncate', 'clamp', 'multiline', 'expand'],
      },
      {
        key: 'layout.hideShortsHome',
        type: 'toggle',
        label: 'Hide Shorts on Home',
        description: 'Hide the Shorts shelf on the homepage.',
        keywords: ['shorts', 'hide', 'home'],
      },
      {
        key: 'layout.hideTopicChips',
        type: 'toggle',
        label: 'Hide topic chips bar on Home',
        description:
          'Hide the topic filter chips row ("All", "Music", "Gaming", …) at the top of the home feed. Home page only.',
        keywords: ['topic', 'chips', 'filter', 'home', 'hide'],
      },
      {
        key: 'layout.hideLiveShelf',
        type: 'toggle',
        label: 'Hide Live shelf on Home',
        description: 'Hide the "Live now" shelf on the homepage.',
        keywords: ['live', 'shelf', 'hide', 'home'],
      },
      {
        key: 'layout.hideMixesShelf',
        type: 'toggle',
        label: 'Hide Mixes on Home',
        description: 'Hide Mixes on the homepage — the Mixes shelf and the individual mix cards.',
        keywords: ['mixes', 'mix', 'hide', 'home'],
      },
      {
        key: 'layout.hideNewsShelf',
        type: 'toggle',
        label: 'Hide News shelf on Home',
        description: 'Hide the "Breaking news" shelf on the homepage.',
        keywords: ['news', 'shelf', 'hide', 'home'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.home = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
