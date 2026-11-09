# OneYT — Design

> **Product:** OneYT — All-in-One YouTube Customizer
> **Version:** v1.0 — 2026-11-09
> **Status:** Planning — no code written yet
> **Principle:** minimal, dark-first, engineering-focused — the same
> brand language as Shanto's portfolio (no excessive gradients,
> no glassmorphism, no fake statistics, no generic stock imagery).
> The extension UI should feel like a precise tool, not a toy.

---

## 1. Brand

| Item | Value |
|------|-------|
| Name | **OneYT** |
| Full name | OneYT — All-in-One YouTube Customizer |
| Tagline | "Your YouTube. Your Layout. Your Rules." |
| Voice | Short, plain, confident. No marketing hype, no fake claims. |
| Logo | Original mark only (to be designed in Phase 7; placeholder geometric mark in Phase 1). Never use YouTube's logo, play button, or red as the *logo itself* — YouTube red is an accent, not the brand. |

---

## 2. Colours & Theme

### 2.1 Brand palette (extension UI + default accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `--oneyt-accent` | `#FF0033` | Primary accent — active toggles, primary buttons, links. YouTube-adjacent red, used sparingly. |
| `--oneyt-accent-hover` | `#E6002E` | Accent hover state |
| `--oneyt-accent-soft` | `rgba(255, 0, 51, 0.12)` | Accent backgrounds (active nav item, selected preset) |
| `--oneyt-success` | `#22C55E` | Success / enabled states |
| `--oneyt-warning` | `#F59E0B` | Warnings (shortcut conflict, invalid import) |
| `--oneyt-danger` | `#EF4444` | Destructive actions (Reset All, delete preset) |
| `--oneyt-info` | `#3B82F6` | Informational notes |

### 2.2 Extension UI — dark theme (primary, default)

The popup and dashboard are **dark-first**, matching the user's
portfolio preference.

| Token | Hex | Usage |
|-------|-----|-------|
| `--ui-bg` | `#0F0F0F` | Dashboard / popup background |
| `--ui-surface` | `#181818` | Cards, panels, section surfaces |
| `--ui-surface-hover` | `#212121` | Hover on cards / rows |
| `--ui-border` | `#2A2A2A` | Borders, dividers |
| `--ui-border-strong` | `#3D3D3D` | Focused / emphasised borders |
| `--ui-text` | `#F1F1F1` | Primary text |
| `--ui-text-secondary` | `#AAAAAA` | Secondary text, descriptions |
| `--ui-text-muted` | `#717171` | Muted text, hints |
| `--ui-accent` | `#FF0033` | Same as brand accent |
| `--ui-toggle-on` | `#FF0033` | Toggle ON state |
| `--ui-toggle-off` | `#3D3D3D` | Toggle OFF track |

### 2.3 Extension UI — light theme (dashboard follows system / user choice)

| Token | Hex | Usage |
|-------|-----|-------|
| `--ui-bg` | `#FFFFFF` | Background |
| `--ui-surface` | `#F9F9F9` | Cards, panels |
| `--ui-surface-hover` | `#F0F0F0` | Hover |
| `--ui-border` | `#E5E5E5` | Borders |
| `--ui-text` | `#0F0F0F` | Primary text |
| `--ui-text-secondary` | `#606060` | Secondary text |
| `--ui-text-muted` | `#909090` | Muted text |

The dashboard respects the user's theme choice; the default is
dark. Light is a first-class theme, not an afterthought — check
contrast in both during Phase 6.

### 2.4 YouTube theme presets (injected — Phase 3)

These are the presets the user picks **for YouTube itself**.
Each preset is a CSS-variable set only (see `Architecture.md`
§6.2) — switching preset never rewrites rules.

| Preset | Background | Surface | Text | Secondary text | Accent |
|--------|-----------|---------|------|---------------|--------|
| **Default YouTube** | YouTube's own values (no override) | — | — | — | — |
| **Dark** | `#0F0F0F` | `#212121` | `#F1F1F1` | `#AAAAAA` | `#FF0033` |
| **Light** | `#FFFFFF` | `#F9F9F9` | `#0F0F0F` | `#606060` | `#FF0033` |
| **Midnight** | `#0A0E1A` | `#121826` | `#E8ECF5` | `#8A94A8` | `#5B8CFF` |
| **AMOLED Black** | `#000000` | `#0A0A0A` | `#F1F1F1` | `#AAAAAA` | `#FF0033` |
| **Minimal** | `#FAFAFA` (light) / `#101010` (dark variant) | `#FFFFFF` / `#181818` | `#111111` / `#EDEDED` | `#666666` / `#999999` | `#111111` / `#F1F1F1` (monochrome accent) |
| **Custom** | User-defined | User-defined | User-defined | User-defined | User-defined |

**Preset rules:**
- A preset must never make YouTube's native controls unreadable
  (player controls, captions, buttons). If a custom colour breaks
  contrast, the preset still applies but the dashboard shows a
  contrast warning.
- "Default YouTube" means: OneYT applies **no** colour overrides
  at all — the user's YouTube theme setting stays in charge.
- Custom preset = the user's own colour tokens, saved per user,
  exportable with settings.

### 2.5 Full injected token list (YouTube side)

```css
html.oneyt-enabled {
  --oneyt-bg: #0f0f0f;
  --oneyt-surface: #212121;
  --oneyt-surface-hover: #2e2e2e;
  --oneyt-border: #2a2a2a;
  --oneyt-text: #f1f1f1;
  --oneyt-text-secondary: #aaaaaa;
  --oneyt-accent: #ff0033;
  --oneyt-card-bg: #181818;
  --oneyt-button-bg: #272727;
  --oneyt-button-hover: #3d3d3d;
  --oneyt-radius: 12px;          /* default player/card radius */
  --oneyt-radius-sm: 8px;
  --oneyt-radius-lg: 16px;
  --oneyt-spacing: 16px;         /* base UI spacing */
  --oneyt-sidebar-width: 402px;
  --oneyt-sidebar-max-height: calc(100vh - 100px);
  --oneyt-scrollbar-width: 8px;
  --oneyt-player-max-width: 1280px;
  --oneyt-font-family: inherit;  /* "" = YouTube default */
  --oneyt-font-size: inherit;
  --oneyt-line-height: inherit;
}
```

Every token has a dashboard control (Phase 3/5) and a reset to
its preset value.

### 2.6 Colour rules (hard)

- **No gradients** as a primary treatment. A subtle gradient is
  allowed only as a 1-step hover/focus accent — never as a
  background wash.
- **No glassmorphism** (no frosted panels, no heavy blur) in the
  extension UI or on YouTube.
- **No pure saturated colour blocks** for large surfaces.
- Accent red is for actions and active states only — never for
  large backgrounds or body text.
- Contrast: body text ≥ 4.5:1, secondary text ≥ 3:1 (WCAG AA).
  Check both dark and light dashboard themes in Phase 6.

---

## 3. Fonts & Typography

### 3.1 Extension UI font stack (popup + dashboard)

No webfont is downloaded in v1 — system stack only (fast,
private, no network request).

```css
--oneyt-ui-font: -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, "Noto Sans", sans-serif;
--oneyt-ui-font-mono: ui-monospace, "SF Mono", "Cascadia Code",
  Consolas, "Roboto Mono", monospace;  /* CSS editor, JSON, values */
```

### 3.2 Type scale (extension UI)

| Element | Size | Weight | Line-height | Notes |
|---------|------|--------|-------------|-------|
| Dashboard H1 (section title) | 20px | 600 | 1.3 | One per section |
| Dashboard H2 (group title) | 15px | 600 | 1.4 | Setting groups |
| Body / setting label | 14px | 400 | 1.5 | Default text |
| Setting description | 13px | 400 | 1.5 | `--ui-text-secondary` |
| Small / hint / caption | 12px | 400 | 1.4 | `--ui-text-muted` |
| Button label | 14px | 500 | 1.4 | Sentence case |
| Popup title | 15px | 600 | 1.3 | "OneYT" + status |
| Code / CSS editor | 13px | 400 | 1.6 | Monospace stack |

### 3.3 YouTube-side typography (user-configurable, Phase 3)

- **Font family:** user pick from a curated list (system fonts
  only in v1: Inter/system, Roboto, Arial, Georgia/serif,
  monospace) + "YouTube default" (no override).
- **Font size:** scale control (e.g. 90–115% of YouTube default),
  not absolute px — so titles, descriptions and comments scale
  together without breaking layout.
- **Font weight:** 400 / 500 / 600 for titles only (never force
  weight on body text).
- **Line height:** 1.4–1.8 for description / comment text.
- **Never** override YouTube's font inside the video player
  (captions have their own controls in Playback).

### 3.4 Typography rules

- Sentence case for labels and buttons ("Focus mode", not
  "FOCUS MODE"). No all-caps headings.
- Numbers use tabular figures where they are compared (widths,
  speeds) — set `font-variant-numeric: tabular-nums` on those.
- Truncate long setting descriptions with an ellipsis + tooltip,
  never wrap a control out of alignment.
- The CSS editor is monospace, with line numbers if cheap to add
  in Phase 5 — otherwise plain textarea, no fake editor chrome.

---

## 4. Layout & Spacing (Extension UI)

### 4.1 Popup (380 × ~520 px, scrollable)

```
┌──────────────────────────────┐
│ OneYT            ● Enabled   │  header, 16px padding
├──────────────────────────────┤
│ [Focus Mode      Toggle]     │  quick rows, 12px gap
│ [Independent Scroll Toggle]  │
│ Theme: [Dark ▾]              │
│ Player: [Default ▾]          │
├──────────────────────────────┤
│ [Quick Settings]             │  secondary button
│ [Open Full Dashboard →]      │  primary button
└──────────────────────────────┘
```

- One column, 16px outer padding, 12px gaps between rows.
- Quick toggles are full-width rows: label left, switch right.
- Primary button = accent background, white text, 8px radius.
- Popup must open instantly — no spinner, no async wait for
  settings (read from cache, refresh in background).

### 4.2 Dashboard (options page)

```
┌──────────┬─────────────────────────────────┐
│          │  Top bar: logo · search ·       │
│  Left    │  Import/Export · Reset All      │
│  nav     ├─────────────────────────────────┤
│  240px   │  Section title + description    │
│          │  ┌───────────────────────────┐  │
│  General │  │ Setting group card        │  │
│  Player  │  │  label + control + desc   │  │
│  Layout  │  └───────────────────────────┘  │
│  …       │  ┌───────────────────────────┐  │
│          │  │ Setting group card        │  │
│          │  └───────────────────────────┘  │
└──────────┴─────────────────────────────────┘
```

- Left nav: 240px, icons + labels, active item = accent-soft
  background + accent left border (3px).
- Content: max-width 860px, 24px padding, 16px gaps.
- Setting group = one surface card, 16px padding, 12px radius,
  1px border.
- One setting per row: label + description (left, flexible),
  control (right, fixed width ~200px). On narrow widths the
  control wraps below the label.
- Sticky top bar; sticky left nav on desktop.
- Responsive: below 720px the left nav becomes a horizontal
  scroll row at the top.

### 4.3 Controls

| Control | Spec |
|---------|------|
| Toggle switch | 36 × 20px track, 16px knob, accent when ON, 200 ms ease |
| Slider | Full-width track, accent fill to the left of the thumb, value bubble / inline value on the right (`402 px`) |
| Colour picker | 32 × 32px swatch, 8px radius, 1px border; hex input beside it |
| Dropdown | Native `<select>` styled to match (no custom dropdown lib in v1) |
| Number input | Right-aligned, tabular nums, unit suffix (`px`, `x`, `%`) |
| Text input | 8px radius, 1px border, focus = accent border + soft ring |
| CSS editor | Monospace textarea, min-height 240px, dark surface even in light theme |
| Radio / multi-select | Native inputs, accent checked state |
| Button (primary) | Accent bg, white text, 8px radius, 8px/16px padding |
| Button (secondary) | Transparent, 1px border, text colour |
| Button (danger) | Danger text/border; solid danger bg only on confirm |

- **Focus visible:** every interactive element has a visible
  focus ring (2px accent outline, offset 2px). Keyboard
  navigation must work end-to-end (Phase 6 check).
- **Disabled state:** 50% opacity, `not-allowed` cursor, no hover.

### 4.4 Spacing scale

`4 / 8 / 12 / 16 / 24 / 32 px` — nothing else. If a gap is not
on this scale, pick the nearest value.

### 4.5 Radius scale

`4px` (inputs, chips) / `8px` (buttons, controls) /
`12px` (cards, player default) / `16px` (large surfaces).
Player radius is user-configurable (0–24px) — the scale above
is for the extension UI itself.

---

## 5. States & Feedback

| State | Treatment |
|-------|-----------|
| Setting saved | No toast for every change (too noisy). A subtle "Saved" indicator in the top bar, fading after 1.5 s. |
| Setting reset | Inline — control returns to default, no toast. |
| Error (invalid import / CSS) | Inline red message under the control + field-level list; never a modal for a fixable error. |
| Destructive (Reset All) | Confirm inline (button turns into "Confirm reset?" for 5 s) — no modal in v1. |
| Loading (dashboard open) | Settings render from cache instantly; no spinner. |
| Empty search | "No settings match 'xyz'." + clear-search link. |
| Extension disabled | Popup + dashboard show a muted banner; all controls disabled except the master toggle. |

---

## 6. Icons & Imagery

- **Icons:** inline SVG only, 16/20px, stroke 1.5px, currentColor.
  One consistent set (use a single open set, e.g. Lucide-style
  paths drawn for OneYT — do not mix icon styles).
- **No stock photos, no illustrations, no fake 3D** anywhere in
  the extension UI or store listing.
- **Screenshots** (Phase 7) are real screenshots of the working
  extension — labelled as such, never mockups presented as real.
- **Logo:** original geometric mark. Concept direction (Phase 7):
  a single rounded square / play-triangle abstraction in accent
  red on dark — simple enough to read at 16px.

---

## 7. What Good Looks Like (design checklist, Phase 5/6)

- [ ] Popup opens instantly, one glance tells the state (enabled? focus? theme?)
- [ ] Dashboard: any setting found in ≤ 2 clicks or one search
- [ ] Dark and light dashboard both pass contrast checks
- [ ] No gradient, no glass, no stock imagery anywhere
- [ ] Every control has a visible focus ring; full keyboard use works
- [ ] Player / sidebar changes on YouTube look intentional, not patched-on
- [ ] At 16px the logo is still recognisable

---

*Design decisions that change a token, a scale, or a preset go
here first — never straight into CSS. If a preset value changes,
update §2.4 and note it in `Memory.md`.*
