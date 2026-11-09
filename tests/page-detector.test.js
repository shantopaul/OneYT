// OneYT — page-detector + selectors tests (node:test).
const test = require('node:test');
const assert = require('node:assert/strict');
const detector = require('../content/core/page-detector').createPageDetector({
  constants: require('../shared/constants'),
});
const selectors = require('../shared/selectors');

const cases = [
  ['https://www.youtube.com/', 'home'],
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'watch'],
  ['https://www.youtube.com/results?search_query=cats', 'search'],
  ['https://www.youtube.com/feed/subscriptions', 'subscriptions'],
  ['https://www.youtube.com/@shantopaul', 'channel'],
  ['https://www.youtube.com/channel/UC123', 'channel'],
  ['https://www.youtube.com/playlist?list=PL123', 'playlist'],
  ['https://www.youtube.com/shorts/abc123', 'shorts'],
  ['https://www.youtube.com/feed/history', 'home'],
  ['https://example.com/', 'other'],
  ['https://www.youtube.com/feed/library', 'home'],
  ['not a url at all', 'other'],
];

for (const [url, expected] of cases) {
  test(`detect(${url}) -> ${expected}`, () => {
    assert.equal(detector.detect(url), expected);
  });
}

test('onNavigate is a no-op unsubscribe outside a browser', () => {
  const off = detector.onNavigate(() => {});
  assert.equal(typeof off, 'function');
  off(); // must not throw
});

test('every required watch selector exists and is a non-empty string', () => {
  for (const key of selectors.REQUIRED_WATCH_SELECTORS) {
    assert.equal(typeof selectors.SELECTORS[key], 'string');
    assert.ok(selectors.SELECTORS[key].length > 0, key);
  }
});

test('no selector in the central list is empty', () => {
  for (const [key, value] of Object.entries(selectors.SELECTORS)) {
    assert.equal(typeof value, 'string', key);
    assert.ok(value.length > 0, key);
  }
});
