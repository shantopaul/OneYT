# OneYT — Memory

> **Purpose:** the living progress tracker for OneYT.
> Update this file **every time** work is done, a decision is made,
> or something is blocked. If it is not here, the next session
> does not know it happened.
>
> **How to update:** add a dated entry under "Log", move the
> "Current status" section, and tick the current phase checklist
> in `Phases.md`. Never delete history — append and correct.

---

## Current Status

| Item | Value |
|------|-------|
| **Date** | 2026-11-09 |
| **Phase** | Phase 0 ✅ done · **Phase 1 — Foundation ✅ code complete, pushed to branch** (browser check still open) |
| **Version** | 0.1.0 (extension shell, no features yet) |
| **Repo** | `github.com/shantopaul/OneYT` (private) — `main` @ `a52cd3e`; branch `feature/foundation` pushed 2026-11-09, **never merged to `main`** |
| **Code written** | Phase 1: 15 JS files + manifest + base.css + popup + tests (see "What Has Been Completed") |
| **Currently working on** | — (Phase 1 code done; waiting for browser check + Phase 2 go-ahead) |
| **Blocked on** | Browser verification needs Chrome on Shanto's PC (see `tests/manual-checklist.md`); Phase 2 start decision |
| **Last verified** | 2026-11-09 — `npm test` 38/38 pass, `npm run lint` clean, `npm run format` clean, manifest valid, no polling/network (grep) |

---

## What Has Been Completed

### 2026-11-09 — Phase 0: Planning docs (done)

- Workspace created: `~/workspace/oneyt/`
- User's full product spec (All-in-One YouTube Customizer) turned
  into six planning files, one by one:
  - `PRD.md` — requirements, target users, 11 feature areas,
    success criteria, non-goals, Definition of Done (v1.0)
  - `Architecture.md` — MV3 stack, app flow, module system,
    centralised selectors, CSS variable theming, full settings
    schema v1, folder structure, 8 architecture decisions
    (AD-01…AD-08, 3 still open)
  - `Rules.md` — what to use / avoid, forbidden libraries /
    permissions / anti-patterns, error handling, AI boundaries
  - `Phases.md` — Phase 0–7 plan with per-phase tasks and
    checklists; v1.1+ future list
  - `Design.md` — brand, colour tokens (dark-first UI +
    7 YouTube presets), fonts, type scale, popup/dashboard
    layout, control specs, spacing/radius scales
  - `Memory.md` — this file
- **Nothing coded.** No extension code, no manifest, no icons.
- **Pushed 2026-11-09:** local git init (`main`), remote
  `https://github.com/shantopaul/OneYT.git`, commit `5e608e1`
  "docs: OneYT planning docs — PRD, architecture, rules, phases,
  design, memory (Phase 0)" — 7 files, 1,995 lines. Pushed to
  `main`, verified remote HEAD = `5e608e1` (private repo,
  default branch `main`).

### 2026-11-09 — Phase 1: Foundation DONE (code, branch only)

- Branch `feature/foundation` from `main` (`a52cd3e`).
  **22 part-by-part commits, pushed only when Phase 1 was fully
  complete** (per Shanto's instruction — no intermediate push,
  no merge to `main`).
- Built: `manifest.json` (MV3, `storage` only, youtube.com only),
  `shared/` (constants, defaults schema v1 + pure migration,
  selectors, storage wrapper, validators), `content/core/`
  (logger, event-bus, dom-manager, settings-manager,
  page-detector, module-manager, app, index), `content/styles/base.css`,
  `background/service-worker.js` (seed defaults + message relay),
  minimal `popup/` (master toggle + status), ESLint + Prettier
  configs, `package.json` (+ lockfile), 38 unit tests
  (`node:test`, no extra deps), `tests/manual-checklist.md`.
- **AD-06 decided:** classic scripts, one `OneYT` global,
  manifest load order — no bundler, no ES modules in content
  scripts. Recorded in `Architecture.md`.
- Verification here: `npm test` **38/38 pass**, `npm run lint`
  clean, `npm run format` clean, every JS file `node --check`
  clean, manifest JSON valid, grep: no `setInterval` / `fetch` /
  `eval` in extension code. Migration, page detection (12 cases),
  module failure isolation and app wiring all verified live in
  Node with fakes.
- **Fix found during verification:** manifest declared
  `options_page` but the dashboard does not exist until Phase 5 —
  removed the key (commit `315cb44`); it returns in Phase 5.
- **Not verified here (needs Chrome on Shanto's PC):** loading
  unpacked, real YouTube page detection / SPA navigation, master
  toggle in the browser, console errors on Home/Watch/Search,
  live selector check. All listed in
  `tests/manual-checklist.md` — Phase 1 is code-complete, not
  browser-verified.
- Icons are placeholders (original dark+red play mark, PIL);
  final art in Phase 7.

---

## Decisions Made

| Date | Decision | Where recorded |
|------|----------|---------------|
| 2026-11-09 | Project name: **OneYT** | All docs |
| 2026-11-09 | Manifest V3, vanilla JS/HTML/CSS, no framework, no build step in v1 | `Architecture.md` AD-01, `Rules.md` §1–2 |
| 2026-11-09 | `chrome.storage.local` default; sync opt-in later, selected keys only | `Architecture.md` AD-02 |
| 2026-11-09 | All YouTube selectors in `shared/selectors.js` only | `Architecture.md` AD-03 |
| 2026-11-09 | One `<style>` tag per module, removed on disable | `Architecture.md` AD-04 |
| 2026-11-09 | Themes = CSS variable sets only | `Architecture.md` AD-05 |
| 2026-11-09 | No backend, no account, no telemetry, no data leaves device (v1) | `PRD.md` §8, `Rules.md` §2.4 |
| 2026-11-09 | Flagship feature = independent sidebar scroll + stationary player | `PRD.md` §4.2 |
| 2026-11-09 | Player `position: absolute` supported as a user option | `PRD.md` §4.1, `Architecture.md` §6.3 |
| 2026-11-09 | AD-06: content scripts = classic scripts, one `OneYT` global, manifest load order; no bundler, no ES modules | `Architecture.md` AD-06 |
| 2026-11-09 | Phase 1 commits part-by-part (one commit per file/feature), push branch only when Phase 1 fully complete, never merge to `main` | User instruction 2026-11-09; `Memory.md` log |
| 2026-11-09 | Dark-first UI; no gradients / glassmorphism / fake stats | `Design.md` §2.6 |

## Decisions Needed (from user)

| # | Question | Options / recommendation | Status |
|---|----------|--------------------------|--------|
| D-01 | Create GitHub repo `shantopaul/OneYT` now, or later at Phase 1? | Recommend: create at Phase 1 start, `main` = stable | ✅ Done 2026-11-09 — user created the (private) repo; planning docs pushed as `5e608e1` on `main` |
| D-02 | Start Phase 1 (Foundation) coding now? | Recommend: yes, after D-01 | ✅ Done 2026-11-09 — user said "Phase 1 start", branch `feature/foundation`, part-by-part commits, push only when complete |
| D-07 | Phase 2 start? | Recommend: after the Phase 1 browser checklist passes on Shanto's PC | ⬜ Awaiting user |
| D-03 | AD-06: ES-module loading strategy for content scripts | Decide in Phase 1 (single entry vs tiny bundler) | ⬜ Open — Phase 1 |
| D-04 | AD-07: Focus Mode scope — global or per-tab? | Decide in Phase 4 | ⬜ Open — Phase 4 |
| D-05 | AD-08: Which keys sync (opt-in)? | Decide in Phase 5 | ⬜ Open — Phase 5 |
| D-06 | Default sidebar width / player max-width on ultrawide? | Propose in Phase 2 (402px / 1280px defaults in schema) | ⬜ Open — Phase 2 |

---

## Current Phase Checklist

**Phase 1 — Foundation** (from `Phases.md`; ✅ = verified here in
Node, ⬜ = needs Chrome on Shanto's PC — see
`tests/manual-checklist.md`):

- [ ] Extension loads unpacked in Chrome with zero errors
- [x] Activates on youtube.com only (manifest match + host guard unit-tested; browser check open)
- [x] Settings load, save, persist across restart (unit-tested round-trip with fake storage; browser persistence open)
- [x] Old-schema settings migrate without overwriting user values (unit-tested)
- [x] Page detection correct (home / watch / search / subs / channel / playlist — 12 cases unit-tested)
- [ ] SPA navigation re-detects (watch → watch, home → watch, back/forward)
- [x] Master toggle disables everything and restores YouTube exactly (app test: `enabled: false` → no `oneyt-enabled` class; browser check open)
- [ ] No console errors on Home / Watch / Search
- [x] No polling, no network requests (grep-verified: no `setInterval` / `fetch` / `eval` in extension code)

**Phase 2 — Core Layout** (not started; awaiting user go-ahead):
see `Phases.md` Phase 2 checklist.

---

## File Map (what lives where)

| File | What it is | Update when |
|------|-----------|-------------|
| `PRD.md` | What to build, users, features, DoD | A requirement changes / a feature is added or cut |
| `Architecture.md` | How it is built, flow, schema, structure | A technical decision changes |
| `Rules.md` | What to use / avoid, AI boundaries | A rule changes (bump version, note here) |
| `Phases.md` | Phase plan + checklists | A phase starts / finishes |
| `Design.md` | Colours, themes, fonts, layout | A token / preset / scale changes |
| `Memory.md` | This file — progress + decisions | Every work session |
| `README.md` | Workspace index (to be added at Phase 1) | Repo / install instructions change |

> Code files do not exist yet. When Phase 1 starts, the structure
> in `Architecture.md` §9 is the target — do not improvise a
> different layout without updating that section first.

---

## Known Risks / Watch-outs

- **YouTube DOM changes often.** Every selector must be re-verified
  live at Phase 1 (§1.4) and again in Phase 6 (§6.7). A broken
  selector must degrade gracefully, never break playback.
- **SPA navigation is the #1 bug source.** Every module must be
  idempotent and re-apply on `yt-navigate-finish`.
- **Fullscreen + theater** must suspend player/sidebar positioning
  — test explicitly in Phases 2 and 6.
- **Focus Mode restore must be exact.** If restore is lossy, the
  feature is not done (Phase 4 checklist).
- **Scope creep:** features not in `PRD.md` do not enter the build
  without a PRD + Phases update first.

---

## Log

### 2026-11-09
- Planning docs created (PRD, Architecture, Rules, Phases, Design,
  Memory) from the user's All-in-One YouTube Customizer spec.
  Project named **OneYT**. No code written, nothing pushed.
- Waiting on user: repo creation (D-01) and Phase 1 start (D-02).

### 2026-11-09 — repo connected + planning docs pushed
- User created private repo `shantopaul/OneYT` (screenshot).
  Connected local `~/workspace/oneyt/` via HTTPS + `gh` credential
  helper (`gh auth setup-git`), `git init -b main`, remote `origin`.
- First commit `5e608e1` pushed to `main` and verified on remote
  (HEAD = `5e608e1`, 7 files, 1,995 lines). **No coding started.**
- D-01 done. Waiting on user: Phase 1 start (D-02).

### 2026-11-09 — Phase 1 pushed to branch `feature/foundation`
- 22 part-by-part commits, pushed only after Phase 1 was fully
  complete (per instruction). Branch verified on remote;
  `main` untouched at `a52cd3e`, nothing merged.
- Next: browser checklist on Shanto's PC
  (`tests/manual-checklist.md`), then Phase 2 decision (D-07).

<!-- Add new entries above this line, newest first. Format:
### YYYY-MM-DD — short title
- What was done / decided / verified.
- What is next / blocked.
-->
