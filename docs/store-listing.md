# OneYT — Chrome Web Store Listing (Phase 7)

Copy-paste source for the store listing. Every claim below is
a shipped feature (v1.0.0); nothing is invented, no statistics
are claimed, no feature is listed that the extension does not
have. If a feature changes, update this file first, then the
listing.

## Title (max 75 chars)

OneYT — All-in-One YouTube Customizer

## Short description (max 132 chars — 126 used)

Make YouTube yours: custom player, sidebar, themes, playback and focus mode. Private by design — settings stay on your device.

## Detailed description (max 16,000 chars)

OneYT is an all-in-one customizer for YouTube. It lets you
shape the player, the layout, the sidebar, the look and the
playback behaviour — and it keeps every setting on your own
device. No account, no server, no tracking.

**Player, your way**
- Set the player width, alignment and position — including a
  fixed or absolute player that stays visible while you scroll
  the recommendations
- Mini-player size and position, corner radius, borders and
  shadows
- Works with fullscreen and theater mode, and restores itself
  exactly when you leave them

**A sidebar that keeps up**
- The recommendations sidebar scrolls independently of the
  video, with its own width, scrollbar and scroll sensitivity
- Compact density, card size and metadata controls

**Layout**
- Hide comments, Shorts shelves and Shorts on Home and Watch
- Home grid columns, card spacing and thumbnail size

**Appearance**
- Six themes (Default, Dark, Light, Midnight, AMOLED, Minimal)
  plus a custom theme with your own colours
- Typography for titles, descriptions and comments
- Corner radius, spacing and your own custom CSS (validated;
  remote resources are blocked)

**Playback & productivity**
- Default speed and volume, remembered across videos
- Speed presets, quality preference, autoplay and captions
  controls, caption font size
- Focus Mode: hide the recommendations, chat, comments and
  navigation with one toggle — and get everything back
  exactly as it was when you turn it off
- Keyboard shortcuts (Shift+ by default, fully rebindable)
- Guide navigation controls

**Settings dashboard**
- Every setting in one searchable dashboard, with live
  preview on open YouTube tabs — no reload needed
- Import and export your settings as JSON, with a diff
  preview before applying
- Optional Chrome sync (opt-in): your settings follow you
  across browsers signed into the same account. Custom CSS
  and remembered speed/volume never sync — they stay on
  each device.

**Privacy**
OneYT stores settings locally in your browser. It makes no
network requests, collects no data, shows no ads and has no
backend. The only permission beyond storage is activeTab,
used solely so the popup can show which YouTube page you
are on. See PRIVACY.md for the full policy.

**How to use**
1. Install OneYT and open any YouTube page.
2. Click the OneYT icon for quick toggles, or open the full
   dashboard for every setting.
3. Changes apply instantly — no reload, no restart.

OneYT is an independent project and is not affiliated with,
endorsed by, or connected to YouTube or Google.

## Category

Productivity

## Language

English (en)

## Single purpose (for store review)

Customise the YouTube interface — player, layout, sidebar,
themes, playback and focus — with settings stored locally on
the user's device.

## Permissions justification (for store review)

- `storage` — save the user's settings (local by default;
  `chrome.storage.sync` only when the user opts into sync).
- `activeTab` — the popup reads the active tab's URL only,
  to show which YouTube page the user is on.
- Host `https://www.youtube.com/*` — the extension runs on
  YouTube pages only, nowhere else.

## Assets

| Asset | File | Status |
| --- | --- | --- |
| Icon 128 | `assets/icons/icon128.png` | ✅ final |
| Small promo tile 440×280 | `assets/promo/small-tile.png` | ✅ final |
| Large promo tile 920×680 | `assets/promo/large-tile.png` | ✅ final |
| Marquee 1400×560 | `assets/promo/marquee.png` | ✅ final |
| Screenshot 1 — Watch | `assets/screenshots/1-watch.png` | ⬜ real screenshot, Shanto's PC |
| Screenshot 2 — Home | `assets/screenshots/2-home.png` | ⬜ real screenshot, Shanto's PC |
| Screenshot 3 — Dashboard | `assets/screenshots/3-dashboard.png` | ⬜ real screenshot, Shanto's PC |
| Screenshot 4 — Focus Mode | `assets/screenshots/4-focus.png` | ⬜ real screenshot, Shanto's PC |
| Screenshot 5 — Themes | `assets/screenshots/5-themes.png` | ⬜ real screenshot, Shanto's PC |
