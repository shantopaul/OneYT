// OneYT — fake DOM helpers for module tests (not a test file).
// Minimal stand-ins for documentElement / elements: classList,
// style vars, attributes, listeners, getBoundingClientRect.

function createFakeElement(options) {
  const opts = options || {};
  const classes = new Set();
  const vars = new Map();
  const attrs = new Map(Object.entries(opts.attrs || {}));
  const listeners = {};
  return {
    _classes: classes,
    _vars: vars,
    _attrs: attrs,
    _listeners: listeners,
    scrollTop: 0,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    style: {
      setProperty: (k, v) => vars.set(k, v),
      removeProperty: (k) => vars.delete(k),
      getPropertyValue: (k) => vars.get(k) || '',
    },
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
    },
    dispatch: (type, event) => {
      (listeners[type] || []).forEach((fn) => fn(event));
    },
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => attrs.set(name, value),
    removeAttribute: (name) => attrs.delete(name),
    getBoundingClientRect: () => opts.rect || { width: 0, height: 0, left: 0, top: 0 },
  };
}

function createFakeDocument() {
  const root = createFakeElement();
  return {
    documentElement: root,
    fullscreenElement: null,
    _root: root,
  };
}

// Fake dom-manager: query by selector key, waitFor resolves at once.
function createFakeDom(elements) {
  return {
    query: (key) => elements[key] || null,
    queryAll: () => [],
    waitFor: (key) => Promise.resolve(elements[key] || null),
  };
}

const quietLogger = {
  debug: () => {},
  info: () => {},
  error: () => {},
  warn: () => {},
};

module.exports = {
  createFakeElement,
  createFakeDocument,
  createFakeDom,
  quietLogger,
};
