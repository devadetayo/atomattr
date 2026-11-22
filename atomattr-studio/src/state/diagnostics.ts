import { getState } from './store';

/** Beta build label, shown in the About window and in every report. */
export const BETA = { version: '0.3.0-beta.1', label: 'Beta' };
/** Set this to receive reports by email from the "Send feedback" window. Left empty, reports can be copied or downloaded. */
export const FEEDBACK_EMAIL = '';

const errors: { at: string; message: string }[] = [];
export function recordError(e: unknown) {
  const message = e instanceof Error ? `${e.name}: ${e.message}${e.stack ? '\n' + e.stack.split('\n').slice(1, 4).join('\n') : ''}` : String(e);
  errors.push({ at: new Date().toISOString(), message: message.slice(0, 600) }); if (errors.length > 20) errors.shift();
}
export const recentErrors = () => errors.slice();
let installed = false;
export function installErrorLog() {
  if (installed || typeof window === 'undefined') return; installed = true;
  window.addEventListener('error', ev => recordError(ev.error || ev.message));
  window.addEventListener('unhandledrejection', ev => recordError(ev.reason));
}

const count = (n: { children?: unknown[] } | undefined): number => !n ? 0 : 1 + (n.children || []).reduce<number>((a, k) => a + count(k as { children?: unknown[] }), 0);

/** A plain-text report a tester can paste or send. It holds no project content, only sizes and the environment. */
export function buildReport(note = '', includeErrors = true): string {
  const p = getState().project;
  const lines = [
    `AtomAttr Studio ${BETA.version}`,
    `When: ${new Date().toString()}`,
    `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
    `Screen: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x` : 'unknown'}`,
    p ? `Project: ${p.pages.length} page(s), ${p.pages.reduce((a, pg) => a + count(pg.root as never), 0)} objects, ${(p.collections || []).length} collection(s), ${(p.assets || []).length} asset(s)` : 'Project: none open',
  ];
  if (note.trim()) lines.push('', 'What happened:', note.trim());
  if (includeErrors) { const e = recentErrors(); lines.push('', e.length ? `Recent errors (${e.length}):` : 'Recent errors: none', ...e.map(x => `- ${x.at} ${x.message}`)); }
  return lines.join('\n');
}

/** The open project as a JSON backup, for the crash screen. Returns null when nothing is open. */
export function projectBackupJson(): string | null { const p = getState().project; return p ? JSON.stringify(p) : null; }
