// OneYT — dashboard section: Productivity.
// Focus Mode global switch + what it hides.
(function () {
  'use strict';

  var section = {
    id: 'productivity',
    title: 'Productivity',
    description: 'Focus Mode: hide distractions with one click.',
    controls: [
      {
        key: 'productivity.focusMode',
        type: 'toggle',
        label: 'Focus Mode',
        description:
          'Hide the distractions below on every YouTube tab. Shift+F toggles it for the current tab only.',
        keywords: ['focus', 'distraction', 'mode'],
      },
      {
        key: 'productivity.focusHideComments',
        type: 'toggle',
        label: 'Hide comments in Focus Mode',
        description: 'Hide the comments section while Focus Mode is on.',
        keywords: ['focus', 'comments', 'hide'],
      },
      {
        key: 'productivity.focusHideChat',
        type: 'toggle',
        label: 'Hide live chat in Focus Mode',
        description: 'Hide the live chat while Focus Mode is on.',
        keywords: ['focus', 'chat', 'live', 'hide'],
      },
      {
        key: 'productivity.focusHideRecommendations',
        type: 'toggle',
        label: 'Hide recommendations in Focus Mode',
        description: 'Hide the recommendations sidebar (watch) and the homepage grid (home).',
        keywords: ['focus', 'recommendations', 'hide'],
      },
      {
        key: 'productivity.focusHideShorts',
        type: 'toggle',
        label: 'Hide Shorts in Focus Mode',
        description: 'Hide Shorts shelves while Focus Mode is on.',
        keywords: ['focus', 'shorts', 'hide'],
      },
      {
        key: 'productivity.focusHideButtons',
        type: 'toggle',
        label: 'Hide action buttons in Focus Mode',
        description: 'Hide the like / share / download row while Focus Mode is on.',
        keywords: ['focus', 'buttons', 'like', 'share', 'hide'],
      },
      {
        key: 'productivity.focusHideMetadata',
        type: 'toggle',
        label: 'Hide description in Focus Mode',
        description: 'Hide the video description while Focus Mode is on.',
        keywords: ['focus', 'description', 'metadata', 'hide'],
      },
      {
        key: 'productivity.focusHideNav',
        type: 'toggle',
        label: 'Hide guide in Focus Mode',
        description:
          'Hide the left guide while Focus Mode is on. Search and account are never hidden.',
        keywords: ['focus', 'guide', 'navigation', 'hide'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.productivity = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
