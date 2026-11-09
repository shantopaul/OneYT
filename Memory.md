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
| **Phase** | Phase 0 ✅ · Phase 1 ✅ (merged) · Phase 2 ✅ (merged) · Phase 3 ✅ (merged) · Phase 4 ✅ (merged) · Phase 5 ✅ (merged) · Phase 6 ✅ (merged, PR #6) · Phase 7 ✅ (merged, PR #7) · Phase 8 ✅ (merged, PR #9) · YouTube domains ✅ (merged, PR #10) · Phase 9 ✅ (merged, PR #11) · Phase 10 ✅ (merged, PR #12) · Phase 11 ✅ (merged, PR #13) · Phase 12 ✅ (merged) · Phase 14 ✅ (merged) · Phase 15 ✅ (merged) · Phase 16 ✅ (merged) · Phase 17 — Onboarding (v1.9) ✅ (merged) · Phase 18 — Selector Health Check (v1.10) ✅ (merged) · Phase 19 — Popup Theme + Channel-Page Shorts Tab (v1.11) ✅ (merged) · Phase 20 — Custom CSS Templates (v1.12) ✅ (merged) · Phase 21 — Saved Themes + Export/Share (v1.13) ✅ (merged) · **Phase 22 — Advanced Layout Editor (v1.14) ✅ (merged)** · **Phase 23 — Player Accent Color (v1.15) ✅ (merged)** · **Phase 24 — Custom Font (v1.16) ✅ (merged)** · **Code-check round 1 (v1.16.1) ✅ (merged)** |
| **Version** | 1.16.1 in `main` |
| **Repo** | `github.com/shantopaul/OneYT` (private) — `main` @ `860f8ae` (Phases 1–12 + 14–16 + YouTube domains merged: PR #1 `79aa279`, PR #2 `d6d2df1`, PR #3 `d49ac19`, PR #4 `33d9e08`, PR #5 `5b44c9e`, PR #6 `383e35a`, PR #7 `4ca8a88`, PR #8 docs `713cf6c`, PR #9 `c04274e`, PR #10 `c8acec4`, PR #11 `7b70b80`, PR #12 `dc3061b`, PR #13 `6f0b965`, Phase 12 merge `91fd1f2`, Phase 14 merge `167ac14`, Phase 15 merge `69a9471`, Phase 16 merge `1077140`; Phases 17–24 merged directly to `main`, reaching `ad1c645` (v1.16.0); code-check round 1 merge `860f8ae` (v1.16.1)) |
| **Code written** | Phases 1–12 + 14–24 + YouTube domains + code-check round 1: all modules + dashboard (11 sections, 110 controls) + final popup + sync + Block Shorts + all-youtube.com hosts + dashboard theme + optimised search + hide endscreen cards + hide like/view/subscriber counts + hide topic chips bar + default theater mode + hide live/mixes/news shelves + presets / profiles + onboarding + selector health check + popup theme + channel Shorts tab + custom CSS templates + saved themes + export/share + advanced layout editor + player accent color + custom font + 45 code-check fixes + 8 audit docs + release packaging (see "What Has Been Completed") |
| **Currently working on** | — (code-check round 1 merged; browser check still open) |
| **Blocked on** | Browser verification needs Chrome on Shanto's PC (see `tests/manual-checklist.md` Phases 1–6, 8–12, 14–24 sections) — cross-browser (6.2), viewports (6.3), fullscreen/theater (6.5), sync across two profiles, live selectors and memory are browser-only and stay open; real screenshots (7.3), the privacy-policy URL decision and the Chrome Web Store submission (7.8) need Shanto (his browser + his developer account) |
| **Last verified** | 2026-11-10 — `npm test` 264/264 pass on `main` after the code-check round 1 merge, `npm run lint` clean, `npm run format` clean, manifest valid, `npm run package` builds a clean `oneyt-1.16.1.zip` |

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
| 2026-11-09 | Shanto merged PR #3 (`feature/appearance` → `main`, `d49ac19`) himself | GitHub API (remote `main` HEAD) |
| 2026-11-09 | AD-07 decided: Focus Mode = global setting + per-tab in-memory toggle | `Architecture.md` AD-07 |
| 2026-11-09 | Phase 4 same rule: branch `feature/Productivity` from `main`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Shanto merged PR #4 (`feature/Productivity` → `main`, `33d9e08`) himself | GitHub API (remote `main` HEAD) |
| 2026-11-09 | AD-08 decided: sync scope — opt-in; everything syncs except `appearance.customCSS` (local-only, sync size limits); remembered playback never syncs | `Architecture.md` AD-08 |
| 2026-11-09 | Phase 5 same rule: branch `feature/Settings` from `main`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Shanto merged PR #5 (`feature/Settings` → `main`, `5b44c9e`) himself | GitHub API (remote `main` HEAD) |
| 2026-11-09 | Phase 6 same rule: branch `feature/Optimisation` from `main`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Phase 7 same rule: branch `feature/Release`, part-by-part commits, push only when fully complete | User instruction 2026-11-09 |
| 2026-11-09 | Shanto merged PR #6 (`feature/Optimisation` → `main`, `383e35a`) and PR #7 (`feature/Release` → `main`, `4ca8a88`) himself — all 7 phases now in `main` | GitHub API (remote `main` HEAD) |
| 2026-11-09 | Update all plan files to record full completion (Phases 0–7 merged, v1.0.0 in `main`) | User instruction 2026-11-09 |
| 2026-11-09 | Dark-first UI; no gradients / glassmorphism / fake stats | `Design.md` §2.6 |

## Decisions Needed (from user)

| # | Question | Options / recommendation | Status |
|---|----------|--------------------------|--------|
| D-01 | Create GitHub repo `shantopaul/OneYT` now, or later at Phase 1? | Recommend: create at Phase 1 start, `main` = stable | ✅ Done 2026-11-09 — user created the (private) repo; planning docs pushed as `5e608e1` on `main` |
| D-02 | Start Phase 1 (Foundation) coding now? | Recommend: yes, after D-01 | ✅ Done 2026-11-09 — user said "Phase 1 start", branch `feature/foundation`, part-by-part commits, push only when complete |
| D-07 | Phase 2 start? | Recommend: after the Phase 1 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 2 start", branch `feature/core` from `feature/foundation`, same part-by-part rule, push only when complete |
| D-08 | Phase 3 start? | Recommend: after the Phase 2 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 3 start", branch `feature/appearance` from `main` (`d6d2df1`, PR #2 merged), same part-by-part rule, push only when complete |
| D-09 | Default player radius 12px — keep, or 0 (YouTube sharp corners)? | Recommend: keep 12px unless Shanto prefers stock look | ⬜ Awaiting user — note: radius is now a setting (`appearance.borderRadius`), default stays 12 per schema; changeable without code |
| D-10 | Phase 4 start? | Recommend: after the Phase 3 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 4 start", branch `feature/Productivity` from `main` (`d49ac19`, PR #3 merged), same part-by-part rule, push only when complete |
| D-11 | Phase 5 start? | Recommend: after the Phase 4 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 5 start", branch `feature/Settings` from `main` (`33d9e08`, PR #4 merged), same part-by-part rule, push only when complete |
| D-12 | Phase 6 start? | Recommend: after the Phase 5 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 6 start", branch `feature/Optimisation` from `main` (`5b44c9e`, PR #5 merged), same part-by-part rule, push only when complete |
| D-13 | Phase 7 start? | Recommend: after the Phase 6 browser checklist passes on Shanto's PC | ✅ Done 2026-11-09 — user said "Phase 7 start", branch `feature/Release` (based on `feature/Optimisation` because PR #6 was still open at the time — Shanto merged PR #6 himself during Phase 7, then PR #7 himself; `main` now `4ca8a88`), same part-by-part rule, push only when complete |
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

**Phase 4 — Playback & Productivity** (code complete 2026-11-09;
✅ = verified here in Node, ⬜ = needs Chrome on Shanto's PC):

- [x] Speed/volume remembered across videos and restarts
  (unit-tested: storage round-trip, second video re-applies)
- [x] Speed presets add/remove correctly; invalid speeds rejected
  (validateSpeedPresets unit-tested; dashboard add/remove UI is
  Phase 5)
- [x] Quality preference falls back gracefully when unavailable
  (unit-tested: no call when the level is missing)
- [x] Focus Mode hides exactly the configured elements — and
  restores exactly on toggle-off (class-only hiding, unit-tested)
- [x] Shortcuts work, duplicates blocked (first wins), YouTube-native
  conflicts warned (unit-tested; warnings surface in dashboard)
- [x] Mini-player still works natively (open/close/drag) — no rule
  applies when nothing is configured (unit-tested; drag check open
  in browser)
- [x] Navigation hiding never removes account menu or accessibility
  controls (module only touches the guide; unit-tested classes)

**Phase 5 — Settings Dashboard** (code complete 2026-11-09;
✅ = verified here in Node, ⬜ = needs Chrome on Shanto's PC):

- [x] Every setting reachable from the dashboard; every setting
  has name + description + current + default + reset
  (unit-tested: full coverage of the defaults tree)
- [x] Search finds settings by keyword and jumps to them
  (unit-tested index; jump + highlight is browser-open)
- [x] Live changes apply without reload; reset restores defaults
  (writes go to storage, content scripts watch onChanged;
  live-apply is browser-open)
- [x] Import validates and previews before applying; invalid
  file rejected with field errors (unit-tested round-trip +
  rejection; file picker is browser-open)
- [x] Export → import round-trip reproduces the same settings
  (unit-tested)
- [x] Disabling a module from the dashboard disables only that
  module (module toggles in General; isolation is browser-open)
- [x] Popup opens fast, shows correct page status, all quick
  toggles work (parsePageStatus unit-tested; live popup is
  browser-open)

**Phase 6 — Optimisation & Testing** (code complete 2026-11-09;
✅ = verified here in Node, ⬜ = needs Chrome on Shanto's PC):

- [x] AD-08 sync wired: opt-in toggle in Advanced; settings
  mirror to `chrome.storage.sync` except Custom CSS and
  remembered speed/volume; first-run seeds from sync; sync
  changes merge in (local CSS kept); sync failure never
  breaks the local save; turning sync off removes the stale
  sync copy (unit-tested incl. no-loop)
- [x] Performance audit 6.1: every observer/listener/timer
  inventoried (`docs/PERFORMANCE_AUDIT.md`) — one real fix
  (mini-player observer now only runs when configured)
- [x] SPA stress 6.4: 20 navigations + back/forward + modules
  off/on 10× — no duplicate listeners, style tags, classes
  or vars (Node test; live confirmation is browser-open)
- [x] Migration 6.6: v0.1 + v0.4 + corrupt fixtures
  (`tests/fixtures/`) — user values preserved, new keys
  filled, corrupt types repaired
- [x] Selector audit 6.7: 20 keys, all used; dead
  `sidebarSection` removed; no module JS hard-codes a
  YouTube selector (live DOM check is browser-open)
- [x] Security review 6.8 (`docs/SECURITY_REVIEW.md`): remote
  `url()` in custom CSS blocked, dead service-worker relay
  removed, import size enforced; permissions minimal
  (`storage` + `activeTab`, youtube.com only), no network
  calls, no eval/innerHTML
- [x] Accessibility 6.9: muted text now passes WCAG AA,
  visible focus rings everywhere, shortcut capture no
  longer swallows Tab (live keyboard/screen-reader
  walkthrough is browser-open)
- [x] Bug bash 6.10 (`docs/BUG_BASH.md`): 11 fixes logged,
  7 minors deferred to v1.1 (all browser-only checks)
- [x] Version bumped to 0.9.0 (release candidate)
- [ ] Browser-only items (6.2 cross-browser, 6.3 viewports,
      6.5 fullscreen/theater, two-profile sync, live
      selectors, memory) — see Phase 6 checklist in
      `tests/manual-checklist.md`

**Phase 7 — Public Release** (code complete 2026-11-09;
✅ = verified here in Node, ⬜ = needs Shanto):

- [x] Final branding: original Y mark (replaces the Phase 1
  placeholder play button — that was literally YouTube's
  play button, which Design.md forbids), icons 16/48/128 +
  512 master, tagline confirmed
- [x] Promo tiles 440×280 / 920×680 / 1400×560 (branded
  tiles only — no fake UI)
- [x] Store listing copy (`docs/store-listing.md`): every
  claim is a shipped feature, no invented statistics
- [x] Privacy policy (`docs/PRIVACY.md`): no collection, no
  network, no third parties; sync opt-in only
- [x] README final + CHANGELOG + MIT LICENSE
- [x] `npm run package` builds a clean submission zip
  (100 KB, no test/doc/script files inside)
- [x] Version 1.0.0; PRD §12 Definition of Done checked
  (`docs/RELEASE_CHECKLIST.md`) — code column complete,
  browser column open
- [ ] Real screenshots (5, 1280×800) — Shanto's PC
  (`docs/SCREENSHOTS.md`)
- [ ] Privacy-policy URL decision (repo-public vs
  shantopaul.com) — Shanto
- [ ] Browser checklists Phases 1–6 — Shanto's PC
- [ ] Tag `v1.0.0` + GitHub release — AFTER the release PR
  is merged (tag must point at main)
- [ ] Chrome Web Store submission — Shanto's account
  (`docs/SUBMISSION.md`)

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
  **8 part-by-part commits, pushed only when Phase 2 was fully
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

### 2026-11-09 — Phase 4: Playback & Productivity DONE (code, branch only)

- Shanto merged PR #3 (`feature/appearance` → `main`, `d49ac19`)
  himself before Phase 4 started, so Phase 4 branched from
  `main` (`d49ac19`).
- Branch `feature/Productivity` (capital P, as instructed).
  **10 part-by-part commits, pushed only when Phase 4 was fully
  complete** (same rule — no intermediate push, no merge to
  `main`).
- Built: playback module (default speed/volume, remember across
  videos/restarts via separate storage keys, best-effort quality
  via the player API, autoplay/captions via aria-pressed toggles
  that are never clicked blind, caption font size), focus module
  (AD-07: global setting + per-tab in-memory toggle; class-only
  hiding = exact restore; masthead never hidden),
  recommendations module (hide sidebar, density, card size,
  metadata), mini-player in the player module (size/position/
  radius/shadow/offsets; page-independent; observer only
  re-applies when the element's presence changes), keyboard
  module (Shift+ defaults, capture-phase listener, typing never
  hijacked, duplicates first-wins + warned, native conflicts
  warned), navigation module (guide entries by :has + href,
  compact, guide width; account/accessibility never touched).
- **AD-07 decided:** Focus Mode scope. Recorded in
  `Architecture.md`.
- Verification here: `npm test` **83/83 pass** (68 Phase 1–3 +
  15 new), `npm run lint` clean, `npm run format` clean, every
  JS file `node --check` clean, manifest valid with all files
  present, grep: no polling / network / eval in extension code.
- **Not verified here (needs Chrome on Shanto's PC):** the
  actual behaviour — remembered speed after a real restart,
  quality fallback on a video without that level, Focus restore
  on a live page, mini-player drag with styling on, shortcuts
  on a live page, guide hiding. All listed in the new Phase 4
  section of `tests/manual-checklist.md`. Phase 4 is
  code-complete, not browser-verified.
- Deliberately deferred to Phase 5 (dashboard): shortcut reset
  UI, speed-preset add/remove UI, recommendation section
  toggles, caption appearance beyond font size.

### 2026-11-09 — Phase 5: Settings Dashboard DONE (code, branch only)

- Shanto merged PR #4 (`feature/Productivity` → `main`, `33d9e08`)
  himself before Phase 5 started, so Phase 5 branched from
  `main` (`33d9e08`).
- Branch `feature/Settings`. **11 part-by-part commits, pushed
  only when Phase 5 was fully complete** (same rule — no
  intermediate push, no merge to `main`).
- Built: dashboard shell (`options/options.html` + `options.css`,
  Design.md §2.2 dark-first tokens, light variant via
  prefers-color-scheme) + engine (`options/options.js`: data-
  driven renderer for 8 control types, storage writes, live
  preview via the existing onChanged watch, search with
  jump-to-control + highlight, import/export with diff preview,
  per-setting / per-section / global reset) + 9 section files
  (96 controls, unit-tested to cover every leaf setting) +
  final popup (quick toggles, page status, theme, dashboard
  opener) + manifest (`options_page` returns, `activeTab`
  permission for the popup's page status only).
- **AD-08 decided:** sync scope (see Architecture.md). No sync
  toggle ships in Phase 5 — the implementation is Phase 6
  work, and a dead toggle would be dishonest.
- Verification here: `npm test` **93/93 pass** (83 Phase 1–4 +
  10 new), `npm run lint` clean, `npm run format` clean, every
  JS file `node --check` clean, manifest valid with all files
  present, grep: no polling / network / eval in extension code.
  7 ESLint errors found in the new files during verification
  were fixed (unused vars, optional catch binding, browser
  globals, curly) before the tests commit.
- **Not verified here (needs Chrome on Shanto's PC):** the live
  dashboard — opening it, search jump, import file picker,
  popup on a real tab, settings applying live on an open
  YouTube tab, module toggles isolating correctly. All listed
  in the new Phase 5 section of `tests/manual-checklist.md`.
  Phase 5 is code-complete, not browser-verified.

### 2026-11-09 — Phase 6: Optimisation & Testing DONE (code, branch only)

- Shanto merged PR #5 (`feature/Settings` → `main`, `5b44c9e`)
  himself before Phase 6 started, so Phase 6 branched from
  `main` (`5b44c9e`).
- Branch `feature/Optimisation`. **15 part-by-part commits,
  pushed only when Phase 6 was fully complete** (same rule —
  no intermediate push, no merge to `main`).
- The one feature this phase was allowed: AD-08 sync wiring.
  Opt-in toggle in Advanced; `storage.set()` mirrors the
  syncable subset (everything except Custom CSS) to
  `chrome.storage.sync`; first run seeds from sync; sync
  changes merge in (local Custom CSS kept); identical merges
  skipped (no loop); sync failure never breaks the local
  save; turning sync off removes the stale sync copy.
- Audits (each with its own doc + regression tests): 6.1
  performance (mini-player observer gated — it used to run
  on every page with nothing configured), 6.4 SPA stress
  (20 navigations, no duplicates), 6.6 migration fixtures
  (v0.1/v0.4/corrupt), 6.7 selector audit (dead
  `sidebarSection` removed), 6.8 security (remote `url()` in
  custom CSS blocked, dead service-worker relay removed,
  import size enforced), 6.9 accessibility (muted text now
  WCAG AA, focus rings, Tab capture trap), 6.10 bug bash
  (Tab/Escape unbindable shortcuts, import number clamping;
  11 fixes total, 7 minors deferred to v1.1 — all
  browser-only checks).
- One process correction this phase: a commit message
  claimed "107 pass" when one test was actually failing —
  the pipeline (`npm test | tail`) hid the exit code; from
  then on the pass/fail lines were checked before every
  commit, and the follow-up commit corrected the record.
- Version bumped to 0.9.0 (release candidate).
- Verification here: `npm test` **121/121 pass** (93 Phase
  1–5 + 28 new), `npm run lint` clean, `npm run format`
  clean, every JS file `node --check` clean, manifest valid
  with all files present, grep: no polling / network / eval
  in extension code.
- **Not verified here (needs Chrome/Edge/Brave on Shanto's
  PC):** cross-browser (6.2), viewports (6.3), fullscreen +
  theater (6.5), two-profile sync, live selectors, real
  memory measurement, live keyboard/screen-reader
  walkthrough. All listed in the new Phase 6 section of
  `tests/manual-checklist.md`. Phase 6 is code-complete,
  not browser-verified.

### 2026-11-09 — Phase 7: Public Release DONE (code, branch only)

- PR #6 (`feature/Optimisation` → `main`) was **still open**
  when Phase 7 started, so the release branch was based on
  `feature/Optimisation` (`4ddac3d`) instead of `main` —
  otherwise v1.0.0 would have shipped without sync and all
  Phase 6 fixes. **Update:** Shanto merged PR #6 himself
  while Phase 7 was in progress (`main` now `383e35a`), so
  the release branch is now a clean descendant of `main`
  and the release PR merges without conflict.
- Branch `feature/Release`. **12 part-by-part commits,
  pushed only when Phase 7 was fully complete** (same rule —
  no intermediate push, no merge to `main`).
- Final branding: the Phase 1 placeholder icon was a red
  square + white play triangle — literally YouTube's play
  button, which Design.md forbids as the logo. The final
  mark is original: a bold white geometric "Y" on a dark
  rounded square, small red dot below the stem (red as
  accent only), drawn with PIL (`scripts/generate-icons.py`).
  Verified by eye at 128 and 16 px. Tagline confirmed
  (already in Design.md): "Your YouTube. Your Layout. Your
  Rules."
- Promo tiles 440×280 / 920×680 / 1400×560
  (`scripts/generate-promo.py`): branded tiles only, minimal
  text, no Chrome/Google branding, no fake UI.
- Store listing copy (`docs/store-listing.md`): title 37
  chars, short description 126/132, detailed 2,561/16,000 —
  limits verified against the Chrome Web Store spec. Every
  claim is a shipped v1.0.0 feature; no invented statistics.
- Privacy policy (`docs/PRIVACY.md`): matches the code —
  no collection, no network, no third parties, sync opt-in
  only. Contact is the public GitHub repo (support email is
  Shanto's to add if he wants one).
- README final + CHANGELOG (0.1.0 / 0.9.0 / 1.0.0) + MIT
  LICENSE (the README already referenced a LICENSE that did
  not exist).
- `npm run package` builds `oneyt-1.0.0.zip` (100 KB) with
  runtime files only — verified zero test/doc/script/promo/
  screenshot files inside; zips are gitignored artefacts.
- Screenshots: **not captured here** — a real browser is
  required. `docs/SCREENSHOTS.md` has the shot list (5 shots
  at 1280×800) and the honest rule: real captures only, no
  mockups, no edited UI presented as real.
- Version 1.0.0. Tag `v1.0.0` + GitHub release are
  **deliberately not done here** — a tag must point at
  `main`, so they happen after the release PR is merged
  (steps in `docs/RELEASE_CHECKLIST.md`).
- PRD §12 Definition of Done checked box by box
  (`docs/RELEASE_CHECKLIST.md`): code column complete,
  browser column open for items 2–9, 11–14 — the same open
  browser checks carried since Phase 1.
- Verification here: `npm test` **121/121 pass**, `npm run
  lint` clean, `npm run format` clean, every JS file
  `node --check` clean, manifest valid with all files
  present, grep: no polling / network / eval in extension
  code (one hit is a comment in `validators.js` saying
  "no eval").
- **Open, all Shanto's:** browser checklists Phases 1–6,
  5 real screenshots, privacy-policy URL decision
  (repo-public vs shantopaul.com — the store needs a public
  URL and the repo is private), tag + GitHub release after
  the merge, Chrome Web Store submission ($5 account,
  1–3 day review).
- **Update 2026-11-09:** Shanto merged PR #7 himself
  (`main` now `4ca8a88`) — Phase 7 is in `main`, and all
  plan files (PRD, Architecture, Design, Memory, Phases,
  RELEASE_CHECKLIST) were updated the same day to record
  full completion.

### 2026-11-09 — Phase 8: Block Shorts DONE (code, branch only)

- User instruction: add one new feature — block Shorts
  fully, hide them, do not show them — plan and implement
  the code.
- Gap found first: Shorts hiding existed only as 3 separate
  toggles (Home shelf, Watch shelf, guide entry). Nothing
  hid the shelf on search/subscriptions, nothing hid Shorts
  video cards, and nothing stopped the `/shorts/` player
  page from playing.
- Branch `feature/shorts-block` from `main` (`4ca8a88`).
  **8 part-by-part commits, pushed only when Phase 8 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- New setting `layout.blockShorts: false` (additive default
  off — existing users see no change until they turn it on).
  Layout module sets `oneyt-block-shorts` on `<html>` on
  every page type (set after the page branches so cleanup()
  cannot strip it) and redirects `/shorts/VIDEOID` to
  `/watch?v=VIDEOID` via `location.replace` (no history
  entry, so Back does not return to Shorts). Pure helper
  `shortsWatchUrl` (11-char IDs only, anything else → null);
  redirect injectable for tests.
- CSS (layout.css): rich shelf `[is-shorts]`, reel shelf
  (search/subscriptions), guide + mini-guide Shorts entries,
  Shorts video cards in grids/search (`:has(a[href^=
  '/shorts/'])` — precise, only renderers containing a
  Shorts link).
- Dashboard: master toggle "Block Shorts everywhere" first
  in the Layout section. The 3 older toggles are unchanged.
- Selectors: 20 → 21 keys (`reelShelf`); usage enforced by
  the Phase 6 audit tests.
- Version 1.1.0 (new feature = minor bump) + CHANGELOG.
  Note: the professional README rewrite (PR #8) merged to
  `main` (`713cf6c`) while Phase 8 was in progress, so this
  branch was rebased onto it — the README version badge,
  package zip name and roadmap line were bumped to 1.1.0
  during the rebase (conflict resolved in favour of the
  rewritten README).
- Verification here: `npm test` **123/123 pass** (121 + 2
  new), `npm run lint` clean, `npm run format` clean,
  manifest valid, `npm run package` builds a clean
  `oneyt-1.1.0.zip` (100 KB). One test needed a fix during
  the work: the selector-count assertion (20 → 21).
- **Not verified here (needs Chrome on Shanto's PC):** the
  new selectors against the live YouTube DOM and the
  `/shorts/` → `/watch` redirect on a real page. Known
  limit: the Shorts tab on channel pages is not hidden yet
  (v1.1 follow-up, logged in Phases.md).

### 2026-11-09 — Phase 16: Presets / Profiles STARTED (branch only)

- Branch `feature/presets` from `main` (`4440b49`, v1.7.0).
  Plan in PRD (PL-16) + Phases (Phase 16, v1.8.0); the
  "Workspace presets" Future item is now this phase.
  Design: 4 built-in presets (Stock YouTube, Focus, Clean,
  Cinema) as partial overrides merged onto current
  settings; custom profiles as full migrated snapshots
  (max 10, names 1–40 chars, no duplicates); storage key
  `oneyt.profiles.v1`, local only, never synced; dashboard
  Profiles section + popup picker; no content-script
  changes, no new permission / network / selector.
  Baseline on `main` before coding: `npm test` 146/146 pass.

### 2026-11-09 — Phase 16: Presets / Profiles DONE (code, branch only)

- Branch `feature/presets` from `main` (`4440b49`).
  **7 part-by-part commits, pushed only when Phase 16 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: `shared/profiles.js` (pure — `BUILTIN_PRESETS`
  with partial overrides, `applyPreset` onto current
  settings, `createProfile` / `applyProfile` /
  `validateProfiles` / `renameProfile` / `deleteProfile`,
  max 10 profiles, names 1–40 chars, built-in names
  reserved, corrupt snapshots never wipe settings);
  `PROFILES_STORAGE_KEY` (`oneyt.profiles.v1`, local
  only, never synced) in `shared/constants.js`;
  dashboard Profiles section (`options/sections/
  profiles.js`, after General; `renderProfilesTools` in
  `options.js`, mirroring `renderAdvancedTools`) with
  preset buttons, save-name input, profile list
  (Apply / Rename / Delete); popup preset picker
  (`preset:` / `profile:` select, resets after applying,
  disabled when the extension is off, refreshes when
  profiles change elsewhere).
- Verification here: `npm test` **162/162 pass** (146
  baseline + 16 new), `npm run lint` clean, `npm run
  format` clean, manifest valid, `npm run package`
  builds a clean `oneyt-1.8.0.zip` (114 KB, runtime
  files only), grep: no polling / network / eval in
  extension code. Two test updates were needed for the
  new files: `SECTION_FILES` + the options.html script
  count (16 → 18) in `tests/dashboard.test.js`.
- **Not verified here (needs Chrome on Shanto's PC):**
  the dashboard Profiles section, the popup picker and
  live apply on a real YouTube tab. All listed in the
  new Phase 16 section of `tests/manual-checklist.md`.
  Phase 16 is code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `1077140`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 162/162 pass, lint + format clean, merged tree identical to the branch head (no merge-trap losses). Follow-up docs commit records the merge in Phases.md + Memory.md. Note: the status table above was duplicated by two parallel edits in the first Phase 16 commit — repaired here into a single table; do not edit the same file in parallel.
- Note: the first attempt at this phase (delegated to a
  helper) was refused by a safety check before any work
  started — nothing was built, branched or committed in
  that attempt. Shanto asked again in a later turn and
  the phase was then built directly, in this session,
  from the same design.

### 2026-11-09 — Phase 20: Custom CSS Templates DONE (code, branch only)

- Branch `feature/css-templates` from `main` (`c3732a3`).
  **8 part-by-part commits, pushed only when Phase 20 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: `shared/cssTemplates.js` (pure — 6 templates:
  hide duration badges, fade watched videos, hide video
  badges, hide home metadata, hide voice search, hide
  channel banner; `getCssTemplate` / `listCssTemplates` /
  `isCssTemplateApplied` / `applyCssTemplate` — apply
  appends the template CSS under a marker comment, so
  applying twice is a no-op); dashboard tool-box in the
  Appearance section (`renderCssTemplateTools` in
  `options.js`, mirroring `renderProfilesTools`) — one
  row per template with an Apply button (reads
  "Applied" when its marker is already in the Custom
  CSS text); applying turns `appearance.customCSSEnabled`
  on, so templates flow through the existing validated
  custom-CSS path. No new setting, no content-script
  change, no new permission, no new selector in
  `selectors.js`. Removal is manual in v1 (delete the
  block from the Custom CSS box).
- Template selectors are sourced, not guessed: voice
  search from 3+ independent userstyles + a uBlock
  filter list, channel banner from the YouTube Custom UI
  Cleaner userstyle. Every template passes
  `validators.validateCustomCSS` (asserted in tests).
- Verification here: `npm test` **193/193 pass** (183
  baseline + 10 new), `npm run lint` clean, `npm run
  format` clean (one fix commit for two Prettier
  reflows), manifest valid, `npm run package` builds a
  clean `oneyt-1.12.0.zip` (128 KB, runtime files only).
  Script-count pin in `tests/dashboard.test.js` went
  20 → 21 for `shared/cssTemplates.js`.
- **Not verified here (needs Chrome on Shanto's PC):**
  the templates tool-box and live apply on real
  YouTube pages. All listed in the new Phase 20 section
  of `tests/manual-checklist.md`. Phase 20 is
  code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `8af093d`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 193/193 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.12.0.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

### 2026-11-09 — Phase 21: Saved Themes + Export/Share DONE (code, branch only)

- Branch `feature/saved-themes` from `main` (`81201fb`).
  **8 part-by-part commits, pushed only when Phase 21 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: `shared/savedThemes.js` (pure — a saved theme
  is theme-only: `{ name, createdAt, theme, colors }`;
  `createSavedTheme` / `applySavedTheme` /
  `validateSavedThemeName` / `validateSavedThemes` /
  `renameSavedTheme` / `deleteSavedTheme`, max 10,
  names 1–40 chars, built-in theme names reserved,
  corrupt entries never wipe settings; `exportSavedTheme`
  → `{ oneytTheme: 1, name, theme, colors }` JSON +
  `oneyt-theme-<slug>.json` filename;
  `parseSavedThemeImport` rejects bad JSON, wrong
  version marker, unknown base theme, unknown colour
  keys, invalid hex and duplicate names);
  `SAVED_THEMES_STORAGE_KEY` (`oneyt.themes.v1`, local
  only, never synced) in `shared/constants.js`;
  dashboard tool-box in the Appearance section
  (`renderSavedThemeTools` in `options.js`, mirroring
  `renderProfilesTools`) — save by name, per-theme
  Apply / Export / Rename / Delete, import box (file
  or pasted JSON → validate + preview → Add theme
  only on confirm). Applying writes
  `appearance.theme` + `appearance.colors` only.
  No new setting, no content-script change, no new
  permission, no new selector.
- Two real bugs caught before committing, both by
  reading the failure first: the engine referenced an
  `ignoreName` parameter that the `validateSavedThemeName`
  signature had dropped (smoke test threw
  `ReferenceError` — fixed before the engine commit);
  and one test expectation was wrong, not the engine
  (a whitespace-padded duplicate name IS a duplicate
  after trimming — the test was corrected, 202/203 →
  203/203).
- Verification here: `npm test` **203/203 pass** (193
  baseline + 10 new), `npm run lint` clean, `npm run
  format` clean (one fix commit for Prettier reflows),
  manifest valid, `npm run package` builds a clean
  `oneyt-1.13.0.zip` (runtime files only). Script-count
  pin in `tests/dashboard.test.js` went 21 → 22 for
  `shared/savedThemes.js`.
- **Not verified here (needs Chrome on Shanto's PC):**
  the saved-themes tool-box and live apply on a real
  YouTube page. All listed in the new Phase 21 section
  of `tests/manual-checklist.md`. Phase 21 is
  code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `03b6120`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 203/203 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.13.0.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

### 2026-11-09 — Phase 22: Advanced Layout Editor DONE (code, branch only)

- Branch `feature/layout-editor` from `main` (`1324f15`).
  **9 part-by-part commits, pushed only when Phase 22 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: new additive setting `layout.homeMaxWidth`
  (0 = YouTube default, px, 0–2560) — the layout module
  sets class `oneyt-home-max-width` + variable
  `--oneyt-home-max-width` in `applyHome()` (cleared on
  watch/other pages and in `cleanup()`), and `layout.css`
  caps + centres `ytd-rich-grid-renderer` under that
  class (the ultrawide fix). No new selector key —
  the rule reuses the existing `ytd-rich-grid-renderer`
  element, so the selector count stays 31. Pure engine
  `shared/layoutPresets.js` — three built-in layout
  presets as partial overrides (Compact 5 cols / 8 px
  gap / no cap, Balanced 4 cols / 16 px / 1600 px,
  Spacious 3 cols / 24 px / 1280 px) +
  `getLayoutPreset` / `applyLayoutPreset` /
  `layoutPreviewSummary`; dashboard tool-box in the
  Layout section (`renderLayoutEditorTools` in
  `options.js`, mirroring `renderProfilesTools`) — one
  row per preset with an Apply button, plus a live
  preview (mini grid drawn from the current values:
  columns · gap · max-width). Applying a preset
  changes only the five layout numbers.
- One honest repair inside the phase: an edit meant to
  append a test instead replaced the whole
  hideLiveShelf/hideMixesShelf/hideNewsShelf test with
  its header line — caught by reading the `git diff`
  before committing, restored verbatim, and the new
  test appended after it. Final diff verified clean.
- Verification here: `npm test` **214/214 pass** (203
  baseline + 11 new: 10 engine + 1 module), `npm run
  lint` clean, `npm run format` clean (one fix commit
  for a Prettier reflow), manifest valid, `npm run
  package` builds a clean `oneyt-1.14.0.zip` (runtime
  files only). Script-count pin in
  `tests/dashboard.test.js` went 22 → 23 for
  `shared/layoutPresets.js`. The dashboard coverage
  test passes with the new `layout.homeMaxWidth`
  number control.
- **Not verified here (needs Chrome on Shanto's PC):**
  the editor tool-box, the preview and live apply on
  a real YouTube page (esp. the centred feed on a
  wide monitor). All listed in the new Phase 22 section
  of `tests/manual-checklist.md`. Phase 22 is
  code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `e581692`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 214/214 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.14.0.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

### 2026-11-09 — Phase 23: Player Accent Color DONE (code, branch only)

- Branch `feature/player-accent-color` from `main` (`cd49ebb`).
  **10 part-by-part commits, pushed only when Phase 23 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: one new additive setting `player.accentColor`
  (string, `''` = YouTube default red; a `#rrggbb` value
  recolours the player). Two selector keys in
  `shared/selectors.js` (count 31 → 33) — `playProgress:
  '.ytp-play-progress'` (played portion) and
  `scrubberButton: '.ytp-scrubber-button'` (knob) —
  sourced from several independent userstyles (Youtube
  Cybercore, Gura, Acheron, YouTube Custom Color, Youtube
  Retouch, xlvxlv, V3-2011 player); health metadata for
  both (watch, `always`, feature 'Player accent color').
  The player module sets class `oneyt-player-accent` +
  variable `--oneyt-player-accent` in the theater-safe
  Appearance section of `apply()` (cleared off watch
  pages and in fullscreen like every player class);
  an invalid hex (e.g. from a hand-edited import) is
  treated as empty — YouTube red stays. `player.css`
  recolours only those two elements under `#movie_player`;
  the buffered portion is deliberately untouched so
  played vs buffered stays readable, and the volume
  slider is out of scope (its fill hook has only one
  source). Dashboard: one `color` control in the Player
  section (the existing picker + text + Clear control)
  after "Player spacing"; the coverage test passes with
  it. The accent is independent of the appearance theme
  accent — it recolours the player only.
- Two honest repairs inside the phase: the selectors
  commit landed with the audit test failing (the new keys
  had no CSS use yet — fixed by the next commit, the
  module + CSS one, which turned the suite green); and
  the tests commit landed 216/217 — a second
  selector-count pin in `tests/popup-theme.test.js` was
  missed (31, should be 33) — fixed by the next commit
  after reading the fail line. Final state verified
  green before the version commit.
- Verification here: `npm test` **217/217 pass** (214
  baseline + 3 new module tests), `npm run lint` clean,
  `npm run format` clean, manifest valid, `npm run
  package` builds a clean `oneyt-1.15.0.zip` (runtime
  files only). No new permission, no new script, no
  sync change.
- **Not verified here (needs Chrome on Shanto's PC):**
  the accent, the picker and live apply on a real
  YouTube page (esp. theater vs fullscreen, and the
  Health row). All listed in the new Phase 23 section
  of `tests/manual-checklist.md`. Phase 23 is
  code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `bcc733b`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 217/217 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.15.0.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

### 2026-11-09 — Phase 24: Custom Font DONE (code, branch only)

- Branch `feature/custom-font` from `main` (`4a2bcea`).
  **10 part-by-part commits, pushed only when Phase 24 was
  fully complete** (same rule — no intermediate push, no
  merge to `main`).
- Built: one new additive setting
  `appearance.typography.customFont` (string, `''` = use
  the Font family select) — any font installed on this
  device, typed by name. Pure engine in `shared/themes.js`:
  `isValidCustomFontName` (trimmed, 1–64 chars, starts
  alnum, only letters/digits/spaces/hyphens/underscores)
  + `resolveFontFamily(fontFamily, customFont)` (a valid
  custom name wins → `"Name", sans-serif`; otherwise the
  `FONT_STACKS` entry; otherwise null). The typography
  module uses the resolver; an invalid custom name is
  warned about and falls back to the select — the raw
  string never reaches the page. No Google Fonts, no
  download, no new permission, no new selector, no new
  script. Same scope as typography today — video titles,
  descriptions and comments only; player, captions and
  navigation untouched. Dashboard: one `text` control in
  the Appearance section right after "Font family"; the
  coverage test passes with it. Profiles snapshot the
  setting automatically; saved themes are theme-only, so
  they do not carry it.
- One honest repair inside the phase: the typography
  module first referenced a `themes` variable that did
  not exist in its scope (`ReferenceError`, 2 tests
  failing) — caught by running the appearance tests
  before committing, fixed by capturing `themes` from
  the deps; the module commit landed green, no red
  commit exists. One fix commit for a Prettier reflow
  in `tests/themes.test.js`.
- Verification here: `npm test` **220/220 pass** (217
  baseline + 3 new: 1 engine + 2 typography), `npm run
  lint` clean, `npm run format` clean, manifest valid,
  `npm run package` builds a clean `oneyt-1.16.0.zip`
  (runtime files only).
- **Not verified here (needs Chrome on Shanto's PC):**
  the custom font, the text box and live apply on a real
  YouTube page (esp. an installed font vs a missing one,
  and the injection fallback). All listed in the new
  Phase 24 section of `tests/manual-checklist.md`.
  Phase 24 is code-complete, not browser-verified.
- **Merged to `main` 2026-11-09** (merge `7c0f22d`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 220/220 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.16.0.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

### 2026-11-10 — Code-check round 1 DONE + MERGED (v1.16.1)

- Read-only code audit of every feature (3 parallel
  reviewers: shared engines + docs, content modules,
  dashboard + popup + onboarding + manifest + service
  worker), then fixes for all 45 confirmed findings.
  No real-browser testing in this round — code reads +
  Node suite only (see `docs/CODE_CHECK.md` S1–S6).
- Headline fixes: dead `sidebar.keepPlayerVisible`
  toggle deleted (not wired); `deepMerge` null-section
  + non-boolean nullable repairs; validator gaps (CSS
  strings/comments, `url()` quote evasion, unknown-key
  wording); one-token-per `--yt-spec-*` target; repair
  shadowing; base.css width variables removed; mini-player
  stale config; focus reset; keyboard repeat; apply-time
  numeric clamps; compact-wins-over-wide; stale theater
  waiter; starved health timer; settings-manager
  deepEqual + echo notify; scoped `waitFor`; feed-page
  detection; detached-video playback; dashboard batch
  (theme after state replace, honest save reporting,
  shortcut blur, colour reset, speed options, theme
  clamp, delete confirms, independent load failures,
  byte-size imports, CSS probe validation, onChanged
  refresh, search tool-box items, AA primary buttons);
  popup write cache; onboarding theme + error.
- 3 small optimizations: sidebar wheel re-bind skip,
  stale `inputsByKey` clear, dead validators include
  removed. Checked, kept: unstyled class hooks,
  copy-pasted `isPlainObject`, per-file repair loops,
  local 4-line theme resolvers, no auto-disable.
- Docs staleness fixed: README tests badge 121 → 264,
  `package.json` 1.1.0 → 1.16.1, `Memory.md` table
  (frozen at Phase 16), Future list (shipped Phase 19
  items removed).
- Two honest repairs inside the round: a wiring test
  asserted no `state = cloneDefaults()` anywhere, but
  `load()`'s catch legitimately falls back that way —
  test corrected; a navigation test pinned the
  compact+wide bug (300px guide with hidden titles) —
  updated to assert compact wins.
- Verification: `npm test` **264/264 pass** (220 baseline
  + 44 new), `npm run lint` clean, `npm run format`
  clean, manifest valid, `npm run package` builds a clean
  `oneyt-1.16.1.zip` (runtime files only).
- **Not verified here (needs Chrome on Shanto's PC):**
  the S1–S6 suspicions in `docs/CODE_CHECK.md` and all
  browser checklists (Phases 1–6, 8–12, 14–24). The
  round is code-complete, not browser-verified.
- **Merged to `main` 2026-11-10** (merge `860f8ae`, per the standing rule: feature complete → merge to main). Verified on `main` after the merge: `npm test` 264/264 pass, lint + format clean, manifest valid, `npm run package` builds a clean `oneyt-1.16.1.zip`. Follow-up docs commit records the merge in Phases.md + Memory.md.

<!-- Add new entries above this line, newest first. Format:
### YYYY-MM-DD — short title
- What was done / decided / verified.
- What is next / blocked.
-->
