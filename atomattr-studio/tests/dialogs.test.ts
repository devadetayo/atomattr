import test from 'node:test';
import assert from 'node:assert/strict';
import { _activeDialog, _clearDialogs, choiceDialog, confirmDialog, inputDialog, settleDialog, textDialog } from '../src/state/dialogs';

test('confirm resolves true / false and shows one dialog at a time, in order', async () => {
  _clearDialogs();
  const a = confirmDialog({ title: 'A' }); const b = confirmDialog({ title: 'B', tone: 'danger' });
  assert.equal(_activeDialog()?.spec.title, 'A');
  settleDialog(_activeDialog()!.id, true);
  assert.equal(await a, true);
  assert.equal(_activeDialog()?.spec.title, 'B');
  settleDialog(_activeDialog()!.id, false);
  assert.equal(await b, false);
  assert.equal(_activeDialog(), null);
});

test('a stale id cannot settle the dialog that is on screen', async () => {
  _clearDialogs();
  const p = confirmDialog({ title: 'X' }); const id = _activeDialog()!.id;
  settleDialog(id + 99, true);
  assert.equal(_activeDialog()?.spec.title, 'X');
  settleDialog(id, false); assert.equal(await p, false);
});

test('choice resolves to the picked action id', async () => {
  _clearDialogs();
  const p = choiceDialog({ title: 'Unsaved changes', actions: [{ id: 'cancel', label: 'Cancel' }, { id: 'discard', label: 'Discard' }, { id: 'save', label: 'Save' }] });
  settleDialog(_activeDialog()!.id, 'discard');
  assert.equal(await p, 'discard');
});

test('dismissing resolves to the "no" value of each kind', async () => {
  const c = confirmDialog({ title: 'c' }), h = choiceDialog({ title: 'h', actions: [] }), i = inputDialog({ title: 'i', fields: [] });
  _clearDialogs();
  assert.deepEqual([await c, await h, await i], [false, 'cancel', null]);
});

test('textDialog trims, and requires text when asked', async () => {
  _clearDialogs();
  const p = textDialog({ title: 'Name', label: 'Name', required: true });
  const spec: any = _activeDialog()!.spec;
  assert.equal(spec.validate({ text: '   ' }), "Name can't be empty.");
  assert.equal(spec.validate({ text: 'Hero' }), null);
  settleDialog(_activeDialog()!.id, { text: '  Hero v2 ' });
  assert.equal(await p, 'Hero v2');
});
