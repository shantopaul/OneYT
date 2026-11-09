# OneYT — Changelog

All notable changes, newest first. Version numbers follow the
phases: 0.1.0 (Phases 1–5), 0.9.0 (Phase 6 release candidate),
1.0.0 (Phase 7 public release).

## 1.0.0 — 2026-11-09 (public release)

Public release. No new behaviour over 0.9.0 — this is the
release packaging:

- Final branding: original Y mark (replaces the Phase 1
  placeholder play button), icons 16/48/128 + 512 master
- Promo tiles 440×280 / 920×680 / 1400×560
- Store listing copy, privacy policy, final README
- `npm run package` builds the store submission zip
- Screenshots are real captures from the release build (see
  `docs/SCREENSHOTS.md`)

## 0.9.0 — 2026-11-09 (release candidate, Phase 6)

- **Sync (opt-in):** settings mirror to Chrome sync except
  Custom CSS and remembered speed/volume; first-run seeding
  from sync; sync-change merging; failure-safe (local is the
  source of truth)
- Performance: mini-player observer only runs when configured
- SPA stress test: 20 navigations, no duplicate listeners,
  style tags, classes or variables
- Migration fixtures: v0.1 / v0.4 / corrupt stored settings
- Selector audit: dead `sidebarSection` removed; every
  selector's usage enforced by tests
- Security: remote `url()` in custom CSS blocked; dead
  service-worker relay removed; import size enforced
- Accessibility: muted text now passes WCAG AA; visible
  focus rings; shortcut capture no longer swallows Tab
- Bug bash: Tab/Escape unbindable as shortcuts; imports
  clamp numbers to the dashboard controls' ranges; wheel
  sensitivity clamped to 0.5–3
- 11 fixes total, 7 minors deferred to v1.1 (all browser-only
  checks) — see `docs/BUG_BASH.md`

## 0.1.0 — 2026-11-09 (Phases 1–5)

- **Phase 1 — Foundation:** Manifest V3 shell, settings
  schema v1 with additive migration, centralised selectors,
  storage wrapper, content core (logger, event-bus,
  dom/settings/page-detector/module-manager, app), service
  worker, minimal popup, 38 tests
- **Phase 2 — Core Layout:** independent sidebar scroll,
  player sizing and positioning (default/sticky/fixed/
  absolute), layout part 1 (hide comments, watch spacing)
- **Phase 3 — Appearance:** six themes + custom colours,
  typography, layout part 2 (home columns, card spacing,
  thumbnail size, hide Shorts)
- **Phase 4 — Playback & Productivity:** default/remembered
  speed and volume, quality, autoplay/captions, caption font
  size, Focus Mode, recommendations, mini-player, keyboard
  shortcuts, navigation
- **Phase 5 — Settings Dashboard:** 9 sections, 96 controls,
  search with jump-to-control, live preview, import/export
  with diff preview, per-setting / per-section / global reset,
  final popup with quick toggles and page status
