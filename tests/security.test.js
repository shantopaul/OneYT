// OneYT — Phase 6 security regression tests (node:test).
// 6.8: the promises in docs/SECURITY_REVIEW.md, enforced.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const validators = require('../shared/validators');

function readTree(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...readTree(full, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

test('security: custom CSS rejects remote url(), allows data: URLs', () => {
  const remote = validators.validateCustomCSS(
    'div { background: url(https://evil.example/x.png); }'
  );
  assert.equal(remote.valid, false);
  assert.ok(remote.errors.some((e) => e.includes('url()')));
  const font = validators.validateCustomCSS(
    "@font-face { font-family: X; src: url('https://evil.example/f.woff2'); }"
  );
  assert.equal(font.valid, false);
  const data = validators.validateCustomCSS(
    'div { background: url(data:image/png;base64,iVBORw0KGgo=); }'
  );
  assert.equal(data.valid, true);
  const plain = validators.validateCustomCSS('ytd-rich-item-renderer { border: 1px solid red; }');
  assert.equal(plain.valid, true);
});

test('security: no network calls, eval, or innerHTML in extension code', () => {
  const root = path.join(__dirname, '..');
  const banned = [
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'sendBeacon',
    'eval(',
    'new Function',
    'innerHTML',
    'outerHTML',
    'document.write',
    'insertAdjacentHTML',
  ];
  const offenders = [];
  for (const dir of ['background', 'content', 'popup', 'options', 'shared']) {
    for (const file of readTree(path.join(root, dir), ['.js'])) {
      const text = fs.readFileSync(file, 'utf8');
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
      for (const token of banned) {
        if (code.includes(token)) offenders.push(path.relative(root, file) + ' contains ' + token);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('security: manifest permissions and hosts are minimal', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.deepEqual([...manifest.permissions].sort(), ['activeTab', 'storage']);
  // All YouTube hosts, still YouTube-only: every *.youtube.com
  // subdomain plus the bare domain — no other host, no http.
  assert.deepEqual(manifest.host_permissions, ['https://*.youtube.com/*', 'https://youtube.com/*']);
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.equal(manifest.content_security_policy, undefined);
});

test('security: service worker has no message relay', () => {
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'background', 'service-worker.js'),
    'utf8'
  );
  // The header comment documents the removal — check code only.
  const sw = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.equal(sw.includes('onMessage'), false);
  assert.equal(sw.includes('setByPath'), false);
  assert.equal(sw.includes('onInstalled'), true);
});
