import test from 'node:test';
import assert from 'node:assert/strict';
import { addReply, mergeComments, newThread, openCount, parseComments, setResolved } from '../src/document/comments';

const t1 = newThread('t1', 'Ada', 'Make this bigger', 'pg', 'n1', 100);
test('threads, replies and resolve', () => {
  let l = [t1]; l = addReply(l, 't1', 'r1', 'Cody', 'Done', 200); l = setResolved(l, 't1', true, 300);
  assert.equal(l[0].replies.length, 1); assert.equal(l[0].resolved, true); assert.equal(openCount(l), 0);
  assert.equal(addReply(l, 't1', 'r2', 'x', '   ', 1)[0].replies.length, 1);
});
test('merging keeps everything and the newest resolve state', () => {
  const mine = [addReply([t1], 't1', 'r1', 'Cody', 'Looking', 200)[0]];
  const theirs = [{ ...addReply([t1], 't1', 'r2', 'Ada', 'Thanks', 250)[0], resolved: true, updatedAt: 400 }, newThread('t2', 'Ada', 'New', 'pg', undefined, 300)];
  const { merged, added, updated } = mergeComments(mine, theirs);
  assert.equal(added, 1); assert.equal(updated, 1); assert.equal(merged.length, 2);
  assert.deepEqual(merged[0].replies.map(r => r.id), ['r1', 'r2']); assert.equal(merged[0].resolved, true);
  assert.equal(mergeComments(merged, merged).added + mergeComments(merged, merged).updated, 0);
});
test('files from outside are sanitised', () => {
  const out = parseComments({ comments: [{ id: 'a', text: 'x'.repeat(9000), pageId: 'p', replies: [{ nope: 1 }] }, { text: 'no id' }, 7] });
  assert.equal(out.length, 1); assert.equal(out[0].text.length, 4000); assert.equal(out[0].replies.length, 0); assert.equal(out[0].author, 'Anonymous');
});
