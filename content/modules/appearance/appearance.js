/* OneYT — appearance module.
 *
 * Themes, custom colours, radius/spacing and custom CSS (Phase 3).
 * Applies on every page (themes are global), never reloads: a
 * preset switch is a variable swap + one html class.
 *
 * How a theme reaches the page (AD-10):
 *  - OneYT tokens (--oneyt-*) are set on <html>.
 *  - The same tokens are mapped onto YouTube's own
 *    --yt-spec-* variables, so surfaces the extension never
 *    touches (menus, chips, buttons) follow the theme.
 *  - appearance.css adds scoped rules for surfaces that don't
 *    read --yt-spec-* (masthead, guide, grid background).
 * If YouTube renames a --yt-spec-* variable, that surface
 * silently keeps its own theme — nothing depends on it.
 *
 * Custom CSS lives in its own style tag (dom.setStyle), applied
 * only when valid (validators.validateCustomCSS) and enabled;
 * toggling it never touches the theme variables.
 */
(function () {
  'use strict';

  var CUSTOM_CSS_TAG = 'oneyt-custom-css';

  function createAppearanceModule(deps) {
    var dom = deps.dom;
    var logger = deps.logger || {
      debug: function () {},
      warn: function () {},
      error: function () {},
    };
    var doc = deps.document || (typeof document !== 'undefined' ? document : null);
    var themes =
      deps.themes || (typeof globalThis !== 'undefined' ? globalThis.OneYT.themes : null);
    var validators =
      deps.validators || (typeof globalThis !== 'undefined' ? globalThis.OneYT.validators : null);

    var lastThemeClass = null;

    function root() {
      return doc && doc.documentElement ? doc.documentElement : null;
    }

    function setVar(el, name, value) {
      el.style.setProperty(name, value);
    }

    function removeVar(el, name) {
      el.style.removeProperty(name);
    }

    function applyTheme(el, settings) {
      var app = settings.appearance || {};
      var name = typeof app.theme === 'string' ? app.theme : 'default';
      var vars = themes.resolveThemeVars(name, app.colors || {});

      if (lastThemeClass) {
        el.classList.remove(lastThemeClass);
        lastThemeClass = null;
      }
      el.classList.remove('oneyt-themed');

      // Clear every token + spec var first, so switching back to
      // 'default' (or a preset with fewer tokens) never leaves
      // stale colours behind. Not every token maps onto a
      // --yt-spec-* variable (see YT_SPEC_VARS), so guard.
      for (var key in themes.TOKEN_VARS) {
        removeVar(el, themes.TOKEN_VARS[key]);
        if (themes.YT_SPEC_VARS[key]) removeVar(el, themes.YT_SPEC_VARS[key]);
      }

      if (Object.keys(vars).length === 0) return;

      el.classList.add('oneyt-themed');
      lastThemeClass = 'oneyt-theme-' + name;
      el.classList.add(lastThemeClass);
      for (var token in vars) {
        if (themes.TOKEN_VARS[token]) {
          setVar(el, themes.TOKEN_VARS[token], vars[token]);
        }
        if (themes.YT_SPEC_VARS[token]) {
          setVar(el, themes.YT_SPEC_VARS[token], vars[token]);
        }
      }

      // Warn only — never block a user's colours (AD-10).
      var ok = themes.textContrastOk(vars);
      if (ok === false) {
        logger.warn(
          'appearance: theme "' + name + '" text/background contrast is below WCAG AA (4.5:1)'
        );
      }
    }

    function applyRadiusSpacing(el, settings) {
      var app = settings.appearance || {};
      var radius = typeof app.borderRadius === 'number' ? app.borderRadius : 12;
      var spacing = typeof app.spacing === 'number' ? app.spacing : 16;
      el.classList.add('oneyt-radius');
      el.classList.add('oneyt-spaced');
      setVar(el, '--oneyt-radius', radius + 'px');
      setVar(el, '--oneyt-spacing', spacing + 'px');
    }

    function applyCustomCSS(settings) {
      var app = settings.appearance || {};
      var css = typeof app.customCSS === 'string' ? app.customCSS : '';
      if (!app.customCSSEnabled || !css.trim()) {
        if (dom) dom.removeStyleTag(CUSTOM_CSS_TAG);
        return;
      }
      var check = validators ? validators.validateCustomCSS(css) : { valid: true, errors: [] };
      if (!check.valid) {
        logger.warn('appearance: custom CSS rejected — ' + check.errors.join(' '));
        if (dom) dom.removeStyleTag(CUSTOM_CSS_TAG);
        return;
      }
      if (dom) dom.setStyle(CUSTOM_CSS_TAG, css);
    }

    function cleanup() {
      var el = root();
      if (el) {
        if (lastThemeClass) el.classList.remove(lastThemeClass);
        el.classList.remove('oneyt-themed');
        el.classList.remove('oneyt-radius');
        el.classList.remove('oneyt-spaced');
        if (themes) {
          for (var key in themes.TOKEN_VARS) {
            removeVar(el, themes.TOKEN_VARS[key]);
            if (themes.YT_SPEC_VARS[key]) removeVar(el, themes.YT_SPEC_VARS[key]);
          }
        }
        removeVar(el, '--oneyt-radius');
        removeVar(el, '--oneyt-spacing');
      }
      lastThemeClass = null;
      if (dom) dom.removeStyleTag(CUSTOM_CSS_TAG);
    }

    return {
      id: 'appearance',
      init: function () {},
      apply: function (settings) {
        var el = root();
        if (!el || !themes) return;
        applyTheme(el, settings);
        applyRadiusSpacing(el, settings);
        applyCustomCSS(settings);
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
  ns.modules.appearance = { createAppearanceModule: createAppearanceModule };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createAppearanceModule: createAppearanceModule };
  }
})();
