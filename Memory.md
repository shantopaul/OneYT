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
| **Phase** | Phase 0 — Planning ✅ done, pushed · **Phase 1 — Foundation ⬜ not started** |
| **Version** | Planning v1.0 (no code, no release) |
| **Repo** | `github.com/shantopaul/OneYT` (private) — `main` @ `5e608e1`, verified on remote 2026-11-09 |
| **Code written** | None. Repo contains planning docs only (7 files, 1,995 lines). |
| **Currently working on** | — (nothing — waiting for user to approve Phase 1 start) |
| **Blocked on** | Phase 1 start decision (D-02 below) |
| **Last verified** | 2026-11-09 — remote HEAD `5e608e1` confirmed via `git ls-remote` + GitHub API |

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
| 2026-11-09 | Dark-first UI; no gradients / glassmorphism / fake stats | `Design.md` §2.6 |

## Decisions Needed (from user)

| # | Question | Options / recommendation | Status |
|---|----------|--------------------------|--------|
| D-01 | Create GitHub repo `shantopaul/OneYT` now, or later at Phase 1? | Recommend: create at Phase 1 start, `main` = stable | ✅ Done 2026-11-09 — user created the (private) repo; planning docs pushed as `5e608e1` on `main` |
| D-02 | Start Phase 1 (Foundation) coding now? | Recommend: yes, after D-01 | ⬜ Awaiting user |
| D-03 | AD-06: ES-module loading strategy for content scripts | Decide in Phase 1 (single entry vs tiny bundler) | ⬜ Open — Phase 1 |
| D-04 | AD-07: Focus Mode scope — global or per-tab? | Decide in Phase 4 | ⬜ Open — Phase 4 |
| D-05 | AD-08: Which keys sync (opt-in)? | Decide in Phase 5 | ⬜ Open — Phase 5 |
| D-06 | Default sidebar width / player max-width on ultrawide? | Propose in Phase 2 (402px / 1280px defaults in schema) | ⬜ Open — Phase 2 |

---

## Current Phase Checklist

**Phase 1 — Foundation** (copy from `Phases.md`; tick only after
verifying in the browser):

- [ ] Extension loads unpacked in Chrome with zero errors
- [ ] Activates on youtube.com only
- [ ] Settings load, save, persist across restart
- [ ] Old-schema settings migrate without overwriting user values
- [ ] Page detection correct (home / watch / search / subs / channel / playlist)
- [ ] SPA navigation re-detects (watch → watch, home → watch, back/forward)
- [ ] Master toggle disables everything and restores YouTube exactly
- [ ] No console errors on Home / Watch / Search
- [ ] No polling, no network requests

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

<!-- Add new entries above this line, newest first. Format:
### YYYY-MM-DD — short title
- What was done / decided / verified.
- What is next / blocked.
-->
