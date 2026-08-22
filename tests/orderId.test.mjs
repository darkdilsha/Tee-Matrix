// Unit tests for order id generation.
//   node tests/orderId.test.mjs
//
// These are the assertions that would have caught the original bug: ids built from
// `Date.now().toString().slice(-4)` recycle every 10 seconds, so both the bulk-uniqueness
// test and the 10-second-apart test fail against the old scheme.
import assert from 'assert';
import { generateOrderId, isUniqueViolation } from '../lib/orderId.js';

let pass = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    pass++;
  } catch (err) {
    console.error(`  FAIL  ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n=== order id generation ===\n');

test('100,000 ids are all distinct', () => {
  const seen = new Set();
  for (let i = 0; i < 100000; i++) seen.add(generateOrderId());
  assert.strictEqual(seen.size, 100000, `only ${seen.size} distinct ids`);
});

test('ids match the expected format', () => {
  for (let i = 0; i < 1000; i++) {
    const id = generateOrderId();
    assert.match(id, /^TM-[0-9A-Z]+-[0-9A-F]{8}$/, `bad format: ${id}`);
  }
});

test('timestamps exactly 10s apart do not collide', () => {
  // The precise failure mode of the old scheme: 10,000 ms later, the last four digits repeat.
  const base = 1755782400000;
  assert.notStrictEqual(generateOrderId(base), generateOrderId(base + 10000));
});

test('same millisecond still yields distinct ids', () => {
  const base = 1755782400000;
  const seen = new Set();
  for (let i = 0; i < 10000; i++) seen.add(generateOrderId(base));
  assert.strictEqual(seen.size, 10000, `only ${seen.size} distinct within one millisecond`);
});

test('ids sort chronologically by their timestamp prefix', () => {
  const base = 1755782400000;
  const earlier = generateOrderId(base);
  const later = generateOrderId(base + 60000);
  assert.ok(earlier < later, `${earlier} should sort before ${later}`);
});

console.log('\n=== unique violation detection ===\n');

test('detects a PostgREST 23505 error', () => {
  const err = new Error('Supabase query error (409): {"code":"23505","message":"duplicate key"}');
  assert.strictEqual(isUniqueViolation(err), true);
});

test('does not treat other errors as collisions', () => {
  assert.strictEqual(isUniqueViolation(new Error('Supabase query error (500): timeout')), false);
  assert.strictEqual(isUniqueViolation(new Error('fetch failed')), false);
  assert.strictEqual(isUniqueViolation(undefined), false);
  assert.strictEqual(isUniqueViolation(null), false);
});

console.log(`\n=== ${pass} passed${process.exitCode ? ', some failed' : ''} ===\n`);
