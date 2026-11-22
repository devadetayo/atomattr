import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import type { Node } from '../document/types';
import { IconBtn } from '../components/ui';
import { T } from '../theme';

/* A row-based editor for a node's custom HTML attributes: name, value, remove.
   Names are checked as you type, bare names (no value) become boolean attributes, and common attributes
   are one click away. Replaces the old "name=value per line" textarea. */

type Attrs = Record<string, string | boolean>;
type Row = { id: number; k: string; v: string };

export const ATTR_NAME = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;
const SUGGEST: { k: string; v: string; hint: string }[] = [
  { k: 'id', v: '', hint: 'Anchor target' },
  { k: 'aria-label', v: '', hint: 'Accessible name' },
  { k: 'title', v: '', hint: 'Tooltip' },
  { k: 'role', v: '', hint: 'ARIA role' },
  { k: 'data-', v: '', hint: 'Data attribute' },
  { k: 'tabindex', v: '0', hint: 'Focusable' },
  { k: 'target', v: '_blank', hint: 'Open in new tab' },
  { k: 'rel', v: 'noopener noreferrer', hint: 'Link safety' },
];
const RESERVED = new Set(['style', 'className', 'key', 'ref']);

export function attrProblem(k: string, all: Row[], id: number): string | null {
  const name = k.trim();
  if (!name) return null;
  if (!ATTR_NAME.test(name)) return 'Use letters, numbers, - _ : . and start with a letter';
  if (RESERVED.has(name)) return `“${name}” is set by Studio. Use the design panels instead.`;
  if (all.some(r => r.id !== id && r.k.trim() === name)) return 'Already added';
  return null;
}
const toRows = (a: Attrs | undefined, next: () => number): Row[] => Object.entries(a || {}).map(([k, v]) => ({ id: next(), k, v: v === true ? '' : String(v) }));
const toAttrs = (rows: Row[]): Attrs => {
  const out: Attrs = {};
  for (const r of rows) { const k = r.k.trim(); if (!k || attrProblem(k, rows, r.id)) continue; out[k] = r.v === '' ? true : r.v; }
  return out;
};
const same = (a: Attrs, b: Attrs) => { const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every(k => a[k] === b[k]); };

const input = (extra: Record<string, unknown> = {}) => ({ h: '28px', px: '2', fontSize: 'sm', 'min-w': '0', ...T.field, ...extra });

export function AttrEditor({ node }: { node: Node }) {
  const seq = useRef(0); const next = () => ++seq.current;
  const [rows, setRows] = useState<Row[]>(() => toRows(node.attrs, next));
  const last = useRef<Attrs>(toAttrs(rows));
  const focusId = useRef<number | null>(null);

  /* an outside change (undo, other panel, other selection) replaces the rows; our own commits do not */
  useEffect(() => {
    const cur = (node.attrs || {}) as Attrs;
    if (same(cur, last.current)) return;
    last.current = cur; setRows(toRows(cur, next));
  }, [node.id, node.attrs]);
  useEffect(() => { last.current = (node.attrs || {}) as Attrs; setRows(toRows(node.attrs, next)); }, [node.id]);

  const commit = (list: Row[]) => {
    const a = toAttrs(list);
    if (same(a, last.current)) return;
    last.current = a; S.setCustomAttrs([node.id], a);
  };
  const edit = (id: number, patch: Partial<Row>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) => setRows(rs => { const n = rs.filter(r => r.id !== id); commit(n); return n; });
  const focusField = useRef<'k' | 'v'>('k');
  const add = (k = '', v = '') => {
    focusField.current = k && !k.endsWith('-') ? 'v' : 'k';
    setRows(rs => {
      const blank = rs.find(r => !r.k.trim() && !r.v);
      const id = blank ? blank.id : next(); focusId.current = id;
      const n = blank ? rs.map(r => (r.id === id ? { id, k, v } : r)) : [...rs, { id, k, v }];
      if (k) commit(n);
      return n;
    });
  };
  useEffect(() => {
    if (focusId.current === null) return;
    const el = document.querySelector<HTMLInputElement>(`[data-attr-${focusField.current === 'v' ? 'value' : 'name'}="${focusId.current}"]`);
    if (el) { el.focus(); const n = el.value.length; el.setSelectionRange(n, n); }
    focusId.current = null;
  });
  const onKey = (e: React.KeyboardEvent, r: Row, field: 'k' | 'v') => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); if (field === 'v' && r.k.trim()) add(); }
    if (e.key === 'Escape') (e.target as HTMLElement).blur();
  };
  const used = new Set(rows.map(r => r.k.trim()));
  const open = SUGGEST.filter(s => s.k === 'data-' || !used.has(s.k));
  const isLink = node.type === 'button' || !!node.href;

  return (
    <Box display="flex" flex-col gap="2">
      {rows.length === 0 && (
        <Box p="3" {...T.card} display="flex" flex-col gap="1">
          <Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>No custom attributes</Txt>
          <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Add accessibility labels, anchors, data attributes or anything else the exported HTML needs.</Txt>
        </Box>
      )}

      {rows.map(r => {
        const problem = attrProblem(r.k, rows, r.id);
        const handler = /^on/i.test(r.k.trim()) && !problem;
        return (
          <Box key={r.id} display="flex" flex-col gap="1">
            <Row gap="1" items="center" min-w="0">
              <Box as="input" data-attr-name={r.id} value={r.k} placeholder="name" aria-label="Attribute name" aria-invalid={!!problem} spellCheck={false} autoCapitalize="off" list="attr-names"
                onChange={(e: any) => edit(r.id, { k: e.target.value })} onBlur={() => commit(rows)} onKeyDown={(e: React.KeyboardEvent) => onKey(e, r, 'k')}
                flex="1" font-mono {...input(problem ? { 'border-color': 'danger', 'dark-border-color': 'danger' } : {})} />
              <Box as="input" data-attr-value={r.id} value={r.v} placeholder="value" aria-label={`Value of ${r.k || 'attribute'}`} spellCheck={false}
                onChange={(e: any) => edit(r.id, { v: e.target.value })} onBlur={() => commit(rows)} onKeyDown={(e: React.KeyboardEvent) => onKey(e, r, 'v')}
                flex="1.4" {...input()} />
              <IconBtn icon="close" title={`Remove ${r.k || 'attribute'}`} size={26} iconSize={14} onClick={() => remove(r.id)} />
            </Row>
            {problem && <Txt fontSize="sm" m="0" text="danger" px="1">{problem}</Txt>}
            {handler && <Txt fontSize="sm" m="0" text="warning" px="1">Event handlers run in exported pages. Only add code you trust.</Txt>}
          </Box>
        );
      })}

      <datalist id="attr-names">{SUGGEST.filter(s => s.k !== 'data-').map(s => <option key={s.k} value={s.k} />)}</datalist>

      <Row gap="1" wrap>
        {open.map(sg => (
          <Btn key={sg.k} type="button" title={sg.hint} onClick={() => add(sg.k, sg.v)} h="24px" px="2" border="0" rounded="full" cursor="pointer" fontSize="sm" font-mono whitespace="nowrap" bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/10" dark-hover-bg="white/10" {...T.muted}>
            + {sg.k === 'data-' ? 'data-…' : sg.k}
          </Btn>
        ))}
        <Btn type="button" onClick={() => add()} h="24px" px="3" border="0" rounded="full" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" text="white">Add attribute</Btn>
      </Row>
      {isLink && !used.has('aria-label') && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Tip: icon-only buttons and links need an <Box as="span" font-mono>aria-label</Box>.</Txt>}
    </Box>
  );
}
