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

## Phase 11 — Hide Counts (v1.4) ✅ CODE COMPLETE (2026-11-09)

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
**Done (8 commits):** `a72aa90` start (PRD PL-10–12 +
plan, Memory.md corrected to Phase 10 merged as PR #12),
`4aed32f` settings, `3b0fc96` selectors (count 22 → 25),
`85698a6` player module + CSS, `403f3fb` dashboard toggles,
`eeaac99` tests (136/136 with the endscreen tests) +
checklist, `c86a029` version 1.4.0. Rebased onto `main`
`dc3061b` after PR #12 merged (conflicts in 12 files,
all resolved by keeping both phases' changes). **Browser
verification still open** — all three
selectors need a real watch page on Shanto's PC; YouTube
moved the views line into the description box in the 2023
layout, so the views selector is the one most likely to
need a correction after the live check (the live check is
the proof, same as the endscreen selector in Phase 10).
Numbering note: PL-09 is the endscreen row (Phase 10,
merged as PR #12) and this phase takes PL-10–12; v1.4.0
follows because 1.3.0 is in `main` now. Ambient mode was
redirected mid-work: branch `feature/disable-ambient-mode`
exists (no commits yet) with the research done —
`#cinematics` + `.ytp-ambient-canvas` — and becomes Phase 13
when resumed (renumbered: Phase 12 is hide topic chips,
Phase 14 is default theater).

## Phase 12 — Hide Topic Chips Bar (v1.5) ✅ MERGED (2026-11-09)

**Goal:** one toggle that hides the topic filter chips row
("All", "Music", "Gaming", …) at the top of the home feed,
so the home page opens straight into videos.

**Deliverable:** v1.5.0.

**Plan (part-by-part, push only when complete):** one new
setting `layout.hideTopicChips` (default off, additive);
one selector in `shared/selectors.js` (count 25 → 26) —
`topicChips: 'ytd-feed-filter-chip-bar-renderer'` (the
well-known home chip-bar hook, confirmed by several
independent userstyles); layout module sets
`oneyt-hide-topic-chips` on `<html>` on home pages only
and its CSS hides the bar (class-only hiding, cleared on
watch/other pages like the other home classes); one toggle
in the Layout section; module tests + manual checklist
item. **Done (8 commits):** `809117a` start (PRD PL-13 +
plan, Memory.md corrected to Phase 11 merged as PR #13),
`bdf61e1` setting, `e2bf8b5` selector (count 25 → 26),
`d55958a` layout module + CSS, `1f47d4b` dashboard toggle,
`407682b` tests (137/137) + checklist, `09fd840` version
1.5.0. **Browser verification still open** — the selector
needs a real home page on Shanto's PC; one known risk: the
frosted-glass header (`#frosted-glass`, class
`with-chipbar`) may leave an empty strip where the bar
was, in which case the fix is to collapse that container
too — the checklist asks to check for the gap.
Numbering note: this phase takes Phase 12 because it was
built now; ambient mode moves to Phase 13 and default
theater mode is Phase 14. v1.5.0 is unambiguous: 1.4.0
was in `main` then (PR #13 merged).

## Phase 14 — Default Theater Mode (v1.6) ✅ MERGED (2026-11-09)

**Goal:** every video opens in theater mode automatically
— no click on the theater button, no "t" key, the wide
player is just the default.

**Deliverable:** v1.6.0.

**Plan (part-by-part, push only when complete):** one new
setting `player.defaultTheater` (default off, additive);
the player module clicks the existing `theaterButton`
selector (`#movie_player .ytp-size-button`, already in
`shared/selectors.js` — no new selector, no new CSS, no
new permission) at most **once per video**, tracked by
`location.href` (URL change resets it); if the user exits
theater manually, no re-click on that video; turning the
setting on mid-video enters theater immediately; turning
it off never exits theater. If the button is late, the
existing `dom.waitFor('theaterButton')` (10 s, resolves
null, never rejects) is used, and the click happens only
if still on the same video and still not in theater. The
click-once flag is set synchronously before the click.
The existing apply() guards stay: off-watch and
fullscreen skip everything. No cookie route — deliberately
out of scope (clicking the real button is the documented
YouTube behaviour, a cookie would be a hidden side
channel). Dashboard toggle in the Player section; module
tests + manual checklist item. **Browser verification
still open** — the player may flash at default size
briefly before the click lands; slow loads (button
timing) and watch → watch SPA navigation need a real
watch page on Shanto's PC. If YouTube ever removes
`.ytp-size-button`, the feature silently does nothing and
the page does not break.
**Done (8 commits):** `b3a8bb9` start (PRD PL-14 + plan,
branch rebased onto `main` `6f0b965`, Memory.md corrected
to Phase 11 merged as PR #13), `95a97fe` setting,
`f5248e8` player module click-once logic, `f8ab988`
dashboard toggle, `4237ebe` tests (144/144),
`beecfe7` checklist, `00c263d` version 1.6.0. Selector
count stays 26 (no new selector); no new CSS, no new
permission. **Browser verification still open** — the
flash, slow-load button timing, and watch → watch SPA
navigation need a real watch page on Shanto's PC.
Numbering note: this phase takes Phase 14 because Phase
12 is hide topic chips (merged) and Phase 13 is disable
ambient mode (parked, branch `feature/disable-ambient-mode`
with no commits). v1.6.0 assumed 1.5.0 merges first —
it did.

## Phase 15 — Hide Live / Mixes / News Shelves (v1.7) ✅ MERGED (2026-11-09)

**Goal:** three separate toggles that hide the Live, Mixes,
and News rows from the home feed — the same treatment the
Shorts shelves already get (Phase 8 / hideShortsHome), but
for the other shelf types. (The "— Shorts" in the user's
directive is read as "like Shorts": Shorts hiding itself
already exists and is not rebuilt here.)

**Deliverable:** v1.7.0.

**Plan (part-by-part, push only when complete):** three new
settings `layout.hideLiveShelf` / `layout.hideMixesShelf` /
`layout.hideNewsShelf` (all default off, additive); the
layout module sets `oneyt-hide-live-shelf` /
`oneyt-hide-mixes-shelf` / `oneyt-hide-news-shelf` on home
pages only (cleared on watch/other pages, like the topic
chips class); CSS hides the rows. Hooks, confirmed by a web
search against independent userstyles/userscripts before
coding (the `ytd-rich-shelf-renderer[title*="…" i]` pattern
comes from a HideYouTubeShorts userscript; the
`start_radio=1` mix hook from uBlock filter lists):
- Live: `ytd-rich-shelf-renderer[title*="Live now" i]` —
  the "Live now" shelf.
- Mixes: `ytd-rich-shelf-renderer[title*="Mixes" i]` for a
  Mixes shelf if one renders, plus
  `ytd-rich-item-renderer:has(a[href*="start_radio=1"])`
  for the individual mix cards (mixes on home are
  individual grid items, not a shelf — the uBlock lists
  target them this way).
- News: `ytd-rich-shelf-renderer[title*="News" i]` — the
  "Breaking news" shelf (also catches a plain "News" shelf).
Selector count 25 → 29. No new permission, no JS
observer — class-only hiding like the other shelf rules.
Dashboard: three toggles in the Layout section; module
tests + manual checklist item. **Done (8 commits):**
`254d359` start (PRD PL-15 + plan, Memory.md corrected
to Phase 11 merged as PR #13), `b2c1dea` settings,
`1e7c51c` selectors (count 25 → 29), `76aff04` layout
module + CSS (incl. the Prettier quote fix: CSS
attribute quotes are single, so the selector values
use single quotes inside), `488a8b0` dashboard toggles,
`679efe6` tests (137/137) + checklist, `20bf400`
version 1.7.0. **Browser verification still open** —
the title attributes are the risky part: they are
English UI text (a non-English YouTube UI may use
different titles), and YouTube may rename the shelf
titles; the live check on Shanto's PC is the proof, and
the checklist asks for the real title from DevTools if a
row does not hide. If a hidden shelf leaves an empty gap
(the section wrapper `ytd-rich-section-renderer` stays),
the fix is to hide the wrapper too.
Numbering note: this phase takes Phase 15 because Phase
12 is hide topic chips (merged) and Phase 14 is default
theater (merged); Phase 13 is disable ambient mode
(parked, branch `feature/disable-ambient-mode` with no
commits). v1.7.0 assumed 1.5.0 and 1.6.0 merge first —
they did.

## Phase 16 — Presets / Profiles (v1.8) ✅ MERGED (2026-11-09)

**Goal:** one click to a whole YouTube setup — four built-in
presets (Stock YouTube, Focus, Clean, Cinema) plus named
custom profiles that save the current settings as a snapshot
and restore them exactly, from a new dashboard Profiles
section and from the popup.

**Deliverable:** v1.8.0.

**Status 2026-11-09:** code complete on branch
`feature/presets` (7 part-by-part commits on top of
`main` `4440b49`, pushed after completion) and **merged
to `main` — merge `1077140`, `main` now `1077140`** (per
the standing rule: feature complete → merge to main).
`npm test` 162/162 pass (146 baseline + 16
new), lint + format clean, manifest valid, `npm run
package` builds a clean `oneyt-1.8.0.zip` (114 KB,
runtime files only — zero test/doc files inside).
**Done:** `2f5dba3` start (PRD PL-16 + plan, Memory.md
corrected to Phase 15 merged), `f7149bc` profiles engine
(`shared/profiles.js` pure + `PROFILES_STORAGE_KEY`),
`56961c5` dashboard Profiles section
(`renderProfilesTools`, like `renderAdvancedTools`),
`0cdd99e` popup preset picker, `cb8c893` tests (16 new)
+ checklist, `26eaa0e` format, `d2fc584` version 1.8.0,
`639f9a1` docs. **Browser verification still open** — the dashboard
section, popup picker and live apply need a real browser
on Shanto's PC (`tests/manual-checklist.md` Phase 16).
Numbering note: this phase takes Phase 16 because Phase
12 is hide topic chips (merged), Phase 14 is default
theater (merged) and Phase 15 is hide shelves (merged);
Phase 13 is disable ambient mode (parked, branch
`feature/disable-ambient-mode` with no commits). v1.8.0
assumes 1.7.0 is in `main` — it is.

## Phase 17 — Onboarding (v1.9) ✅ MERGED (2026-11-09)

**Goal:** a new user understands OneYT in under a minute
instead of opening a dashboard with 106 controls and
getting lost. A 3-step welcome setup, shown once on first
install.

**Deliverable:** v1.9.0.

**Plan (part-by-part, push only when complete):** one new
setting `ui.onboarded` (default false, additive; when
true the welcome page never opens on its own again); a
small pure step machine in `shared/onboarding.js`
(`ONBOARDING_STEPS = ['preset', 'theme', 'done']`,
`nextOnboardingStep` / `isOnboardingComplete`); a
dedicated extension page `onboarding/onboarding.html`
(+ CSS + page JS) that reuses the Phase 16 presets and
the Phase 9 dashboard themes — step 1 pick a preset
(Stock / Focus / Clean / Cinema, or "Keep YouTube as
it is" which applies nothing), step 2 pick the dashboard
theme (System / Dark / Light), step 3 done with a
button into the full dashboard; Skip on every step and
Finish both set `ui.onboarded: true` and close the page.
The service worker opens the page once on
`onInstalled` reason `install` (via
`chrome.tabs.create({ url: chrome.runtime.getURL(...) })`;
update installs never open it). The popup gains a
"Welcome setup" button that re-opens the page any time
(no permission change, no new host). No dashboard tour
overlay — deliberately out of scope: the welcome page
IS the tour (it names the three things that matter:
presets, the dashboard, the popup), and an overlay tour
would need a second positioning system on top of the
dashboard engine. Dashboard: nothing new (the setting
has no control — it is set by the page itself).
Module tests for the step machine + the preset/theme
choice application + manual checklist item. **Browser
verification still open** — the first-install open is a
real Chrome behaviour (the worker's `tabs.create` needs
a real install); the checklist covers it plus the
skip/finish/re-open paths.
**Status 2026-11-09:** code complete on branch
`feature/onboarding` (11 part-by-part commits on top of
`main` `fa95f0b`, pushed after completion) and **merged
to `main` — merge `d70d0a9`, `main` now `d70d0a9`** (per
the standing rule: feature complete → merge to main).
`npm test` 170/170 pass (162 baseline + 8 new), lint +
format clean, manifest valid, `npm run package` builds
a clean `oneyt-1.9.0.zip` (runtime files only). **Done:**
`88c1282` start (PRD PL-17 + plan), `993da75` setting
`ui.onboarded`, `b6ac636` dashboard coverage exemption,
`23d4baf` shared step machine, `5a896ba` welcome page,
`ce18f77` service worker install-only open, `c5ed22c`
popup Welcome setup button, `25613b0` tests (8 new),
`4a2f0e6` checklist, `d024566` version 1.9.0,
`180b6ee` docs. **Browser
verification still open** — the first-install open is a
real Chrome behaviour (`tests/manual-checklist.md`
Phase 17).
Numbering note: this phase takes Phase 17 because
Phase 13 is disable ambient mode (parked, branch
`feature/disable-ambient-mode` with no commits) and
Phase 16 is presets (merged). v1.9.0 is unambiguous:
1.8.0 is in `main` now.

## Phase 18 — Selector Health Check (v1.10) ✅ MERGED (2026-11-09)

**Goal:** a YouTube DOM change stops failing silently.
Today a renamed selector means a feature quietly does
nothing — the user finds out by noticing, if at all.
After this phase the dashboard says, per feature,
whether it is working, broken, or simply not seen on
this visit.

**Deliverable:** v1.10.0.

**Plan (part-by-part, push only when complete):** a pure
health engine in `shared/health.js` — per-selector
metadata (`pages`, `feature` label, `presence`:
`always` = the element exists on every load of those
pages, `sometimes` = it only exists in some states;
always-selectors decide the verdict, sometimes ones
are reported as "not seen" and never alarm) +
`checkHealth(selectors, pageType, exists)` +
`validateHealthRecord` (repairs a stored record the
way `validateProfiles` does) + `summarizeHealth`
(overall status + per-feature rows for the dashboard).
A content module `content/modules/health/health.js`
runs one delayed check (2 s, so late elements have
loaded) per page type and re-checks on every SPA
navigation, writing the record to local storage under
`oneyt.health.v1` (local-only, never synced, never a
setting); a failed write is logged, never fatal. The
dashboard gains a Health section (custom render block
like Profiles) showing the overall status, the
per-feature rows, the last-checked time per page, and
a "Check again" button that re-reads the stored
record. **No auto-disable, deliberately:** a selector
missing at check time does not prove the feature is
broken (late loading, page state), and disabling on
that signal would break working features — the
warning IS the feature. No new permission, no new
host, no message relay (the dashboard only reads
storage, like it already does for settings).
Module tests for the engine + the module's check
timing + the record repair + manual checklist item.
**Browser verification still open** — the live DOM is
the proof (`tests/manual-checklist.md` Phase 18).
**Status 2026-11-09:** code complete on branch
`feature/selector-health` (11 part-by-part commits on
top of `main` `f4c31c6`, pushed after completion) and **merged
to `main` — merge `11a28e9`, `main` now `11a28e9`** (per
the standing rule: feature complete → merge to main).
`npm test` 179/179 pass (170 baseline + 9 new), lint +
format clean, manifest valid, `npm run package` builds
a clean `oneyt-1.10.0.zip` (runtime files only).
**Done:** `c221755` start (PRD PL-18 + plan),
`d3bbd69` storage key `oneyt.health.v1`, `fcf6c08`
pure health engine, `9fcea41` health module +
manifest + index wiring, `d82185e` dashboard Health
section, `0da817a` fix — script-count pin 18 → 20
(the dashboard commit landed with 169/170: the pin
was stale, fixed by the next commit), `d0c3341` tests
(9 new), `a301b8d` checklist, `c706784` version
1.10.0, `3cb979a` fix — lint + format in
shared/health.js (the version commit's
"lint/format clean" claim was wrong: the full-repo
check ran after it in the same command and its
output was not read before committing),
`d68c266` docs. **Browser
verification still open** — the live DOM is the
proof (`tests/manual-checklist.md` Phase 18).
Numbering note: this phase takes Phase 18 because
Phase 13 is disable ambient mode (parked, branch
`feature/disable-ambient-mode` with no commits) and
Phase 17 is onboarding (merged). v1.10.0 is
unambiguous: 1.9.0 is in `main` now.

## Phase 19 — Popup Theme + Channel-Page Shorts Tab (v1.11) ✅ MERGED (2026-11-09)

**Goal:** the two small follow-ups that still make the
extension look unfinished from the outside — the popup
is dark-only while the dashboard has had a theme since
Phase 9, and Block Shorts leaves the Shorts tab sitting
on channel pages.

**Deliverable:** v1.11.0.

**Plan (part-by-part, push only when complete):**
- **Popup theme:** the popup follows `ui.dashboardTheme`
  (the same setting the dashboard uses — System / Dark /
  Light), applied live when it changes. `popup.css`
  moves to the dashboard's token structure (`:root`
  dark tokens + `[data-theme='light']` block + the
  `prefers-color-scheme` pre-JS fallback, same measured
  light tokens as Phase 9); `popup.js` gains a local
  pure `resolvePopupTheme` (same 4-line logic as the
  dashboard's `resolveDashboardTheme` and the
  onboarding page's copy — the codebase already accepts
  this duplication rather than a shared export) and sets
  `data-theme` on `<html>` in `render()` plus a
  `matchMedia` listener while the setting is 'system'.
  No new setting, no new control — the dashboard's
  theme select already covers it.
- **Channel Shorts tab:** tied to `layout.blockShorts`
  (no new setting — Block Shorts means no Shorts
  anywhere). One selector key `channelShortsTab:
  'yt-tab-shape[tab-title="Shorts"]'` in
  `shared/selectors.js` (sourced from three
  independent lists: the gijsdev uBlock Hide YouTube
  Shorts list, the HideYouTubeShorts userscript, and
  the Youtube Clear View list — all three use the
  `tab-title="Shorts"` hook) + one rule in
  `layout.css` under the existing `oneyt-block-shorts`
  class (already set on every page type, including
  channel, so no module change). The Block Shorts
  toggle description gains the channel tab. Health
  metadata: pages `['channel']`, presence `sometimes`
  (not every channel has a Shorts tab). **Honest
  limit:** `tab-title` is English UI text — a
  non-English YouTube UI may use a different title,
  same caveat as the Phase 15 shelf titles.
- Module tests for the popup theme function + the CSS
  tokens + the new selector wiring + manual checklist
  item. **Browser verification still open** — the live
  DOM is the proof (`tests/manual-checklist.md`
  Phase 19).
**Status 2026-11-09:** code complete on branch
`feature/popup-theme-shorts-tab` (10 part-by-part
commits on top of `main` `d2bde2d`, pushed after
completion) and **merged to `main` — merge
`0a0aacd`, `main` now `0a0aacd`** (per the standing
rule: feature complete → merge to main).
`npm test` 183/183 pass (179 baseline + 4 new),
lint + format clean, manifest valid,
`npm run package` builds a clean `oneyt-1.11.0.zip`
(runtime files only). **Done:** `b3ea475` start
(PRD PL-19 + plan), `dd9ba55` popup.css tokens +
light block, `8699a3f` popup follows
ui.dashboardTheme, `0c6d254` channel Shorts tab
under Block Shorts + health metadata (selector
count 30 → 31; the CSS quote trap — Prettier
rewrites CSS attribute quotes to single, so the JS
value uses single quotes inside), `7abe73e` tests
(4 new) + a real engine fix found by them
(summarizeHealth returned 'ok' for a sometimes-
only record — now 'unknown'), `cc78d18` fix —
test expectation follows the corrected rule (the
previous commit landed 182/183: the fail line was
not read before committing), `c2c3c31` fix —
summarizeHealth takes `now` + the channel test
uses a fresh record (the 1970 timestamp was
dropped as 7-day stale, so the feature read
'unchecked' instead of 'not-seen'; this commit
was verified green before committing),
`568eaed` checklist, `28d11d5` version 1.11.0,
`7f9d096` docs. **Browser verification still open**
— the live DOM is the proof
(`tests/manual-checklist.md` Phase 19).
Numbering note: this phase takes Phase 19 because
Phase 13 is disable ambient mode (parked, branch
`feature/disable-ambient-mode` with no commits) and
Phase 18 is the health check (merged). v1.11.0 is
unambiguous: 1.10.0 is in `main` now.

## Phase 20 — Custom CSS Templates (v1.12) ✅ MERGED (2026-11-09)

(PRD PL-20 + plan), engine, dashboard wiring, tests,
checklist, version, docs.
- Pure engine `shared/cssTemplates.js`: 6 ready-made
  templates as data (`id`, `name`, `description`, `css`)
  + pure helpers `getCssTemplate` / `listCssTemplates` /
  `applyCssTemplate`. Applying appends the template CSS
  to the current Custom CSS text under a marker comment
  (`/* OneYT template: <id> */`) — so applying the same
  template twice is a no-op — and returns the new text;
  unknown ids return the text unchanged. No new setting:
  templates write into `appearance.customCSS` and turn
  `appearance.customCSSEnabled` on, so the existing
  appearance module applies them through the validated
  custom-CSS path (no content-script change, no new
  permission, no new selector in `selectors.js` — the
  template CSS is user-CSS-shaped data, and the selector
  audit scans `content/` only).
- The 6 templates (each does something no setting does):
  hide duration badges
  (`ytd-thumbnail-overlay-time-status-renderer`), fade
  watched videos (`:has` +
  `ytd-thumbnail-overlay-resume-playback-renderer` on
  rich + compact items), hide video badges
  (`ytd-badge-supported-renderer` — "New" / "LIVE" /
  "4K"), hide home metadata (`#metadata-line` under
  rich items — views + age), hide voice search
  (`ytd-masthead #voice-search-button` — sourced from
  3+ independent userstyles + a uBlock filter list),
  hide channel banner (`.banner-visible-area` —
  sourced from the YouTube Custom UI Cleaner
  userstyle). Every template passes
  `validators.validateCustomCSS` (asserted in tests).
- Dashboard: Appearance section tool-box
  (`renderCssTemplateTools` in `options.js`, mirroring
  `renderProfilesTools` — `el()` only, no innerHTML):
  one row per template (name + description + Apply
  button, showing "Applied" when its marker is already
  in the Custom CSS text). Apply saves, refreshes the
  Custom CSS textarea in place, and re-renders with a
  notice. `options.html` gains `shared/cssTemplates.js`
  (script count 20 → 21, pin updated in
  `tests/dashboard.test.js`).
- Removal is manual in v1: delete the template block
  from the Custom CSS box. No per-template remove
  button — the marker comment makes the block easy to
  find. **Honest limits:** template selectors are
  YouTube DOM hooks — if YouTube renames one, that
  template silently does nothing (same caveat as the
  other CSS-based features); `:has()` needs Chrome
  105+. **Browser verification still open** — the live
  DOM is the proof (`tests/manual-checklist.md`
  Phase 20).
**Status 2026-11-09:** code complete on branch
`feature/css-templates` (8 part-by-part commits on top
of `main` `c3732a3`, pushed after completion) and
**merged to `main` — merge `8af093d`, `main` now
`8af093d`** (per the standing rule: feature complete →
merge to main).
`npm test` 193/193 pass (183 baseline + 10 new),
lint + format clean, manifest valid,
`npm run package` builds a clean `oneyt-1.12.0.zip`
(runtime files only). **Done:** `d04d19d` start
(PRD PL-20 + plan), `085fa1d` engine
(`shared/cssTemplates.js`, 6 templates), `3188d99`
dashboard wiring (tool-box in Appearance + script
pin 20 → 21), `3918be9` tests (10 new),
`9743fd8` checklist, `ac588cc` fix — prettier
format, `c0e7e05` version 1.12.0, docs (this commit).
**Browser verification still open** — the live DOM is
the proof (`tests/manual-checklist.md` Phase 20).

## Phase 21 — Saved Themes + Export/Share (v1.13) ✅ MERGED (2026-11-09)

(PRD PL-21 + plan), engine, dashboard wiring, tests,
checklist, version, docs.
- Pure engine `shared/savedThemes.js`: a saved theme
  is theme-only — `{ name, createdAt, theme, colors }`
  (base preset name + the custom-colour overrides),
  unlike a Profile, which snapshots all settings.
  Helpers `createSavedTheme` / `applySavedTheme` /
  `validateSavedThemeName` / `validateSavedThemes` /
  `renameSavedTheme` / `deleteSavedTheme` (mirroring
  `shared/profiles.js`: max 10, names 1–40 chars,
  case-insensitive duplicates rejected, built-in theme
  names reserved) + `exportSavedTheme` (JSON
  `{ oneytTheme: 1, name, theme, colors }`, filename
  `oneyt-theme-<slug>.json`) / `parseSavedThemeImport`
  (rejects bad JSON, wrong version marker, unknown
  base theme, unknown colour keys, invalid hex, and
  duplicate names — a corrupt import never touches
  the stored list). Storage key
  `oneyt.themes.v1` (`SAVED_THEMES_STORAGE_KEY` in
  `shared/constants.js`), local-only, never synced —
  export/share is the sharing path, not sync.
- Dashboard: Appearance section tool-box
  (`renderSavedThemeTools` in `options.js`, mirroring
  `renderProfilesTools` — `el()` only, no innerHTML):
  save the current theme by name; one row per saved
  theme (name + base preset + custom-colour count +
  Apply / Export / Rename / Delete); import box (file
  input or pasted JSON → validate + preview → Add
  theme only on confirm, mirroring the Advanced
  import flow). Applying writes `appearance.theme` +
  `appearance.colors` only — everything else stays —
  and the theme select + colour inputs refresh in
  place. `options.html` gains `shared/savedThemes.js`
  (script count 21 → 22, pin updated in
  `tests/dashboard.test.js`).
- No content-script change (apply rides the existing
  storage onChanged path into the appearance module),
  no new setting, no new permission, no new selector.
  **Honest limits:** a saved theme carries colours
  only — radius, spacing, typography and custom CSS
  are not part of it (that is what Profiles are for);
  an exported file applies on any device, but the
  theme itself never syncs. **Browser verification
  still open** — the live page is the proof
  (`tests/manual-checklist.md` Phase 21).
**Status 2026-11-09:** code complete on branch
`feature/saved-themes` (8 part-by-part commits on top
of `main` `81201fb`, pushed after completion) and
**merged to `main` — merge `03b6120`, `main` now
`03b6120`** (per the standing rule: feature complete →
merge to main).
`npm test` 203/203 pass (193 baseline + 10 new),
lint + format clean, manifest valid,
`npm run package` builds a clean `oneyt-1.13.0.zip`
(runtime files only). **Done:** `1b244ff` start
(PRD PL-21 + plan), `5d602ae` engine
(`shared/savedThemes.js` + `oneyt.themes.v1` key),
`8c7bc5a` dashboard wiring (tool-box in Appearance +
script pin 21 → 22), `3be68b3` tests (10 new),
`a3ba3e9` checklist, `dd483a6` fix — prettier
format, `5f6ad2a` version 1.13.0, docs (this commit).
**Browser verification still open** — the live page
is the proof (`tests/manual-checklist.md` Phase 21).

## Phase 22 — Advanced Layout Editor (v1.14) 🔄 IN PROGRESS (2026-11-09)

(PRD PL-22 + plan), setting + engine, module, dashboard
wiring, tests, checklist, version, docs.
- New additive setting `layout.homeMaxWidth` (0 =
  YouTube default, px, 0–2560): caps the home feed
  grid width and centres it — the ultrawide fix. The
  layout module sets class `oneyt-home-max-width` +
  variable `--oneyt-home-max-width` in `applyHome()`
  (cleared on watch/other pages and in `cleanup()`,
  like the other home vars); `layout.css` centres
  `ytd-rich-grid-renderer` under that class. No new
  selector key — the rule reuses the existing
  `ytd-rich-grid-renderer` element (selector count
  stays 31). A dashboard number control covers the
  setting (the coverage test requires every setting
  to have a control).
- Pure engine `shared/layoutPresets.js`: three
  built-in layout presets as partial overrides over
  the layout numbers — Compact (5 columns, 8 px gap,
  8 px watch spacing, no max-width), Balanced
  (4 columns, 16 px gap, 16 px watch spacing,
  1600 px max-width), Spacious (3 columns, 24 px
  gap, 32 px watch spacing, 1280 px max-width) —
  plus `getLayoutPreset` / `applyLayoutPreset`
  (unknown id → settings back unchanged, mirroring
  `shared/profiles.js`). Applying a preset changes
  only the layout numbers it names.
- Dashboard: Layout-section tool-box
  (`renderLayoutEditorTools` in `options.js`,
  mirroring `renderProfilesTools` — `el()` only, no
  innerHTML): one row per preset (name + what it
  sets + Apply button) and a live preview — a mini
  grid drawn from the current values (columns,
  gap, max-width label), re-rendered whenever the
  section renders, so applying a preset visibly
  changes the preview. Fine-tuning stays in the
  number controls above the tool-box.
- No new permission, no new selector, no sync
  change. **Honest limits:** the preview is a
  diagram of the numbers, not a screenshot of
  YouTube — the live page is the proof; a max-width
  narrower than the viewport leaves empty space on
  both sides of the feed by design; the presets set
  only the five layout numbers (hiding toggles are
  untouched). **Browser verification still open** —
  the live page is the proof
  (`tests/manual-checklist.md` Phase 22).
**Status 2026-11-09:** started on branch
`feature/layout-editor` (from `main` `1324f15`).

## Future (v1.1+, not in scope now)

- Popup dark/light theme to match the dashboard (follow-up to Phase 9)
- Channel-page Shorts tab hiding (follow-up to Block Shorts)
- Optional cloud sync / cross-device backup (opt-in, explicit)
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
