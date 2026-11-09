/* OneYT — shared/savedThemes.js
 *
 * Saved themes + export/share (Phase 21, PL-21).
 * Pure: no chrome.*, no DOM, so unit tests can run it
 * in Node.
 *
 * A SAVED THEME is theme-only: { name, createdAt,
 * theme, colors } — the base preset name
 * (appearance.theme) plus the custom-colour overrides
 * (appearance.colors). That is the whole point versus
 * a Profile (shared/profiles.js), which snapshots ALL
 * settings: a saved theme changes how YouTube looks
 * and nothing else. Applying one writes
 * appearance.theme + appearance.colors only; every
 * other setting stays exactly as it is.
 *
 * Export/share is a JSON file, not sync: export
 * downloads `oneyt-theme-<slug>.json`, import parses
 * and validates the file first and only adds it when
 * the caller confirms. A corrupt import never touches
 * the stored list. Saved themes live under
 * SAVED_THEMES_STORAGE_KEY ('oneyt.themes.v1') in
 * chrome.storage.local — local only, never synced.
 *
 * The themes API (THEME_NAMES / CUSTOM_COLOR_KEYS /
 * isValidHex from shared/themes.js) is passed in by
 * the caller (OneYT.themes in the browser,
 * require('./themes') in Node) so this module stays
 * pure and testable. The defaults API
 * (migrateSettings / deepClone) is passed in the same
 * way, mirroring shared/profiles.js.
 */
(function () {
  'use strict';

  var MAX_SAVED_THEMES = 10;
  var MAX_SAVED_THEME_NAME_LENGTH = 40;
  var EXPORT_FORMAT_VERSION = 1;

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Clean a colours object into the stored shape: only
  // known CUSTOM_COLOR_KEYS survive; each value is a
  // valid hex colour or '' (empty = use the preset's
  // colour). Anything else is dropped, never repaired
  // by guessing.
  function cleanColors(colors, themesApi) {
    var out = {};
    if (!isPlainObject(colors) || !themesApi) return out;
    var keys = themesApi.CUSTOM_COLOR_KEYS || {};
    for (var key in colors) {
      if (!Object.prototype.hasOwnProperty.call(keys, key)) continue;
      var value = colors[key];
      if (value === '') out[key] = '';
      else if (themesApi.isValidHex && themesApi.isValidHex(value)) {
        out[key] = String(value).toLowerCase();
      }
    }
    return out;
  }

  // Clean a base theme name: a known preset (or
  // 'custom') survives, anything else becomes 'default'.
  function cleanThemeName(theme, themesApi) {
    if (typeof theme !== 'string' || !themesApi) return 'default';
    var names = themesApi.THEME_NAMES || [];
    return names.indexOf(theme) !== -1 ? theme : 'default';
  }

  // Validate a saved-theme name. Returns an error
  // string, or null when the name is usable. `existing`
  // is the current saved-themes array (may be empty);
  // `ignoreName` skips one entry, for renames.
  function validateSavedThemeName(name, existing, themesApi, ignoreName) {
    if (typeof name !== 'string') return 'Theme name must be text.';
    var trimmed = name.trim();
    if (trimmed.length === 0) return 'Theme name cannot be empty.';
    if (trimmed.length > MAX_SAVED_THEME_NAME_LENGTH) {
      return 'Theme name is too long (max ' + MAX_SAVED_THEME_NAME_LENGTH + ' characters).';
    }
    var lower = trimmed.toLowerCase();
    var builtins = (themesApi && themesApi.THEME_NAMES) || [];
    for (var i = 0; i < builtins.length; i++) {
      if (String(builtins[i]).toLowerCase() === lower) {
        return '"' + trimmed + '" is a built-in theme name — pick another name.';
      }
    }
    var list = Array.isArray(existing) ? existing : [];
    for (var j = 0; j < list.length; j++) {
      if (!list[j] || typeof list[j].name !== 'string') continue;
      if (ignoreName && list[j].name.toLowerCase() === String(ignoreName).toLowerCase()) continue;
      if (list[j].name.toLowerCase() === lower) {
        return 'A saved theme named "' + list[j].name + '" already exists.';
      }
    }
    return null;
  }

  // Save the current theme as a named saved theme.
  // Returns {themes} on success or {error} on failure;
  // the input array is never mutated.
  function createSavedTheme(name, currentSettings, existing, defaultsApi, themesApi) {
    var list = validateSavedThemes(existing, themesApi);
    var error = validateSavedThemeName(name, list, themesApi);
    if (error) return { error: error };
    if (list.length >= MAX_SAVED_THEMES) {
      return {
        error: 'You already have ' + MAX_SAVED_THEMES + ' saved themes — delete one first.',
      };
    }
    var appearance = (currentSettings && currentSettings.appearance) || {};
    var theme = {
      name: name.trim(),
      createdAt: Date.now(),
      theme: cleanThemeName(appearance.theme, themesApi),
      colors: cleanColors(appearance.colors, themesApi),
    };
    return { themes: list.concat([theme]) };
  }

  // Apply a saved theme: only appearance.theme +
  // appearance.colors change; everything else in the
  // current settings stays. A corrupt entry never
  // wipes the current settings — it returns them back,
  // unchanged (cloned).
  function applySavedTheme(currentSettings, savedTheme, defaultsApi, themesApi) {
    if (!savedTheme || typeof savedTheme.theme !== 'string' || !isPlainObject(savedTheme.colors)) {
      return defaultsApi.deepClone(currentSettings);
    }
    var next = defaultsApi.deepClone(currentSettings);
    next.appearance = next.appearance || {};
    next.appearance.theme = cleanThemeName(savedTheme.theme, themesApi);
    next.appearance.colors = cleanColors(savedTheme.colors, themesApi);
    return defaultsApi.migrateSettings(next);
  }

  // Repair a stored saved-themes value into a clean
  // array: non-arrays become [], corrupt entries are
  // dropped, duplicate names keep the first, and at
  // most MAX_SAVED_THEMES are kept.
  function validateSavedThemes(stored, themesApi) {
    if (!Array.isArray(stored)) return [];
    var out = [];
    var seen = {};
    for (var i = 0; i < stored.length; i++) {
      if (out.length >= MAX_SAVED_THEMES) break;
      var entry = stored[i];
      if (!entry || typeof entry.name !== 'string') continue;
      if (typeof entry.theme !== 'string') continue;
      if (!isPlainObject(entry.colors)) continue;
      var name = entry.name.trim();
      if (name.length === 0 || name.length > MAX_SAVED_THEME_NAME_LENGTH) continue;
      var lower = name.toLowerCase();
      if (seen[lower]) continue;
      seen[lower] = true;
      out.push({
        name: name,
        createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : 0,
        theme: cleanThemeName(entry.theme, themesApi),
        colors: cleanColors(entry.colors, themesApi),
      });
    }
    return out;
  }

  // Rename a saved theme. Returns {themes} or {error}.
  function renameSavedTheme(themes, oldName, newName, themesApi) {
    var list = validateSavedThemes(themes, themesApi);
    var index = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name.toLowerCase() === String(oldName).toLowerCase()) {
        index = i;
        break;
      }
    }
    if (index === -1) return { error: 'No saved theme named "' + oldName + '" was found.' };
    var error = validateSavedThemeName(newName, list, themesApi, list[index].name);
    if (error) return { error: error };
    var next = list.slice();
    next[index] = {
      name: newName.trim(),
      createdAt: list[index].createdAt,
      theme: list[index].theme,
      colors: list[index].colors,
    };
    return { themes: next };
  }

  // Delete a saved theme by name (case-insensitive).
  // Unknown names return the list unchanged.
  function deleteSavedTheme(themes, name, themesApi) {
    var list = validateSavedThemes(themes, themesApi);
    var lower = String(name).toLowerCase();
    return list.filter(function (theme) {
      return theme.name.toLowerCase() !== lower;
    });
  }

  // File name for an exported theme: lower-case,
  // non-alphanumerics become dashes, e.g. "My Night"
  // -> "oneyt-theme-my-night.json".
  function exportFileName(name) {
    var slug = String(name || 'theme')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) slug = 'theme';
    return 'oneyt-theme-' + slug + '.json';
  }

  // Serialise one saved theme for export. Returns
  // { json, filename } — the JSON is pretty-printed
  // so a shared file stays readable.
  function exportSavedTheme(savedTheme) {
    var data = {
      oneytTheme: EXPORT_FORMAT_VERSION,
      name: savedTheme.name,
      theme: savedTheme.theme,
      colors: savedTheme.colors,
    };
    return { json: JSON.stringify(data, null, 2), filename: exportFileName(savedTheme.name) };
  }

  // Parse pasted / uploaded theme JSON into a saved
  // theme. Returns { theme } on success or { error }
  // on failure; the stored list is never touched here
  // — the caller adds the result (and reports a
  // duplicate name) only after the user confirms.
  // Rejects: non-JSON, non-objects, missing/wrong
  // version marker, missing or non-string name,
  // unknown base theme, non-object colours, unknown
  // colour keys, invalid hex values, and names that
  // already exist in `existing`.
  function parseSavedThemeImport(text, existing, themesApi) {
    if (typeof text !== 'string' || !text.trim()) {
      return { error: 'Import is empty — paste exported theme JSON first.' };
    }
    var data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { error: 'Not valid JSON: ' + err.message };
    }
    if (!isPlainObject(data)) return { error: 'Imported theme must be a JSON object.' };
    if (data.oneytTheme !== EXPORT_FORMAT_VERSION) {
      return { error: 'This file is not a OneYT theme export (missing oneytTheme: 1).' };
    }
    if (typeof data.name !== 'string' || !data.name.trim()) {
      return { error: 'Imported theme has no name.' };
    }
    if (typeof data.theme !== 'string' || !themesApi) {
      return { error: 'Imported theme has no base theme.' };
    }
    if ((themesApi.THEME_NAMES || []).indexOf(data.theme) === -1) {
      return { error: 'Imported theme uses unknown base theme "' + data.theme + '".' };
    }
    if (!isPlainObject(data.colors)) {
      return { error: 'Imported theme has no colours.' };
    }
    var keys = themesApi.CUSTOM_COLOR_KEYS || {};
    for (var key in data.colors) {
      if (!Object.prototype.hasOwnProperty.call(keys, key)) {
        return { error: 'Imported theme has unknown colour "' + key + '".' };
      }
      var value = data.colors[key];
      if (value !== '' && !(themesApi.isValidHex && themesApi.isValidHex(value))) {
        return { error: 'Imported theme has an invalid colour for "' + key + '".' };
      }
    }
    var nameError = validateSavedThemeName(data.name, existing, themesApi);
    if (nameError) return { error: nameError };
    return {
      theme: {
        name: data.name.trim(),
        createdAt: Date.now(),
        theme: data.theme,
        colors: cleanColors(data.colors, themesApi),
      },
    };
  }

  var api = {
    MAX_SAVED_THEMES: MAX_SAVED_THEMES,
    MAX_SAVED_THEME_NAME_LENGTH: MAX_SAVED_THEME_NAME_LENGTH,
    EXPORT_FORMAT_VERSION: EXPORT_FORMAT_VERSION,
    cleanColors: cleanColors,
    cleanThemeName: cleanThemeName,
    validateSavedThemeName: validateSavedThemeName,
    createSavedTheme: createSavedTheme,
    applySavedTheme: applySavedTheme,
    validateSavedThemes: validateSavedThemes,
    renameSavedTheme: renameSavedTheme,
    deleteSavedTheme: deleteSavedTheme,
    exportFileName: exportFileName,
    exportSavedTheme: exportSavedTheme,
    parseSavedThemeImport: parseSavedThemeImport,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.savedThemes = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
