// OneYT — dashboard section: Appearance.
// Theme presets, custom colours, typography, radius, custom CSS.
(function () {
  'use strict';

  // Custom colour keys (shared/themes.js CUSTOM_COLOR_KEYS).
  // Empty = use the active preset's colour.
  var COLOR_CONTROLS = [
    ['accent', 'Accent colour', 'Links, buttons and highlights.'],
    ['background', 'Background colour', 'Main page background.'],
    ['surface', 'Surface colour', 'Cards, menus and raised surfaces.'],
    ['hover', 'Hover colour', 'Background of hovered items.'],
    ['border', 'Border colour', 'Dividers and outlines.'],
    ['text', 'Text colour', 'Primary text.'],
    ['secondaryText', 'Secondary text colour', 'Muted text: metadata, descriptions.'],
    ['card', 'Card colour', 'Video card background.'],
    ['button', 'Button colour', 'Button background.'],
    ['buttonHover', 'Button hover colour', 'Button background on hover.'],
  ].map(function (entry) {
    return {
      key: 'appearance.colors.' + entry[0],
      type: 'color',
      label: entry[1],
      description: entry[2] + ' Empty = use the preset colour.',
      keywords: ['colour', 'color', 'theme', entry[0]],
    };
  });

  var section = {
    id: 'appearance',
    title: 'Appearance',
    description:
      'Themes, colours, typography, custom CSS, ready-made CSS templates and saved themes.',
    controls: [
      {
        key: 'appearance.theme',
        type: 'select',
        label: 'Theme',
        description: 'Preset theme. "Custom" starts from Dark, then your colours below apply.',
        source: 'themes',
        keywords: ['theme', 'dark', 'light', 'midnight', 'amoled', 'minimal', 'custom'],
      },
    ]
      .concat(COLOR_CONTROLS)
      .concat([
        {
          key: 'appearance.typography.fontFamily',
          type: 'select',
          label: 'Font family',
          description: 'Font for video titles, descriptions and comments. Empty = YouTube default.',
          source: 'fontFamilies',
          keywords: ['font', 'typography', 'family'],
        },
        {
          key: 'appearance.typography.customFont',
          type: 'text',
          label: 'Custom font',
          description:
            'Any font installed on this device, by name (e.g. Hind Siliguri). Wins over Font family above when set. Empty = use Font family. Nothing is downloaded — a font that is not installed falls back to sans-serif.',
          placeholder: 'e.g. Hind Siliguri',
          keywords: ['font', 'typography', 'custom', 'family', 'name'],
        },
        {
          key: 'appearance.typography.fontSize',
          type: 'number',
          label: 'Font size',
          description: 'Percent of the default size. 0 = YouTube default.',
          min: 0,
          max: 200,
          step: 5,
          unit: '%',
          keywords: ['font', 'size', 'typography'],
        },
        {
          key: 'appearance.typography.fontWeight',
          type: 'select',
          label: 'Font weight',
          description: 'Thickness of title/description/comment text. 0 = YouTube default.',
          source: 'fontWeights',
          keywords: ['font', 'weight', 'bold', 'typography'],
        },
        {
          key: 'appearance.typography.lineHeight',
          type: 'number',
          label: 'Line height',
          description: 'Line spacing multiplier. 0 = YouTube default.',
          min: 0,
          max: 3,
          step: 0.1,
          keywords: ['font', 'line', 'height', 'spacing', 'typography'],
        },
        {
          key: 'appearance.borderRadius',
          type: 'number',
          label: 'Thumbnail corner radius',
          description: 'Rounded corners on thumbnails in pixels. 0 = sharp corners.',
          min: 0,
          max: 32,
          step: 1,
          unit: 'px',
          keywords: ['radius', 'corners', 'rounded', 'thumbnail'],
        },
        {
          key: 'appearance.spacing',
          type: 'number',
          label: 'UI spacing',
          description: 'Gap between filter chips in pixels.',
          min: 0,
          max: 64,
          step: 1,
          unit: 'px',
          keywords: ['spacing', 'gap'],
        },
        {
          key: 'appearance.customCSSEnabled',
          type: 'toggle',
          label: 'Enable custom CSS',
          description:
            'Apply the custom CSS below. It is validated before it ever reaches the page.',
          keywords: ['css', 'custom', 'enable'],
        },
        {
          key: 'appearance.customCSS',
          type: 'textarea',
          label: 'Custom CSS',
          description: 'Your own CSS. Invalid CSS is rejected with an error and never applied.',
          rows: 10,
          placeholder: '/* e.g. ytd-rich-item-renderer { border: 1px solid red; } */',
          keywords: ['css', 'custom', 'style'],
        },
      ]),
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.appearance = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
