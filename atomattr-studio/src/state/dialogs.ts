import { useSyncExternalStore } from 'react';

/**
 * Promise-based dialog queue. It replaces the browser's alert / confirm / prompt:
 *   if (await confirmDialog({ title: 'Delete page?', tone: 'danger' })) ...
 * Dialogs are shown one at a time, in the order they were asked for. <DialogHost /> (components/Dialogs.tsx) renders the active one.
 * Dismissing a dialog (Esc, the backdrop, Cancel) always resolves to the "no" value: false, 'cancel' or null.
 */
export type DialogTone = 'default' | 'danger';
type Base = { title: string; message?: string; icon?: string; tone?: DialogTone };
export type ConfirmSpec = Base & { kind: 'confirm'; confirmLabel?: string; cancelLabel?: string };
export type ChoiceAction = { id: string; label: string; tone?: 'primary' | 'danger' | 'quiet' };
export type ChoiceSpec = Base & { kind: 'choice'; actions: ChoiceAction[] };
export type InputField = { key: string; label: string; value?: string; placeholder?: string; type?: 'text' | 'number'; min?: number; max?: number; suffix?: string };
export type InputSpec = Base & { kind: 'input'; fields: InputField[]; confirmLabel?: string; cancelLabel?: string; validate?: (values: Record<string, string>) => string | null };
export type DialogSpec = ConfirmSpec | ChoiceSpec | InputSpec;
export type ActiveDialog = { id: number; spec: DialogSpec; resolve: (value: any) => void };

let nextId = 0;
let current: ActiveDialog | null = null;
const queue: ActiveDialog[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const snapshot = () => current;

function pump() { if (!current && queue.length) { current = queue.shift()!; emit(); } }
function ask<T>(spec: DialogSpec): Promise<T> {
  return new Promise<T>(resolve => { queue.push({ id: ++nextId, spec, resolve }); pump(); });
}

/** Close the dialog on screen with `value` and move on to the next one waiting. */
export function settleDialog(id: number, value: unknown) {
  if (!current || current.id !== id) return;
  const done = current; current = null; emit(); done.resolve(value); pump();
}

export const confirmDialog = (spec: Omit<ConfirmSpec, 'kind'>) => ask<boolean>({ kind: 'confirm', ...spec });
/** Resolves to the id of the chosen action, or 'cancel' when dismissed. */
export const choiceDialog = (spec: Omit<ChoiceSpec, 'kind'>) => ask<string>({ kind: 'choice', ...spec });
/** Resolves to the field values keyed by `field.key`, or null when cancelled. */
export const inputDialog = (spec: Omit<InputSpec, 'kind'>) => ask<Record<string, string> | null>({ kind: 'input', ...spec });
/** One text field. Resolves to the text (trimmed) or null when cancelled. */
export async function textDialog(spec: Omit<InputSpec, 'kind' | 'fields'> & { label: string; value?: string; placeholder?: string; required?: boolean }): Promise<string | null> {
  const { label, value, placeholder, required, validate, ...rest } = spec;
  const out = await inputDialog({ ...rest, fields: [{ key: 'text', label, value, placeholder }], validate: v => (required && !v.text.trim() ? `${label} can't be empty.` : validate ? validate(v) : null) });
  return out ? out.text.trim() : null;
}

export const useDialog = () => useSyncExternalStore(subscribe, snapshot, snapshot);
/** Test hook: drop everything that is open or waiting (their promises resolve to the dismissed value). */
export function _clearDialogs() {
  const all = [current, ...queue].filter(Boolean) as ActiveDialog[]; current = null; queue.length = 0; emit();
  all.forEach(d => d.resolve(d.spec.kind === 'confirm' ? false : d.spec.kind === 'choice' ? 'cancel' : null));
}
export const _activeDialog = () => current;
