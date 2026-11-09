# OneYT — Selector Audit (Phase 6, task 6.7)

Date: 2026-11-09 · Auditor: SP (static audit) ·
Scope: `shared/selectors.js` + every `dom.query` / `waitFor`
call + every module CSS file.

Verdict: **one dead selector removed** (`sidebarSection`,
below). The registry is otherwise healthy: no module JS
hard-codes a YouTube selector, and every registered selector
is used. **Live verification against the current YouTube DOM
is still browser-only** — it cannot be done in this workspace
and stays open in the manual checklist (Phase 2 item).

## The registry

20 keys in `shared/selectors.js` (was 21). Every key is used
either by name in JS (`dom.query('video')`) or by raw value
in module CSS (which cannot read the JS map — e.g.
`sidebarItems`' value `#secondary ytd-compact-video-renderer`
lives in `recommendations.css`). Enforced by
`tests/selectors.test.js`: a key whose value appears nowhere
fails the suite.

| Key | Used by |
| --- | --- |
| `player`, `playerContainer`, `primary`, `secondary`, `watchFlexy`, `below`, `comments` | JS + CSS |
| `video`, `theaterButton`, `autonavToggle`, `captionsButton`, `miniPlayer` | JS (playback / player) |
| `sidebarItems`, `shortsShelf`, `richGrid` | CSS (recommendations / layout / focus / appearance) |
| `guide`, `masthead`, `chat`, `actions`, `description` | CSS (navigation / focus) |

## Removed

- `sidebarSection` (`#secondary ytd-item-section-renderer`):
  referenced nowhere — not in JS, not in CSS. It was a
  planned key from the Architecture doc that no module ever
  used. Removed from `shared/selectors.js` in Phase 6.

## Hard-coding check

No module JS file contains a YouTube selector literal
(`#movie_player`, `#primary`, `ytd-`, …) — enforced by
`tests/selectors.test.js`. The only files allowed to hold
them are `shared/selectors.js` and `content/core/dom-manager.js`
(which resolves keys to values). Module CSS necessarily
contains raw selectors (AD-09 static CSS); those strings are
exactly the registry values, and the test above keeps them
in sync.

## Still open (browser-only)

- Verify every selector against the **live** YouTube DOM
  (Phase 2 checklist item: `#primary #player` with
  `#movie_player` fallback, guide `:has()` selectors, Shorts
  shelf, mini-player element). YouTube renames elements
  regularly; a selector that was right in November may not
  be right later. When one breaks, fix it in
  `shared/selectors.js` (and its CSS twin) only.
- The `playerContainer` fallback path (`#primary #player` →
  `#movie_player`) needs a live check on a page where
  `#player` is absent.
