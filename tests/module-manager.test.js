// OneYT — module-manager tests (node:test).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createModuleManager } = require('../content/core/module-manager');

const quietLogger = { debug: () => {}, error: () => {} };
const SETTINGS_ON = { enabled: true, modules: { good: true, boom: true } };

test('register rejects modules without an id or any lifecycle method', () => {
  const mm = createModuleManager({ logger: quietLogger });
  assert.equal(mm.register({}), false);
  assert.equal(mm.register({ id: 'x' }), false);
  assert.equal(mm.register(null), false);
});

test('register rejects a duplicate id', () => {
  const mm = createModuleManager({ logger: quietLogger });
  assert.equal(mm.register({ id: 'a', apply: () => {} }), true);
  assert.equal(mm.register({ id: 'a', apply: () => {} }), false);
});

test('a throwing module is disabled, the others keep running', () => {
  const mm = createModuleManager({ logger: quietLogger });
  let goodApplied = 0;
  mm.register({
    id: 'good',
    init: () => {},
    apply: () => {
      goodApplied++;
    },
    enable: () => {},
    disable: () => {},
  });
  mm.register({
    id: 'boom',
    apply: () => {
      throw new Error('boom');
    },
    enable: () => {},
    disable: () => {},
  });
  mm.initAll({});
  mm.updateAll(SETTINGS_ON, 'watch');
  assert.equal(mm.isEnabled('good'), true);
  assert.equal(mm.isEnabled('boom'), false);
  assert.equal(goodApplied, 1);
});

test('updateAll respects settings.enabled=false and per-module flags', () => {
  const mm = createModuleManager({ logger: quietLogger });
  mm.register({ id: 'good', apply: () => {}, enable: () => {}, disable: () => {} });
  mm.updateAll({ enabled: false, modules: { good: true } }, 'watch');
  assert.equal(mm.isEnabled('good'), false);
  mm.updateAll({ enabled: true, modules: { good: false } }, 'watch');
  assert.equal(mm.isEnabled('good'), false);
  mm.updateAll({ enabled: true, modules: { good: true } }, 'watch');
  assert.equal(mm.isEnabled('good'), true);
});

test('disable on an unknown module returns false, destroy clears the registry', () => {
  const mm = createModuleManager({ logger: quietLogger });
  assert.equal(mm.disable('nope'), false);
  mm.register({ id: 'a', apply: () => {} });
  mm.destroy();
  assert.deepEqual(mm.listIds(), []);
});
