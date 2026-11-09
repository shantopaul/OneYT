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
