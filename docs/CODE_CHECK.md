# OneYT — Code-Check Log (round 1, v1.16.1)

Date: 2026-11-10 · A read-only code audit of every feature
at code level (no real-browser testing — see "Not verified
here" below), then fixes for everything it confirmed.
Three parallel reviewers covered shared engines +
docs, content modules, and dashboard + popup +
onboarding + manifest + service worker. Every finding
below was re-checked against the code before fixing;
44 findings came back, 3 of them major in the shared
engines and 2 major in the content modules.

Baseline before the round: `main` @ `ad1c645`, v1.16.0,
220/220 tests. After the round: 264/264 tests, lint +
format clean. Branch `fix/code-check-round-1`, merged to
`main` per the standing rule (feature complete → merge
to main).

## Fixed

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Dead setting `sidebar.keepPlayerVisible`: dashboard toggle + Cinema preset line existed, no reader anywhere — a placebo control | Setting, control, preset line and test assertion removed (not wired — if the behaviour is wanted, it should be built as a phase) |
| 2 | `deepMerge` accepted `null` for object/array-typed defaults: a stored `{player: null}` wiped the whole section, and preset overrides for that section then silently never applied | `deepMerge` treats a `null` stored value as a type mismatch unless the default is `null` (`shared/defaults.js`) |
| 3 | `deepMerge`'s nullable branch accepted any primitive: `autoplay: "yes"` survived migration, and `applyToggle` then clicked the autoplay/captions toggle on every apply | Nullable branch accepts null/boolean only; `applyToggle` ignores non-boolean desired values (`shared/defaults.js`, `content/modules/playback/playback.js`) |
| 4 | `YT_SPEC_VARS` mapped two tokens onto the same YouTube variable: `card` always overwrote `surface`, `buttonHover` always overwrote `surfaceHover` | One token owns each `--yt-spec-*` target; `card`/`buttonHover` mappings removed (they keep their own `--oneyt-*` vars) |
| 5 | `validateSettings` header + warning said unknown keys are dropped/ignored; migration deliberately preserves them | Comment + warning corrected to "kept as-is" |
| 6 | `validateCustomCSS` brace/paren counting ignored strings and comments: `content: "}"` was rejected as unbalanced | Counter tracks string/comment state |
| 7 | `validateCustomCSS` `url()` regex could be evaded by a quote inside an unquoted URL (`url(https://evil.com/a'b)`) | Replaced with a scanner that also catches the smuggled-quote form (the browser most likely drops such a declaration, but the validator no longer relies on that) |
| 8 | `validateSettings` `'any'` branch was dead code (no top-level default is `null`) | Removed |
| 9 | `SCHEMA_VERSION` defined twice; the `constants.js` copy was never read | Removed from `shared/constants.js` |
| 10 | Repair functions kept profiles/themes that shadow built-in names ("Focus", "dark"), while create/rename rejected them | `validateProfiles` / `validateSavedThemes` drop shadowing entries |
| 11 | `validateHealthRecord` accepted any page-type key | Only known page types (`home`, `watch`, `search`, `subscriptions`, `channel`, `playlist`, `shorts`, `other`) |
| 12 | `base.css` set `--oneyt-player-max-width: 1280px` and `--oneyt-sidebar-width: 402px`, so `maxWidth: 0` was silently capped at 1280px and `customWidth: 0` forced 402px — opposite their documented promises | Variables removed from `base.css`; module CSS fallbacks (`none`/`auto`) now work |
| 13 | Mini-player stale config: `applyMiniPlayer`'s `!el` branch did nothing, so the observer re-applied the old config on reopen; `init()` attached the mini observer before config was known | `!el` branch calls `cleanupMini()`; observer attaches lazily from `applyMiniPlayer` |
| 14 | Focus per-tab override survived page-type changes until reload (AD-07 promised reset on navigation) | `apply()` resets the override on page-type change |
| 15 | Held Shift+F repeated into YouTube and toggled fullscreen: `preventDefault`/`stopPropagation` ran after the repeat check | Both moved before the repeat check; only the action is skipped on repeats |
| 16 | Numeric settings reached apply() unclamped (hand-edited imports bypass the dashboard): `customWidth` 99999, `captionFontSize` 9999, etc. | Every numeric value clamped at apply() to its dashboard control range (layout, navigation, appearance, player, sidebar, playback); sidebar max-height validated as CSS with a default fallback |
| 17 | Navigation compact + wide both set: the wide rule won on equal specificity — a 300px guide with hidden titles | Compact wins over wide (`wide` requires `nav.compact !== true`); the old test pinned the bug and was updated |
| 18 | Stale theater waiter cleared a newer video's pending flag, letting a third waiter start | Flag cleared only when it still equals the waiter's own URL |
| 19 | Health check timer reset on every apply, so continuous resizes/slider drags starved the check forever | Pending timer kept for the same page; only navigation reschedules |
| 20 | `settings-manager.load()` compared `JSON.stringify` output: a stored object with the same keys in a different order looked "changed" and was re-persisted on every load | Key-order-insensitive local `deepEqual` (also in the sync-merge branch) |
| 21 | Sync-merge write back to local storage echoed into the local `onChanged` branch and ran a second full module re-apply | Local branch skips values identical to current state |
| 22 | `waitFor`'s observer callback re-queried the whole document, ignoring the `root` option | Callback uses the same root as the initial query |
| 23 | Page-detector `/feed/` catch-all sent history, library and "you" to HOME, so home-only modules ran there; exact `/shorts` was not SHORTS | Only `/` and `/feed/trending` are home; other feed pages are `other`; exact `/shorts` → SHORTS |
| 24 | Playback kept applying prefs to a detached `<video>` element after YouTube swapped it on SPA navigation | Detached elements (`isConnected === false`) are dropped at the top of apply(), so the waitFor path finds the new one |
| 25 | Dashboard theme was not applied after import, reset-all, preset/profile apply or per-section reset | All five paths go through a `replaceState()` helper that applies the theme before saving |
| 26 | `saveNow()` resolved either way, so callers showed success notices on failed writes; the failure text rendered in success green | `saveNow()` resolves a boolean; success notices gate on it; failure text gets an `.error` class (`var(--ui-danger)`) |
| 27 | Shortcut field blanked on focus with no blur restore | Blur restores the stored shortcut when not capturing |
| 28 | Per-setting Reset for `appearance.colors.*` stored `undefined` (defaults are `{}`) | `getDefault` returns `''` for those keys |
| 29 | Default-speed select options went stale after the preset list changed | `set()` rebuilds the options from current state for `speedPresets` |
| 30 | Unknown stored theme left the theme select blank (dashboard and popup) | Both clamp to `'default'`, matching the appearance renderer's fallback |
| 31 | Profile and saved-theme deletes had no confirmation | `window.confirm` first, matching reset-all |
| 32 | `load()`'s `Promise.all` meant one failing storage read reset settings, profiles, health and themes to defaults | Each read fails independently to `undefined` (migrate/validate already treat that as defaults) |
| 33 | Import size checks compared `text.length` (UTF-16 units) against `MAX_IMPORT_BYTES` | Both import paths measure real bytes via `utf8ByteLength()` (TextEncoder, `text.length` fallback) and report bytes |
| 34 | Free-text CSS settings (`player.border`, `player.shadow`, `player.miniPlayer.shadow`, `sidebar.maxHeight`) were stored unvalidated | Controls carry a `cssProperty` field; `makeText` probe-validates against a dummy element's style, warns and reverts on invalid input |
| 35 | `onChanged` ignored `PROFILES_KEY` / `SAVED_THEMES_KEY`, so open Profiles/Appearance sections went stale; the Layout preview is drawn in render, not `refreshValues` | Both keys re-read, validated and re-rendered when their section is open; settings changes re-render the Layout section when open |
| 36 | Dashboard search indexed only section controls: CSS templates, layout presets, profiles and saved themes were unfindable | `dynamicSearchEntries()` appends them at search time; activating one switches to its section |
| 37 | Dark-theme `.btn-primary` (white on `#ff0033`, ~3.9:1) was below WCAG AA 4.5 in options, popup and onboarding CSS | Dark-scope override uses `#e6002e` (4.53) and `#cc0027` on hover; `--ui-accent` stays `#ff0033` for non-text accents |
| 38 | Popup `update()` did load → set per toggle: two fast toggles raced and the first could be lost | One in-memory settings copy (updated synchronously on write, refreshed on render/storage change); preset handler uses the same cache; writes are chained so they cannot land out of order |
| 39 | Onboarding re-open returned before `applyTheme()`: the page stayed on the pre-JS fallback theme | `applyTheme()` runs before `showStep('done')` |
| 40 | Onboarding `init()` silently returned on missing APIs, leaving a blank page | Renders a plain error message into the page |
| 41 | Sidebar `bindWheel` re-attached the wheel listener on every apply | Skips when element and sensitivity are unchanged |
| 42 | `renderSection` rebuilt every control row but left `inputsByKey` pointing at detached nodes | Cleared at the start of `renderSection` |
| 43 | `onboarding.html` loaded `shared/validators.js`, which onboarding.js never uses | Include removed |
| 44 | `onboardingPresetId` hardcoded the preset-id list, duplicating `BUILTIN_PRESETS` | Derives ids from `BUILTIN_PRESETS` when passed (literal list only as fallback) |
| 45 | `applyProfile` overwrote `ui.onboarded`: a pre-onboarding profile un-completed setup | `applyProfile` preserves the current `ui.onboarded` |

## Verified clean (no bug)

- Selector/health counts agree everywhere: `SELECTORS` 33
  keys, `SELECTOR_HEALTH` 33 keys, identical sets; pins at
  33 in `tests/selectors.test.js` and
  `tests/popup-theme.test.js`; dashboard script pin 23 ==
  23 `<script>` tags in `options/options.html`.
- No dangerous sinks: no `eval`, `new Function`,
  `innerHTML`, `fetch` or XHR anywhere in extension code
  (only comments mentioning them); custom CSS is applied
  via `textContent`; manifest permissions exactly
  `['activeTab', 'storage']`, hosts YouTube-only.
- Custom font / accent color are safe as claimed:
  `resolveFontFamily` only emits a quoted name after the
  strict allowlist check; the accent is validated as
  `#rrggbb` before applying.
- Sync (AD-08) holds: `syncableSettings` deletes only
  `appearance.customCSS`; the sync merge preserves local
  custom CSS; profiles/themes/health keys are local-only.
- Settings coverage: every leaf in `DEFAULT_SETTINGS`
  has a dashboard control — 111 controls before this
  round, 110 after finding #1 (verified by
  `tests/dashboard.test.js`). `speedPresets` is genuinely
  consumed.
- Docs mostly consistent: PRD has all 24 PL rows;
  CHANGELOG lists 1.16.0/1.15.0; test counts in
  Phases.md/Memory.md matched the stated history before
  this round.

## Docs staleness fixed in this round

- README tests badge said "121 passing" (the v1.0.0
  count); now 264.
- `package.json` version was stale at "1.1.0" while the
  manifest said 1.16.0; both now say 1.16.1.
- `Memory.md` summary table was frozen at the Phase 16
  era (Version 1.14.0, `main` @ `1077140`, "Phases 1–12
  + 14–16 … 106 controls", browser verification "Phase
  1–6 sections"); updated to the Phase 24 + code-check
  state (110 controls).
- `Phases.md` Future list still contained shipped work
  (popup theme, channel Shorts tab — both Phase 19);
  those two bullets are deleted. ("Optional cloud sync /
  cross-device backup" stays, but it is ambiguous
  against AD-08 sync — it would need clarifying before
  anyone builds it.)

## Checked, kept (deliberately not changed)

- `.control-reset`, `.control-speed-list`,
  `.layout-preview-grid`, `.layout-preview-cell` are
  class hooks in `options.js` with no CSS rules —
  harmless, no removal.
- `isPlainObject` is copy-pasted into 5 shared files:
  extracting it to one helper was skipped (manifest
  load-order risk, low benefit).
- The three repair functions (`validateProfiles`,
  `validateSavedThemes`, `validateHealthRecord`) each
  hand-roll the same loop: a shared helper was skipped
  (too invasive for this round).
- The 4-line theme resolver stays local per page
  (dashboard / popup / onboarding) by design, per the
  Phase 19 comment.
- No auto-disable on health "broken", by design
  (Phase 18).

## Not verified here (needs a real browser)

No live-browser testing happened in this round — the
extension was never loaded in Chrome here, only the code
was read and the Node suite was run. These suspicions
from the review need a real YouTube page to prove or
dismiss:

- **S1.** `validateCustomCSS`'s `url()` hardening (finding
  #7): confirm Chrome never fetches a quote-smuggled
  URL.
- **S2.** Player `measure()` stale geometry; `#movie_player`
  overflow clipping; theater observer stale flexy.
- **S3.** Focus "hide recommendations" blanking home
  (probably intended — product decision); focus Shorts
  hiding partial.
- **S4.** Caption font-size vs YouTube inline styles;
  recommendation thumbnail height; popup preset select
  overflow with long names; `.control-input` min-width
  overflow.
- **S5.** Health "broken" verdict sticking from a
  transient miss on one page type (self-heals on
  re-check, but a slow load could flash a false
  "broken").
- **S6.** Free-text CSS settings (`player.border` /
  `player.shadow`, `sidebar.maxHeight`) reach the page
  unvalidated from a crafted import (self-import threat
  model only; `setProperty` drops outright-invalid
  values).

The browser checklists in `tests/manual-checklist.md`
(Phases 1–6, 8–12, 14–24) are still open, on Shanto's PC.
