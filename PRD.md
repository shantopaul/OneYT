# OneYT — Product Requirements Document (PRD)

> **Product:** OneYT — All-in-One YouTube Customizer
> **Type:** Browser Extension (Manifest V3)
> **Version:** PRD v1.0 — 2026-11-09
> **Status:** v1.0.0 — all phases complete (Phases 0–7 merged to `main`, 2026-11-09); browser verification + store submission still open
> **Owner:** Shanto Paul
> **Tagline:** "Your YouTube. Your Layout. Your Rules."

---

## 1. Product Overview

### 1.1 What to build

OneYT is a lightweight, modular browser extension that lets a user
customise almost every supported aspect of YouTube — player, layout,
sidebar, appearance, playback, recommendations, navigation, focus and
keyboard shortcuts — from one settings dashboard, without breaking
YouTube's native functionality.

It is **not** a YouTube downloader, ad blocker, or recommendation
manipulator. It changes **presentation and behaviour on the user's own
browser only**. No backend, no account, no data leaves the device in v1.

### 1.2 Problem statement

- YouTube's default layout is one-size-fits-all. On a watch page the
  player scrolls away when the user scrolls recommendations.
- Power users (students, researchers, developers, long-form viewers)
  want a minimal, distraction-free, faster layout — but existing
  extensions each solve one small piece, with conflicting settings.
- There is no single, lightweight, privacy-first customizer where
  every feature can be turned on/off independently.

### 1.3 Product vision

One extension, many independent modules. The user enables only what
they want, configures each feature separately, and can reset any
single setting without touching the rest.

### 1.4 Success criteria (v1)

| # | Criterion | How it is measured |
|---|-----------|--------------------|
| 1 | Installs and activates only on `youtube.com` | No errors / no injection on other sites |
| 2 | Independent sidebar scrolling works on watch page | Player stays visible while sidebar scrolls |
| 3 | Player sizing / positioning works | Width, alignment, radius apply live, survive SPA navigation |
| 4 | Themes + custom CSS apply without breaking native controls | Visual check on Home / Watch / Search / Channel |
| 5 | Playback preferences apply on new videos | Speed / volume / quality preference remembered |
| 6 | Focus Mode hides the configured elements in one click and restores them | Toggle on/off, settings restored exactly |
| 7 | Settings persist across browser restarts | `chrome.storage.local` round-trip |
| 8 | No noticeable slowdown | No continuous polling; debounced resize; lazy modules |
| 9 | Privacy review clean | No network requests, no credentials, minimal permissions |

### 1.5 Non-goals (v1)

- No video/audio downloading, no ad blocking, no sponsor skipping.
- No changing YouTube's recommendation **algorithm** — only how
  recommendations are displayed (hide / resize / scroll).
- No account, sync server, cloud backup, or analytics in v1.
  (`chrome.storage.sync` is optional, user-controlled, in a later phase.)
- No Shorts-first feature set — Shorts support is optional/limited.
- No mobile browser support in v1 (desktop Chromium only).

---

## 2. Target Users

| Segment | Who they are | What they need most |
|---------|--------------|---------------------|
| **Focused viewer** | Watches long-form / educational videos | Stationary player + independent sidebar scroll, Focus Mode |
| **Student / researcher** | Studies with YouTube, takes notes | Distraction-free layout, playback speed presets, hide Shorts/comments |
| **Productivity user / developer** | Wants a minimal, fast UI | Hide UI clutter, compact navigation, keyboard shortcuts |
| **Customizer / power user** | Likes themes, CSS, fine control | Theme presets, custom CSS, per-setting reset, import/export |
| **Casual viewer** | Wants a nicer-looking YouTube | One-click themes, player size, dark/AMOLED modes |

**Primary persona (v1):** the focused long-form viewer — the
independent-scroll + stationary-player feature is the differentiator
and must work flawlessly before anything else ships.

### 2.1 User stories (top 15)

1. As a viewer, I can scroll recommendations without the video
   scrolling away, so I can browse while watching.
2. As a viewer, I can make the player wider / narrower and choose
   left / center / right alignment.
3. As a student, I can hide comments, live chat and Shorts in one
   click (Focus Mode) and restore them with one more click.
4. As a viewer, I can pick a theme (Dark / Midnight / AMOLED /
   Minimal / Custom) and it applies everywhere on YouTube.
5. As a power user, I can write my own CSS and toggle it on/off.
6. As a viewer, my preferred playback speed and volume are
   remembered for the next video.
7. As a viewer, I can set my own speed presets (0.5x–2x) and
   add/remove them.
8. As a viewer, I can hide the recommendation sidebar entirely.
9. As a user, I can change sidebar width, height and scrollbar style.
10. As a user, I can assign my own keyboard shortcuts, with a
    warning if a shortcut conflicts with YouTube's native keys.
11. As a user, I can search settings ("sidebar", "player width")
    and jump straight to the matching control.
12. As a user, I can export my settings as JSON and import them
    on another browser.
13. As a user, I can reset one setting, one section, or everything.
14. As a user, I can disable any single module without affecting
    the others.
15. As a user, my settings survive a browser restart and a
    YouTube SPA navigation (no full reload needed).

---

## 3. Platform & Compatibility

| Item | Requirement |
|------|-------------|
| Browsers | Chrome, Microsoft Edge, Brave, other Chromium browsers with MV3 |
| Manifest | Manifest V3 |
| Target site | `https://*.youtube.com/*` + `https://youtube.com/*` (all YouTube hosts) |
| Pages | Home, Watch, Search, Subscriptions, Channel, Playlist — full support. Shorts — optional / limited. Fullscreen & Theater — must not break. |
| Languages | UI in English v1 |
| Offline | Fully offline — no network dependency |

---

## 4. Feature Requirements

### 4.1 Player customization (P0 — core)

| ID | Feature | Detail / acceptance |
|----|---------|---------------------|
| PL-01 | Custom player width | px or %; max-width cap; live apply |
| PL-02 | Custom player height / aspect handling | Must not distort video or break controls |
| PL-03 | Player alignment | Left / Center / Right |
| PL-04 | Border radius, border, shadow, background, spacing | Per-setting controls + reset |
| PL-05 | Player position | Default / Fixed / Sticky / Custom (incl. `position: absolute` option) |
| PL-06 | Theater mode enhancements | Works with YouTube theater toggle |
| PL-07 | Fullscreen safety | All positioning disabled / neutralised in fullscreen |
| PL-08 | Sticky player (optional) | Player stays visible while scrolling page |
| PL-09 | Hide endscreen cards | Toggle; the video suggestions shown at the end of a video are hidden; live apply, works in theater too |
| PL-10 | Hide like count | Toggle; the number next to the Like button is hidden, the button stays clickable; live apply |
| PL-11 | Hide view count | Toggle; the "X views" line on the watch page is hidden; live apply |
| PL-12 | Hide subscriber count | Toggle; the "X subscribers" next to the channel name is hidden, the Subscribe button stays; live apply |
| PL-15 | Hide live / mixes / news shelves | Three toggles; the "Live now" shelf, Mixes (shelf + mix cards), and the "Breaking news" shelf are hidden on the home feed; live apply |

**Rule:** positioning must never overlap the sidebar, break
responsive layout, or hide native player controls.

### 4.2 Independent scrollable recommendation sidebar (P0 — flagship)

**Problem:** scrolling a watch page scrolls the player away.

**Expected behaviour:**
1. User opens a watch page.
2. Player stays stationary in its position.
3. Sidebar (`#secondary`) gets its own scrollbar.
4. Mouse wheel over the sidebar scrolls only recommendations.
5. Video stays visible and keeps playing.
6. Works after SPA navigation, resize, theater mode; disabled
   cleanly in fullscreen.

**Settings:** enable/disable, max-height (`calc(100vh - 100px)`
default), width, position, scrollbar visibility, scrollbar width,
smooth scrolling, scroll sensitivity, keep-player-visible,
custom player offset.

**Reference selectors (centralised, never hard-coded in modules):**
`#movie_player`, `#primary`, `#secondary`, `ytd-watch-flexy`.

### 4.3 Layout customization (P0/P1)

- **Home:** hide Shorts, hide sections, grid columns, card spacing,
  thumbnail size, homepage width, hide UI elements.
- **Watch:** player width/alignment, sidebar width, description
  area, comments visibility, section spacing, hide elements.
- **Subscriptions:** grid, hide Shorts, card layout, visible sections.
- **Search:** result spacing, thumbnail size, hide result types,
  result layout.
- Every layout change is individually toggleable.

### 4.4 Appearance & themes (P1)

**Presets:** Default YouTube, Dark, Light, Midnight, AMOLED Black,
Minimal, Custom.

**Tokens:** primary / secondary / accent / background / text /
secondary-text / border / card / hover / button colours; border
radius; font family / size / weight / line height; UI spacing.

**Custom CSS:** editor, enable/disable, reset, import/export,
basic syntax validation. Custom CSS must be isolated from the
extension's own popup/dashboard styles.

### 4.5 Playback customization (P1)

- Default playback speed + custom presets (0.5x, 0.75x, 1x, 1.25x,
  1.5x, 1.75x, 2x; add/remove presets).
- Remember speed / remember volume.
- Default volume, default quality preference (where YouTube allows),
  autoplay preference, default captions + caption appearance.

**Rule:** never force a quality YouTube does not offer for that
video; fall back gracefully.

### 4.6 Mini-player enhancements (P2)

Custom dimensions, position, corner radius, shadow, offsets,
always-visible option, keyboard controls. Native mini-player
behaviour must keep working.

### 4.7 Recommendation customization (P1)

Hide sidebar, hide/show sections, card size, thumbnail size,
spacing, visible metadata, density, independent scrolling.
**Presentation only** — no manipulation of the recommendation system.

### 4.8 Distraction-Free / Focus Mode (P1)

One-click toggle that hides comments, live chat, recommendations,
Shorts, selected buttons/metadata/navigation, and switches to a
minimal watch layout. **Must remember the user's normal settings
and restore them exactly when disabled.**

### 4.9 Keyboard shortcuts (P1)

Configurable actions: toggle Focus Mode, toggle sidebar, toggle
player position, speed up / down, reset speed, toggle theater.
Requirements: custom binding UI, duplicate detection, conflict
warning vs YouTube native shortcuts, reset to defaults.

### 4.10 Navigation customization (P2)

Hide nav items / menu sections, nav width / visibility / spacing,
compact mode. Must not hide essential account or accessibility
controls.

### 4.11 Typography & readability (P2)

Font family/size/weight, line height, text spacing; title,
description and comment text controls; metadata visibility.

---

## 5. Settings Dashboard & Popup

### 5.1 Popup (quick controls)

Enable/disable extension, current page status, Focus Mode toggle,
Independent Scroll toggle, theme selector, player layout toggle,
Quick Settings, Open Full Dashboard. Lightweight, fast to open.

### 5.2 Dashboard (full settings)

Left nav: General, Player, Layout, Appearance, Playback,
Recommendations, Productivity, Keyboard, Advanced.
Main area: section heading, description, controls, live preview
where supported, per-section reset.
Top bar: logo, settings search, Import/Export, Reset All.

### 5.3 Control types

Toggle, slider, colour picker, dropdown, number input, text input,
CSS editor, radio, multi-select. Every setting shows: name,
description, current value, default value, reset.

### 5.4 Live preview & search

Changes apply immediately where practical (e.g. sidebar width).
Settings search matches by name/keyword ("Sidebar", "Player Width",
"Dark Theme", "Playback Speed") and jumps to the control.

---

## 6. Data & Settings

- **Storage:** `chrome.storage.local` by default. `chrome.storage.sync`
  optional, user-controlled, selected prefs only.
- **Schema:** versioned (`schemaVersion`). On update: detect old
  version, migrate compatible settings, preserve user prefs, apply
  new defaults only to new keys, never silently overwrite.
- **Import/Export:** JSON export/import with validation, preview of
  changes before applying, restore defaults.
- **No backend, no account, no telemetry in v1.**

Example shape (illustrative — final schema in `Architecture.md`):

```js
{
  schemaVersion: 1,
  enabled: true,
  modules: { player: true, layout: true, sidebar: true, appearance: true,
             playback: true, recommendations: true, focus: true, keyboard: true },
  sidebar: { independentScroll: true, maxHeight: "calc(100vh - 100px)",
             customWidth: 360, scrollbar: true, smoothScroll: true },
  player: { position: "default", alignment: "center", customWidth: 0, borderRadius: 8 },
  appearance: { theme: "default", customCSS: "" },
  playback: { defaultSpeed: 1, rememberSpeed: true },
  productivity: { focusMode: false, hideComments: false, hideShorts: false }
}
```

---

## 7. Performance Requirements

- No continuous polling. `MutationObserver` only where needed;
  `yt-navigate-finish` for SPA navigation; debounced resize.
- No heavy libraries; vanilla JS/HTML/CSS in v1.
- Minimal DOM operations; lazy-init non-essential modules;
  remove listeners when a module is disabled.
- No unnecessary network requests; no background work when
  YouTube is not open.
- Targets (engineering goals, not guarantees): minimal startup
  overhead, no playback degradation, low memory, fast settings
  load, smooth scrolling.

## 8. Privacy & Security Requirements

1. Settings stored locally by default.
2. No YouTube credentials, passwords, or browsing history collected.
3. No user data sent to any external server.
4. No remotely injected executable code.
5. No tracking.
6. Validate imported JSON before applying.
7. Minimum permissions: `storage` + host access to
   `https://*.youtube.com/*` + `https://youtube.com/*` (all
   YouTube hosts) only. `scripting` only if proven
   necessary.
8. Custom CSS processed locally only.

## 9. Reliability Requirements

- YouTube changes its DOM regularly: **all selectors centralised**
  in one file; missing/changed elements handled gracefully
  (feature degrades, extension never crashes the page).
- SPA navigation, back/forward, resize, fullscreen, theater all
  tested (see `Phases.md` Phase 6).
- Every UI modification reversible; disabling a module restores
  YouTube's original DOM/CSS for that module.

## 10. Release Scope

| Release | Scope |
|---------|-------|
| **v0.1 — Foundation** | MV3 shell, storage, module manager, SPA detection |
| **v0.2 — Core layout** | Independent sidebar scroll, stationary player, sidebar/player sizing |
| **v0.3 — Appearance** | Themes, colours, typography, custom CSS |
| **v0.4 — Playback & focus** | Speed/volume/quality prefs, Focus Mode, shortcuts |
| **v0.5 — Dashboard** | Popup + full dashboard, search, import/export |
| **v1.0 — Public** | Hardening, cross-browser test, store listing, privacy policy |

Full phase breakdown: see `Phases.md`.

## 11. Open Questions (decide before / during build)

1. Default sidebar width & player max-width on ultrawide screens?
2. Should Focus Mode be per-tab or global? — **Decision: global
   setting, per-tab toggle in popup (decide in Phase 4).**
3. Sync: opt-in `chrome.storage.sync` in v1 or v1.1?
4. Icon / brand mark — original, before store listing.
5. Store listing copy + screenshots — Phase 7 only.

## 12. Definition of Done (v1.0)

- [ ] Manifest V3 complete; YouTube-only activation
- [ ] Independent sidebar scrolling works
- [ ] Player positioning works
- [ ] Layout customization works
- [ ] Appearance customization works
- [ ] Playback preferences work
- [ ] Focus Mode works (with exact restore)
- [ ] Keyboard shortcuts work
- [ ] Popup + dashboard complete
- [ ] Local persistence works
- [ ] Import/Export works
- [ ] SPA navigation stable
- [ ] Responsive behaviour tested
- [ ] Fullscreen + theater tested
- [ ] Privacy + permission review complete
- [ ] No critical bugs remain

---

*Source: user's All-in-One YouTube Customizer planning spec
(2026-11-09). This PRD is the frozen requirement baseline for
coding — if a feature is not here, it is not in v1 unless the PRD
is updated first.*
