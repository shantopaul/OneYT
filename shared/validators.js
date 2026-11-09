/* OneYT — shared/validators.js
 *
 * Pure validation for imported settings JSON and user custom CSS.
 * No chrome.*, no DOM, no eval, no new Function — imported data
 * is treated as untrusted text and only ever checked, never run.
 *
 * validateSettings(data):
 *   Returns { valid, errors[], warnings[], cleaned }.
 *   - valid=false when the top level is not a plain object, or a
 *     known key has the wrong type. Nothing is applied then.
 *   - Unknown keys are PRESERVED in `cleaned` (forward-compat,
 *     see the deepMerge rule in shared/defaults.js) with a
 *     warning — they are not dropped or ignored.
 *   - Known keys with wrong types are dropped with an error and
 *     the import is rejected (valid=false) — a half-applied
 *     import is worse than a rejected one.
 *   - `cleaned` is the migrated settings object when valid.
 *
 * validateCustomCSS(css):
 *   Basic sanity only: length cap, balanced braces/parens,
 *   no HTML tags, no `expression(`, no `@import` of remote URLs.
 *   Returns { valid, errors[] }.
 */
(function () {
  'use strict';

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Expected type for each top-level settings key, by the type of
  // its default value. Nested keys are checked by the migration
  // type-repair in defaults.js; this validator guards the shape
  // an import must have before migration runs.
  function expectedTopLevelTypes(defaults) {
    var out = {};
    for (var key in defaults) {
      if (Object.prototype.hasOwnProperty.call(defaults, key)) {
        out[key] = Array.isArray(defaults[key]) ? 'array' : typeof defaults[key];
      }
    }
    return out;
  }

  function typeOf(value) {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  }

  function validateSettings(data, defaultsApi) {
    var errors = [];
    var warnings = [];
    if (!isPlainObject(data)) {
      return {
        valid: false,
        errors: ['Imported settings must be a JSON object.'],
        warnings: warnings,
        cleaned: null,
      };
    }

    var defaults = defaultsApi.DEFAULT_SETTINGS;
    var expected = expectedTopLevelTypes(defaults);

    for (var key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      if (!(key in expected)) {
        warnings.push('Unknown setting "' + key + '" is not a OneYT setting yet — kept as-is.');
        continue;
      }
      if (typeOf(data[key]) !== expected[key]) {
        errors.push(
          'Setting "' + key + '" must be ' + expected[key] + ' but got ' + typeOf(data[key]) + '.'
        );
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors: errors, warnings: warnings, cleaned: null };
    }

    return {
      valid: true,
      errors: errors,
      warnings: warnings,
      cleaned: defaultsApi.migrateSettings(data),
    };
  }

  function validateCustomCSS(css, maxLength) {
    var errors = [];
    var limit = typeof maxLength === 'number' ? maxLength : 50000;
    if (typeof css !== 'string') {
      return { valid: false, errors: ['Custom CSS must be text.'] };
    }
    if (css.length > limit) {
      errors.push('Custom CSS is too long (max ' + limit + ' characters).');
    }
    if (/<\/?[a-z][\s\S]*>/i.test(css)) {
      errors.push('Custom CSS must not contain HTML tags.');
    }
    if (/expression\s*\(/i.test(css)) {
      errors.push('Custom CSS must not use expression().');
    }
    if (/@import/i.test(css)) {
      errors.push('Custom CSS must not use @import (no remote code).');
    }
    if (/javascript\s*:/i.test(css)) {
      errors.push('Custom CSS must not contain javascript: URLs.');
    }
    // url() is the remaining remote-load vector in CSS (images,
    // fonts, @font-face src). Only data: URLs are allowed — they
    // cannot fetch anything. Found in the Phase 6 security review:
    // the old validator blocked @import but not url(https://…),
    // which would have fetched a remote resource (and could act
    // as a tracking pixel) when the CSS was applied. The scan
    // below (not a regex) also catches a quote smuggled into an
    // unquoted url(), e.g. url(https://evil.com/a'b) — the old
    // regex stopped at the quote and missed the remote URL.
    var lowerCss = css.toLowerCase();
    var urlAt = 0;
    while ((urlAt = lowerCss.indexOf('url(', urlAt)) !== -1) {
      var j = urlAt + 4;
      while (j < css.length && /\s/.test(css[j])) j++;
      var quote = css[j] === '"' || css[j] === "'" ? css[j] : null;
      var start = quote ? j + 1 : j;
      var end = start;
      if (quote) {
        while (end < css.length && css[end] !== quote) end++;
      } else {
        while (end < css.length && css[end] !== ')') end++;
      }
      var target = css.slice(start, end).trim().toLowerCase();
      if (target.indexOf('data:') !== 0) {
        errors.push(
          'Custom CSS must not load remote resources with url() (only data: URLs are allowed).'
        );
        break;
      }
      urlAt = end + 1;
    }
    // Balanced braces/parens. Braces and parens inside string
    // literals (content: "}") and /* comments */ are not syntax
    // — counting them rejected valid CSS.
    var depth = 0;
    var parenDepth = 0;
    var inString = null;
    var inComment = false;
    for (var i = 0; i < css.length; i++) {
      var ch = css[i];
      if (inComment) {
        if (ch === '*' && css[i + 1] === '/') {
          inComment = false;
          i++;
        }
        continue;
      }
      if (inString) {
        if (ch === '\\') i++;
        else if (ch === inString) inString = null;
        continue;
      }
      if (ch === '/' && css[i + 1] === '*') {
        inComment = true;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = ch;
        continue;
      }
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (ch === '(') parenDepth++;
      if (ch === ')') parenDepth--;
      if (depth < 0 || parenDepth < 0) break;
    }
    if (depth !== 0) errors.push('Custom CSS has unbalanced braces { }.');
    if (parenDepth !== 0) errors.push('Custom CSS has unbalanced parentheses ( ).');
    return { valid: errors.length === 0, errors: errors };
  }

  // Speed presets (playback.speedPresets): numbers in 0.25..4,
  // sorted ascending, duplicates removed. Returns
  // { valid, errors[], cleaned[] } — cleaned is always the usable
  // list (empty when nothing survives), so callers never have to
  // guess. 1x is always kept: an empty cleaned list still plays
  // at normal speed, the presets just offer nothing extra.
  var MIN_SPEED = 0.25;
  var MAX_SPEED = 4;

  function validateSpeedPresets(list) {
    var errors = [];
    if (!Array.isArray(list)) {
      return { valid: false, errors: ['Speed presets must be a list.'], cleaned: [] };
    }
    var cleaned = [];
    list.forEach(function (value) {
      if (typeof value !== 'number' || !isFinite(value)) {
        errors.push('Speed preset "' + value + '" is not a number and was dropped.');
      } else if (value < MIN_SPEED || value > MAX_SPEED) {
        errors.push(
          'Speed preset ' +
            value +
            'x is out of range (' +
            MIN_SPEED +
            'x-' +
            MAX_SPEED +
            'x) and was dropped.'
        );
      } else if (cleaned.indexOf(value) === -1) {
        cleaned.push(value);
      }
    });
    cleaned.sort(function (a, b) {
      return a - b;
    });
    return { valid: errors.length === 0, errors: errors, cleaned: cleaned };
  }

  var api = {
    validateSettings: validateSettings,
    validateCustomCSS: validateCustomCSS,
    validateSpeedPresets: validateSpeedPresets,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.validators = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
