# OneYT — Performance Audit (Phase 6, task 6.1)

Date: 2026-11-09 · Auditor: SP (code review + Node tests) ·
Scope: all observers, listeners, timers and writes in
`content/`, `background/`, `popup/`, `options/`, `shared/`.

Verdict: **one real issue found and fixed** (mini-player
observer, below). Everything else is clean. No `setInterval`,
no polling, no network calls anywhere in extension code
(grep-verified).

## Inventory

| What | Where | Lifetime | Verdict |
| --- | --- | --- | --- |
| `waitFor` MutationObserver (scoped, subtree) | `content/core/dom-manager.js` | Per call; disconnects on resolve **or** timeout; never rejects, never polls | ✅ |
| Theater attribute observer | `content/modules/player/player.js` | One per page; `disconnect()` in `cleanup()` / `disable()` | ✅ |
| Mini-player subtree observer (documentElement) | `content/modules/player/player.js` | See fix below | ⚠️ → ✅ fixed |
| `yt-navigate-finish` listener | `content/core/page-detector.js` | Once per app start; unsubscribe on `app.destroy()` | ✅ |
| `resize` + `fullscreenchange` (debounced 150 ms) | `content/core/app.js` | Once per app start; removed on `destroy()` | ✅ |
| Settings write debounce (150 ms) | `content/core/settings-manager.js` | Collapses rapid sets to one write (tested: 10 sets → 1 write) | ✅ |
| Options-page save debounce (150 ms) | `options/options.js` | Same pattern for text inputs | ✅ |
| Sidebar `wheel` listener | `content/modules/sidebar/sidebar.js` | Attached to the sidebar element; `removeEventListener` on element change / `disable()` | ✅ |
| Playback `ratechange` / `volumechange` | `content/modules/playback/playback.js` | Attached to the current video element; removed when the video changes / `disable()` | ✅ |
| Keyboard `keydown` (capture) | `content/modules/keyboard/keyboard.js` | Once on `init()`; removed on `disable()` | ✅ |
| `storage.onChanged` subscriptions | settings-manager, popup, options | Unsubscribe on destroy / page close | ✅ |
| Dashboard shortcut-capture `keydown` | `options/options.js` | Removed on capture complete / cancel | ✅ (Tab fix in 6.9) |
| Style tags | `content/core/dom-manager.js` | One tag per module id (`data-oneyt-module`); reused, never duplicated | ✅ |
| Background service worker | `background/service-worker.js` | Event-driven only (install + messages); no timers | ✅ |

## Issue found and fixed

**Mini-player observer ran on every page with nothing
configured.** `applyMiniPlayer()` called `observeMini()` whenever
the mini-player element was absent — even with all mini-player
settings at their defaults, when there is nothing to apply when
it opens. That left a document-subtree `MutationObserver` running
permanently on every YouTube page for no benefit.

Fix (`content/modules/player/player.js`, Phase 6): a
`miniConfigured()` gate — the observer attaches only when at
least one mini-player setting is non-default, and disconnects
again when the configuration is cleared. Covered by
`tests/performance.test.js` (fake `MutationObserver` counts
attach/disconnect).

## Not measurable here (browser-only)

- Real memory growth after toggling modules 10× (checklist
  item; needs Chrome's task manager on Shanto's PC).
- Observer callback cost on a live, mutating YouTube page
  (the mini observer re-applies only on presence change, by
  construction; the theater observer watches one attribute).
- Popup open time and dashboard first-paint time.

These stay open in `tests/manual-checklist.md` (Phase 6).
