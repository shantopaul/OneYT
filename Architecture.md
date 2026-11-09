# OneYT — Architecture

> **Product:** OneYT — All-in-One YouTube Customizer
> **Version:** v1.0 — 2026-11-09
> **Status:** v1.0.0 — all phases complete (Phases 0–7 merged to `main`, 2026-11-09); browser verification + store submission still open
> **Companion docs:** `PRD.md` (what), `Rules.md` (how / how not),
> `Phases.md` (when), `Design.md` (look), `Memory.md` (progress)

---

## 1. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Extension standard | **Manifest V3** | Required for Chrome Web Store; service worker, no persistent background page |
| Language | **Vanilla JavaScript (ES2022)** | Lightweight, no build step in v1, no framework overhead on YouTube pages |
| Markup / style | **HTML5 + CSS3** (popup + options page) | Same reason — fast, debuggable |
| Storage | **`chrome.storage.local`** (default), `chrome.storage.sync` (optional, opt-in) | Local-first privacy; sync only for selected prefs |
| Theming | **CSS custom properties (variables)** | One variable swap re-themes the whole injected layer |
| DOM detection | **`yt-navigate-finish` event + `MutationObserver`** (scoped, minimal) | YouTube is an SPA; no polling |
| Build tooling | **None in v1** (plain files, loaded unpacked) | Keep v1 shippable without a bundler; add Vite/esbuild only if the file count forces it — see §9 |
| Lint / format | ESLint (flat config) + Prettier — added in Phase 1 | Catches MV3 API misuse early |
| Version control | Git, repo `shantopaul/OneYT` (to be created at Phase 1) | `main` = stable, `feature/*` branches per phase |

**Explicitly not used in v1:** React/Vue/Svelte, jQuery, Tailwind
(injected pages), any CSS-in-JS, any remote script/CDN, any
analytics SDK, any backend.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Chromium, MV3)                                    │
│                                                             │
│  ┌──────────────────┐   chrome.storage   ┌──────────────┐  │
│  │ Service Worker   │ ◄────────────────► │ storage.local│  │
│  │ background/      │   (settings,       │  (+ sync,    │  │
│  │ service-worker.js│    messages)       │   opt-in)    │  │
│  └──────┬───────────┘                    └──────┬───────┘  │
│         │ chrome.runtime messages               │          │
│  ┌──────▼───────────┐                    ┌──────▼───────┐  │
│  │ Popup            │                    │ Options /    │  │
│  │ popup/           │                    │ Dashboard    │  │
│  │ quick controls   │                    │ options/     │  │
│  └──────────────────┘                    └──────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Content script — injected on youtube.com only        │  │
│  │ content/index.js  →  core/app.js                    │  │
│  │   ├─ SettingsManager  (load / watch / migrate)      │  │
│  │   ├─ PageDetector     (watch / search / channel…)   │  │
│  │   ├─ ModuleManager    (init / enable / disable)     │  │
│  │   ├─ DOMManager       (centralised selectors)       │  │
│  │   └─ Modules (independent, see §4)                   │  │
│  │        player · sidebar · layout · appearance ·      │  │
│  │        playback · recommendations · focus ·          │  │
│  │        navigation · typography · keyboard            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 App flow — startup

```
1. Browser loads youtube.com
2. manifest content_scripts inject content/index.js (document_idle)
3. index.js → App.init()
4. SettingsManager.load() → chrome.storage.local.get()
   ├─ No settings? → write DEFAULTS (schemaVersion: 1)
   └─ Old schemaVersion? → migrate() (additive only, never overwrite user values)
5. PageDetector.detect() → page type: home | watch | search |
   subscriptions | channel | playlist | shorts | other
6. ModuleManager.init(enabled modules only)
   └─ Each module: init() → apply(settings, page) → observe if needed
7. App listens:
   ├─ yt-navigate-finish → re-detect page → modules.update(page)
   ├─ chrome.storage.onChanged → live-apply changed settings
   ├─ resize (debounced 150 ms) → layout-affected modules update
   └─ fullscreenchange → player/sidebar modules suspend/resume
```

### 2.2 App flow — a setting changes

```
User toggles "Independent scroll" in popup/dashboard
  → SettingsManager.set("sidebar.independentScroll", true)
  → chrome.storage.local.set(...)
  → chrome.storage.onChanged fires in content script
  → ModuleManager.update("sidebar")
  → SidebarModule.apply() → adds/removes CSS class + inline vars
  → No page reload, no re-init of other modules
```

### 2.3 App flow — SPA navigation

```
User clicks a video (no full reload)
  → YouTube fires yt-navigate-finish
  → PageDetector re-detects (watch)
  → ModuleManager.updateAll(page)
  → Each module checks: does it apply to this page?
      yes → re-apply (idempotent: same result if run twice)
      no  → clean up its own DOM/CSS only
  → MutationObserver (scoped to #primary / #secondary) catches
     late-loaded elements (recommendations, comments) — once,
     then disconnects when the target appears
```

**Idempotency rule:** running any module's `apply()` twice must
produce the same DOM as running it once. No duplicate style tags,
no duplicate listeners, no duplicate wrappers.

---

## 3. Manifest V3 — `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "OneYT — All-in-One YouTube Customizer",
  "version": "1.0.0",
  "description": "Your YouTube. Your Layout. Your Rules. Customise player, layout, sidebar, themes, playback and focus — privately, locally.",
  "permissions": ["storage"],
  "host_permissions": ["https://www.youtube.com/*"],
  "background": { "service_worker": "background/service-worker.js" },
  "action": { "default_popup": "popup/popup.html", "default_title": "OneYT" },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "js": ["content/index.js"],
      "css": ["content/styles/base.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": { "16": "assets/icons/icon16.png", "48": "assets/icons/icon48.png", "128": "assets/icons/icon128.png" }
}
```

**Permission rules:**
- `storage` only in v1. Add `scripting` only if a concrete
  feature proves it necessary — never pre-emptively.
- Host access is `youtube.com` only — never `<all_urls>`.
- No `cookies`, `tabs` (beyond what MV3 gives the action),
  `webRequest`, or `declarativeNetRequest` in v1.

---

## 4. Module System

Every feature is a module with the **same lifecycle**:

```js
// Every module implements this shape:
const Module = {
  id: "sidebar",            // unique, matches settings key
  init(ctx) {},             // one-time setup: cache elements, bind listeners
  apply(settings, page) {},// (re-)apply settings — must be idempotent
  update(settings, page) {},// apply() after a settings/page change
  enable() {},              // turn on: apply + observe
  disable() {},             // turn off: remove ALL own DOM/CSS/listeners
  destroy() {}              // full teardown
};
```

| Module | File | Responsibility | Pages |
|--------|------|---------------|-------|
| Player | `modules/player/` | Size, position, radius, shadow, theater/fullscreen safety | watch |
| Sidebar | `modules/sidebar/` | Independent scroll, width, height, scrollbar | watch |
| Layout | `modules/layout/` | Home/search/subs grid, hide sections, spacing | all |
| Appearance | `modules/appearance/` | Themes, CSS variables, custom CSS | all |
| Playback | `modules/playback/` | Speed, volume, quality, captions, autoplay | watch |
| Recommendations | `modules/recommendations/` | Hide/resize/density of rec. cards | watch, home |
| Focus | `modules/focus/` | Focus Mode: hide + remember + restore | watch |
| Navigation | `modules/navigation/` | Guide/nav items, compact mode | all |
| Typography | `modules/typography/` | Fonts, sizes, line-height, readability | all |
| Keyboard | `modules/keyboard/` | Custom shortcuts, conflict detection | watch (+ global) |

**Module rules (hard):**
1. A module never reads another module's internals — only shared
   `ctx` (`settings`, `dom`, `page`, `bus`).
2. Disabling a module restores YouTube exactly for that module's
   scope — no leftover classes, style tags, or listeners.
3. A module never throws on a missing element — it logs (debug
   mode only) and retries via a scoped observer, then gives up
   cleanly.
4. Modules communicate via a tiny event bus (`ctx.bus.emit/on`),
   never via direct imports of each other.

### 4.1 Core files

| File | Responsibility |
|------|---------------|
| `content/index.js` | Entry: creates `App`, calls `init()`, nothing else |
| `content/core/app.js` | Wires SettingsManager + PageDetector + ModuleManager + listeners |
| `content/core/module-manager.js` | Registry, lifecycle calls, enable/disable, update routing |
| `content/core/page-detector.js` | URL → page type; `yt-navigate-finish` listener |
| `content/core/dom-manager.js` | **The only place selectors live**; `query()` helpers with graceful nulls |
| `content/core/settings-manager.js` | Load/save/watch/migrate/validate settings |
| `content/core/event-bus.js` | Tiny pub/sub for module-to-module signals |
| `content/core/logger.js` | `debug`-gated logging; silent in production by default |

---

## 5. DOM & Selectors — Centralised, Defensive

All YouTube selectors live in **one file**: `shared/selectors.js`
(imported by `dom-manager.js`). No module hard-codes a selector.

```js
// shared/selectors.js (example — verify against live YouTube at build time)
export const SELECTORS = {
  player: "#movie_player",
  primary: "#primary",
  secondary: "#secondary",
  watchFlexy: "ytd-watch-flexy",
  sidebarItems: "#secondary ytd-compact-video-renderer",
  comments: "#comments",
  shortsShelf: "ytd-rich-shelf-renderer[is-shorts]",
  // … every selector used anywhere, with a comment on what it targets
};
```

**Defensive rules:**
- `dom.query(sel)` returns `null` instead of throwing.
- If an element is missing, the module waits with **one scoped
  `MutationObserver`** (target: nearest stable ancestor, e.g.
  `#primary`), disconnects on success or after a 10 s timeout.
- Never `setInterval` / polling to find elements.
- YouTube changes DOM often: when a selector breaks, fix it in
  `selectors.js` only, and note the change in `Memory.md`.

---

## 6. CSS Architecture

### 6.1 Injection strategy

- `content/styles/base.css` — injected via manifest; only the
  CSS variables + the few rules that must exist before JS runs.
- Each module's **static** CSS ships as one file
  (`content/modules/<id>/<id>.css`), listed in the manifest's
  `content_scripts.css` array. Its rules are scoped under
  `html.oneyt-enabled` plus a module class (e.g.
  `.oneyt-sidebar-scroll`), so enabling = adding the class,
  disabling = removing it. Dynamic values (a user-chosen px
  width) travel as CSS variables set by the module, never as
  scattered inline `style` attributes. (AD-09, Phase 2.)
- `dom.setStyle()` / `removeStyleTag()` remain for **dynamic**
  CSS only — user custom CSS (Phase 3) — one
  `<style data-oneyt-module="…">` tag per module, created on
  `enable()`, removed on `disable()`.
- Extension UI (popup/dashboard) styles live in `popup/` and
  `options/` only — **never** leak into YouTube pages, and
  YouTube-targeted CSS never leaks into the dashboard.
- All injected rules are scoped under a root class, e.g.
  `html.oneyt-enabled`, so disabling the extension removes the
  scope in one step.

### 6.2 Theming via CSS variables

```css
html.oneyt-enabled {
  --oneyt-bg: #0f0f0f;
  --oneyt-text: #f1f1f1;
  --oneyt-accent: #ff0033; /* brand red — see Design.md */
  /* … full token list in Design.md §3 */
}
```

Theme presets are **variable sets only** — switching theme =
swapping variable values, not rewriting rules. Custom CSS is
appended as a separate, user-controlled style tag
(`data-oneyt-custom-css`) so it can be toggled without touching
theme variables.

### 6.3 The flagship feature — how independent scroll works

```css
/* Sidebar module, watch page only, when enabled */
html.oneyt-enabled.oneyt-sidebar-scroll #secondary {
  max-height: var(--oneyt-sidebar-max-height, calc(100vh - 100px));
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: var(--oneyt-scrollbar-width, thin);
}
html.oneyt-enabled.oneyt-sidebar-scroll #primary {
  /* player column stays put; exact positioning per player.position:
     default | sticky | fixed | absolute (user preference) */
}
```

Player positioning is **configurable** (`player.position`), with
`absolute` supported as the user requested — the module measures
the container and sets offsets so nothing overlaps. Fullscreen
and theater mode suspend these rules (`:fullscreen` guard +
`fullscreenchange` listener).

---

## 7. Settings — Schema, Storage, Migration

### 7.1 Final schema (v1)

```js
// shared/defaults.js — single source of truth for defaults
export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = {
  schemaVersion: 1,
  enabled: true,

  modules: {
    player: true, layout: true, sidebar: true, appearance: true,
    playback: true, recommendations: true, focus: true,
    navigation: true, typography: true, keyboard: true,
  },

  player: {
    customWidth: 0,        // 0 = YouTube default; px otherwise
    maxWidth: 1280,        // px, 0 = no cap
    alignment: "center",   // left | center | right
    position: "default",   // default | sticky | fixed | absolute
    borderRadius: 12,      // px
    border: "none",        // CSS border shorthand or "none"
    shadow: "none",        // CSS box-shadow or "none"
    spacing: 0,            // px around player
    sticky: false,
  },

  sidebar: {
    independentScroll: true,
    maxHeight: "calc(100vh - 100px)",
    customWidth: 402,      // px, 0 = YouTube default
    scrollbarVisible: true,
    scrollbarWidth: 8,     // px
    smoothScroll: true,
    scrollSensitivity: 1,  // multiplier
    keepPlayerVisible: true,
    playerOffset: 0,       // px
  },

  layout: {
    hideShortsHome: false, hideShortsWatch: false,
    homeColumns: 0,        // 0 = default
    cardSpacing: 0, hideComments: false,
    // … one flag per hideable element, all default false (non-intrusive)
  },

  appearance: {
    theme: "default",      // default | dark | light | midnight | amoled | minimal | custom
    colors: { /* overrides, empty = preset values */ },
    typography: { fontFamily: "", fontSize: 0, fontWeight: 0, lineHeight: 0 },
    customCSS: "",
    customCSSEnabled: false,
  },

  playback: {
    defaultSpeed: 1, rememberSpeed: true,
    speedPresets: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
    defaultVolume: 100, rememberVolume: true,
    autoplay: null,        // null = YouTube default; true/false = override
    defaultQuality: "auto",// auto | 1080p | 720p | … (best-effort)
    captions: null,        // null = default; true/false
  },

  recommendations: {
    hideSidebar: false, density: "comfortable", // comfortable | compact
    cardSize: 0, showMetadata: true,
  },

  productivity: {
    focusMode: false,
    focusHideComments: true, focusHideChat: true,
    focusHideRecommendations: true, focusHideShorts: true,
  },

  keyboard: {
    shortcuts: {
      toggleFocus: "", toggleSidebar: "", togglePlayerPosition: "",
      speedUp: "", speedDown: "", resetSpeed: "", toggleTheater: "",
    }, // "" = unbound; defaults assigned in Phase 4, after conflict check
  },
};
```

### 7.2 Storage rules

- Read once at startup; thereafter react to `onChanged`.
- Writes are debounced (150 ms) when they come from sliders /
  live inputs, so dragging a slider does not spam storage.
- `chrome.storage.local` holds everything; `chrome.storage.sync`
  (opt-in, later) holds only: `appearance.theme`,
  `playback.speedPresets`, `keyboard.shortcuts` — never custom CSS
  (size limits) or per-device layout widths.
- **Migration:** `migrate(old, defaults)` — deep-merge, additive
  only: unknown old keys are preserved, new keys get defaults,
  user values are never overwritten. Migration is unit-tested
  with a fixture per version.
- **Validation:** imported JSON is validated against a schema
  (`shared/validators.js`): wrong types → rejected with a
  per-field error list; unknown keys → dropped with a warning;
  never `eval`, never `new Function` on imported data; custom CSS
  is stored as a string and injected as text, never executed as JS.

### 7.3 Messaging

- Popup/dashboard ↔ content script: `chrome.runtime.sendMessage`
  via the service worker as a relay where needed; content script
  is the source of truth for "what is applied right now".
- Service worker stays thin: install/upgrade housekeeping,
  storage migration trigger, message relay. **No DOM access,
  no fetching, no timers** in the worker in v1.

---

## 8. UI Architecture — Popup & Dashboard

```
popup/popup.html  →  popup/popup.js  →  SettingsManager (shared)
  - Reads settings, renders quick toggles
  - Writes go through the same set() path as the dashboard
  - Shows current page status via a message to the content script

options/options.html  →  options/options.js  →  sections/*.js
  - One JS file per dashboard section (general, player, layout,
    appearance, playback, sidebar, productivity, keyboard, advanced)
  - Each section renders its controls from a declarative
    CONTROL SCHEMA (see below) — no hand-written HTML per setting

options/sections/ — control schema example:
  { key: "sidebar.customWidth", type: "slider",
    label: "Sidebar width", min: 240, max: 600, unit: "px",
    description: "Width of the recommendation sidebar on watch pages." }
```

**Why a control schema:** adding a setting = adding one schema
entry (+ default + module handling). No new HTML, no new wiring.
Settings search works by filtering this schema.

---

## 9. Folder & File Structure (target — built in Phase 1)

```
oneyt/
├── PRD.md  Architecture.md  Rules.md  Phases.md  Design.md  Memory.md
├── README.md
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── index.js
│   ├── core/
│   │   ├── app.js
│   │   ├── module-manager.js
│   │   ├── page-detector.js
│   │   ├── dom-manager.js
│   │   ├── settings-manager.js
│   │   ├── event-bus.js
│   │   └── logger.js
│   ├── modules/
│   │   ├── player/        (player.js + player.css)
│   │   ├── sidebar/       (sidebar.js + sidebar.css)
│   │   ├── layout/        (layout.js + layout.css)
│   │   ├── appearance/    (appearance.js + themes.css)
│   │   ├── playback/      (playback.js)
│   │   ├── recommendations/ (recommendations.js + recommendations.css)
│   │   ├── focus/         (focus.js + focus.css)
│   │   ├── navigation/    (navigation.js + navigation.css)
│   │   ├── typography/    (typography.js + typography.css)
│   │   └── keyboard/      (keyboard.js)
│   └── styles/
│       ├── base.css       (variables + scoping)
│       ├── player.css
│       ├── sidebar.css
│       ├── layout.css
│       └── themes.css
├── popup/
│   ├── popup.html  popup.css  popup.js
├── options/
│   ├── options.html  options.css  options.js
│   └── sections/
│       ├── general.js  player.js  layout.js  appearance.js
│       ├── playback.js  sidebar.js  productivity.js
│       ├── keyboard.js  advanced.js
├── shared/
│   ├── constants.js   (page types, events, limits)
│   ├── defaults.js    (DEFAULT_SETTINGS + SCHEMA_VERSION)
│   ├── selectors.js   (ALL YouTube selectors)
│   ├── storage.js     (storage helpers)
│   └── validators.js  (import validation, CSS sanity check)
├── assets/
│   ├── icons/         (icon16/48/128.png — original art)
│   └── images/
├── tests/
│   ├── settings-migration.test.js
│   ├── validators.test.js
│   └── manual-checklist.md   (per-phase browser checklist)
└── docs/
    └── store-listing.md  (Phase 7: copy, screenshots, privacy policy)
```

**Note on "no build step":** content scripts are plain files
loaded in order via the manifest / `import` (ES modules in
content scripts need care in MV3 — Phase 1 decides: either a
single concatenated `content/index.js` entry that uses dynamic
`import()` with `chrome.runtime.getURL`, or a tiny esbuild bundle.
Decision recorded in `Memory.md` when made; do not improvise
mid-phase.)

---

## 10. Error Handling & Resilience

| Situation | Behaviour |
|-----------|-----------|
| YouTube element missing | Module logs (debug only), scoped observer retry ≤ 10 s, then gives up silently |
| Selector changed by YouTube | Feature degrades; extension never breaks playback/navigation; fix in `selectors.js` |
| Corrupt stored settings | Fall back to defaults for bad keys; keep good keys; log once |
| Invalid imported JSON | Reject with field-level errors; apply nothing |
| Storage quota exceeded | Warn user; keep last-good settings; never wipe |
| Fullscreen / theater | Player & sidebar positioning suspended; restored on exit |
| Module throws | Caught at ModuleManager boundary; that module disabled, others keep running; error logged |
| Service worker restarts | Stateless by design — everything re-reads from storage |

---

## 11. Testing Strategy (summary — detail in Phases.md)

- **Unit (Node, no browser):** settings migration, validators,
  control-schema rendering, selector list sanity.
- **Manual browser checklist** (`tests/manual-checklist.md`):
  per phase, per page type, per browser (Chrome / Edge / Brave),
  fullscreen + theater + SPA navigation + resize.
- **Regression rule:** after any YouTube-facing change, verify
  native controls, playback, captions, navigation and account
  menu still work before calling the phase done.
- No automated E2E in v1 (Puppeteer + extension loading is a
  Phase 6 stretch goal, not a blocker).

---

## 12. Decisions Log (architecture decisions — update as made)

| # | Decision | Date | Status |
|---|----------|------|--------|
| AD-01 | Vanilla JS, no framework, no build step in v1 | 2026-11-09 | Decided (planning) |
| AD-02 | `chrome.storage.local` default; sync opt-in later | 2026-11-09 | Decided (planning) |
| AD-03 | All selectors in `shared/selectors.js` only | 2026-11-09 | Decided (planning) |
| AD-04 | One `<style>` tag per module, removed on disable | 2026-11-09 | Decided (planning) |
| AD-05 | Themes = CSS variable sets only | 2026-11-09 | Decided (planning) |
| AD-06 | ES-module loading strategy for content scripts | 2026-11-09 | **Decided (Phase 1): classic scripts, no bundler.** Content scripts load in dependency order via `manifest.json` `content_scripts.js`, sharing one global namespace `window.OneYT`. Shared files use a UMD-style guard (`globalThis.OneYT` in the browser, `module.exports` in Node) so unit tests run without a build step. No ES `import`/`export` in content scripts, no dynamic `import()`, no `web_accessible_resources` needed. Revisit only if the file count forces a bundler. |
| AD-07 | Focus Mode scope: global setting, per-tab toggle | 2026-11-09 | **Decided (Phase 4): global setting + per-tab toggle.** `productivity.focusMode` is the global switch (dashboard, Phase 5). The per-tab toggle (keyboard shortcut in Phase 4, popup button in Phase 5) is an **in-memory override in the content script**: it affects only the current tab and resets on navigation/reload, so a tab can never get stuck in Focus Mode. The global setting persists in storage; the override never does. |
| AD-08 | Sync scope (which keys sync) | 2026-11-09 | **Decided (Phase 5): sync is opt-in; when enabled (implementation in Phase 6) chrome.storage.sync holds the whole settings object EXCEPT `appearance.customCSS`.** Custom CSS stays in chrome.storage.local only — it can be up to 50 KB and sync caps at 8 KB per item / 100 KB total. Remembered playback (`oneyt.playback.lastSpeed` / `lastVolume`) never syncs — local-only by design (per-device). Local remains the source of truth if a sync write fails (quota error falls back silently). No sync toggle ships in Phase 5 (no dead controls); the dashboard Advanced section documents this scope, and Phase 6 wires the storage switch. |
| AD-09 | Module static CSS via manifest + html classes (not style tags); dynamic values via CSS variables; style tags only for dynamic/custom CSS | 2026-11-09 | **Decided (Phase 2).** Keeps zero build step and needs no `web_accessible_resources`/fetch; matches the §6.3 example. Disable = remove the class. |
| AD-10 | Themes map OneYT tokens onto YouTube `--yt-spec-*` variables + scoped CSS rules; custom colours override the active preset; contrast checked (warn only, never blocks) | 2026-11-09 | **Decided (Phase 3).** `--yt-spec-*` names are YouTube's own theming API — overriding them themes surfaces the extension never touches. If YouTube renames a variable, that surface silently keeps its own theme (graceful degradation); no selector depends on it. Presets live in `shared/themes.js` as pure data, so unit tests cover them without a DOM. |
