<div align="center">

<img src="assets/icons/icon128.png" alt="OneYT logo" width="96" height="96">

# OneYT — All-in-One YouTube Customizer

**Your YouTube. Your Layout. Your Rules.**

[![Version](https://img.shields.io/badge/version-1.6.0-FF0033)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen)](tests/)
[![Privacy](https://img.shields.io/badge/privacy-no%20data%20collected-brightgreen)](docs/PRIVACY.md)
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS-yellow)](Architecture.md)

A lightweight, modular, privacy-first browser extension that
customises YouTube's player, layout, sidebar, themes, playback,
recommendations, focus mode and keyboard shortcuts — every
feature independently toggleable. No backend, no account, no
data leaves your device.

[Features](#-features) ·
[Install](#-install) ·
[Usage](#-usage) ·
[Privacy](#-privacy) ·
[Development](#-development) ·
[Contributing](#-contributing)

</div>

---

## ✨ Features

| Area | What you get |
| --- | --- |
| 🎬 **Player** | Width, alignment and position — including a fixed or absolute player that stays visible while you scroll; mini-player size and position; radius, borders and shadows |
| 📑 **Sidebar** | Independent scrolling with its own width, scrollbar and scroll sensitivity; compact density, card size and metadata controls |
| 🧩 **Layout** | Hide comments and Shorts; home grid columns, card spacing and thumbnail size |
| 🎨 **Appearance** | Six themes (Default, Dark, Light, Midnight, AMOLED, Minimal) plus a custom theme with your own colours; typography, radius, spacing and validated custom CSS |
| ▶️ **Playback** | Default speed and volume, remembered across videos; speed presets, quality, autoplay, captions and caption font size |
| 🎯 **Productivity** | Focus Mode — hide recommendations, chat, comments and navigation, restored exactly on exit; keyboard shortcuts (Shift+ by default, fully rebindable); guide navigation controls |
| ⚙️ **Dashboard** | Every setting in one searchable dashboard with live preview; import/export with diff preview; per-setting, per-section and global reset; optional Chrome sync (opt-in — Custom CSS and remembered playback never sync) |

## 📦 Install

### Chrome Web Store

> **Coming soon** — the listing is prepared and under review
> preparation (see [`docs/SUBMISSION.md`](docs/SUBMISSION.md)).
> The link will appear here once the store review passes.

### Load unpacked (development)

Works in any Chromium-based browser (Chrome, Edge, Brave):

1. Clone this repo:
   ```sh
   git clone https://github.com/shantopaul/OneYT.git
   ```
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the repo folder.
4. Open any YouTube page — click the OneYT icon for quick
   toggles, or open the full dashboard for every setting.

## 🚀 Usage

1. **Quick toggles** — click the OneYT icon in the toolbar:
   Focus Mode, independent scroll, player module, theme.
2. **Full dashboard** — click **Open Full Dashboard** in the
   popup (or the extension's Options page). Search any setting,
   change it, and watch it apply live on open YouTube tabs —
   no reload needed.
3. **Import / export** — back up your settings as JSON from
   the dashboard's Advanced section, with a diff preview
   before applying.
4. **Sync (optional)** — turn on *Sync settings across
   browsers* in Advanced to mirror settings to Chrome sync.
   Custom CSS and remembered speed/volume stay on each device.

## 🔒 Privacy

OneYT stores settings locally in your browser. It makes **no
network requests, collects no data, shows no ads and has no
backend**.

| Permission | Why it exists |
| --- | --- |
| `storage` | Save your settings locally (and to Chrome sync only when you opt in) |
| `activeTab` | The popup reads the active tab's URL only, to show which YouTube page you are on |
| Host `https://*.youtube.com/*` + `https://youtube.com/*` | The extension runs on all YouTube pages only, nowhere else |

Full policy: [`docs/PRIVACY.md`](docs/PRIVACY.md) ·
Security review: [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md)

## 🛠 Tech stack

- **Manifest V3**, vanilla JavaScript / HTML / CSS — no
  framework, no bundler, no build step for the extension
  itself
- Classic content scripts sharing one `OneYT` global, with a
  per-module system (failure in one module never breaks the
  others)
- Settings schema v1 with additive migration — old stored
  settings keep working after updates
- Node.js test suite (`node:test`, no extra test dependencies)

See [`Architecture.md`](Architecture.md) for the module system,
settings schema and architecture decisions (AD-01…AD-10).

## 📁 Project structure

```
OneYT/
├── manifest.json            # MV3 manifest (storage + activeTab only)
├── background/              # Service worker (seeds defaults on install)
├── content/
│   ├── core/                # Logger, event bus, DOM, settings, page
│   │                        # detector, module manager, app
│   ├── modules/             # sidebar, player, layout, appearance,
│   │                        # typography, playback, focus,
│   │                        # recommendations, keyboard, navigation
│   └── styles/              # Shared CSS-variable tokens
├── popup/                   # Toolbar popup (quick toggles, page status)
├── options/                 # Settings dashboard + 9 section files
├── shared/                  # Defaults, selectors, storage, validators,
│                            # themes
├── assets/icons/            # Final icons (16/48/128 + 512 master)
├── assets/promo/            # Store promo tiles (440×280 / 920×680 /
│                            # 1400×560)
├── docs/                    # Store listing, privacy, audits, checklists
├── scripts/                 # Icon/promo generators, package builder
└── tests/                   # 121 unit tests + migration fixtures
```

## 💻 Development

```sh
npm install          # dev tools only (ESLint + Prettier)
npm test             # 121 tests (node:test)
npm run lint         # ESLint
npm run format       # Prettier (check)
npm run format:fix   # Prettier (write)
npm run package      # builds oneyt-1.6.0.zip for the store
```

**Before every commit:** tests green, lint clean, format
clean. One commit per file/feature; push only when the work
is complete.

### Quality gates

- 121 unit tests covering every module, the dashboard, sync,
  migration fixtures (v0.1 / v0.4 / corrupt), SPA stress
  (20 navigations), security and accessibility regressions
- No polling, no network calls, no `eval` / `innerHTML` in
  extension code (enforced by tests)
- WCAG AA contrast in the dashboard and popup; keyboard
  navigation throughout

## 🗺 Roadmap

**v1.6.0** (current) — all 11 feature areas, sync, settings
dashboard, store-ready packaging, Block Shorts, dashboard
dark/light theme, optimised dashboard search, hide
endscreen cards, hide like/view/subscriber counts, hide
topic chips bar on Home, default theater mode.

**v1.1** (planned) — the browser-only checks from the Phase 6
bug bash: cross-browser and viewport verification, live
selector checks against YouTube's current DOM, real memory
measurement, live keyboard/screen-reader walkthrough. See
[`docs/BUG_BASH.md`](docs/BUG_BASH.md) for the deferred list.

## ❓ FAQ

**Does OneYT collect my data?**
No. No analytics, no tracking, no network requests. Settings
live in your browser.

**Do I need an account?**
No. There is no backend and no sign-in.

**Does it work on Firefox / mobile?**
OneYT is a Manifest V3 extension for Chromium browsers
(Chrome, Edge, Brave) on desktop. There is no mobile version.

**Is OneYT affiliated with YouTube or Google?**
No. It is an independent project and is not affiliated with,
endorsed by, or connected to YouTube or Google.

**Why does the store listing say "Coming soon"?**
The extension is complete and packaged; the Chrome Web Store
submission happens after the final browser checks and
screenshots. See [`docs/SUBMISSION.md`](docs/SUBMISSION.md).

## 🤝 Contributing

OneYT is a personal project by [Shanto Paul](https://github.com/shantopaul).
Issues and suggestions are welcome —
[open an issue](https://github.com/shantopaul/OneYT/issues)
with your browser version, the OneYT version (dashboard →
About) and steps to reproduce.

Please read [`Rules.md`](Rules.md) before contributing — it
sets the hard boundaries (no new permissions, no network
calls, no copied UI or assets, original code only).

## 📚 Documentation

| File | What it answers |
|------|-----------------|
| [PRD.md](PRD.md) | What to build, who it is for, features, Definition of Done |
| [Architecture.md](Architecture.md) | App flow, module system, settings schema, folder structure |
| [Rules.md](Rules.md) | What to use / avoid, error handling, boundaries for AI |
| [Phases.md](Phases.md) | Phase 0–7 build plan with per-phase checklists |
| [Design.md](Design.md) | Brand, colours, themes, fonts, popup/dashboard layout |
| [Memory.md](Memory.md) | Progress tracker — what is done, what is next, what is blocked |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [docs/store-listing.md](docs/store-listing.md) | Store listing copy |
| [docs/PRIVACY.md](docs/PRIVACY.md) | Privacy policy |
| [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) | Phase 6 security & privacy review |
| [docs/PERFORMANCE_AUDIT.md](docs/PERFORMANCE_AUDIT.md) | Phase 6 performance audit |
| [docs/SELECTOR_AUDIT.md](docs/SELECTOR_AUDIT.md) | Phase 6 selector audit |
| [docs/BUG_BASH.md](docs/BUG_BASH.md) | Phase 6 bug bash log |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | Store submission checklist |
| [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) | Screenshot shot list |
| [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) | PRD §12 Definition of Done check |

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Made by [Shanto Paul](https://github.com/shantopaul) · OneYT is not affiliated with YouTube or Google.

</div>
