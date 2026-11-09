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
| 0.8 | Create GitHub repo `shantopaul/OneYT` (user decision) | ⬜ Awaiting user |

**Exit criteria:** all six docs exist, user has read them, repo
decision made. **No code in Phase 0.**

---

## Phase 1 — Foundation

**Goal:** a working MV3 extension shell that loads on YouTube,
stores settings, detects pages, and manages modules — with no
visible features yet except a master on/off.

**Deliverable:** loadable unpacked extension, v0.1.0.

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

## Phase 2 — Core Layout (Flagship)

**Goal:** the differentiator — independent sidebar scrolling +
stationary player + player/sidebar sizing.

**Deliverable:** functional layout customisation, v0.2.0.

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

## Phase 3 — Appearance System

**Goal:** themes, colours, typography, custom CSS.

**Deliverable:** advanced appearance customisation, v0.3.0.

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

## Phase 4 — Playback & Productivity

**Goal:** playback preferences, Focus Mode, keyboard shortcuts.

**Deliverable:** productivity + playback modules, v0.4.0.

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

## Phase 5 — Settings Dashboard

**Goal:** the complete settings interface — popup, dashboard,
search, import/export.

**Deliverable:** complete customisation interface, v0.5.0.

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

## Phase 6 — Optimisation & Testing

**Goal:** stable release candidate. No new features in this phase
unless a Phase 1–5 checklist item forces one.

**Deliverable:** release candidate, v0.9.0.

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

## Phase 7 — Public Release

**Goal:** Chrome Web Store listing + v1.0.0.

**Deliverable:** public release, v1.0.0.

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

## Future (v1.1+, not in scope now)

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
