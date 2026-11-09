# OneYT — Screenshot Shot List (Phase 7, task 7.3)

**Status: ⬜ NOT DONE — needs a real browser on Shanto's PC.**

These screenshots must be **real captures** of the extension
running on YouTube. No mockups, no Figma recreations, no
edited UI presented as real. If a shot cannot be captured
cleanly, skip it and ship with fewer screenshots (minimum 1)
rather than faking one.

## Setup (do once, before shooting)

1. Load the `feature/Release` branch unpacked in Chrome.
2. Set the browser window to exactly **1280×800** (the store
   size; 640×400 is the alternative). Use a clean profile:
   no other extensions visible, bookmarks bar hidden.
3. In the dashboard, reset all settings first, then apply
   only what each shot needs (listed below).
4. Use a neutral video for the watch shots — something
   uncontroversial with a clear title (e.g. a popular music
   video or a tech talk). Avoid videos with personal or
   sensitive content in the recommendations.

## The five shots

### 1 — Watch page, stationary player (`assets/screenshots/1-watch.png`)

- Page: a watch page, scrolled down ~one screen so the
  recommendations are visible.
- Settings: player position **Fixed**, custom width 900.
- Must show: the video still visible at the top while the
  page is scrolled, recommendations below it. This is the
  flagship feature — make it obvious.
- Caption: "The player stays put while you scroll"

### 2 — Home page, custom theme (`assets/screenshots/2-home.png`)

- Page: YouTube Home.
- Settings: theme **Midnight**, home columns 4.
- Must show: the dark theme applied across the home grid.
- Caption: "Themes that cover the whole page"

### 3 — Settings dashboard (`assets/screenshots/3-dashboard.png`)

- Page: the OneYT dashboard (popup → "Open Full Dashboard").
- Settings: any section open (Appearance shows the most).
- Must show: the section nav on the left and real controls
  with values — not an empty state.
- Caption: "Every setting in one searchable dashboard"

### 4 — Focus Mode (`assets/screenshots/4-focus.png`)

- Page: a watch page with Focus Mode **on**.
- Must show: the video with recommendations, chat and
  comments hidden — a clean, distraction-free watch page.
- Caption: "Focus Mode: just the video"

### 5 — Playback + shortcuts (`assets/screenshots/5-playback.png`)

- Page: a watch page with the popup open (or the Playback
  section of the dashboard).
- Settings: default speed 1.5, a couple of speed presets.
- Must show: the quick toggles / playback controls.
- Caption: "Playback your way, one keypress away"

## After capturing

1. Check each PNG is exactly 1280×800 (or 640×400).
2. Check no personal data is visible (account name, history,
   recommendations that identify you). Use a fresh profile
   if in doubt.
3. Save into `assets/screenshots/` with the names above.
4. Tick the rows in `docs/store-listing.md` (Assets table)
   and mark this doc done in `Memory.md`.

## What NOT to do

- Do not present a mockup as a screenshot.
- Do not edit the UI in an image editor (no added arrows,
  highlights or text overlays — the store shows the raw
  image).
- Do not use another extension's screenshots or YouTube's
  own marketing images.
