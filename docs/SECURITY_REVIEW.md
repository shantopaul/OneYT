# OneYT — Security & Privacy Review (Phase 6, task 6.8)

Date: 2026-11-09 · Reviewer: SP (code audit + Node tests) ·
Scope: manifest, permissions, storage, import/export, custom
CSS, service worker, all `chrome.*` use, DOM injection
surface. Reference: `Rules.md` §4.4.

Verdict: **two real issues found and fixed** (remote `url()`
in custom CSS; unvalidated service-worker relay). One
unenforced limit fixed (import size). Everything else passes.
No data leaves the device.

## Findings fixed in Phase 6

### 1. Custom CSS could load remote resources (fixed)

`validateCustomCSS` blocked `@import`, `javascript:` and
`expression()` — but not `url(https://…)`. A crafted import
(or a user pasting CSS from the web) could make the browser
fetch a remote image/font when the CSS applied: a network
call the extension promises never to make, and a tracking
pixel vector. Fix: `url()` is rejected unless it is a `data:`
URI (which cannot fetch). Covered by `tests/validators.test.js`.

### 2. Unvalidated service-worker relay (removed)

The worker's `onMessage` handler accepted `oneyt:set-setting`
with an arbitrary dotted path and value, no validation, and
wrote it straight into settings. `setByPath` walks the path
blindly — a path like `__proto__.x` reaches `Object.prototype`
(prototype pollution shape). It was unreachable in practice
(no `externally_connectable`, no sender anywhere — popup and
dashboard write storage directly — and the type string did
not even match the constant in `shared/constants.js`), but
dead code with that shape does not ship. Fix: the relay,
`setByPath` and the `MESSAGES` constants are removed. The
worker now only seeds defaults on install.

### 3. Import size limit was declared but unenforced (fixed)

`constants.MAX_IMPORT_BYTES` (200 000) existed but nothing
checked it. The dashboard import handler now rejects
oversized input before `JSON.parse`.

## Checks that passed

- **Permissions** (`manifest.json`): `storage` + `activeTab`
  only. `activeTab` (Phase 5) is used solely for the popup's
  page status (active tab URL, on user click). Host:
  `https://www.youtube.com/*` only. No other host, no
  `web_accessible_resources`, no CSP override (MV3 default
  `script-src 'self'` applies).
- **Network**: no `fetch`, `XMLHttpRequest`, `WebSocket`,
  `EventSource`, `sendBeacon` anywhere in extension code
  (grep-verified; regression test in `tests/security.test.js`).
- **Dynamic code**: no `eval`, `new Function`, `innerHTML`,
  `outerHTML`, `document.write`, `insertAdjacentHTML`.
  The dashboard builds DOM with `createElement` +
  `textContent` only.
- **Storage**: settings in `chrome.storage.local`; sync
  mirror (Phase 6, AD-08) excludes custom CSS and never
  syncs remembered speed/volume. No PII is stored anywhere
  — settings only, no accounts, no identifiers, no history.
  No analytics, no telemetry, no third-party code.
- **Import validation**: `validateSettings` type-checks every
  top-level key and rejects the file with field errors;
  `migrateSettings` repairs nested type mismatches to
  defaults; the dashboard shows the full diff preview
  before applying. Export → import round-trip is tested.
- **Custom CSS** (after fix 1): blocks HTML tags,
  `expression()`, `@import`, `javascript:`, remote `url()`,
  unbalanced braces/parens, and > 50 000 chars. Applied via
  one dedicated style tag (`dom.setStyle`), never inline
  event handlers.
- **Keyboard shortcuts**: actions are a fixed internal map;
  no string is ever executed as code.
- **Sync**: quota failures fall back silently to local
  (local is the source of truth); disabling sync removes
  the stale sync copy.

## Residual notes (not vulnerabilities)

- Import validation type-checks top-level keys only; nested
  wrong types are repaired to defaults by migration rather
  than rejected. The diff preview shows the repair, so the
  user sees it. Acceptable.
- `chrome.storage.sync` data (when the user opts in) goes to
  the user's own Google account sync — that is the feature,
  documented in the dashboard, and it excludes custom CSS
  and remembered playback by design.
- Live DOM selector verification is a browser-only item
  (see `docs/SELECTOR_AUDIT.md`); a renamed YouTube element
  is a breakage risk, not a security one.
