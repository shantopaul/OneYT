// OneYT — theme presets and colour helpers (shared, pure, no DOM).
// A theme is a map of token keys to hex colours. The appearance
// module turns tokens into CSS variables (--oneyt-*) and maps them
// onto YouTube's own --yt-spec-* variables (see AD-10). Unknown
// YouTube variables are harmlessly ignored by the browser, so a
// YouTube rename degrades to "that surface keeps its own theme".

(function (root) {
  'use strict';

  // Token keys -> CSS variable names.
  var TOKEN_VARS = {
    bg: '--oneyt-bg',
    surface: '--oneyt-surface',
    surfaceHover: '--oneyt-surface-hover',
    border: '--oneyt-border',
    text: '--oneyt-text',
    textSecondary: '--oneyt-text-secondary',
    accent: '--oneyt-accent',
    card: '--oneyt-card',
    buttonBg: '--oneyt-button-bg',
    buttonHover: '--oneyt-button-hover',
  };

  // How OneYT tokens map onto YouTube's own CSS variables.
  // YouTube components read these; overriding them themes the
  // surfaces the extension never touches directly.
  // One token owns each --yt-spec-* target: `surface` and
  // `card` both used to point at --yt-spec-raised-background
  // (and `surfaceHover` / `buttonHover` at
  // --yt-spec-10-percent-layer), so the later token in preset
  // order silently overwrote the earlier one and the mapping
  // table promised something the code could not deliver.
  // `surface` owns the raised background and `surfaceHover`
  // owns the 10-percent layer; `card` / `buttonHover` still
  // have their own --oneyt-* variables above.
  var YT_SPEC_VARS = {
    bg: '--yt-spec-base-background',
    surface: '--yt-spec-raised-background',
    surfaceHover: '--yt-spec-10-percent-layer',
    border: '--yt-spec-outline',
    text: '--yt-spec-text-primary',
    textSecondary: '--yt-spec-text-secondary',
    accent: '--yt-spec-call-to-action',
    buttonBg: '--yt-spec-badge-chip-background',
  };

  // Presets (Design.md §2.4). `default` is null: no overrides,
  // YouTube's own theme stays untouched.
  var THEMES = {
    default: null,
    dark: {
      bg: '#0f0f0f',
      surface: '#212121',
      surfaceHover: '#2e2e2e',
      border: '#2a2a2a',
      text: '#f1f1f1',
      textSecondary: '#aaaaaa',
      accent: '#ff0033',
      card: '#181818',
      buttonBg: '#272727',
      buttonHover: '#3d3d3d',
    },
    light: {
      bg: '#ffffff',
      surface: '#f9f9f9',
      surfaceHover: '#f0f0f0',
      border: '#e5e5e5',
      text: '#0f0f0f',
      textSecondary: '#606060',
      accent: '#ff0033',
      card: '#ffffff',
      buttonBg: '#f0f0f0',
      buttonHover: '#e0e0e0',
    },
    midnight: {
      bg: '#0a0e1a',
      surface: '#121826',
      surfaceHover: '#1a2338',
      border: '#1e2740',
      text: '#e8ecf5',
      textSecondary: '#8a94a8',
      accent: '#5b8cff',
      card: '#121826',
      buttonBg: '#1a2338',
      buttonHover: '#24304d',
    },
    amoled: {
      bg: '#000000',
      surface: '#0a0a0a',
      surfaceHover: '#111111',
      border: '#1a1a1a',
      text: '#f1f1f1',
      textSecondary: '#aaaaaa',
      accent: '#ff0033',
      card: '#0a0a0a',
      buttonBg: '#111111',
      buttonHover: '#1f1f1f',
    },
    minimal: {
      bg: '#fafafa',
      surface: '#ffffff',
      surfaceHover: '#f0f0f0',
      border: '#e5e5e5',
      text: '#111111',
      textSecondary: '#666666',
      accent: '#111111',
      card: '#ffffff',
      buttonBg: '#f0f0f0',
      buttonHover: '#e0e0e0',
    },
  };

  // settings.appearance.colors keys -> token keys. A user colour
  // overrides the same token of whichever preset is active.
  var CUSTOM_COLOR_KEYS = {
    background: 'bg',
    surface: 'surface',
    hover: 'surfaceHover',
    border: 'border',
    text: 'text',
    secondaryText: 'textSecondary',
    accent: 'accent',
    card: 'card',
    button: 'buttonBg',
    buttonHover: 'buttonHover',
  };

  // 'custom' is a valid theme name too: dark base + user colours.
  var THEME_NAMES = Object.keys(THEMES).concat(['custom']);

  // Font family allowlist -> CSS stacks (typography module).
  var FONT_STACKS = {
    system: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    Roboto: 'Roboto, Arial, sans-serif',
    Arial: 'Arial, Helvetica, sans-serif',
    Georgia: 'Georgia, "Times New Roman", serif',
    monospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  };

  // Custom font names (Phase 24): a font installed on this
  // device, typed by name. Valid names are 1-64 chars after
  // trimming, start with a letter or digit, and contain only
  // letters, digits, spaces, hyphens and underscores — no
  // quotes, commas, semicolons, braces or parens, so a stored
  // name can never break out of the quoted family it is
  // placed in. Returns the trimmed name, or '' when invalid.
  function cleanCustomFontName(value) {
    if (typeof value !== 'string') return '';
    var name = value.trim();
    if (name.length === 0 || name.length > 64) return '';
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(name)) return '';
    return name;
  }

  function isValidCustomFontName(value) {
    return cleanCustomFontName(value) !== '';
  }

  // Resolve the font stack the typography module applies.
  // A valid custom name wins over the Font family select and
  // resolves to the quoted name + a sans-serif fallback (the
  // browser falls back when the device lacks the font).
  // Otherwise the FONT_STACKS entry for fontFamily, or null
  // when neither resolves (YouTube default).
  function resolveFontFamily(fontFamily, customFont) {
    var custom = cleanCustomFontName(customFont);
    if (custom) return '"' + custom + '", sans-serif';
    if (typeof fontFamily === 'string' && fontFamily && FONT_STACKS[fontFamily]) {
      return FONT_STACKS[fontFamily];
    }
    return null;
  }

  function isValidHex(value) {
    return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  }

  // Resolve the final token map for a theme name + user colours.
  // Unknown theme names fall back to 'default' (no overrides).
  // 'custom' starts from the dark preset, then applies user colours.
  function resolveThemeVars(themeName, customColors) {
    var name =
      themeName === 'custom' ? 'custom' : THEMES[themeName] !== undefined ? themeName : 'default';
    var base = name === 'custom' ? THEMES.dark : THEMES[name] || null;
    var vars = {};
    if (base) {
      for (var k in base) {
        vars[k] = base[k];
      }
    }
    if (customColors && typeof customColors === 'object') {
      for (var key in CUSTOM_COLOR_KEYS) {
        var value = customColors[key];
        if (isValidHex(value)) {
          vars[CUSTOM_COLOR_KEYS[key]] = value.toLowerCase();
        }
      }
    }
    return vars;
  }

  // WCAG relative luminance + contrast ratio (1..21).
  function hexToRgb(hex) {
    if (!isValidHex(hex)) return null;
    var h = hex.slice(1);
    if (h.length === 3) {
      h = h
        .split('')
        .map(function (c) {
          return c + c;
        })
        .join('');
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function luminance(rgb) {
    function channel(c) {
      var s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function contrastRatio(hexA, hexB) {
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    if (!a || !b) return null;
    var l1 = luminance(a);
    var l2 = luminance(b);
    var hi = Math.max(l1, l2);
    var lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  // WCAG AA for normal text is 4.5:1. Returns null when the
  // colours are missing/invalid, so callers can skip the check.
  function textContrastOk(vars) {
    if (!vars || !vars.text || !vars.bg) return null;
    var ratio = contrastRatio(vars.text, vars.bg);
    return ratio === null ? null : ratio >= 4.5;
  }

  var api = {
    TOKEN_VARS: TOKEN_VARS,
    YT_SPEC_VARS: YT_SPEC_VARS,
    THEMES: THEMES,
    THEME_NAMES: THEME_NAMES,
    CUSTOM_COLOR_KEYS: CUSTOM_COLOR_KEYS,
    FONT_STACKS: FONT_STACKS,
    isValidHex: isValidHex,
    isValidCustomFontName: isValidCustomFontName,
    resolveFontFamily: resolveFontFamily,
    resolveThemeVars: resolveThemeVars,
    contrastRatio: contrastRatio,
    textContrastOk: textContrastOk,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.OneYT = root.OneYT || {};
  root.OneYT.themes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
