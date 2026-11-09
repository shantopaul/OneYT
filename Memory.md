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
| **Phase** | Phase 0 ✅ · Phase 1 ✅ (merged) · Phase 2 ✅ (merged) · **Phase 3 — Appearance ✅ code complete, pushed to branch** (browser check still open) |
| **Version** | 0.1.0 (foundation + core layout + appearance, no dashboard yet) |
| **Repo** | `github.com/shantopaul/OneYT` (private) — `main` @ `d6d2df1` (Phase 1 + Phase 2 merged by Shanto: PR #1 `79aa279`, PR #2 `d6d2df1`); branch `feature/appearance` pushed 2026-11-09, **not merged** |
| **Code written** | Phase 1 + Phase 2 + Phase 3: sidebar, player, layout, appearance, typography modules + themes + tests (see "What Has Been Completed") |
| **Currently working on** | — (Phase 3 code done; waiting for browser check + Phase 4 go-ahead) |
| **Blocked on** | Browser verification needs Chrome on Shanto's PC (see `tests/manual-checklist.md` Phase 1–3 sections); Phase 4 start decision |
| **Last verified** | 2026-11-09 — `npm test` 68/68 pass, `npm run lint` clean, `npm run format` clean, manifest valid (all files exist), no polling/network (grep) |

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
| 2026-11-09 | AD-09: module static CSS via manifest + classes, vars for dynamic values | `Architecture.md` AD-09 |
| 2026-11-09 | Phase 2 same rule as Phase 1: branch `feature/core`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Shanto merged PR #1 (`feature/foundation` → `main`, `79aa279`) and PR #2 (`feature/core` → `main`, `d6d2df1`) himself | GitHub API (remote `main` HEAD) |
| 2026-11-09 | AD-10: themes map OneYT tokens onto YouTube `--yt-spec-*` vars + scoped CSS; custom colours override preset; contrast warn only | `Architecture.md` AD-10 |
| 2026-11-09 | Phase 3 same rule: branch `feature/appearance` from `main`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Dark-first UI; no gradients / glassmorphism / fake stats | `Design.md` §2.6 |

## Decisions Needed (from user)

| # | Question | Options / recommendation | Status |
|---|----------|--------------------------|--------|
| D-01 | Create GitHub repo `shantopaul/OneYT` now, or later at Phase 1? | Recommend: create at Phase 1 start, `main` = stable | ✅ Done 2026-11-09 — user created the (private) repo; planning docs pushed as `5e608e1` on `main` |
| D-02 | Start Phase 1 (Foundation) coding now? | Recommend: yes, after D-01 | ✅ Done 2026-11-09 — user said "Phase 1 start", branch `feature/foundation`, part-by-part commits, push only when complete |
| D-07 | Phase 2 start? | Recommend: after the Phase 1 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 2 start", branch `feature/core` from `feature/foundation`, same part-by-part rule, push only when complete |
| D-08 | Phase 3 start? | Recommend: after the Phase 2 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 3 start", branch `feature/appearance` from `main` (`d6d2df1`, PR #2 merged), same part-by-part rule, push only when complete |
| D-09 | Default player radius 12px — keep, or 0 (YouTube sharp corners)? | Recommend: keep 12px unless Shanto prefers stock look | ⬜ Awaiting user — note: radius is now a setting (`appearance.borderRadius`), default stays 12 per schema; changeable without code |
| D-10 | Phase 4 start? | Recommend: after the Phase 3 browser checklist passes on Shanto's PC | ⬜ Awaiting user |
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

**Phase 2 — Core Layout** (code complete 2026-11-09; ✅ = verified
here in Node, ⬜ = needs Chrome on Shanto's PC):

- [ ] Player stays visible while sidebar scrolls (mouse wheel over sidebar only)
- [ ] Video keeps playing during sidebar scroll
- [x] Player width / alignment logic applies and survives SPA navigation (unit-tested; live browser check open)
- [x] `position: absolute` geometry: container measured, height reserved (unit-tested; no-overlap check open in browser)
- [ ] No overlap, no horizontal scrollbar at 1280 / 1440 / 1920 px
- [x] Fullscreen: positioning suspended (unit-tested: all player classes removed)
- [x] Theater: sizing/position skipped, appearance kept (unit-tested via theater attribute)
- [x] Disabling sidebar/player module restores YouTube exactly (unit-tested: classes + vars removed)
- [x] Resize: debounced updates (app.js 150 ms debounce, re-apply re-measures; live check open)

**Phase 3 — Appearance** (code complete 2026-11-09; ✅ = verified
here in Node, ⬜ = needs Chrome on Shanto's PC):

- [x] Every preset applies across Home/Watch/Search/Channel
  (unit-tested variable mapping; live surface check open)
- [x] Switching presets instant — variable swap, no reload
  (unit-tested: old theme class + vars removed)
- [x] Custom colours override preset (unit-tested); contrast
  below WCAG AA logs a warning only, never blocks
- [x] Custom CSS on/off instantly; invalid CSS rejected with a
  warning, never reaches the page (unit-tested)
- [x] Typography changes target only titles/descriptions/comments
  (unit-tested; layout-breakage check open in browser)
- [x] Disabling appearance/typography/layout restores YouTube's
  own theme exactly (unit-tested: classes + vars removed)

**Phase 4 — Playback & Productivity** (not started; awaiting
user go-ahead): see `Phases.md` Phase 4 checklist.

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

### 2026-11-09 — Phase 2: Core Layout DONE (code, branch only)

- Branch `feature/core` from `feature/foundation` (`6385ad3`).
  **7 part-by-part commits, pushed only when Phase 2 was fully
  complete** (same rule as Phase 1 — no intermediate push,
  no merge to `main` or to `feature/foundation`).
- Built: sidebar module (independent scroll, width, scrollbar,
  smooth scroll, wheel sensitivity), player module (width /
  max-width / alignment, position default/sticky/fixed/absolute
  with container measurement + height reservation, radius/border/
  shadow/spacing, fullscreen + theater guards), layout module
  part 1 (hide comments, watch spacing — new additive default
  `layout.watchSpacing: 0`, schema stays v1).
- **AD-09 decided:** module static CSS via manifest + html
  classes; dynamic values via CSS variables; style tags only
  for dynamic/custom CSS. Recorded in `Architecture.md`.
- Fixes found during the work: waitFor retry would loop forever
  when an element never appears (now re-applies only if the
  element arrived); unused `ctx` storage removed from modules
  (deps come through the factory); manifest `options_page`
  already removed in Phase 1.
- Verification here: `npm test` **51/51 pass** (38 Phase 1 + 13
  new fake-DOM module tests), `npm run lint` clean,
  `npm run format` clean, every JS file `node --check` clean,
  manifest valid with all files present, grep: no polling /
  network / eval in extension code.
- **Not verified here (needs Chrome on Shanto's PC):** the
  actual visual behaviour — player staying visible while the
  sidebar scrolls, fixed/absolute geometry, no overlap at
  1280/1440/1920, theater/fullscreen behaviour, live
  `#primary #player` selector. All listed in the new Phase 2
  section of `tests/manual-checklist.md`. Phase 2 is
  code-complete, not browser-verified.
- Known design note: default player radius is 12px per the
  schema (`Architecture.md` §7.1) — the player gets slightly
  rounded corners by default. If Shanto wants YouTube's sharp
  corners by default, change `player.borderRadius` to 0.

### 2026-11-09 — Phase 3: Appearance DONE (code, branch only)

- Shanto merged PR #1 (`feature/foundation` → `main`, `79aa279`)
  and PR #2 (`feature/core` → `main`, `d6d2df1`) himself before
  Phase 3 started, so Phase 3 branched from `main` (`d6d2df1`),
  not from `feature/core`. The stale `main @ a52cd3e` reference
  in this file was corrected in the first Phase 3 commit.
- Branch `feature/appearance`. **6 part-by-part commits, pushed
  only when Phase 3 was fully complete** (same rule — no
  intermediate push, no merge to `main`).
- Built: `shared/themes.js` (6 presets + custom, WCAG contrast),
  appearance module (themes via `--oneyt-*` + `--yt-spec-*` vars,
  custom colours override the preset, radius/spacing vars,
  validated custom CSS in its own style tag), typography module
  (family/size/weight/line-height for titles/descriptions/
  comments only), layout part 2 (home columns, card spacing,
  thumbnail size, hide Shorts home/watch).
- **AD-10 decided:** themes map OneYT tokens onto YouTube
  `--yt-spec-*` variables + scoped CSS; graceful degradation if
  YouTube renames a variable. Recorded in `Architecture.md`.
- Fixes found by the tests (real bugs, not style): (1)
  `resolveThemeVars('custom')` returned empty vars instead of
  the dark base — 'custom' is now a named theme; (2) invalid
  typography values left stale variables behind — invalid now
  removes the variable.
- Verification here: `npm test` **68/68 pass** (51 Phase 1+2 +
  17 new), `npm run lint` clean, `npm run format` clean, every
  JS file `node --check` clean, manifest valid with all files
  present, grep: no polling / network / eval in extension code.
- **Not verified here (needs Chrome on Shanto's PC):** the
  actual visual behaviour — presets across Home/Watch/Search/
  Channel, instant switching, custom CSS on/off, typography
  not breaking layouts, home grid columns/spacing, Shorts
  hiding, live `--yt-spec-*` / `--ytd-rich-grid-*` variables.
  All listed in the new Phase 3 section of
  `tests/manual-checklist.md`. Phase 3 is code-complete, not
  browser-verified.
- Note: task 3.6's editor UI (edit/import/export) belongs to
  the Phase 5 dashboard; Phase 3 ships the validated
  apply/enable/disable engine underneath it.

<!-- Add new entries above this line, newest first. Format:
### YYYY-MM-DD — short title
- What was done / decided / verified.
- What is next / blocked.
-->
