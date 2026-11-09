/* OneYT — shared/profiles.js
 *
 * Presets and custom profiles (Phase 16, PL-16). Pure: no
 * chrome.* here, so unit tests can run it in Node.
 *
 * Two different things, on purpose:
 *
 * - A BUILT-IN PRESET is a PARTIAL override. Applying one
 *   deep-merges its overrides onto the CURRENT settings, so
 *   a preset changes only what it names — everything else
 *   the user set is kept. A preset is a starting point, not
 *   a lock: the user can tweak settings afterwards.
 *
 * - A CUSTOM PROFILE is a FULL snapshot. Saving one stores
 *   the current settings (migrated) under a name; applying
 *   one replaces the current settings with that snapshot
 *   exactly. A profile restores a setup; a preset suggests
 *   one.
 *
 * Profiles are stored under PROFILES_STORAGE_KEY
 * ('oneyt.profiles.v1') in chrome.storage.local, as a plain
 * array of {name, createdAt, settings}. They are LOCAL ONLY
 * and never synced: a profile holds a full settings
 * snapshot, and the storage sync-mirror only acts on values
 * with a `.sync` object, which a profiles value never has.
 *
 * The defaults API (migrateSettings / deepClone /
 * deepMerge) is passed in by the caller (OneYT.defaults in
 * the browser, require('./defaults') in Node) so this
 * module stays pure and testable.
 */
(function () {
  'use strict';

  var MAX_PROFILES = 10;
  var MAX_PROFILE_NAME_LENGTH = 40;

  // Built-in presets. `overrides` is a partial settings
  // tree: only the leaves a preset names are changed.
  var BUILTIN_PRESETS = [
    {
      id: 'stock',
      name: 'Stock YouTube',
      description:
        'OneYT stays on, but YouTube looks and behaves like stock YouTube: no hiding, no reshaping.',
      overrides: {
        enabled: true,
        modules: {
          player: true,
          layout: true,
          sidebar: true,
          appearance: true,
          playback: true,
          recommendations: true,
          focus: true,
          navigation: true,
          typography: true,
          keyboard: true,
        },
        player: {
          defaultTheater: false,
          hideEndscreen: false,
          hideLikeCount: false,
          hideViewCount: false,
          hideSubscriberCount: false,
        },
        layout: {
          blockShorts: false,
          hideShortsHome: false,
          hideShortsWatch: false,
          hideTopicChips: false,
          hideLiveShelf: false,
          hideMixesShelf: false,
          hideNewsShelf: false,
          hideComments: false,
        },
        appearance: {
          theme: 'default',
        },
        recommendations: {
          hideSidebar: false,
        },
        productivity: {
          focusMode: false,
        },
      },
    },
    {
      id: 'focus',
      name: 'Focus',
      description:
        'Distraction-free watching: Focus Mode on, recommendations and Shorts hidden, comments hidden.',
      overrides: {
        productivity: {
          focusMode: true,
          focusHideComments: true,
          focusHideChat: true,
          focusHideRecommendations: true,
          focusHideShorts: true,
          focusHideButtons: true,
          focusHideMetadata: true,
          focusHideNav: true,
        },
        recommendations: {
          hideSidebar: true,
        },
        layout: {
          blockShorts: true,
          hideTopicChips: true,
          hideLiveShelf: true,
          hideMixesShelf: true,
          hideNewsShelf: true,
          hideComments: true,
        },
        player: {
          hideEndscreen: true,
        },
      },
    },
    {
      id: 'clean',
      name: 'Clean',
      description:
        'A tidy home feed and watch page: Shorts, shelves and counts hidden, minimal theme, compact rows.',
      overrides: {
        layout: {
          blockShorts: true,
          hideShortsHome: true,
          hideShortsWatch: true,
          hideTopicChips: true,
          hideLiveShelf: true,
          hideMixesShelf: true,
          hideNewsShelf: true,
        },
        player: {
          hideLikeCount: true,
          hideViewCount: true,
          hideSubscriberCount: true,
        },
        appearance: {
          theme: 'minimal',
        },
        recommendations: {
          density: 'compact',
        },
      },
    },
    {
      id: 'cinema',
      name: 'Cinema',
      description:
        'Every video opens in theater mode on a full-width player, with the recommendations sidebar scrolling on its own.',
      overrides: {
        player: {
          defaultTheater: true,
          customWidth: 0,
          maxWidth: 0,
        },
        sidebar: {
          independentScroll: true,
          keepPlayerVisible: true,
        },
      },
    },
  ];

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function getPreset(id) {
    for (var i = 0; i < BUILTIN_PRESETS.length; i++) {
      if (BUILTIN_PRESETS[i].id === id) return BUILTIN_PRESETS[i];
    }
    return null;
  }

  // Apply a built-in preset onto the current settings.
  // Unknown id → the current settings back, unchanged
  // (cloned, never the same object).
  function applyPreset(currentSettings, presetId, defaultsApi) {
    var preset = getPreset(presetId);
    if (!preset) return defaultsApi.deepClone(currentSettings);
    var merged = defaultsApi.deepMerge(currentSettings, preset.overrides);
    return defaultsApi.migrateSettings(merged);
  }

  // Validate a profile name. Returns an error string, or
  // null when the name is usable. `existing` is the current
  // profiles array (may be empty); `ignoreName` skips one
  // entry, for renames.
  function validateProfileName(name, existing, ignoreName) {
    if (typeof name !== 'string') return 'Profile name must be text.';
    var trimmed = name.trim();
    if (trimmed.length === 0) return 'Profile name cannot be empty.';
    if (trimmed.length > MAX_PROFILE_NAME_LENGTH) {
      return 'Profile name is too long (max ' + MAX_PROFILE_NAME_LENGTH + ' characters).';
    }
    var lower = trimmed.toLowerCase();
    for (var i = 0; i < BUILTIN_PRESETS.length; i++) {
      if (BUILTIN_PRESETS[i].id === lower || BUILTIN_PRESETS[i].name.toLowerCase() === lower) {
        return '"' + trimmed + '" is a built-in preset name — pick another name.';
      }
    }
    var list = Array.isArray(existing) ? existing : [];
    for (var j = 0; j < list.length; j++) {
      if (!list[j] || typeof list[j].name !== 'string') continue;
      if (ignoreName && list[j].name.toLowerCase() === String(ignoreName).toLowerCase()) continue;
      if (list[j].name.toLowerCase() === lower) {
        return 'A profile named "' + list[j].name + '" already exists.';
      }
    }
    return null;
  }

  // Save the current settings as a named profile. Returns
  // {profiles} on success or {error} on failure; the input
  // array is never mutated.
  function createProfile(name, currentSettings, existing, defaultsApi, now) {
    var list = validateProfiles(existing, defaultsApi);
    var error = validateProfileName(name, list);
    if (error) return { error: error };
    if (list.length >= MAX_PROFILES) {
      return { error: 'You already have ' + MAX_PROFILES + ' profiles — delete one first.' };
    }
    var profile = {
      name: name.trim(),
      createdAt: typeof now === 'number' ? now : Date.now(),
      settings: defaultsApi.migrateSettings(currentSettings),
    };
    return { profiles: list.concat([profile]) };
  }

  // Apply a custom profile: full replace with its snapshot.
  // A corrupt snapshot never wipes the current settings —
  // it returns them back, unchanged (cloned).
  function applyProfile(currentSettings, profile, defaultsApi) {
    if (!profile || !isPlainObject(profile.settings)) {
      return defaultsApi.deepClone(currentSettings);
    }
    return defaultsApi.migrateSettings(profile.settings);
  }

  // Repair a stored profiles value into a clean array:
  // non-arrays become [], corrupt entries are dropped,
  // duplicate names keep the first, and at most
  // MAX_PROFILES are kept. Snapshots are migrated so a
  // profile saved under an older schema still applies.
  function validateProfiles(stored, defaultsApi) {
    if (!Array.isArray(stored)) return [];
    var out = [];
    var seen = {};
    for (var i = 0; i < stored.length; i++) {
      if (out.length >= MAX_PROFILES) break;
      var entry = stored[i];
      if (!entry || typeof entry.name !== 'string') continue;
      if (!isPlainObject(entry.settings)) continue;
      var name = entry.name.trim();
      if (name.length === 0 || name.length > MAX_PROFILE_NAME_LENGTH) continue;
      var lower = name.toLowerCase();
      if (seen[lower]) continue;
      // Create/rename reject built-in preset names — repair
      // must too, or a hand-edited list could shadow one.
      var isBuiltin = false;
      for (var k = 0; k < BUILTIN_PRESETS.length; k++) {
        if (BUILTIN_PRESETS[k].id === lower || BUILTIN_PRESETS[k].name.toLowerCase() === lower) {
          isBuiltin = true;
          break;
        }
      }
      if (isBuiltin) continue;
      seen[lower] = true;
      out.push({
        name: name,
        createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : 0,
        settings: defaultsApi.migrateSettings(entry.settings),
      });
    }
    return out;
  }

  // Rename a profile. Returns {profiles} or {error}.
  function renameProfile(profiles, oldName, newName, defaultsApi) {
    var list = validateProfiles(profiles, defaultsApi);
    var index = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name.toLowerCase() === String(oldName).toLowerCase()) {
        index = i;
        break;
      }
    }
    if (index === -1) return { error: 'No profile named "' + oldName + '" was found.' };
    var error = validateProfileName(newName, list, list[index].name);
    if (error) return { error: error };
    var next = list.slice();
    next[index] = {
      name: newName.trim(),
      createdAt: list[index].createdAt,
      settings: list[index].settings,
    };
    return { profiles: next };
  }

  // Delete a profile by name (case-insensitive). Unknown
  // names return the list unchanged.
  function deleteProfile(profiles, name, defaultsApi) {
    var list = validateProfiles(profiles, defaultsApi);
    var lower = String(name).toLowerCase();
    return list.filter(function (profile) {
      return profile.name.toLowerCase() !== lower;
    });
  }

  var api = {
    MAX_PROFILES: MAX_PROFILES,
    MAX_PROFILE_NAME_LENGTH: MAX_PROFILE_NAME_LENGTH,
    BUILTIN_PRESETS: BUILTIN_PRESETS,
    getPreset: getPreset,
    applyPreset: applyPreset,
    validateProfileName: validateProfileName,
    createProfile: createProfile,
    applyProfile: applyProfile,
    validateProfiles: validateProfiles,
    renameProfile: renameProfile,
    deleteProfile: deleteProfile,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.profiles = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
