/**
 * Release notes shown in the What's New dialog. Newest first. To ship a new version: add an entry at the top and bump APP_VERSION
 * (and package.json). Everyone sees the newest entry once; the older ones stay in Help > What's new.
 */
export type NoteKind = 'feature' | 'improvement' | 'fix';
export type ReleaseNote = { kind: NoteKind; icon: string; title: string; text: string };
export type Release = { version: string; date?: string; headline: string; notes: ReleaseNote[] };

export const APP_VERSION = '0.2.0';

export const RELEASES: Release[] = [
  {
    version: '0.2.0', date: '2026-11-08', headline: 'Calmer dialogs, clearer changes',
    notes: [
      { kind: 'feature', icon: 'sparkle', title: "What's New", text: 'See what changed after every update. Older notes live in Help > What’s new.' },
      { kind: 'feature', icon: 'info', title: 'Confirmation dialogs', text: 'Deleting a project or page, resetting the workspace and restoring a snapshot now ask in the Studio’s own dialogs, not the browser’s.' },
      { kind: 'improvement', icon: 'pencil', title: 'Names and sizes in dialogs', text: 'Naming a snapshot and setting a custom viewport use proper input dialogs with validation.' },
      { kind: 'improvement', icon: 'layers', title: 'Dark glass', text: 'The New project dialog and its cards are now frosted glass like the rest of the interface.' },
      { kind: 'fix', icon: 'save', title: 'Leaving with unsaved changes', text: 'If the browser could not keep your latest changes, closing a project offers Save, Discard or Cancel.' },
    ],
  },
  {
    version: '0.1.0', headline: 'Workspace and top bar',
    notes: [
      { kind: 'feature', icon: 'fountain', title: 'Palette layouts', text: 'Float the colour palette horizontally or vertically, or dock it to the bottom or right edge.' },
      { kind: 'feature', icon: 'pages', title: 'Pages clip in', text: 'Drag the pages panel to the top or bottom edge to clip it in as a strip.' },
      { kind: 'improvement', icon: 'zoom', title: 'Zoom dock', text: 'Zoom moved to a floating dock at the bottom centre of the canvas.' },
      { kind: 'improvement', icon: 'sliders', title: 'Responsive top bar', text: 'The top bar measures itself and tucks less-used buttons into More on narrow windows.' },
      { kind: 'fix', icon: 'save', title: 'Save state pill', text: 'Saved, saving and failed saves show as a coloured pill next to the project name.' },
    ],
  },
];

export const KIND_LABEL: Record<NoteKind, string> = { feature: 'New', improvement: 'Improved', fix: 'Fixed' };
export const KIND_ORDER: NoteKind[] = ['feature', 'improvement', 'fix'];

/* ---------- acknowledgement: the newest version the person has dismissed, kept in localStorage ---------- */
export const ACK_KEY = 'atomattr.studio.whatsnew';
const num = (v: string) => v.split('.').map(n => Number(n) || 0);
/** True when `a` is a newer version than `b`. */
export const isNewer = (a: string, b: string) => { const x = num(a), y = num(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };

export function readAck(store: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): string | null {
  try { return store?.getItem(ACK_KEY) || null; } catch { return null; }
}
export function writeAck(version: string, store: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {
  try { store?.setItem(ACK_KEY, version); return !!store; } catch { return false; }
}
/** Show the dialog automatically when this version has not been acknowledged. */
export const shouldAutoShow = (ack: string | null, current = APP_VERSION) => !ack || isNewer(current, ack);
