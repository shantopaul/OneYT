/* OneYT — shared/layoutPresets.js
 *
 * Advanced layout editor presets (Phase 22, PL-22).
 * Pure: no chrome.*, no DOM — unit tests can run it
 * in Node.
 *
 * A LAYOUT PRESET is a PARTIAL override over the five
 * layout numbers the editor owns: homeColumns,
 * cardSpacing, thumbnailSize, homeMaxWidth and
 * watchSpacing. Applying one deep-merges its overrides
 * onto the CURRENT settings (mirroring
 * shared/profiles.js applyPreset), so a preset changes
 * only what it names — every hiding toggle, theme,
 * player or sidebar setting stays exactly as it is.
 * A preset is a starting point, not a lock: the user
 * can fine-tune the numbers in the Layout section
 * afterwards, and the editor preview shows the result.
 *
 * The defaults API (migrateSettings / deepClone /
 * deepMerge) is passed in by the caller (OneYT.defaults
 * in the browser, require('./defaults') in Node) so
 * this module stays pure and testable.
 *
 * Preview numbers: a preset (or the current settings)
 * is summarised by layoutPreviewSummary — the column
 * count the preview draws (0 means "YouTube default",
 * drawn as 4), the gap, and the max-width label.
 * Those defaults (4 columns, 12 px gap) are preview
 * display values only; they never change a setting.
 */
(function () {
  'use strict';

  // Built-in layout presets. `overrides` is a partial
  // settings tree: only the leaves a preset names are
  // changed. thumbnailSize stays 0 (YouTube default)
  // in all three — the presets tune the grid, not the
  // thumbnail.
  var LAYOUT_PRESETS = [
    {
      id: 'compact',
      name: 'Compact',
      description: 'More videos per row, tighter gaps — fit more of the feed on screen.',
      overrides: {
        layout: {
          homeColumns: 5,
          cardSpacing: 8,
          thumbnailSize: 0,
          homeMaxWidth: 0,
          watchSpacing: 8,
        },
      },
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'The middle ground: four columns, comfortable gaps, feed capped at 1600 px.',
      overrides: {
        layout: {
          homeColumns: 4,
          cardSpacing: 16,
          thumbnailSize: 0,
          homeMaxWidth: 1600,
          watchSpacing: 16,
        },
      },
    },
    {
      id: 'spacious',
      name: 'Spacious',
      description: 'Three wide columns, generous gaps, feed capped at 1280 px.',
      overrides: {
        layout: {
          homeColumns: 3,
          cardSpacing: 24,
          thumbnailSize: 0,
          homeMaxWidth: 1280,
          watchSpacing: 32,
        },
      },
    },
  ];

  function getLayoutPreset(id) {
    for (var i = 0; i < LAYOUT_PRESETS.length; i++) {
      if (LAYOUT_PRESETS[i].id === id) return LAYOUT_PRESETS[i];
    }
    return null;
  }

  // Apply a built-in layout preset onto the current
  // settings. Unknown id → the current settings back,
  // unchanged (cloned, never the same object).
  function applyLayoutPreset(currentSettings, presetId, defaultsApi) {
    var preset = getLayoutPreset(presetId);
    if (!preset) return defaultsApi.deepClone(currentSettings);
    var merged = defaultsApi.deepMerge(currentSettings, preset.overrides);
    return defaultsApi.migrateSettings(merged);
  }

  // Summarise the layout numbers for the editor preview:
  // { columns, gap, maxWidth } — columns is the number
  // of boxes the preview draws (0 / out-of-range in the
  // settings reads as YouTube default = 4), gap is the
  // card spacing in px (0 reads as 12), maxWidth is the
  // homeMaxWidth value (0 = full width).
  function layoutPreviewSummary(settings) {
    var layout = (settings && settings.layout) || {};
    var columns =
      typeof layout.homeColumns === 'number' && layout.homeColumns >= 1 && layout.homeColumns <= 15
        ? layout.homeColumns
        : 4;
    var gap =
      typeof layout.cardSpacing === 'number' && layout.cardSpacing > 0 ? layout.cardSpacing : 12;
    var maxWidth =
      typeof layout.homeMaxWidth === 'number' && layout.homeMaxWidth > 0 ? layout.homeMaxWidth : 0;
    return { columns: columns, gap: gap, maxWidth: maxWidth };
  }

  var api = {
    LAYOUT_PRESETS: LAYOUT_PRESETS,
    getLayoutPreset: getLayoutPreset,
    applyLayoutPreset: applyLayoutPreset,
    layoutPreviewSummary: layoutPreviewSummary,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.layoutPresets = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
