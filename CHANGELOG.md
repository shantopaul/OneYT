# OneYT — Changelog

All notable changes, newest first. Version numbers follow the
phases: 0.1.0 (Phases 1–5), 0.9.0 (Phase 6 release candidate),
1.0.0 (Phase 7 public release), 1.1.0 (Phase 8 Block Shorts),
1.2.0 (Phase 9 dashboard theme + search),
1.3.0 (Phase 10 hide endscreen cards), 1.4.0 (Phase 11 hide counts),
1.5.0 (Phase 12 hide topic chips bar), 1.6.0 (Phase 14
default theater), 1.7.0 (Phase 15 hide live / mixes /
news shelves), 1.8.0 (Phase 16 presets / profiles),
1.9.0 (Phase 17 onboarding),
1.10.0 (Phase 18 selector health check),
1.11.0 (Phase 19 popup theme + channel Shorts tab).

## 1.11.0 — 2026-11-09 (Popup Theme + Channel-Page Shorts Tab, Phase 19)

- The popup now follows the dashboard theme (System /
  Dark / Light) — same setting, live when it changes.
  No new setting.
- Block Shorts also hides the Shorts tab on channel
  pages. No new setting — the Block Shorts toggle
  covers it.
- Fixed: the health summary could report "all OK"
  for a record that only checked sometimes-selectors
  (nothing was actually verified); it now reports
  "unknown" in that case.

## 1.10.0 — 2026-11-09 (Selector Health Check, Phase 18)

- The extension now checks its own YouTube selectors
  against the live page (one delayed check per page
  type, re-checked on every navigation) and the
  dashboard's new Health section shows, per feature,
  whether it is working, not working, or not seen on
  this visit — so a YouTube DOM change stops failing
  silently. Deliberately no auto-disable: a missing
  selector at check time does not prove the feature is
  broken. No new permission, no new host.

## 1.9.0 — 2026-11-09 (Onboarding, Phase 17)

- A 3-step welcome setup on first install: pick a preset
  (Stock / Focus / Clean / Cinema, or keep YouTube as it
  is), pick the dashboard theme, done. Choices apply
  immediately; Skip and Finish both mark the setup done
  so the page never opens on its own again. Re-openable
  any time from the popup ("Welcome setup"). No new
  permission, no new host.

## 1.8.0 — 2026-11-09 (Presets / Profiles, Phase 16)

- **Presets / Profiles** (`shared/profiles.js`, PL-16):
  four built-in presets — Stock YouTube, Focus, Clean,
  Cinema — applied in one click from a new dashboard
  Profiles section or from the popup picker. A preset
  changes only the settings it names; everything else
  you set stays. Named custom profiles (up to 10) save
  the current settings as a snapshot and restore them
  exactly when applied; rename and delete included.
  Profiles stay on this device and are never synced.
  See `tests/manual-checklist.md` Phase 16 for the live
  checks (dashboard section, popup picker, live apply).

## 1.7.0 — 2026-11-09 (Hide Live / Mixes / News Shelves, Phase 15)

- **Hide Live / Mixes / News shelves**
  (`layout.hideLiveShelf`, `layout.hideMixesShelf`,
  `layout.hideNewsShelf`, all default off): three toggles
  in the Layout section. They hide the "Live now" shelf,
  Mixes, and the "Breaking news" shelf from the home feed
  — the same treatment the Shorts shelves already get.
  Shelves are matched by their title attribute; Mixes are
  matched two ways (a Mixes shelf by title, plus the
  individual mix cards by their radio link
  `start_radio=1`, since mixes on home are grid items,
  not a shelf). Home page only — the same shelves on
  other pages stay. See `tests/manual-checklist.md`
  Phase 15 for the live checks (title attributes are
  English UI text; a hidden shelf may leave a gap where
  its section wrapper stays).

## 1.6.0 — 2026-11-09 (Default Theater Mode, Phase 14)

- **Default theater mode** (`player.defaultTheater`,
  default off): one toggle in the Player section. Every
  video opens in theater mode automatically — the player
  module clicks the existing theater button
  (`#movie_player .ytp-size-button`) once per video,
  tracked by the video URL. Exiting theater manually is
  respected (no re-click on that video); turning the
  setting on mid-video enters theater immediately;
  turning it off never exits theater. No new CSS, no new
  selector, no new permission. See
  `tests/manual-checklist.md` Phase 14 for the live
  checks (flash, slow loads, watch → watch navigation).

## 1.5.0 — 2026-11-09 (Hide Topic Chips Bar, Phase 12)

- **Hide topic chips bar** (`layout.hideTopicChips`,
  default off): one toggle in the Layout section. Hides the
  topic filter chips row ("All", "Music", "Gaming", …) at
  the top of the home feed, so the home page opens straight
  into videos. Home page only — the watch-page sidebar
  chips and the search chips are untouched. Class-only
  hiding — the bar returns the moment the toggle goes off
  or the user leaves home. Selector:
  `ytd-feed-filter-chip-bar-renderer` (see
  `tests/manual-checklist.md` Phase 12 for the live check
  and the frosted-glass gap risk).

## 1.4.0 — 2026-11-09 (Hide Counts, Phase 11)

- **Hide counts** (`player.hideLikeCount` /
  `player.hideViewCount` / `player.hideSubscriberCount`,
  all default off): three separate toggles in the Player
  section. The like number, the "X views" line and the "X
  subscribers" next to the channel name are hidden; the
  Like button stays clickable and the Subscribe button
  stays. Class-only hiding — turning a toggle off restores
  the number exactly; the classes are cleared off watch
  pages and in fullscreen like every other player class.
  Selectors: like `#segmented-like-button
  .yt-spec-button-shape-next__button-text-content`, views
  `ytd-video-primary-info-renderer #info-text`, subscribers
  `ytd-video-owner-renderer #subscriber-count`. The views
  selector needs a live check on a real watch page —
  YouTube moved the views line into the description box in
  the 2023 layout (see `tests/manual-checklist.md`
  Phase 11).

## 1.3.0 — 2026-11-09 (Hide Endscreen Cards, Phase 10)

- **Hide endscreen cards** (`player.hideEndscreen`, off by
  default): one toggle in the Player section. Hides the video
  suggestions shown at the end of a video, so it ends cleanly
  instead of offering the next watch. Works in theater mode
  too; the class is cleared in fullscreen and off watch pages
  like every other player class.
- Live verification of the endscreen selector on a real video
  end is still open (browser check).

## 1.2.0 — 2026-11-09 (Dashboard Theme + Search, Phase 9)

- **Dashboard theme** (`ui.dashboardTheme`, default System):
  the settings dashboard now has its own dark / light mode.
  System follows the OS, Dark and Light force one; the choice
  applies instantly, follows OS changes while on System, and
  syncs across browsers like any other setting.
- **Light-mode contrast fixed** (measured, not eyeballed):
  warning, success, danger and accent text were 2.04 / 2.16 /
  3.57 / 3.76 on light surfaces — below WCAG AA. Now #b45309
  (4.77), #15803d (4.76), #b91c1c (6.15), accent #e6002e
  (4.53). Native controls follow the scheme via color-scheme.
- **Search bar, position:** the results dropdown is anchored
  to the input inside a `.search-wrap` (was magic offsets from
  the topbar that detached on narrow windows); the topbar wraps
  and the search takes its own row under 640px.
- **Search bar, functionality:** ArrowDown/Up navigation
  (wraps), Enter to jump, Escape to close/clear, match
  highlighting, ranked results (label > key/section >
  description), no-results feedback, result count past 8,
  clear button, and ARIA combobox semantics.
- Browser verification of the theme and the search on a real
  dashboard page is still open (browser check).

## 1.1.0 — 2026-11-09 (Block Shorts, Phase 8)

- **Block Shorts everywhere** (`layout.blockShorts`, off by
  default): one master toggle in the Layout section. Hides
  Shorts shelves on every page (home/watch + search/
  subscriptions), removes Shorts from the guide and
  mini-guide, hides Shorts video cards in grids and search
  results, and opens `/shorts/VIDEOID` links as normal
  `/watch?v=VIDEOID` videos instead.
- The three older per-page Shorts toggles (Hide Shorts on
  Home / Watch, Hide Shorts from guide) are unchanged —
  Block Shorts adds the full block on top of them.
- Live verification of the new selectors and the redirect on
  a real YouTube page is still open (browser check).

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
