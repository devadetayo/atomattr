import test from 'node:test';
import assert from 'node:assert/strict';
import { ACK_KEY, APP_VERSION, KIND_ORDER, RELEASES, isNewer, readAck, shouldAutoShow, writeAck } from '../src/state/releases';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

test('the newest release is the app version, and every note has a known kind', () => {
  assert.equal(RELEASES[0].version, APP_VERSION);
  for (const r of RELEASES) for (const n of r.notes) assert.ok(KIND_ORDER.includes(n.kind), `${r.version}: ${n.title}`);
});

test('versions compare numerically, not as text', () => {
  assert.ok(isNewer('0.10.0', '0.9.0')); assert.ok(isNewer('1.0.0', '0.99.9'));
  assert.ok(!isNewer('0.2.0', '0.2.0')); assert.ok(!isNewer('0.1.0', '0.2.0'));
});

test('shows once per version: first run, then not again, then again for a newer version', () => {
  const store = memory();
  assert.equal(shouldAutoShow(readAck(store), '0.2.0'), true);
  assert.equal(writeAck('0.2.0', store), true);
  assert.equal(store.m.get(ACK_KEY), '0.2.0');
  assert.equal(shouldAutoShow(readAck(store), '0.2.0'), false);
  assert.equal(shouldAutoShow(readAck(store), '0.3.0'), true);
});

test('blocked storage never throws', () => {
  const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  assert.equal(readAck(blocked), null); assert.equal(writeAck('0.2.0', blocked), false);
});
