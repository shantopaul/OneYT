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

---

# Phase 3 Manual Checklist (browser) — Appearance

Run on Home + a watch page, after loading the `feature/appearance`
branch unpacked. Change settings via the extension's storage
(`chrome.storage.local`, key `oneyt.settings.v1`) until the
Phase 5 dashboard exists. Tick only after verifying in the browser.

Themes (set `appearance.theme`):
- [ ] `dark` — Home, Watch, Search, Channel all dark; masthead,
      guide, grid background, menus, chips and buttons follow
- [ ] `light` — everything light, readable, no dark leftovers
- [ ] `midnight` / `amoled` / `minimal` — each applies cleanly
- [ ] Switching presets is instant (no reload), no leftover
      colours from the previous preset
- [ ] `default` — YouTube's own theme returns exactly

Custom colours (set `appearance.colors`, e.g. `{ accent: "#00ff00" }`):
- [ ] Accent override changes buttons/links without breaking
      contrast of native controls
- [ ] Low-contrast pair (e.g. grey text on grey bg) — extension
      still works, warning only (check console for the warning)

Radius / spacing:
- [ ] `appearance.borderRadius: 0` — thumbnails sharp; `12` —
      rounded again
- [ ] `appearance.spacing` — filter-chip gaps change

Custom CSS (set `appearance.customCSS` + `customCSSEnabled: true`):
- [ ] Valid CSS applies instantly; toggle off — page returns,
      theme untouched
- [ ] Invalid CSS (unbalanced braces / HTML tags) — rejected,
      page never breaks

Typography (set `appearance.typography`):
- [ ] `fontFamily: "Georgia"` — titles/descriptions/comments
      change font; player and captions unchanged
- [ ] `fontSize: 120` — titles/descriptions/comments grow;
      layout does not break (no overlap, no clipped text)
- [ ] `fontWeight` / `lineHeight` — same, no layout breakage
- [ ] All back to 0 / "" — YouTube defaults return

Homepage layout (set `layout.*` on the Home page):
- [ ] `homeColumns: 4` — grid shows 4 columns; `0` — default
- [ ] `cardSpacing: 12` — gap between cards changes
- [ ] `thumbnailSize: 320` — thumbnails shrink, centred
- [ ] `hideShortsHome: true` — Shorts shelf disappears on Home
- [ ] `hideShortsWatch: true` — Shorts shelf disappears on Watch
- [ ] Watch → Home navigation — home rules apply, watch rules
      do not leak onto the homepage

Disable:
- [ ] Disable the appearance module — YouTube's own theme
      returns exactly (all variables gone)
- [ ] Disable the typography module — fonts return exactly
- [ ] Disable the layout module — grid/Shorts return exactly

Selector / variable sanity (live YouTube DOM):
- [ ] If a theme surface stays unthemed, note which one here —
      it may be a renamed `--yt-spec-*` variable:
      - _notes:_
- [ ] If `homeColumns`/`cardSpacing` have no effect, note it —
      `--ytd-rich-grid-items-per-row` / `--ytd-rich-grid-item-margin`
      may have been renamed:
      - _notes:_

Notes / failures:
- _…_

---

# Phase 4 Manual Checklist (browser) — Playback & Productivity

Run on a watch page + Home, after loading the `feature/Productivity`
branch unpacked. Change settings via the extension's storage
(`chrome.storage.local`, key `oneyt.settings.v1`) until the Phase 5
dashboard exists. Tick only after verifying in the browser.

Playback (set `playback.*`):
- [ ] `defaultSpeed: 1.5` — a video starts at 1.5x
- [ ] Change speed by hand in YouTube's settings to 2x, open the
      next video — it starts at 2x (remembered); restart Chrome —
      still 2x
- [ ] `rememberSpeed: false` — hand-set speed does NOT carry over
- [ ] `defaultVolume: 50` — a video starts at half volume;
      hand-set volume is remembered the same way
- [ ] `defaultQuality: "720p"` — video plays at 720p when
      available; on a video with no 720p, YouTube's own choice
      stays (no error, no stuck player)
- [ ] `autoplay: false` — the autoplay toggle turns off;
      `true` — turns on; `null` — untouched
- [ ] `captions: true` — captions turn on; `false` — off
- [ ] `captionFontSize: 130` — caption text grows; `0` — default
- [ ] Speed presets: add/remove in settings, invalid values
      (e.g. 8x, "x") rejected — check console for the message

Focus Mode (set `productivity.focusMode: true`):
- [ ] Comments, chat, recommendations, Shorts, buttons and the
      description disappear; the guide disappears
- [ ] Search box and account menu STAY visible
- [ ] Toggle off — every hidden element returns exactly as it was
- [ ] Shift+F (keyboard) toggles Focus for the current tab only;
      reload the page — Focus follows the global setting again
- [ ] Focus on Home — the grid + Shorts hide; toggle off — back

Recommendations (set `recommendations.*` on a watch page):
- [ ] `hideSidebar: true` — sidebar disappears, player area widens
- [ ] `density: "compact"` — sidebar items tighten up
- [ ] `cardSize: 200` — sidebar thumbnails resize
- [ ] `showMetadata: false` — titles/views under sidebar videos hide

Mini-player (set `player.miniPlayer.*`):
- [ ] Open the mini-player (YouTube's mini-player button) —
      it appears at the configured size/position/radius/shadow
- [ ] With nothing configured — native mini-player behaves
      exactly as without the extension (open/close/drag)
- [ ] Drag the configured mini-player — dragging still works
- [ ] Navigate Home → Watch with the mini-player open — it stays
      open and keeps its styling

Keyboard (defaults, all Shift+):
- [ ] Shift+F toggles Focus; Shift+S toggles the sidebar;
      Shift+P cycles player position; Shift+> / Shift+< step
      speed; Shift+R resets speed; Shift+T toggles theater
- [ ] Type in the search box — no shortcut fires while typing
- [ ] Bind two actions to the same key in settings — only the
      first fires, console shows a duplicate warning
- [ ] Bind a plain `f` — console shows a YouTube-native conflict
      warning

Navigation (set `navigation.*`):
- [ ] `hideHome: true` — Home disappears from the guide;
      `hideShorts` / `hideSubscriptions` / `hideLibrary` /
      `hideHistory` — same for each entry
- [ ] Account menu and accessibility controls are NEVER hidden
- [ ] `compact: true` — mini guide (icons only)
- [ ] `guideWidth: 300` — guide widens; `0` — default

Notes / failures:
- _…_

---

# Phase 5 Manual Checklist (browser) — Settings Dashboard

Load the `feature/Settings` branch unpacked. The dashboard
opens from the popup ("Open Full Dashboard") or from
`chrome://extensions` → OneYT → Details → Extension options.
Tick only after verifying in the browser.

Dashboard (open it):
- [ ] All 9 sections appear in the left nav (General, Player,
      Sidebar, Layout, Appearance, Playback, Productivity,
      Keyboard, Advanced); clicking one shows its controls
- [ ] Every control shows its name, description, current value
      and default value; the Reset button on a row restores
      that setting's default
- [ ] "Reset this section" restores every control in that
      section; "Reset all settings" (Advanced) restores
      everything (after confirm)
- [ ] Change a setting (e.g. Player width 900) — an open
      YouTube tab applies it immediately, without a reload
- [ ] Change the same setting from the popup while the
      dashboard is open — the dashboard value updates
      without stealing focus from a field you are typing in

Search:
- [ ] Type "speed" in the top search — matching settings
      appear; click one — it jumps to the section and
      highlights the control
- [ ] Type "zzzqqq" — no results shown

Sections (spot-check):
- [ ] General: turn a module off (e.g. Player) — only that
      module stops working; the others keep working
- [ ] Appearance: pick the Midnight theme — YouTube turns
      dark; set a custom accent colour — it applies;
      clear it — the preset colour returns
- [ ] Appearance: type invalid CSS (`@import url(...)`) in
      Custom CSS — it is rejected with an error and the old
      value stays; valid CSS applies when enabled
- [ ] Playback: add a speed preset (1.75), remove one —
      the list updates; try 8x — rejected
- [ ] Keyboard: click a shortcut field and press Shift+G —
      it captures; press the same combo for another action —
      a duplicate warning appears; bind a plain `f` —
      a YouTube-native conflict warning appears

Import / Export (Advanced):
- [ ] Export — a `oneyt-settings.json` file downloads
- [ ] Change a setting, then import the exported file —
      the preview lists exactly the changed settings
      (old → new); Apply restores them
- [ ] Paste invalid JSON — rejected with an error, nothing
      changes; paste JSON with a wrong type
      (e.g. `"enabled": "yes"`) — rejected with a field error

Popup:
- [ ] On a watch page it says "Watch page"; on Home "Home";
      on a non-YouTube tab "Not on YouTube"
- [ ] Focus toggle works; Scroll toggle works; Player toggle
      works; theme selector changes the theme
- [ ] Turn the master switch off — the quick controls grey
      out; turn it back on — they work again
- [ ] "Open Full Dashboard" opens the dashboard

Notes / failures:
- _…_

---

# Phase 6 Manual Checklist (browser) — Optimisation & Testing

Load the `feature/Optimisation` branch unpacked (version
0.9.0, release candidate). These are the items no Node test
can check — they need a real browser. Tick only after
verifying in the browser.

Cross-browser (6.2) — run the full checklist on each:
- [ ] Chrome: full checklist (Phases 1–5) passes, no console errors
- [ ] Edge: full checklist passes, no console errors
- [ ] Brave: full checklist passes, no console errors

Viewports (6.3):
- [ ] 1024 px: sidebar + player usable, no overlap
- [ ] 1280 px: same
- [ ] 1440 px: same
- [ ] 1920 px: same
- [ ] Ultrawide (2560+): same; player max-width respected

SPA navigation (6.4) — live confirmation of the Node test:
- [ ] 20 navigations (watch → home → watch → search …) +
      back/forward: no console errors, no duplicate style
      tags in DevTools, no visual glitches
- [ ] No duplicate listeners: toggle a module off/on 10× —
      it still works exactly once per action

Fullscreen + theater (6.5):
- [ ] Fullscreen a video: all OneYT player classes drop,
      video fills the screen; exit: everything restores
- [ ] Theater mode: player sizing/position suspends, restores
      on exit

Sync (AD-08, Phase 6 feature) — needs two Chrome profiles
signed into the same Google account:
- [ ] Turn sync on in Advanced (dashboard) on browser A —
      change the theme; browser B (same account, sync on)
      picks it up within a minute
- [ ] Set a Custom CSS on browser A — browser B does NOT
      get it (local-only)
- [ ] Change remembered speed on browser A — browser B
      does NOT get it (per-device)
- [ ] Turn sync off on browser A — browser B keeps its
      current settings (no wipe)
- [ ] Fresh profile, sync on, no local settings — settings
      seed from sync on first load

Selectors (6.7) — live YouTube DOM:
- [ ] Every Phase 2 checklist selector still matches
      (`#primary #player`, `#movie_player` fallback, guide
      `:has()` selectors, Shorts shelf, mini-player element)

Memory (6.1) — live confirmation:
- [ ] Chrome task manager: memory does not grow after
      toggling modules on/off 10× and 20 SPA navigations

Accessibility (6.9) — live confirmation:
- [ ] Tab through the whole dashboard: every control
      reachable, focus ring visible on each, no traps
- [ ] Tab through the popup: same
- [ ] Screen reader (or keyboard-only) walkthrough of the
      dashboard: labels read correctly
- [ ] Shortcut capture: press Tab while capturing — focus
      moves to the next control, nothing binds

Phase 10 — Hide endscreen cards (browser):
- [ ] Open a video, turn on Player → Hide endscreen cards —
      `<html>` gains `oneyt-player-hide-endscreen`
- [ ] Seek to the last seconds / let the video end — no
      endscreen video suggestions appear (`.ytp-endscreen-content`
      hidden); the video itself and the controls are untouched
- [ ] Same in theater mode — endscreen stays hidden
- [ ] Toggle it off — the endscreen cards return at the next
      video end (class removed, nothing else changed)

Notes / failures:
- _…_

---

## Phase 11 — Hide Counts (v1.4) — live on a real watch page

Selectors under test: like `#segmented-like-button
.yt-spec-button-shape-next__button-text-content`, views
`ytd-video-primary-info-renderer #info-text`, subscribers
`ytd-video-owner-renderer #subscriber-count`. The views
selector is the risky one — YouTube moved the views line
into the description box in the 2023 layout, so if the
views number is still visible with the toggle on, note the
real element here and fix the selector.

- [ ] Open a video — Like button shows a number, the "X
      views" line is visible, the channel shows "X
      subscribers"
- [ ] Turn on "Hide like count" — the number next to Like
      disappears, the Like button still works (click it,
      the thumb fills)
- [ ] Turn on "Hide view count" — the "X views" line
      disappears (note: if it does not, record the real
      views element from DevTools → Elements)
- [ ] Turn on "Hide subscriber count" — "X subscribers"
      disappears, the Subscribe button still works
- [ ] Turn all three off again — every number returns
      exactly (class-only hiding)
- [ ] Same three checks in theater mode — the toggles
      still hide the numbers
- [ ] Fullscreen — the numbers return (player classes are
      cleared in fullscreen, like the other player classes)

Notes / failures:
- _…_

---

## Phase 12 — Hide Topic Chips Bar (v1.5) — live on a real home page

Selector under test: `ytd-feed-filter-chip-bar-renderer`.
Known risk: the frosted-glass header (`#frosted-glass`,
class `with-chipbar`) may leave an empty strip where the
bar was — if it does, note it here; the fix is to collapse
that container too.

- [ ] Open the home page — the topic chips row ("All",
      "Music", "Gaming", …) is visible at the top
- [ ] Turn on "Hide topic chips bar on Home" — the whole
      row disappears and the videos move up (no empty gap
      left behind)
- [ ] Turn it off again — the chips row returns exactly
      (class-only hiding)
- [ ] Open a video — the watch-page sidebar chips are
      still there (home-only scope)
- [ ] Search something — the search chips are still there

Notes / failures:
- _…_

---

## Phase 14 — Default Theater Mode (v1.6) — live on a real watch page

Honest limits: the player may flash at default size
briefly before the click lands (the click happens after
the page loads, not before it). The proof is a real watch
page on Shanto's PC — slow loads (button timing) and
watch → watch SPA navigation are the cases the unit tests
cannot settle.

- [ ] Turn on "Default theater mode" and open a video —
      it opens in theater mode by itself (wide player)
- [ ] Does the player flash at default size first? Note
      how long — if it is obvious, the click may need to
      land earlier
- [ ] Exit theater manually (theater button or "t") — it
      stays exited, it does NOT snap back to theater
      (the trap: the theater observer re-applies on exit)
- [ ] Click a recommended video — the next video opens
      in theater mode again by itself
- [ ] Turn the toggle on mid-video — theater starts
      immediately, no reload
- [ ] Turn the toggle off mid-video — the video stays in
      theater (off never exits theater)
- [ ] Reload with a cold cache / slow connection — the
      theater click still lands once the button appears
- [ ] Fullscreen from theater, then exit fullscreen —
      back in theater, not the default size


Notes / failures:
- _…_
