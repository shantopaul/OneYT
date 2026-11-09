# OneYT — Phase 1 Manual Checklist (browser)

Run in Chrome (unpacked extension). Tick only after verifying
in the browser — a unit test passing does not tick these.

Setup:
- [ ] `npm install` clean, `npm test` green, `npm run lint` clean,
      `npm run format` clean
- [ ] Load `oneyt/` as an unpacked extension in Chrome
      (chrome://extensions → Developer mode → Load unpacked)
- [ ] No errors on the extension's Errors page

YouTube-only activation:
- [ ] Open youtube.com — content script runs, `<html>` gains
      class `oneyt-enabled`
- [ ] Open a non-YouTube site (e.g. example.com) — no OneYT
      class, no console errors from OneYT, no network requests

Settings persistence:
- [ ] Toggle the popup master switch OFF → `<html>` loses
      `oneyt-enabled` on open YouTube tabs, YouTube looks untouched
- [ ] Toggle it back ON → class returns
- [ ] Reload the browser — the toggle state persists

Page detection:
- [ ] Home (`/`) → app state page = `home`
- [ ] Watch (`/watch?v=…`) → `watch`
- [ ] Search (`/results?search_query=…`) → `search`
- [ ] Subscriptions (`/feed/subscriptions`) → `subscriptions`
- [ ] Channel (`/@…`) → `channel`
- [ ] Playlist (`/playlist?list=…`) → `playlist`

SPA navigation (no full reload):
- [ ] Home → click a video → watch page detected
- [ ] Watch → click another video → still detected, no duplicate
      listeners/style tags (check Elements + console)
- [ ] Back / forward → detection follows
- [ ] No console errors on Home / Watch / Search

Selector sanity (live YouTube DOM):
- [ ] `#movie_player`, `#primary`, `#secondary`,
      `ytd-watch-flexy` all exist on a watch page
- [ ] If any is missing/renamed, note it here and fix
      `shared/selectors.js` (do not fix it in a module):
      - _notes:_

Performance / privacy (DevTools):
- [ ] Network tab on YouTube: zero requests from OneYT
- [ ] No `setInterval` polling in the content script (code review)
- [ ] Service worker: no errors, restarts cleanly

Notes / failures:
- _…_

---

# Phase 2 Manual Checklist (browser) — Core Layout

Run on a watch page, after loading the `feature/core` branch
unpacked. Tick only after verifying in the browser.

Independent sidebar scrolling (flagship):
- [ ] Scroll the mouse wheel over the recommendations sidebar —
      only the sidebar scrolls, the player stays visible
- [ ] Video keeps playing while scrolling recommendations
- [ ] Sidebar scrollbar appears, width matches the setting
- [ ] Toggle `sidebar.independentScroll` off in storage (or via
      a future dashboard) — page scroll returns to normal

Player sizing / alignment:
- [ ] Set `player.customWidth` (e.g. 900) — player widens live,
      no reload; survives watch → watch SPA navigation
- [ ] Alignment left / center / right — player moves, no overlap
      with the sidebar
- [ ] Set `player.customWidth` back to 0 — YouTube default returns

Player position:
- [ ] `position: sticky` — player column stays visible on scroll
- [ ] `position: fixed` — player stays fixed; title/comments do
      NOT jump up underneath it
- [ ] `position: absolute` — same, no overlap with sidebar or
      title; no horizontal scrollbar
- [ ] `position: default` — YouTube's own layout returns exactly

Player appearance:
- [ ] Border radius / border / shadow / spacing apply and reset

Fullscreen / theater:
- [ ] Fullscreen — all OneYT player positioning disappears,
      native fullscreen controls work, exit restores settings
- [ ] Theater toggle on/off — sizing/position suspend in theater,
      appearance stays; no breakage toggling back

Responsive / disable:
- [ ] Widths 1280 / 1440 / 1920 — no overlap, no horizontal scrollbar
- [ ] Resize the window — layout updates, no thrash
- [ ] Disable the sidebar module — sidebar returns to YouTube
      default exactly; disable the player module — same
- [ ] Hide comments (`layout.hideComments`) — `#comments` hides;
      toggle off — returns

Selector sanity (live YouTube DOM):
- [ ] `#primary #player` exists on a watch page (player module's
      fixed/absolute anchor). If it is missing/renamed, note it
      here and fix `shared/selectors.js`:
      - _notes:_

Notes / failures:
- _…_
