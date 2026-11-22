import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/* DOM-level check of <DialogHost />. AtomAttr's components are replaced by plain elements (the engine is not needed to test behaviour). */
const dom = new JSDOM('<!doctype html><body><button id="opener">open</button><div id="root"></div></body>', { pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, KeyboardEvent: dom.window.KeyboardEvent, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
const { DialogHost } = await import('../src/components/Dialogs');
const D = await import('../src/state/dialogs');

const root = createRoot(document.getElementById('root')!);
await act(async () => { root.render(<DialogHost />); });
const q = (s: string) => document.querySelector(s) as HTMLElement | null;
const tick = () => act(async () => { await new Promise(r => setTimeout(r, 10)); });
const key = (k: string, extra: any = {}, target: Element = document.activeElement || document.body) => act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra })); });
const click = (el: Element) => act(async () => { (el as HTMLElement).click(); });
const typeInto = (el: HTMLInputElement, v: string) => act(async () => {
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!; set.call(el, v); el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
});
const opener = document.getElementById('opener')!;

test('a destructive confirm focuses Cancel, Esc dismisses to false, and focus returns to the opener', async () => {
  opener.focus();
  let result: unknown; await act(async () => { D.confirmDialog({ title: 'Delete page?', message: 'Gone.', tone: 'danger', confirmLabel: 'Delete page' }).then(v => { result = v; }); });
  await tick();
  const dlg = q('[role="alertdialog"]')!;
  assert.ok(dlg, 'dialog is shown'); assert.equal(dlg.getAttribute('aria-modal'), 'true');
  assert.ok(document.getElementById(dlg.getAttribute('aria-labelledby')!)?.textContent === 'Delete page?');
  assert.equal(document.activeElement?.textContent, 'Cancel', 'safe default on destructive dialogs');
  await key('Escape'); await tick();
  assert.equal(result, false); assert.equal(q('[role="alertdialog"]'), null);
  assert.equal(document.activeElement, opener);
});

test('Enter on the focused confirm button confirms; Tab wraps inside the dialog', async () => {
  let result: unknown; await act(async () => { D.confirmDialog({ title: 'Reset workspace?', confirmLabel: 'Reset workspace' }).then(v => { result = v; }); });
  await tick();
  assert.equal(document.activeElement?.textContent, 'Reset workspace', 'non-destructive: the confirming button has focus');
  const buttons = Array.from(document.querySelectorAll('[role="alertdialog"] button'));
  assert.equal(buttons.length, 2);
  await key('Tab'); assert.equal(document.activeElement, buttons[0], 'Tab from the last button wraps to the first');
  await key('Tab', { shiftKey: true }); assert.equal(document.activeElement, buttons[1], 'Shift+Tab from the first wraps to the last');
  await click(buttons[1]); assert.equal(result, true);
});

test('Save / Discard / Cancel resolve to their ids', async () => {
  for (const want of ['save', 'discard', 'cancel']) {
    let got: unknown; await act(async () => { D.choiceDialog({ title: 'Unsaved changes', actions: [{ id: 'cancel', label: 'Cancel', tone: 'quiet' }, { id: 'discard', label: 'Discard', tone: 'danger' }, { id: 'save', label: 'Save', tone: 'primary' }] }).then(v => { got = v; }); });
    await tick();
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase() === want)!;
    await click(btn); assert.equal(got, want);
  }
});

test('input dialog: focuses the field, blocks invalid values with a message, Enter submits valid ones', async () => {
  let got: unknown; await act(async () => {
    D.inputDialog({ title: 'Custom viewport', confirmLabel: 'Apply size', fields: [{ key: 'width', label: 'Width', value: '100', type: 'number', min: 240 }], validate: v => (Number(v.width) >= 240 ? null : 'Width must be at least 240 px.') }).then(v => { got = v; });
  });
  await tick();
  const input = q('input') as HTMLInputElement;
  assert.equal(document.activeElement, input);
  await key('Enter', {}, input);
  assert.equal(got, undefined, 'invalid value does not close the dialog');
  assert.match(q('[role="alert"]')?.textContent || '', /at least 240/);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  await typeInto(input, '390');
  assert.equal(q('[role="alert"]'), null, 'editing clears the message');
  await key('Enter', {}, input); await tick();
  assert.deepEqual(got, { width: '390' }); assert.equal(q('[role="dialog"]'), null);
});

test('Esc on an input dialog resolves null; keys never leak to the editor shortcuts while a dialog is open', async () => {
  let got: unknown = 'pending'; await act(async () => { D.textDialog({ title: 'Create version snapshot', label: 'Snapshot name' }).then(v => { got = v; }); });
  await tick();
  let leaked = 0; const spy = (e: Event) => { if ((e as KeyboardEvent).key === 'Delete') leaked++; };
  window.addEventListener('keydown', spy);
  await key('Delete'); await key('Backspace', {}, document.body);
  window.removeEventListener('keydown', spy);
  assert.equal(leaked, 0, 'Delete does not reach window listeners (the editor deletes the selection on Delete)');
  await key('Escape'); await tick();
  assert.equal(got, null);
});

test('clicking the backdrop dismisses', async () => {
  let result: unknown; await act(async () => { D.confirmDialog({ title: 'Delete project?' }).then(v => { result = v; }); });
  await tick();
  const dlg = q('[role="alertdialog"]')!;
  await act(async () => { dlg.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })); }); // inside the box: stays open
  assert.equal(q('[role="alertdialog"]') !== null, true);
  await act(async () => { dlg.parentElement!.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })); });
  assert.equal(result, false);
});

test('queued dialogs show one after another', async () => {
  const seen: string[] = [];
  await act(async () => { D.confirmDialog({ title: 'First' }).then(() => seen.push('1')); D.confirmDialog({ title: 'Second' }).then(() => seen.push('2')); });
  await tick(); assert.match(q('[role="alertdialog"]')!.textContent!, /First/);
  await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Confirm')!); await tick();
  assert.match(q('[role="alertdialog"]')!.textContent!, /Second/);
  await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Cancel')!); await tick();
  assert.deepEqual(seen, ['1', '2']);
});
