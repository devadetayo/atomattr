import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import { useStudio } from '../state/store';
import * as C from '../state/cms-actions';
import type { CustomTab } from '../state/layout';
import type { CustomCode } from '../document/types';
import { T } from '../theme';

export type Scope = 'site' | 'page';
export const CUSTOM_META: Record<CustomTab, { key: keyof CustomCode; label: string; file: string; placeholder: string; hint: string }> = {
  'custom:css': { key: 'css', label: 'CSS', file: 'custom.css', placeholder: '.hero h1 {\n  letter-spacing: -0.02em;\n}', hint: 'Added after the generated styles, so it can override them.' },
  'custom:js': { key: 'js', label: 'JS', file: 'custom.js', placeholder: "document.addEventListener('DOMContentLoaded', () => {\n  \n});", hint: 'Loaded with defer at the end of the page. Never run inside Studio.' },
  'custom:head': { key: 'head', label: 'Head', file: 'head.html', placeholder: '<link rel="preconnect" href="https://fonts.googleapis.com">\n<meta name="theme-color" content="#0f172a">', hint: 'Inserted before </head>: fonts, verification tags. Never run inside Studio.' },
};

/** The custom code held by the project (whole site) or the active page. */
export function useCustomValue(tab: CustomTab, scope: Scope) {
  const s = useStudio(); const p = s.project!; const page = p.pages.find(x => x.id === p.activePageId) || p.pages[0];
  const cur = (scope === 'site' ? p.custom : page.custom) || {};
  const m = CUSTOM_META[tab];
  return { page, value: (cur[m.key] as string) || '', counts: { css: (cur.css || '').length, js: (cur.js || '').length, head: (cur.head || '').length } };
}

export function putCustom(tab: CustomTab, scope: Scope, pageId: string, v: string) {
  const patch = { [CUSTOM_META[tab].key]: v } as Partial<CustomCode>;
  if (scope === 'site') C.setProjectCustom(patch); else C.setPageCustom(pageId, patch);
}

/** Scope switch shown in the toolbar while a custom tab is open. */
export function ScopeSwitch({ scope, onChange, pageName }: { scope: Scope; onChange: (s: Scope) => void; pageName: string }) {
  const opt = (v: Scope, label: string, title: string) => (
    <Btn key={v} type="button" title={title} aria-pressed={scope === v} onClick={() => onChange(v)} h="24px" px="2" border="0" rounded="lg" cursor="pointer" fontSize="sm" fontWeight="600" whitespace="nowrap" {...(scope === v ? { ...T.active, ...T.text } : { bg: 'transparent', ...T.hover, ...T.muted })}>{label}</Btn>
  );
  return <Row items="center" gap="1" p="1" {...T.field} role="group" aria-label="Applies to">{opt('site', 'Site', 'Applies to every page')}{opt('page', 'This page', `Only ${pageName}`)}</Row>;
}

/** The editor itself: a plain monospace textarea that saves as you type. */
export function CustomEditor({ tab, scope, wrap, surface }: { tab: CustomTab; scope: Scope; wrap: boolean; surface: Record<string, unknown> }) {
  const { page, value } = useCustomValue(tab, scope);
  const m = CUSTOM_META[tab];
  const [draft, setDraft] = useState(value);
  const timer = useRef<number | null>(null);
  const key = `${tab}|${scope}|${page.id}`;
  /* reload when the tab, scope or page changes; while typing, our own saves must not reset the caret */
  const lastKey = useRef(key);
  useEffect(() => { if (lastKey.current !== key) { lastKey.current = key; setDraft(value); } }, [key, value]);
  useEffect(() => { if (draft !== value && lastKey.current === key && timer.current === null) setDraft(value); }, [value]); // undo/redo from outside
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const change = (v: string) => {
    setDraft(v);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = null; putCustom(tab, scope, page.id, v); }, 350);
  };
  const flush = () => { if (timer.current) { window.clearTimeout(timer.current); timer.current = null; putCustom(tab, scope, page.id, draft); } };
  const onKey = (e: any) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.target as HTMLTextAreaElement; const a = t.selectionStart; const b = t.selectionEnd;
      const next = `${draft.slice(0, a)}  ${draft.slice(b)}`; change(next);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; });
    }
    e.stopPropagation();
  };
  return (
    <Box as="textarea" value={draft} placeholder={m.placeholder} onChange={(e: any) => change(e.target.value)} onBlur={flush} onKeyDown={onKey} spellCheck={false}
      aria-label={`Custom ${m.label} for ${scope === 'site' ? 'the whole site' : page.name}`}
      flex="1" min-h="0" m="0" p="3" border="0" overflow="auto" fontSize="sm" leading="relaxed" font-mono {...surface}
      {...(wrap ? { whitespace: 'pre-wrap', 'overflow-wrap': 'anywhere' } : { whitespace: 'pre' })} />
  );
}

export function CustomStatus({ tab, scope }: { tab: CustomTab; scope: Scope }) {
  const { value } = useCustomValue(tab, scope); const m = CUSTOM_META[tab];
  return (
    <>
      <Txt fontSize="sm" m="0" flex="1" truncate title={m.hint} {...T.muted}>{m.hint}</Txt>
      <Txt as="span" fontSize="sm" m="0" shrink="0" {...T.muted}>{value ? `${value.split('\n').length} lines` : 'empty'}</Txt>
    </>
  );
}
