/** Tiny window events so the canvases can talk to the status bar and "fit" command without re-rendering the whole workspace. */
export const CURSOR_EVENT = 'atomattr-studio:cursor';
export const FIT_EVENT = 'atomattr-studio:fit';

export function emitCursor(x: number | null, y = 0) {
  window.dispatchEvent(new CustomEvent(CURSOR_EVENT, { detail: x === null ? null : { x: Math.round(x), y: Math.round(y) } }));
}
export function requestFit() { window.dispatchEvent(new Event(FIT_EVENT)); }
export function onFit(callback: () => void) {
  window.addEventListener(FIT_EVENT, callback);
  return () => window.removeEventListener(FIT_EVENT, callback);
}
