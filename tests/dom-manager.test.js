// OneYT — dom-manager tests (node:test, no browser needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createDomManager } = require('../content/core/dom-manager');

// A fake element tree: querySelector searches depth-first
// from the element itself.
function fakeEl(matches, children) {
  const el = {
    _matches: matches || null,
    _children: children || [],
    querySelector(sel) {
      const visit = (node) => {
        if (node._matches === sel) return node;
        for (const c of node._children || []) {
          const found = visit(c);
          if (found) return found;
        }
        return null;
      };
      return visit(el);
    },
    querySelectorAll: () => [],
  };
  return el;
}

test('dom-manager: waitFor watches inside the given root, not the whole document', async () => {
  const observed = [];
  const RealObserver = global.MutationObserver;
  global.MutationObserver = class {
    constructor(cb) {
      this.cb = cb;
      observed.push(this);
    }
    observe() {}
    disconnect() {}
  };
  try {
    const rootA = fakeEl(null, []); // document body: no target here
    const rootB = fakeEl(null, []); // scoped subtree, separate from body
    const doc = {
      body: rootA,
      querySelector: (sel) => rootA.querySelector(sel),
      querySelectorAll: () => [],
    };
    const dom = createDomManager({
      document: doc,
      logger: { debug: () => {}, error: () => {} },
      constants: { OBSERVER_TIMEOUT: 10000 },
    });
    const target = fakeEl('.target', []);
    const found = dom.waitFor('.target', { root: rootB, timeout: 5000 });
    // The target appears inside rootB only (never in the document).
    rootB._children.push(target);
    // Fire the observer: the callback must search rootB.
    assert.equal(observed.length, 1);
    observed[0].cb();
    assert.equal(await found, target);
  } finally {
    if (RealObserver === undefined) delete global.MutationObserver;
    else global.MutationObserver = RealObserver;
  }
});
