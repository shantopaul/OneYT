#!/usr/bin/env bash
# OneYT — store submission package builder (Phase 7).
#
# Builds oneyt-<version>.zip containing ONLY the files the
# extension needs at runtime. Excluded on purpose:
#   tests/, docs/, scripts/, root *.md, package.json,
#   node_modules, .git, assets/promo, assets/screenshots
# (promo images and screenshots are uploaded separately in
# the store listing — they are not part of the extension).
#
# Usage: npm run package   (or: bash scripts/package-extension.sh)
# Output: oneyt-<version>.zip in the repo root.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="oneyt-${VERSION}.zip"

# Sanity: manifest must be valid and every file it references
# must exist (same check the test suite does).
python3 - <<'PY'
import json, os, sys
m = json.load(open('manifest.json'))
cs = m['content_scripts'][0]
files = ['background/service-worker.js', 'popup/popup.html', m['options_page']] \
    + cs['js'] + cs['css'] + [m['icons'][k] for k in m['icons']]
missing = [f for f in files if not os.path.exists(f)]
if missing:
    print('missing files:', missing, file=sys.stderr)
    sys.exit(1)
print(f"manifest OK (v{m['version']}), {len(files)} referenced files present")
PY

rm -f "$OUT"
zip -q -r "$OUT" \
  manifest.json \
  background \
  content \
  popup \
  options \
  shared \
  assets/icons \
  -x "*/.*" -x "*/node_modules/*"

echo "built $OUT ($(du -h "$OUT" | cut -f1))"
echo "contents:"
unzip -l "$OUT" | tail -n +4 | head -n -2 | awk '{print "  " $4}'
