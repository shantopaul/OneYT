# OneYT — Rules

> **Product:** OneYT — All-in-One YouTube Customizer
> **Version:** v1.0 — 2026-11-09
> **Purpose:** the hard boundaries for every human and AI contributor.
> If a rule here conflicts with a shortcut, the rule wins.
> Change a rule only by editing this file and noting it in `Memory.md`.

---

## 1. What to Use

### 1.1 Stack — allowed

| Area | Use |
|------|-----|
| Language | Vanilla JavaScript (ES2022), HTML5, CSS3 |
| Extension | Manifest V3, `chrome.storage`, `chrome.runtime` messaging |
| Storage | `chrome.storage.local` (default); `chrome.storage.sync` opt-in only |
| Theming | CSS custom properties (variables) |
| DOM detection | `yt-navigate-finish` event, scoped `MutationObserver` |
| Tooling | ESLint + Prettier (from Phase 1); Git + GitHub |
| Testing | Node-based unit tests for pure logic (migration, validators); manual browser checklist for UI |
| Fonts (extension UI) | System font stack (see `Design.md`) — no webfont download in v1 |
| Icons / art | Original art only, created for OneYT |

### 1.2 Code style — must follow

- **One module = one folder, one responsibility.** A module never
  imports another module.
- **One lifecycle everywhere:** `init / apply / update / enable /
  disable / destroy` (see `Architecture.md` §4). No module with a
  different shape.
- **All YouTube selectors in `shared/selectors.js` only.**
  A selector written anywhere else is a bug — move it.
- **All defaults in `shared/defaults.js` only.** No magic numbers
  or default values scattered in modules or UI.
- **All settings access through `SettingsManager`.** No direct
  `chrome.storage.*` calls outside `shared/storage.js` /
  `settings-manager.js`.
- **`apply()` must be idempotent** — running it twice = running it once.
- **Disable = full restore.** Disabling a module removes its style
  tag, classes, listeners and observers. Verify by toggling twice.
- **Fail soft, never crash the page.** Missing element → log (debug
  only) + scoped retry → give up silently. A module throwing must
  be caught at the ModuleManager boundary.
- **Debounce** storage writes from sliders/live inputs (150 ms)
  and resize handling (150 ms).
- **Name things by what they do:** `sidebar.independentScroll`,
  not `feature1`. Settings keys are user-visible (import/export)
  — keep them stable once shipped.
- **Comment the why, not the what.** Especially: why a selector,
  why a timeout, why a YouTube quirk needs a workaround.
- **Every new setting ships with:** default value, dashboard
  control (schema entry), description, reset path, and a line in
  `Memory.md` / the phase checklist.

### 1.3 Git & workflow — must follow

- `main` = stable, always loadable as an unpacked extension.
- Work on `feature/<phase>-<short-name>` branches; merge to
  `main` only after the phase checklist passes.
- Commit messages: `phase(n): what changed` — e.g.
  `phase(2): independent sidebar scroll + player width`.
- Never commit: API keys, tokens, personal data, `google-services`
  files, built/zipped extension artefacts (those are release
  outputs, not source). OneYT needs no secrets at all — if a
  secret appears, stop and remove it.
- Before every merge: load the extension unpacked in Chrome,
  run that phase's manual checklist, confirm no console errors
  on Home / Watch / Search.

---

## 2. What to Avoid — Forbidden

### 2.1 Libraries & dependencies — do not use in v1

- ❌ **No frameworks** in the extension: no React, Vue, Svelte,
  Angular, jQuery.
- ❌ **No Tailwind / Bootstrap / CSS frameworks** injected into
  YouTube pages (dashboard-only styling is hand-written CSS).
- ❌ **No heavy libraries** — no lodash, no moment, no utility
  bundles. Write the 10 lines yourself.
- ❌ **No remote code:** no CDN scripts, no external fonts/scripts
  loaded at runtime, no `eval`, no `new Function` on user data,
  no remotely hosted code of any kind (MV3 forbids it; privacy
  forbids it twice).
- ❌ **No build tool in v1** unless Phase 1 proves the file count
  forces it — and then only esbuild/Vite, decided explicitly and
  recorded in `Architecture.md` AD-06. Never add a bundler silently.
- ❌ **No analytics, telemetry, crash reporters, or tracking SDKs.**
- ❌ **No backend, no server, no account system** in v1.

### 2.2 Browser APIs & permissions — do not use

- ❌ No `<all_urls>` host permission — `youtube.com` only.
- ❌ No `cookies`, `webRequest`, `declarativeNetRequest`,
  `history`, `tabs` (beyond MV3 action defaults), `downloads`,
  `identity` in v1.
- ❌ No `scripting` permission unless a concrete feature proves
  it necessary — record the proof in `Memory.md` first.
- ❌ No `chrome.storage.sync` by default — opt-in only, selected
  keys only, never custom CSS.

### 2.3 Performance anti-patterns — never do

- ❌ **No `setInterval` / `setTimeout` polling** to find elements
  or watch for changes. Use `yt-navigate-finish` +
  scoped `MutationObserver`.
- ❌ No observer on `document.body` with `subtree: true`
  watching everything. Scope to the smallest stable ancestor.
- ❌ No observer/listener left running after its module is disabled.
- ❌ No style recalculation storms: batch DOM writes, avoid
  layout reads inside loops, debounce resize.
- ❌ No injecting the same style tag twice; no duplicate listeners
  (guard with a flag or use `apply()` idempotency).
- ❌ No network requests from the content script or worker.
- ❌ No work in the service worker when YouTube is not open.

### 2.4 Product & legal boundaries — never do

- ❌ **No downloading videos/audio.** No ad blocking. No sponsor
  skipping. No bypassing YouTube Premium / paywalls.
- ❌ **No manipulating recommendations** — only display (hide /
  resize / scroll). Never call YouTube internal APIs to change
  what is recommended.
- ❌ **No collecting** credentials, passwords, watch history,
  account data, or any personal data.
- ❌ **No sending user data anywhere.** No server, no sync
  endpoint, no third-party call.
- ❌ **No copying YouTube's UI, logos, or branding** as OneYT's
  own. OneYT branding is original (see `Design.md`).
- ❌ **No copying another extension's code, UI, or assets.**
  Original implementation only — same rule as the user's other
  projects (campus app, camera app).
- ❌ **No fake claims** in the store listing or UI: no invented
  user counts, ratings, or features that do not exist yet.
  (Authenticity rule — same as the portfolio / AI Toolkit.)
- ❌ Never break YouTube's native controls, playback, captions,
  navigation, or account menu to make a feature "work". If a
  feature cannot coexist with native behaviour, the feature
  loses — redesign it or cut it.

### 2.5 Code smells — reject in review

- Hard-coded YouTube selector outside `selectors.js`.
- Hard-coded default value outside `defaults.js`.
- Direct `chrome.storage` call outside the storage layer.
- `!important` in injected CSS without a comment explaining
  exactly which YouTube rule it must override — and even then,
  prefer a more specific selector first.
- Inline `style` attributes for values that could be a class +
  CSS variable.
- A module touching another module's DOM/classes.
- `console.log` left in production code (use `logger.js`,
  debug-gated).
- A setting with no reset path.
- A feature that only works after a full page reload (SPA
  navigation must be handled).

---

## 3. Error Handling Rules

| Situation | Required behaviour |
|-----------|-------------------|
| Element not found | Return / log debug-only / scoped-observer retry ≤ 10 s / give up silently |
| Selector broken by a YouTube change | Feature degrades; page keeps working; fix in `selectors.js`; note in `Memory.md` |
| Stored settings corrupt | Use defaults for bad keys only; keep good keys; log once |
| Imported JSON invalid | Reject entirely; show field-level errors; apply nothing |
| Imported JSON has unknown keys | Drop them, warn the user, apply the rest |
| Storage write fails / quota | Warn user; keep last-good settings in memory; never wipe |
| Module throws at runtime | ModuleManager catches it, disables that module, logs; other modules keep running |
| Fullscreen / theater change | Suspend player/sidebar positioning; restore on exit |
| User's custom CSS invalid | Basic validation first; if it still breaks layout, the toggle-off must instantly restore |
| Service worker restarts | Nothing is lost — all state re-reads from storage |

**General rule:** the worst acceptable outcome of any failure is
"that one feature quietly stops working". The page, the video,
and every other feature must keep working.

---

## 4. Boundaries for AI (Muse / any AI assistant)

These apply to **every** AI session working on OneYT, including
this workspace's agent. They are not suggestions.

### 4.1 What AI may do

- Read, analyse, and explain any file in this workspace.
- Write / edit code **only inside `~/workspace/oneyt/`**,
  following `Phases.md` order — one phase at a time, checklist
  before moving on.
- Write / update the six planning docs (`PRD.md`,
  `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`,
  `Memory.md`) and `README.md`.
- Propose decisions with a one-line confirm path for the user.
- Verify its own work by loading the extension unpacked (where
  the environment allows) and by running the manual checklist.

### 4.2 What AI must never do

- ❌ **Never push to any GitHub repo, never merge to `main`,
  never create a release** without the user's explicit
  instruction for that exact action. Planning docs are local
  only until the user says otherwise.
- ❌ **Never invent** a feature, a setting, a price, a user
  count, or a claim that a feature "works" without verifying it
  against the code / the running extension.
- ❌ **Never copy** code, UI text, icons, or assets from another
  extension or from YouTube itself.
- ❌ **Never add** a permission, a dependency, a network call,
  or a build tool without updating `Rules.md` /
  `Architecture.md` first and getting the user's confirmation.
- ❌ **Never skip a phase's checklist** to "save time", and
  never mark a phase done while its checklist has unchecked items.
- ❌ **Never silently change** a shipped setting key, default,
  or schema version — that is a migration, and it needs a
  migration step + test + a note in `Memory.md`.
- ❌ **Never store** secrets, tokens, or personal data in any
  file in this workspace. OneYT needs none.
- ❌ **Never present localhost / workspace-only URLs as
  shareable.** The shareable path is GitHub + Chrome Web Store
  (Phase 7).
- ❌ **Never reuse a stale claim** from an earlier analysis
  without re-verifying it against the current code — YouTube's
  DOM and this codebase both change.

### 4.3 When AI is unsure

1. Stop at the decision point — do not guess a default that
   changes user-visible behaviour.
2. Present the options (2–3 max), with a recommendation and
   the trade-off in one line each.
3. Wait for the user's one-line decision; record it in
   `Memory.md` and in the relevant doc's decision log.
4. If the user has already decided something (in `Memory.md`,
   `PRD.md`, or an earlier message), follow it — do not re-ask.

### 4.4 Review checklist (before calling any phase done)

- [ ] No new permission / dependency / network call added?
- [ ] No selector outside `selectors.js`? No default outside `defaults.js`?
- [ ] Every new setting has a default, a control, a description, a reset?
- [ ] Disable-restore verified for every touched module?
- [ ] SPA navigation tested (watch → watch, home → watch, back/forward)?
- [ ] Fullscreen + theater tested?
- [ ] No console errors on Home / Watch / Search?
- [ ] `Memory.md` updated (what was done, what is next, what is blocked)?
- [ ] Nothing pushed / merged without explicit instruction?

---

## 5. Changing These Rules

1. Propose the change to the user with the reason.
2. On approval, edit this file, bump the version line at the top,
   and add a dated entry in `Memory.md` → "Rule changes".
3. If the change affects code already written, the affected phase
   is re-opened until its checklist passes again.

---

*If it is not in the PRD, it is not in v1. If it breaks a rule
here, it does not ship — however clever it is.*
