# OneYT — Phases

> **Product:** OneYT — All-in-One YouTube Customizer
> **Version:** v1.0 — 2026-11-09
> **Status:** Planning — Phase 0 done (this doc set), no code yet
> **Rule:** one phase at a time, in order. A phase is done only
> when **every** item in its checklist is checked. Never start
> the next phase's code while the current phase's checklist is open.

---

## Phase 0 — Planning & Workspace ✅ DONE

**Goal:** freeze what to build, how, and in what order — before
any code exists.

| # | Task | Status |
|---|------|--------|
| 0.1 | Create workspace `~/workspace/oneyt/` | ✅ Done |
| 0.2 | Write `PRD.md` (requirements, users, features, DoD) | ✅ Done |
| 0.3 | Write `Architecture.md` (flow, modules, schema, structure) | ✅ Done |
| 0.4 | Write `Rules.md` (use / avoid, error handling, AI boundaries) | ✅ Done |
| 0.5 | Write `Phases.md` (this file) | ✅ Done |
| 0.6 | Write `Design.md` (colours, themes, fonts) | ⬜ Next |
| 0.7 | Write `Memory.md` (progress tracker) | ⬜ Next |
| 0.8 | Create GitHub repo `shantopaul/OneYT` (user decision) | ✅ Done 2026-11-09 — private repo, planning docs pushed to `main` (`5e608e1` + `a52cd3e`) |

**Exit criteria:** all six docs exist, user has read them, repo
decision made. **No code in Phase 0.**

---

## Phase 1 — Foundation ✅ CODE COMPLETE (2026-11-09)

**Goal:** a working MV3 extension shell that loads on YouTube,
stores settings, detects pages, and manages modules — with no
visible features yet except a master on/off.

**Deliverable:** loadable unpacked extension, v0.1.0.

**Status 2026-11-09:** code complete on branch
`feature/foundation` (22 part-by-part commits, pushed after
completion, `main` untouched). `npm test` 38/38 pass, lint +
format clean, manifest valid, no polling/network. **Browser
verification still open** — load unpacked, SPA navigation,
console errors and live selectors need Chrome on Shanto's PC
(`tests/manual-checklist.md`). AD-06 decided (classic scripts,
`OneYT` global, no bundler). `options_page` removed from the
manifest until the Phase 5 dashboard exists.

### Tasks

| # | Task | Files |
|---|------|-------|
| 1.1 | `manifest.json` (MV3, `storage` only, youtube.com only) | `manifest.json` |
| 1.2 | Service worker — install/upgrade, message relay only | `background/service-worker.js` |
| 1.3 | `shared/defaults.js` — `DEFAULT_SETTINGS` + `SCHEMA_VERSION = 1` | `shared/defaults.js` |
| 1.4 | `shared/selectors.js` — first selector set, verified live | `shared/selectors.js` |
| 1.5 | `shared/storage.js` + `settings-manager.js` — load / save / watch / migrate / validate | `shared/storage.js`, `content/core/settings-manager.js` |
| 1.6 | `page-detector.js` — page types + `yt-navigate-finish` | `content/core/page-detector.js` |
| 1.7 | `module-manager.js` + `event-bus.js` + `logger.js` | `content/core/` |
| 1.8 | `app.js` + `content/index.js` — startup flow (§2.1) | `content/` |
| 1.9 | **Decide AD-06:** ES-module loading strategy for content scripts; record decision | `Architecture.md`, `Memory.md` |
| 1.10 | Minimal popup: master enable/disable + status | `popup/` |
| 1.11 | ESLint + Prettier config; `.gitignore` | root |
| 1.12 | Unit tests: settings migration + validators | `tests/` |
| 1.13 | Original icons (16/48/128) — placeholder-safe, final art in Phase 7 | `assets/icons/` |

### Checklist (all must pass)

- [ ] Extension loads unpacked in Chrome with zero errors
- [ ] Activates on youtube.com only — no injection elsewhere
- [ ] Settings load, save, persist across restart
- [ ] Old-schema settings migrate without overwriting user values
- [ ] Page detection correct: home / watch / search / subs / channel / playlist
- [ ] SPA navigation (watch → watch, home → watch, back/forward) re-detects
- [ ] Master toggle disables everything and restores YouTube exactly
- [ ] No console errors on Home / Watch / Search
- [ ] No polling, no network requests (verify in DevTools Network tab)

---

## Phase 2 — Core Layout (Flagship) ✅ CODE COMPLETE (2026-11-09)

**Goal:** the differentiator — independent sidebar scrolling +
stationary player + player/sidebar sizing.

**Deliverable:** functional layout customisation, v0.2.0.

**Status 2026-11-09:** code complete on branch `feature/core`
(8 part-by-part commits on top of `feature/foundation`, pushed
after completion, `main` untouched). `npm test` 51/51 pass, lint
+ format clean, manifest valid, no polling/network. **Browser
verification still open** — the visual behaviour (player staying
visible, fixed/absolute geometry, no overlap at 1280/1440/1920,
theater/fullscreen, live `#primary #player` selector) needs
Chrome on Shanto's PC (`tests/manual-checklist.md` Phase 2
section). AD-09 decided (module CSS via manifest + classes).
New additive default: `layout.watchSpacing: 0` (schema stays v1).

### Tasks

| # | Task | Module |
|---|------|--------|
| 2.1 | Sidebar module: independent scroll (`#secondary`, `max-height`, `overscroll-behavior: contain`) | `sidebar` |
| 2.2 | Sidebar settings: enable, max-height, width, scrollbar visibility/width, smooth scroll, sensitivity | `sidebar` |
| 2.3 | Player module: width, max-width, alignment (left/center/right) | `player` |
| 2.4 | Player module: position — default / sticky / fixed / absolute (with container measurement, no overlap) | `player` |
| 2.5 | Player appearance: radius, border, shadow, background, spacing | `player` |
| 2.6 | Fullscreen guard: suspend positioning in fullscreen, restore on exit | `player`, `sidebar` |
| 2.7 | Theater mode compatibility | `player` |
| 2.8 | Responsive handling: resize (debounced), narrow viewports | `player`, `sidebar`, `layout` |
| 2.9 | Layout module (part 1): watch-page spacing, sidebar width wiring, hide comments toggle | `layout` |

### Checklist

- [ ] Player stays visible while sidebar scrolls (mouse wheel over sidebar only)
- [ ] Video keeps playing during sidebar scroll
- [ ] Player width / alignment apply live and survive SPA navigation
- [ ] `position: absolute` works without overlapping sidebar or controls
- [ ] No overlap, no horizontal scrollbar at 1280 / 1440 / 1920 px widths
- [ ] Fullscreen: positioning suspended, native fullscreen intact
- [ ] Theater: no breakage toggling theater on/off
- [ ] Disabling sidebar/player module restores YouTube exactly
- [ ] Resize: no layout thrash, debounced updates

---

## Phase 3 — Appearance System ✅ CODE COMPLETE (2026-11-09)

**Goal:** themes, colours, typography, custom CSS.

**Deliverable:** advanced appearance customisation, v0.3.0.

**Status 2026-11-09:** code complete on branch `feature/appearance`
(6 part-by-part commits on top of `main` `d6d2df1`, pushed after
completion, nothing merged). `npm test` 68/68 pass, lint + format
clean, manifest valid, no polling/network. AD-10 decided (themes
map OneYT tokens onto YouTube `--yt-spec-*` vars, graceful
degradation if renamed). New defaults: `appearance.borderRadius:
12`, `appearance.spacing: 16`, `layout.thumbnailSize: 0` (schema
stays v1). **Browser verification still open** — the visual
behaviour (presets across pages, instant switching, custom CSS,
typography layout, home grid) needs Chrome on Shanto's PC
(`tests/manual-checklist.md` Phase 3 section). Two real bugs
were found and fixed by the tests: `resolveThemeVars('custom')`
fell back to empty vars instead of the dark base, and invalid
typography values left stale variables behind. Note: task 3.6's
editor UI (edit/import/export) belongs to the Phase 5 dashboard;
Phase 3 ships the validated apply/enable/disable engine.

### Tasks

| # | Task | Module |
|---|------|--------|
| 3.1 | CSS variable token system (`base.css`, see `Design.md` §3) | `appearance` |
| 3.2 | Theme presets: Default, Dark, Light, Midnight, AMOLED Black, Minimal, Custom | `appearance` |
| 3.3 | Colour controls: primary / secondary / accent / bg / text / border / card / hover / button | `appearance` |
| 3.4 | Typography controls: family / size / weight / line-height / spacing | `typography` |
| 3.5 | Border radius + UI spacing controls | `appearance` |
| 3.6 | Custom CSS editor: edit / enable / disable / reset / import / export / basic validation | `appearance` |
| 3.7 | Custom CSS isolation: separate style tag, toggleable without touching theme | `appearance` |
| 3.8 | Layout module (part 2): homepage grid columns, card spacing, thumbnail size, hide Shorts/sections | `layout` |

### Checklist

- [ ] Every preset applies across Home / Watch / Search / Channel
- [ ] Switching presets is instant (variable swap, no reload)
- [ ] Custom colours override preset without breaking contrast of native controls
- [ ] Custom CSS on/off instantly; invalid CSS rejected with a message, never breaks the page
- [ ] Typography changes do not break video titles, descriptions, or comments layout
- [ ] Disabling appearance module restores YouTube's own theme exactly

---

## Phase 4 — Playback & Productivity ✅ CODE COMPLETE (2026-11-09)

**Goal:** playback preferences, Focus Mode, keyboard shortcuts.

**Deliverable:** productivity + playback modules, v0.4.0.

**Status 2026-11-09:** code complete on branch `feature/Productivity`
(10 part-by-part commits on top of `main` `d49ac19`, pushed after
completion, nothing merged). `npm test` 83/83 pass, lint + format
clean, manifest valid, no polling/network. AD-07 decided (Focus
Mode = global setting + per-tab in-memory toggle). New defaults:
`playback.captionFontSize: 0`, `player.miniPlayer.*`,
`productivity.focusHideButtons/Metadata/Nav`, keyboard shortcut
defaults (all Shift+ combos), `navigation.*` section (schema stays
v1). **Browser verification still open** — the real behaviour
(remembered speed across restarts, quality fallback, Focus restore,
mini-player drag, shortcuts on a live page, guide hiding) needs
Chrome on Shanto's PC (`tests/manual-checklist.md` Phase 4 section).
Deliberately deferred to Phase 5: shortcut reset UI, speed-preset
add/remove UI, recommendation section toggles (need dashboard list
UI), caption appearance beyond font size.

### Tasks

| # | Task | Module |
|---|------|--------|
| 4.1 | Playback: default speed, remember speed, custom speed presets (add/remove) | `playback` |
| 4.2 | Playback: default volume, remember volume | `playback` |
| 4.3 | Playback: quality preference (best-effort), autoplay, captions + caption appearance | `playback` |
| 4.4 | **Decide AD-07:** Focus Mode scope (global vs per-tab) — record decision | `Architecture.md`, `Memory.md` |
| 4.5 | Focus Mode: one-click hide (comments, chat, recommendations, Shorts, buttons, metadata, nav) + **exact restore** | `focus` |
| 4.6 | Recommendations module: hide sidebar, hide/show sections, card size, density, metadata | `recommendations` |
| 4.7 | Mini-player enhancements: size, position, radius, shadow, offsets | `player` (mini-player) |
| 4.8 | Keyboard module: configurable shortcuts, duplicate detection, conflict warnings, reset | `keyboard` |
| 4.9 | Navigation module: hide nav items/sections, width, compact mode (never hide account/accessibility) | `navigation` |

### Checklist

- [ ] Speed/volume remembered across videos and restarts
- [ ] Speed presets add/remove correctly; invalid speeds rejected
- [ ] Quality preference falls back gracefully when unavailable
- [ ] Focus Mode hides exactly the configured elements — and restores **exactly** the previous state on toggle-off
- [ ] Shortcuts work, duplicates blocked, YouTube-native conflicts warned
- [ ] Mini-player still works natively (open/close/drag)
- [ ] Navigation hiding never removes account menu or accessibility controls

---

## Phase 5 — Settings Dashboard ✅ CODE COMPLETE (2026-11-09)

**Goal:** the complete settings interface — popup, dashboard,
search, import/export.

**Deliverable:** complete customisation interface, v0.5.0.

**Status 2026-11-09:** code complete on branch `feature/Settings`
(11 part-by-part commits on top of `main` `33d9e08`, pushed after
completion, nothing merged). `npm test` 93/93 pass, lint + format
clean, manifest valid, no polling/network. AD-08 decided (sync
scope: opt-in; everything except `appearance.customCSS`; remembered
playback never syncs; implementation in Phase 6). 9 dashboard
sections, 96 controls — unit-tested to cover every leaf setting
in the defaults tree (except `schemaVersion`). Dashboard writes go
straight to storage, so open YouTube tabs apply changes live.
Final popup: master switch, page status (activeTab permission,
URL only), Focus/scroll/player quick toggles, theme selector,
dashboard opener. **Browser verification still open** — the live
dashboard, search jump, import file picker, popup on a real tab
and live-apply need Chrome on Shanto's PC
(`tests/manual-checklist.md` Phase 5 section). Sync
implementation itself is Phase 6 work (AD-08 scope decided
here); no sync toggle ships in Phase 5 (no dead controls).

### Tasks

| # | Task | Files |
|---|------|-------|
| 5.1 | Popup (final): enable/disable, page status, Focus toggle, Scroll toggle, theme selector, player toggle, Quick Settings, Open Dashboard | `popup/` |
| 5.2 | Dashboard shell: left nav, top bar, section rendering from control schema | `options/` |
| 5.3 | Dashboard sections (one file each): General, Player, Layout, Appearance, Playback, Sidebar, Productivity, Keyboard, Advanced | `options/sections/` |
| 5.4 | Settings search (by name/keyword → jump to control) | `options/` |
| 5.5 | Live preview: changes apply immediately where practical | `options/` + modules |
| 5.6 | Per-setting / per-section / global reset | `options/` |
| 5.7 | Import/Export JSON: validate, preview changes, apply, error list | `options/`, `shared/validators.js` |
| 5.8 | **Decide AD-08:** sync scope (which keys sync, opt-in) | `Architecture.md`, `Memory.md` |
| 5.9 | Module toggles in dashboard (disable one module, others unaffected) | `options/` |
| 5.10 | Dashboard design pass per `Design.md` (extension UI tokens) | `options/`, `popup/` |

### Checklist

- [ ] Every setting reachable from the dashboard; every setting has name + description + current + default + reset
- [ ] Search finds settings by keyword and jumps to them
- [ ] Live changes apply without reload; reset restores defaults
- [ ] Import validates and previews before applying; invalid file rejected with field errors
- [ ] Export → import round-trip reproduces the same settings
- [ ] Disabling a module from the dashboard disables only that module
- [ ] Popup opens fast, shows correct page status, all quick toggles work

---

## Phase 6 — Optimisation & Testing ✅ CODE COMPLETE (2026-11-09)

**Goal:** stable release candidate. No new features in this phase
unless a Phase 1–5 checklist item forces one.

**Deliverable:** release candidate, v0.9.0.

**Status 2026-11-09:** code complete on branch
`feature/Optimisation` (15 part-by-part commits on top of
`main` `5b44c9e`, pushed after completion, nothing merged).
`npm test` 121/121 pass, lint + format clean, manifest valid,
no polling/network. The one feature this phase was allowed:
AD-08 sync wiring (opt-in toggle, mirror minus Custom CSS,
seed + merge, failure-safe). Audits produced 11 fixes
(`docs/BUG_BASH.md`): mini-player observer gating, wheel
sensitivity clamp, remote `url()` in custom CSS blocked, dead
service-worker relay removed, import size enforced, WCAG AA
contrast, focus rings, Tab capture trap, Tab/Escape
unbindable shortcuts, import number clamping, dead selector
removed. Version bumped to 0.9.0. **Browser verification
still open** — cross-browser (6.2), viewports (6.3),
fullscreen/theater (6.5), two-profile sync, live selectors
and memory need Chrome/Edge/Brave on Shanto's PC
(`tests/manual-checklist.md` Phase 6 section).

### Tasks

| # | Task |
|---|------|
| 6.1 | Performance pass: audit observers/listeners, remove leaks, confirm no polling, debounce check |
| 6.2 | Cross-browser test: Chrome, Edge, Brave (same checklist) |
| 6.3 | Viewport test: 1024 / 1280 / 1440 / 1920 / ultrawide |
| 6.4 | SPA navigation stress: 20 navigations, back/forward, no duplicate listeners/style tags |
| 6.5 | Fullscreen + theater regression |
| 6.6 | Settings migration test: v0.1 settings → current (fixture per version) |
| 6.7 | Selector audit: verify every selector in `selectors.js` against live YouTube; fix/update |
| 6.8 | Security/privacy review: permissions, storage, import validation, no network calls (per `Rules.md` §4.4) |
| 6.9 | Accessibility pass (dashboard + popup): keyboard navigation, focus states, contrast |
| 6.10 | Bug bash: fix all critical + major bugs; log minors for v1.1 |

### Checklist

- [ ] Full manual checklist (`tests/manual-checklist.md`) passes on Chrome, Edge, Brave
- [ ] No console errors on any page type
- [ ] No duplicate style tags / listeners after 20 SPA navigations
- [ ] Memory: no growth after toggling modules on/off 10×
- [ ] Privacy review signed off (no data leaves device)
- [ ] Zero critical bugs, zero major bugs open

---

## Phase 7 — Public Release ✅ MERGED (2026-11-09)

**Goal:** Chrome Web Store listing + v1.0.0.

**Deliverable:** public release, v1.0.0.

**Status 2026-11-09:** **merged to `main` — PR #7,
`main` now `4ca8a88`. All 7 phases are in `main`.**
Code complete on branch `feature/Release` (12 part-by-part
commits on top of `feature/Optimisation` `4ddac3d`, pushed
after completion). `npm test` 121/121 pass, lint + format
clean, manifest valid, `npm run package` builds a clean
100 KB submission zip. Delivered: final branding (original Y
mark replacing the Phase 1 play-button placeholder), icons
16/48/128 + 512 master, promo tiles 440×280 / 920×680 /
1400×560, honest store listing copy, privacy policy, final
README + CHANGELOG + MIT LICENSE, screenshot shot list,
submission checklist, version 1.0.0, PRD §12 Definition of
Done check (code column complete, browser column open).
**Still open, all Shanto's:** browser checklists Phases 1–6,
5 real screenshots, privacy-policy URL decision
(repo-public vs shantopaul.com), tag `v1.0.0` + GitHub
release, Chrome Web Store submission.
Branch note: PR #6 was still open when Phase 7 started, so
`feature/Release` is based on `feature/Optimisation`.
Shanto merged PR #6 himself during Phase 7 (`main`
`383e35a`), then PR #7 himself (`main` `4ca8a88`).

### Tasks

| # | Task |
|---|------|
| 7.1 | Final branding: logo, name, tagline (original art only) |
| 7.2 | Extension icons (final 16/48/128) + promo images |
| 7.3 | Screenshots (Home / Watch / Dashboard / Focus Mode) — real screenshots, no mockups presented as real |
| 7.4 | Store listing copy (honest: only shipped features, no invented stats) |
| 7.5 | Privacy policy (local-only storage, no data collection) |
| 7.6 | README.md (final) + `docs/store-listing.md` |
| 7.7 | Version bump to 1.0.0, tag `v1.0.0`, GitHub release |
| 7.8 | Submit to Chrome Web Store; fix review feedback |
| 7.9 | Post-release: monitor store reviews, triage v1.1 backlog |

### Checklist

- [ ] PRD §12 Definition of Done — every box checked
- [ ] Store listing approved and live
- [ ] GitHub release published with changelog
- [ ] `Memory.md` marked v1.0 shipped with date + version

---

## Phase 8 — Block Shorts (v1.1) ✅ CODE COMPLETE (2026-11-09)

**Goal:** one master toggle that blocks Shorts fully — hide
them everywhere and do not show them.

**Deliverable:** v1.1.0.

**Status 2026-11-09:** code complete on branch
`feature/shorts-block` (8 part-by-part commits on top of
`main` `4ca8a88`, pushed after completion). **Merged by
Shanto as PR #9 → `main` `c04274e`.** `npm test` 123/123 pass,
lint + format clean, manifest valid, `npm run package` builds
a clean 100 KB `oneyt-1.1.0.zip`. Delivered: new setting
`layout.blockShorts` (default off, additive); layout module
sets `oneyt-block-shorts` on every page type and redirects
`/shorts/VIDEOID` to `/watch?v=VIDEOID` (pure helper
`shortsWatchUrl`, injectable redirect); CSS hides rich
shelves, reel shelves (search / subscriptions), guide +
mini-guide Shorts entries, and Shorts video cards in grids
and search; master toggle at the top of the Layout section;
selector count 20 → 21 (`reelShelf`); version 1.1.0 +
CHANGELOG. The three older per-page Shorts toggles are
unchanged. **Browser verification still open** — the new
selectors and the redirect need a real YouTube page on
Shanto's PC. Known limit: the Shorts tab on channel pages
is not hidden yet (v1.1 follow-up).

## Phase 9 — Dashboard Theme + Search (v1.2) ✅ CODE COMPLETE (2026-11-09)

**Goal:** the settings dashboard gets its own dark / light
mode, every section optimised under light mode — then the
dashboard search bar optimised, position AND functionality.

**Deliverable:** v1.2.0.

**Status 2026-11-09:** code complete on branch
`feature/dashboard-theme` (10 part-by-part commits on top of
`main` `c04274e`, pushed after completion). **Merged by
Shanto as PR #11 → `main` `7b70b80`.**
`npm test` 132/132 pass, lint + format clean, manifest valid,
`npm run package` builds a clean `oneyt-1.2.0.zip`.
Delivered: new setting `ui.dashboardTheme` (default System,
additive — old stored settings migrate with the default);
General section select (System / Dark / Light) via a new
`dashboardThemes` source; JS applies the choice as a
`data-theme` attribute on `<html>` (pure
`resolveDashboardTheme`, applied on load, on change, on
external storage changes, and on OS scheme change while on
System); CSS carries the theme in `:root[data-theme]` rules
with the media query kept as the pre-JS fallback only.
Light-mode contrast fixed by measurement: warning #f59e0b
2.04 → #b45309 4.77, success #22c55e 2.16 → #15803d 4.76,
danger #ef4444 3.57 → #b91c1c 6.15, accent #ff0033 3.76 →
#e6002e 4.53 (white button text 4.77), hover #cc0027 5.84;
text/secondary/muted already passed. `color-scheme`
dark/light keeps native controls in the right scheme. Search
position: input + clear button + dropdown in one
`.search-wrap`, dropdown anchored under the input (the old
magic `top: 56px` offsets are gone), topbar wraps with a
full-width search row under 640px. Search functionality:
ArrowDown/Up navigation (wraps), Enter to jump, Escape to
close/clear, `<mark>` match highlighting (pure
`splitHighlight`, no innerHTML), ranked results (label >
key/section > description), no-results feedback, result
count past 8, clear button, ARIA combobox semantics.
**Browser verification still open** — the theme and the
search need a real dashboard page on Shanto's PC. The popup
stays dark-only for now (follow-up).

## Phase 10 — Hide Endscreen Cards (v1.3) ✅ MERGED (PR #12, 2026-11-09)

**Goal:** one toggle that hides the video suggestions shown
at the end of a video (the endscreen cards), so a video ends
cleanly instead of offering the next watch.

**Deliverable:** v1.3.0.

**Status 2026-11-09:** code complete on branch
`feature/hide-endscreen` (8 part-by-part commits on top of
`main` `7b70b80`, pushed after completion) and **merged by
Shanto as PR #12 → `main` `dc3061b`**.
`npm test` 134/134 pass, lint + format clean, manifest valid,
`npm run package` builds a clean `oneyt-1.3.0.zip`.
Delivered: new setting `player.hideEndscreen` (default off,
additive); selector `endscreenContent:
'.ytp-endscreen-content'` in `shared/selectors.js` (count
21 → 22); player module sets `oneyt-player-hide-endscreen`
on `<html>` in the theater-safe appearance section and its
CSS hides the endscreen container with a plain
`display: none` (class-only hiding, like the focus module —
removing the class restores the endscreen exactly); Player
section toggle after Player spacing; module tests (on/off,
theater, fullscreen, non-watch) + manual checklist item.
**Browser verification still open** — the selector needs a
real video end on Shanto's PC (it is the well-known YouTube
endscreen hook, but YouTube renames DOM elements, so the
live check is the proof).

## Phase 11 — Hide Counts (v1.4) ⏳ IN PROGRESS (2026-11-09)

**Goal:** three separate toggles that hide the like count,
the view count and the subscriber count on the watch page —
the numbers go away, the buttons stay (Like stays clickable,
Subscribe stays clickable).

**Deliverable:** v1.4.0.

**Plan (part-by-part, push only when complete):** three new
settings `player.hideLikeCount` / `player.hideViewCount` /
`player.hideSubscriberCount` (all default off, additive);
three selectors in `shared/selectors.js` (count 22 → 25) —
like `#segmented-like-button
.ytp-spec-button-shape-next__button-text-content` (the count
text inside the Like button; sourced from Return YouTube
Dislike + a current userstyle), views
`ytd-video-primary-info-renderer #info-text` (classic info
line), subscribers `ytd-video-owner-renderer
#subscriber-count`; player module sets
`oneyt-player-hide-like-count` / `-view-count` /
`-subscriber-count` on `<html>` and its CSS hides each
number (class-only hiding, cleared off watch pages and in
fullscreen like every player class); three toggles in the
Player section; module tests + manual checklist item.
**Browser verification still open** — all three selectors
need a real watch page on Shanto's PC; YouTube moved the
views line into the description box in the 2023 layout, so
the views selector is the one most likely to need a
correction after the live check (the live check is the
proof, same as the endscreen selector in Phase 10).
Numbering note: PL-09 is the endscreen row (Phase 10,
merged as PR #12) and this phase takes PL-10–12; v1.4.0
follows because 1.3.0 is in `main` now. Ambient mode was
redirected mid-work: branch `feature/disable-ambient-mode`
exists (no commits yet) with the research done —
`#cinematics` + `.ytp-ambient-canvas` — and becomes Phase 12
when resumed.

## Future (v1.1+, not in scope now)

- Popup dark/light theme to match the dashboard (follow-up to Phase 9)
- Channel-page Shorts tab hiding (follow-up to Block Shorts)
- Workspace presets / saved profiles (per-page profiles)
- Multiple saved themes + community theme sharing (exportable presets)
- Advanced layout editor
- Optional cloud sync / cross-device backup (opt-in, explicit)
- Custom CSS templates library
- More player controls (per user demand)

**Rule:** a future feature enters the plan only by updating
`PRD.md` + `Phases.md` first — never by coding it directly.

---

## How to Use This File During the Build

1. Work top-down, one phase at a time.
2. At the start of a phase, copy its checklist into the working
   chat / `Memory.md` → "Current phase".
3. Check items off only after verifying them in the browser.
4. At the end of a phase, update `Memory.md` (done / next /
   blocked) and this file's phase status.
5. If a phase reveals a missing requirement, update `PRD.md`
   first, then the phase — never code around the PRD.
