# OneYT — Bug Bash Log (Phase 6, task 6.10)

Date: 2026-11-09 · All findings from the Phase 6 audits
(6.1 performance, 6.4 SPA stress, 6.6 migration, 6.7
selectors, 6.8 security, 6.9 accessibility) plus the fixes
they produced. Each item names the audit that found it.

## Fixed in Phase 6

| # | Finding | Audit | Fix |
| --- | --- | --- | --- |
| 1 | Mini-player document-subtree observer attached on every page even with all mini settings at defaults | 6.1 | `miniConfigured()` gate in `player.js`; observer attaches only when configured, disconnects when cleared (`tests/performance.test.js`) |
| 2 | Stored `scrollSensitivity` 99 reached the wheel handler raw (migration repairs types, not ranges) — 99× scroll speed | 6.6 | `clampSensitivity()` in `sidebar.js` (0.5–3, matches the dashboard control) |
| 3 | Custom CSS `url(https://…)` loaded remote resources (validator blocked `@import` but not `url()`) — network call + tracking-pixel vector | 6.8 | `validateCustomCSS` rejects non-`data:` `url()` |
| 4 | Dead service-worker `onMessage` relay accepted an arbitrary set-by-path with no validation (prototype-pollution shape); no senders, type string mismatched the constant | 6.8 | Relay, `setByPath` and `MESSAGES` constants removed |
| 5 | `MAX_IMPORT_BYTES` declared but never enforced | 6.8 | Dashboard import rejects oversized input before `JSON.parse` |
| 6 | Muted text below WCAG AA (dark `#717171` 3.9, light `#909090` 3.2) | 6.9 | Dark `#9a9a9a` (6.8/6.3), light `#6b6b6b` (5.3/5.1) |
| 7 | `:focus` rules removed the outline entirely (border colour only) | 6.9 | 2px accent `:focus-visible` rings on all interactive elements |
| 8 | Shortcut capture swallowed Tab — bound `'Tab'` as a shortcut and trapped keyboard users | 6.9 | Tab cancels capture like Escape, before `preventDefault` |
| 9 | `normalizeShortcut('Tab')` parsed fine, so an imported `'Tab'` shortcut would bind and hijack Tab on every YouTube page | 6.10 | Tab/Escape are unbindable in `normalizeShortcut` (module, capture and import all funnel through it) |
| 10 | Imports bypassed the dashboard's number clamps (`player.customWidth` 99999, `captionFontSize` 999) | 6.10 | `clampSettingsToControls` in `options.js`, applied in the import path with the repairs shown in the preview |
| 11 | Dead selector `sidebarSection` (referenced nowhere) | 6.7 | Removed; usage now enforced by `tests/selectors.test.js` |

## Verified clean (no bug)

- SPA stress (6.4): 20 navigations, back/forward, modules
  off/on 10× — no duplicate listeners, style tags, classes
  or variables (`tests/spa-stress.test.js`).
- Migration (6.6): v0.1 and v0.4 fixtures migrate with all
  user values preserved (`tests/migration-fixtures.test.js`).
- Settings writes debounce: 10 rapid sets → 1 write.
- No polling, no network calls, no `eval`/`innerHTML`
  anywhere in extension code (regression tests).
- All 20 registered selectors are used; no module JS
  hard-codes a YouTube selector in code.

## Deferred to v1.1 (minors, logged — not fixed here)

- **M1.** Live selector verification against the current
  YouTube DOM (browser-only). If YouTube renames an element,
  the fix goes in `shared/selectors.js` only.
- **M2.** Cross-browser (Edge/Brave) and viewport
  (1024/1280/1440/1920/ultrawide) checks — browser-only.
- **M3.** Fullscreen + theater regression on a live page —
  browser-only.
- **M4.** Real memory measurement (toggle modules 10×,
  watch Chrome's task manager) — browser-only.
- **M5.** Live keyboard + screen-reader walkthrough of the
  dashboard and popup — browser-only.
- **M6.** Import validation type-checks top-level keys only;
  nested wrong types are repaired to defaults by migration
  rather than rejected. The diff preview shows the repair.
  Acceptable for v1.0.
- **M7.** Sync conflict rule is last-write-wins across
  devices (standard `chrome.storage.sync` semantics). No
  merge UI is planned for v1.0.
