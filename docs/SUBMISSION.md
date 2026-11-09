# OneYT — Chrome Web Store Submission Checklist (Phase 7, task 7.8)

**Status: ⬜ NOT SUBMITTED — needs Shanto (his developer
account, his decisions below).** Everything that can be
prepared here is prepared; the submission itself happens in
Shanto's browser on his account.

## Before you start — two decisions only Shanto can make

### 1. Privacy policy URL (required by the store)

The store requires a **publicly accessible** privacy policy
URL. The policy is written (`docs/PRIVACY.md`), but the repo
is currently **private**, so linking the file in the repo
will not work for the store review. Pick one:

- **(a) Make the repo public** and use
  `https://github.com/shantopaul/OneYT/blob/main/docs/PRIVACY.md`
  (after the release PR is merged, so `main` has the file), or
- **(b) Publish the policy on shantopaul.com** (e.g.
  `https://shantopaul.com/privacy`) and use that URL.

Do not submit until this URL works in a logged-out browser.

### 2. Support contact

The store listing shows a support link. Options: the repo's
Issues page (`https://github.com/shantopaul/OneYT/issues`)
or a support email. Decide at submission time; the listing
copy in `docs/store-listing.md` uses the Issues page.

## Steps

### 1. Developer account

- Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- Sign in with the Google account the extension will belong
  to. One-time $5 registration fee. (Review takes 1–3 days
  typically.)

### 2. Final browser check (do this first — it is still open)

- Run the Phase 6 browser checklist
  (`tests/manual-checklist.md`, Phase 6 section) on the
  release build: Chrome/Edge/Brave, viewports, fullscreen +
  theater, two-profile sync, live selectors, memory.
- Capture the five screenshots (`docs/SCREENSHOTS.md`) and
  save them in `assets/screenshots/`.

### 3. Build the package

```sh
npm test && npm run lint && npm run package
```

- `npm run package` builds `oneyt-1.0.0.zip` in the repo
  root (excludes tests, docs, scripts, promo images and
  screenshots — verified clean in Phase 7).
- Load that exact zip unpacked once more and smoke-test it:
  open YouTube, change one setting, reload the tab.

### 4. Create the listing

- Dashboard → New Item → upload `oneyt-1.0.0.zip`.
- Fill every field from `docs/store-listing.md` (title, short
  description, detailed description, category, single
  purpose, permissions justification).
- Privacy policy: paste the URL decided above.
- Upload: icon (128), small promo tile (440×280), large tile
  (920×680), marquee (1400×560), and the 5 screenshots
  (1280×800).

### 5. Submit for review

- Submit. Note the date; review typically takes 1–3 days.
- **If the review asks for changes** (common first-time
  reasons: listing copy, permission justification, or a
  screenshot that does not show the real UI): fix exactly
  what they asked, note it in `Memory.md`, bump the patch
  version only if code changed, rebuild the zip and
  resubmit. Do not argue in the review thread — fix and
  resubmit.

### 6. After it goes live

- Tick the Phase 7 checklist in `Phases.md` and mark v1.0.0
  shipped with the date in `Memory.md`.
- Publish the GitHub release (tag `v1.0.0`, see
  `docs/RELEASE_CHECKLIST.md`).
- Update the README store link (currently a placeholder).
- Monitor store reviews; triage into the v1.1 backlog
  (`docs/BUG_BASH.md` § Deferred).

## What NOT to do

- Do not submit a zip built from any branch other than the
  release branch after it is merged.
- Do not list features the extension does not have, or any
  user/install numbers — the listing copy is honest on
  purpose and the review checks it against the code.
- Do not upload mockups as screenshots.
