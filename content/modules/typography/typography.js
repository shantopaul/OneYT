/* OneYT — typography module (Phase 3).
 *
 * Font family / size / weight / line-height for video titles,
 * descriptions and comments. Values travel as CSS variables;
 * typography.css applies them only to the text elements listed
 * there — the player, captions and the rest of YouTube are
 * never touched.
 *
 * Custom font (Phase 24): appearance.typography.customFont
 * names any font installed on this device; when valid it wins
 * over the fontFamily select. Resolution lives in
 * themes.resolveFontFamily — the module never applies a raw
 * custom name, and an invalid one falls back to the select.
 *
 * A setting of 0 (or empty family) means "YouTube default":
 * the variable is removed, not set to a guess. Out-of-range
 * values are ignored with a warning, never applied.
 */
(function () {
  'use strict';

  function createTypographyModule(deps) {
    var logger = deps.logger || {
      debug: function () {},
      warn: function () {},
      error: function () {},
    };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var themes =
      deps.themes ||
      (typeof globalThis !== 'undefined' && globalThis.OneYT.themes
        ? globalThis.OneYT.themes
        : null);
    var fontStacks = (themes && themes.FONT_STACKS) || {};

    function root() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function setOrRemove(el, name, value) {
      if (value === null) el.style.removeProperty(name);
      else el.style.setProperty(name, value);
    }

    function applyTypography(el, settings) {
      var typo = (settings.appearance || {}).typography || {};
      var changed = false;

      // Custom font (Phase 24) wins over the select when
      // valid; an invalid custom name falls back to the
      // select, and the raw string is never applied.
      var stack = null;
      if (themes && typeof themes.resolveFontFamily === 'function') {
        stack = themes.resolveFontFamily(typo.fontFamily, typo.customFont);
      } else if (typeof typo.fontFamily === 'string' && typo.fontFamily) {
        stack = fontStacks[typo.fontFamily] || null;
      }
      if (stack) {
        setOrRemove(el, '--oneyt-font-family', stack);
        changed = true;
      } else if (typeof typo.customFont === 'string' && typo.customFont.trim()) {
        logger.warn('typography: custom font "' + typo.customFont + '" ignored');
        setOrRemove(el, '--oneyt-font-family', null);
      } else if (typeof typo.fontFamily === 'string' && typo.fontFamily) {
        logger.warn('typography: unknown font family "' + typo.fontFamily + '" ignored');
        setOrRemove(el, '--oneyt-font-family', null);
      } else {
        setOrRemove(el, '--oneyt-font-family', null);
      }

      if (typeof typo.fontSize === 'number' && typo.fontSize !== 0) {
        if (typo.fontSize >= 50 && typo.fontSize <= 200) {
          setOrRemove(el, '--oneyt-font-scale', String(typo.fontSize / 100));
          changed = true;
        } else {
          logger.warn('typography: fontSize ' + typo.fontSize + '% out of range (50-200) ignored');
          setOrRemove(el, '--oneyt-font-scale', null);
        }
      } else {
        setOrRemove(el, '--oneyt-font-scale', null);
      }

      if (typeof typo.fontWeight === 'number' && typo.fontWeight !== 0) {
        if (typo.fontWeight >= 100 && typo.fontWeight <= 900 && typo.fontWeight % 100 === 0) {
          setOrRemove(el, '--oneyt-font-weight', String(typo.fontWeight));
          changed = true;
        } else {
          logger.warn('typography: fontWeight ' + typo.fontWeight + ' invalid ignored');
          setOrRemove(el, '--oneyt-font-weight', null);
        }
      } else {
        setOrRemove(el, '--oneyt-font-weight', null);
      }

      if (typeof typo.lineHeight === 'number' && typo.lineHeight !== 0) {
        if (typo.lineHeight >= 1 && typo.lineHeight <= 3) {
          setOrRemove(el, '--oneyt-line-height', String(typo.lineHeight));
          changed = true;
        } else {
          logger.warn('typography: lineHeight ' + typo.lineHeight + ' out of range (1-3) ignored');
          setOrRemove(el, '--oneyt-line-height', null);
        }
      } else {
        setOrRemove(el, '--oneyt-line-height', null);
      }

      if (changed) el.classList.add('oneyt-typography');
      else el.classList.remove('oneyt-typography');
    }

    function cleanup() {
      var el = root();
      if (!el) return;
      el.classList.remove('oneyt-typography');
      setOrRemove(el, '--oneyt-font-family', null);
      setOrRemove(el, '--oneyt-font-scale', null);
      setOrRemove(el, '--oneyt-font-weight', null);
      setOrRemove(el, '--oneyt-line-height', null);
    }

    return {
      id: 'typography',
      init: function () {},
      apply: function (settings) {
        var el = root();
        if (el) applyTypography(el, settings);
      },
      disable: function () {
        cleanup();
      },
      destroy: function () {
        cleanup();
      },
    };
  }

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.modules = ns.modules || {};
  ns.modules.typography = { createTypographyModule: createTypographyModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createTypographyModule: createTypographyModule };
  }
})();
