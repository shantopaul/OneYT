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

---

## Phase 15 — Hide Live / Mixes / News Shelves (v1.7) — live on a real home page

Selectors under test:
`ytd-rich-shelf-renderer[title*='Live now' i]`,
`ytd-rich-shelf-renderer[title*='Mixes' i]`,
`ytd-rich-item-renderer:has(a[href*='start_radio=1'])`,
`ytd-rich-shelf-renderer[title*='News' i]`.
Known risks: the titles are English UI text — a
non-English YouTube UI may use different titles, and
YouTube may rename a shelf. If a row does not hide,
note its real title from DevTools (inspect the shelf
element's `title` attribute). A hidden shelf may also
leave an empty gap where its section wrapper
(`ytd-rich-section-renderer`) stays — note it if so.

- [ ] Open the home page — the "Live now" shelf, Mixes,
      and the "Breaking news" shelf are visible
- [ ] Turn on "Hide Live shelf on Home" — the "Live now"
      row disappears (and nothing else does), no empty
      gap left behind
- [ ] Turn on "Hide Mixes on Home" — the mix cards
      disappear from the grid (and a Mixes shelf too,
      if one renders)
- [ ] Turn on "Hide News shelf on Home" — the "Breaking
      news" row disappears
- [ ] Turn each toggle off again — its row returns
      exactly (class-only hiding)
- [ ] Open a video — the watch page is unaffected (the
      classes are home-only)

Notes / failures:
- _…_

---

## Phase 16 — Presets / Profiles (v1.8) — live in the dashboard and popup

No selectors under test: presets and profiles only write
settings, and the modules apply them through the existing
live-apply path. Known risks: the Profiles section is a
custom render block (like Advanced) — check it renders and
its buttons work; the popup picker lists profiles saved in
the dashboard — check the list updates after saving one.

- [ ] Open the dashboard — a Profiles section sits after General
- [ ] Built-in presets are listed: Stock YouTube, Focus, Clean, Cinema, each with a description
- [ ] Apply Focus — comments, recommendations and Shorts hide; the theme and speed you set before stay untouched
- [ ] Apply Clean — counts hide and the theme switches to Minimal
- [ ] Apply Cinema — the video opens in theater on a full-width player
- [ ] Apply Stock YouTube — the hiding is undone, YouTube looks stock again
- [ ] Save the current settings as a profile named "Test" — it appears in Your profiles (1/10)
- [ ] Change a setting, then Apply "Test" — the settings return to the saved snapshot exactly
- [ ] Rename "Test" to "Test 2" and delete it — the list updates, no errors
- [ ] Try saving a profile named "Focus" — it is rejected (built-in name)
- [ ] Open the popup — the Preset / Profile picker lists the 4 presets plus saved profiles
- [ ] Pick Cinema in the popup — the open YouTube tab applies it live, no reload
- [ ] Turn the extension off in the popup — the preset picker is disabled too

Notes / failures:
- _…_

## Phase 17 — Onboarding (v1.9) — live on a real Chrome install

- [ ] Fresh install (remove the extension, Load unpacked again): the welcome page opens once, on its own, in a new tab
- [ ] Step 1: pick Focus — the card highlights; Continue enables; click it and open YouTube — Focus Mode is on, recommendations and Shorts are hidden
- [ ] Step 1: pick "Keep YouTube as it is" — Continue enables; YouTube is unchanged
- [ ] Step 2: pick Light — the welcome page itself turns light immediately; pick Dark — it turns dark again
- [ ] Step 3: "Open full dashboard" opens the settings dashboard and closes the welcome tab
- [ ] Skip on step 1: the page closes and never opens again on its own (reload the extension — it must NOT reopen)
- [ ] Update the extension (reload, no reinstall): the welcome page does NOT open
- [ ] Popup → "Welcome setup": the page opens again, and since the setup is done it shows the last step ("You're set") instead of restarting
- [ ] The welcome page on a light OS with the theme set to System follows the OS; with Dark forced, it stays dark

Notes / failures:
- _…_

## Phase 18 — Selector Health Check (v1.10) — live on real YouTube pages

- [ ] Dashboard → Health, before opening YouTube: "No health data yet"
- [ ] Open a watch page, wait 3 s, open the dashboard → Health: status "All checked features are working", watch page checked time shown, Video player / Theater mode button / Like count rows "Working"
- [ ] Open the home page, wait 3 s, dashboard → Health: home page checked time shown, Topic chips bar / Home feed grid "Working"; Live / Mixes / News shelf rows "Working" if YouTube showed them, "Not seen on this visit" if it did not
- [ ] Navigate watch → home → watch (SPA, no reload): the checked times update for each page, no errors in the console
- [ ] "Check again" re-reads the record (the times refresh); the dashboard never opens a YouTube tab itself
- [ ] Turn the extension off in the popup: no new health record is written (the checked time stays where it was); turn it back on and visit YouTube: the check runs again
- [ ] Deliberately break one selector to prove the warning works (e.g. in DevTools console on a watch page, confirm `document.querySelector('#segmented-like-button .yt-spec-button-shape-next__button-text-content')` exists; then temporarily rename the key's value in `shared/selectors.js`, reload the extension, open a watch page): Health shows "Some features are not working" and the Like count row "Not working" — and the Like button still works (nothing was auto-disabled). Restore the selector afterwards.

Notes / failures:
- _…_

## Phase 19 — Popup Theme + Channel-Page Shorts Tab (v1.11) — live in Chrome

- [ ] Dashboard → General → Dashboard theme → Light: open the popup — it is light (white background, dark text), including the toggles and buttons
- [ ] Dashboard theme → Dark: the popup is dark again, immediately (no extension reload)
- [ ] Dashboard theme → System: the popup follows the OS — flip the OS dark/light setting with the popup open and it follows
- [ ] On a channel page with Block Shorts ON: the Shorts tab is gone from the tab bar (Home / Videos / Shorts / Live / Playlists — no Shorts). Turn Block Shorts OFF and reload: the tab is back
- [ ] On a channel page with Block Shorts OFF: the Shorts tab is untouched
- [ ] Dashboard → Health, after visiting a channel page: channel page checked time shown, "Shorts tab (channel)" row "Working" (channel has a Shorts tab) or "Not seen on this visit" (channel has none) — never "Not working" just because the channel has no tab
- [ ] Non-English YouTube UI: if the Shorts tab does not hide, note the real tab title from DevTools — the selector uses the English `tab-title="Shorts"`

Notes / failures:
- _…_

## Phase 20 — Custom CSS Templates (v1.12) — live in Chrome

- [ ] Dashboard → Appearance: a "CSS templates" box lists 6 templates (Hide duration badges, Fade watched videos, Hide video badges, Hide home metadata, Hide voice search, Hide channel banner), each with a description and an Apply button
- [ ] Apply "Hide duration badges": the Custom CSS box below now contains `/* OneYT template: hide-duration-badges */` + the rule, "Enable custom CSS" is on, and the button reads "Applied" (disabled) — open a home page: no duration badge on any thumbnail
- [ ] Apply the same template again (reload the dashboard first): the Custom CSS text is unchanged — no duplicated block
- [ ] Apply "Fade watched videos": open the home feed — a video you have started watching looks faded; an unwatched video looks normal
- [ ] Apply "Hide video badges": "New" / "LIVE" / "4K" badges are gone from thumbnails
- [ ] Apply "Hide home metadata": the views + age line under home video titles is gone (watch-page view count is untouched — that is the separate Hide view count toggle)
- [ ] Apply "Hide voice search": the microphone button next to the search box is gone
- [ ] Apply "Hide channel banner": open a channel page — the banner art is gone and no empty gap is left where it was
- [ ] Remove a template by hand: delete its block (marker comment + rule) from the Custom CSS box — the effect is gone on the next YouTube load, and the button reads "Apply" again
- [ ] If a template does nothing on the live page, check the real element in DevTools (right-click → Inspect) and note the selector YouTube actually uses — template selectors are DOM hooks and YouTube renames them

Notes / failures:
- _…_

## Phase 21 — Saved Themes + Export/Share (v1.13) — live in Chrome

- [ ] Dashboard → Appearance: a "Save current theme" box (name input + Save theme button), a "Your saved themes (0/10)" list, and an "Import a shared theme" box
- [ ] Set Theme → Midnight, Accent → a red of your choice, then save as "My Night": the list shows "My Night — Base: midnight · 1 custom colour."
- [ ] Change the theme back to Default (colours cleared): open a watch page — YouTube is back to default. Apply "My Night": the page turns midnight + red again immediately, no reload
- [ ] Apply "My Night" again from the list: nothing else changes (layout, player, sidebar settings untouched — check a layout toggle you set earlier is still as it was)
- [ ] Export "My Night": a file `oneyt-theme-my-night.json` downloads — open it: it has `oneytTheme: 1`, the name, `theme: "midnight"` and the colours
- [ ] Delete "My Night", then import the exported file (paste its text into the import box → Validate & preview → Add theme): the preview names it correctly and it appears in the list
- [ ] Import the same file again: rejected with "already exists". Import a hand-edited file with a wrong `theme` value: rejected with "unknown base theme". Import plain text: rejected with "Not valid JSON"
- [ ] Rename "My Night" to "Dark": rejected (built-in name). Rename it to "Night Red": the list shows the new name, and Apply still works
- [ ] Save 10 themes, then save an 11th: rejected with "delete one first"

Notes / failures:
- _…_

## Phase 22 — Advanced Layout Editor (v1.14) — live in Chrome

- [ ] Dashboard → Layout: a "Preview" box (mini grid + "4 columns · 12 px gap · full width.") and a "Layout presets" box (Compact / Balanced / Spacious, each with Apply button) below the number controls
- [ ] Apply "Balanced": the number controls change to 4 columns, 16 px gap, 1600 px max width, 16 px watch spacing — and the preview changes to 4 boxes with "4 columns · 16 px gap · max-width 1600 px."
- [ ] Apply "Compact": preview shows 5 boxes, "5 columns · 8 px gap · full width." Apply "Spacious": 3 boxes, "3 columns · 24 px gap · max-width 1280 px."
- [ ] Apply "Balanced", then change Homepage columns to 6 by hand: the preview redraws with 6 boxes on the next render — presets are a starting point, not a lock
- [ ] On a wide monitor (>1600 px): with "Balanced" applied, open the home page — the feed is capped at 1600 px and centred, with equal empty space on both sides. Watch page and search page are untouched (full width)
- [ ] Set Homepage max width to 0: the home feed goes full width again, immediately
- [ ] Set Homepage max width to 800 on a narrow window: the feed is narrow and centred — the empty sides are by design, not a bug
- [ ] Hiding toggles are untouched by presets: turn on "Hide topic chips bar", apply "Spacious", and the chips bar stays hidden

Notes / failures:
- _…_

## Phase 23 — Player Accent Color (v1.15) — live in Chrome

- [ ] Dashboard → Player: a "Player accent color" picker sits after "Player spacing" — empty by default (YouTube red)
- [ ] Pick a colour (e.g. #00aaff): open a watch page — the played portion of the progress bar and the scrubber knob turn that colour immediately, no reload
- [ ] The buffered portion stays YouTube's own colour — played vs buffered is still easy to tell apart
- [ ] Theater mode: the accent stays on the wide player. Fullscreen: the bar goes back to YouTube red; exiting fullscreen brings the accent back
- [ ] Clear the colour (Clear button): the bar and knob go back to YouTube red immediately, no reload
- [ ] Type "red" (not a hex) into the colour text box: a warning shows, the value is rejected, and the player keeps its previous colour
- [ ] Import settings JSON with `"accentColor": "red"`: the import applies but the player stays YouTube red (invalid hex is ignored, never applied)
- [ ] Dashboard → Health on a watch page: the "Player accent color" row reads Working
- [ ] The accent is independent of the theme accent: set Appearance → Accent to a different colour and the player keeps its own accent colour
- [ ] If the accent does nothing on the live page, check the real elements in DevTools (right-click → Inspect) and note the selectors YouTube actually uses — `.ytp-play-progress` / `.ytp-scrubber-button` are DOM hooks and YouTube renames them

Notes / failures:
- _…_
