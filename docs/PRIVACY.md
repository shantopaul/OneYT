# OneYT — Privacy Policy

**Last updated:** 2026-11-09 · **Version:** 1.0.0

OneYT ("the extension") is an all-in-one customizer for
YouTube. This policy explains what it does with your
information. The short version: **it collects nothing, sends
nothing anywhere, and stores your settings on your own
device.**

## 1. Data collection: none

OneYT does not collect, transmit, store on a server, sell,
share or analyse any personal data — no browsing history, no
watch history, no search terms, no account information, no
usage analytics, no crash reports, no advertising identifiers.

The extension makes **no network requests at all**. It
contains no analytics SDK, no tracking code and no
third-party code.

## 2. What is stored, and where

**On your device (always):** your settings — player size and
position, sidebar and layout choices, theme and colours,
playback preferences, keyboard shortcuts, focus-mode state.
Stored in your browser's local extension storage
(`chrome.storage.local`). They never leave your device unless
you turn on sync (below) or export them yourself.

**In your Chrome sync account (only if you opt in):** if you
enable "Sync settings across browsers" in the dashboard, the
extension mirrors your settings to your own Google account's
Chrome sync storage, so other browsers signed into the same
account can use them. Custom CSS and remembered speed/volume
never sync — they stay on each device. Turning sync off
removes the synced copy. The developer never sees this data;
it is held by Google under your Google account, not by OneYT.

**If you export settings:** the dashboard can download your
settings as a JSON file on your device. That file goes
wherever you save it; OneYT does not upload it anywhere.

## 3. Permissions, and why each exists

| Permission | Why |
| --- | --- |
| `storage` | Save your settings locally (and to Chrome sync only when you opt in). |
| `activeTab` | The popup reads the active tab's URL only, to show which YouTube page you are on. It is granted only while the popup is open. |
| Host `https://*.youtube.com/*` + `https://youtube.com/*` | The extension runs on all YouTube pages only, nowhere else. |

OneYT does not read the content of web pages beyond what it
needs to apply your settings on YouTube (finding the player,
sidebar and page type). It does not read passwords, messages
or data from any other site.

## 4. Children

OneYT collects no data from anyone, including children.

## 5. Changes to this policy

If the extension ever starts handling data differently, this
policy will be updated here first and the new version will
ship with the extension. The current version is always the
one in the extension's repository.

## 6. Contact

Questions about this policy: open an issue at
https://github.com/shantopaul/OneYT

OneYT is an independent project by Shanto Paul. It is not
affiliated with, endorsed by, or connected to YouTube or
Google.
