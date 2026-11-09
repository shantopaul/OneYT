# OneYT — Release Checklist (Phase 7, PRD §12 Definition of Done)

Date: 2026-11-09 · v1.0.0 · Branch: `feature/Release`

Two columns, kept separate on purpose: **Code** is what is
verified here in Node; **Browser** is what only a real browser
on Shanto's PC can prove. A box is fully done only when both
columns are ✅. Nothing below is marked done on the strength
of code alone.

## PRD §12 — Definition of Done (v1.0)

| # | Item | Code | Browser |
| --- | --- | --- | --- |
| 1 | Manifest V3 complete; YouTube-only activation | ✅ manifest valid, host `youtube.com` only, MV3 | ⬜ load unpacked, no errors (Phase 1 checklist) |
| 2 | Independent sidebar scrolling works | ✅ module + tests | ⬜ Phase 2 checklist |
| 3 | Player positioning works | ✅ module + tests | ⬜ Phase 2 checklist |
| 4 | Layout customization works | ✅ modules + tests | ⬜ Phase 3 checklist |
| 5 | Appearance customization works | ✅ modules + tests | ⬜ Phase 3 checklist |
| 6 | Playback preferences work | ✅ module + tests | ⬜ Phase 4 checklist |
| 7 | Focus Mode works (with exact restore) | ✅ module + tests | ⬜ Phase 4 checklist |
| 8 | Keyboard shortcuts work | ✅ module + tests | ⬜ Phase 4 checklist |
| 9 | Popup + dashboard complete | ✅ 97 controls, 121 tests | ⬜ Phase 5 checklist |
| 10 | Local persistence works | ✅ load/save round-trip tests | ✅ same storage on reload (Phase 1 checklist) |
| 11 | Import/Export works | ✅ round-trip + rejection tests | ⬜ file picker (Phase 5 checklist) |
| 12 | SPA navigation stable | ✅ 20-navigation stress test | ⬜ live confirmation (Phase 6 checklist) |
| 13 | Responsive behaviour tested | — (cannot test in Node) | ⬜ viewports 6.3 |
| 14 | Fullscreen + theater tested | ✅ guards in code + tests | ⬜ live 6.5 |
| 15 | Privacy + permission review complete | ✅ `docs/SECURITY_REVIEW.md` | — (review is a code audit) |
| 16 | No critical bugs remain | ✅ bug bash: 0 critical/major open | ⬜ browser-only minors (v1.1 log) |

**Honest summary:** the code column is complete. The browser
column is open for items 2–9, 11–14 — the same open browser
checks carried since Phase 1. The release ships when Shanto
runs those checklists on his PC and they pass. If a checklist
item fails, it becomes a v1.0.1 fix, not a reason to mark the
box done.

## Release steps (after the PR is merged)

These run on `main` only — a tag must point at main, not at
a feature branch.

1. Shanto merges the release PR (`feature/Release` → `main`).
   PR #6 (`feature/Optimisation`) needs no separate merge —
   this branch is based on it, so its commits arrive with
   the release PR. Close PR #6 after.
2. Verify `main` HEAD, then:
   ```sh
   git tag -a v1.0.0 -m "OneYT 1.0.0 — public release"
   git push origin v1.0.0
   ```
3. GitHub release from tag `v1.0.0`:
   - Title: `OneYT 1.0.0`
   - Body: the 1.0.0 section of `CHANGELOG.md`
   - Attach `oneyt-1.0.0.zip` (built by `npm run package`
     from `main`)
4. Submit to the Chrome Web Store (`docs/SUBMISSION.md`).
5. When the listing is live: update the README store link,
   tick the Phase 7 checklist in `Phases.md`, mark v1.0.0
   shipped with the date in `Memory.md`.

## Sign-off

- [ ] Browser checklists (Phases 1–6) pass on Shanto's PC
- [ ] 5 real screenshots captured (`docs/SCREENSHOTS.md`)
- [ ] Privacy policy URL decided and publicly reachable
- [ ] Release PR merged to `main`
- [ ] Tag `v1.0.0` pushed + GitHub release published
- [ ] Store submission sent
- [ ] Listing live; README link updated
