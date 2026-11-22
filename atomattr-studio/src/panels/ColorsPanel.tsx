import { useMemo, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { usedColors, normalizeColor, type ColorRole } from '../document/colors';
import { EmptyState, IconBtn, Seg } from '../components/ui';
import { ToolIcon } from '../components/ToolIcons';
import { T } from '../theme';

/* Used colors: every colour in the project as a card. Click a card to select the objects that use it,
   then copy it, add it to the palette, or replace it everywhere (one undo step). */

type Filter = 'all' | ColorRole;
const ROLE_LABEL: Record<ColorRole, string> = { fill: 'Fill', stroke: 'Border', text: 'Text', tint: 'Tint' };
const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());

export function ColorsPanel() {
  const s = useStudio(); const project = s.project!;
  const all = useMemo(() => usedColors(project), [project]);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const list = filter === 'all' ? all : all.filter(c => c.roles.includes(filter));
  const palette = new Set(project.colors.map(normalizeColor));
  const sel = open ? all.find(c => c.hex === open) : undefined;

  const use = (hex: string) => { const c = all.find(x => x.hex === hex); if (!c) return; S.select(c.nodeIds); setOpen(open === hex ? null : hex); setTo(hex.slice(0, 7)); };
  const replace = () => {
    if (!sel || !isHex(to)) { S.toast('Enter a hex colour like #3b82f6.', 'error'); return; }
    const n = S.replaceColorEverywhere(sel.hex, to.startsWith('#') ? to : `#${to}`);
    S.toast(n ? `Replaced ${n} ${n === 1 ? 'use' : 'uses'}. Undo with Ctrl+Z.` : 'Nothing to replace.'); setOpen(null);
  };
  const addPalette = (hex: string) => { if (palette.has(hex)) return; S.setProject({ ...project, colors: [...project.colors, hex] }, { history: true }); S.toast('Added to the palette.'); };
  const copy = (hex: string) => { try { void navigator.clipboard.writeText(hex); S.toast(`Copied ${hex}`); } catch { S.toast(hex); } };

  if (!all.length) return <EmptyState icon="brush" title="No colours yet" hint="Fill, border and text colours you use on the page show up here." />;
  return (
    <Box display="flex" flex-col gap="3" p="3">
      <Row items="center" justify="between" gap="2">
        <Txt fontSize="sm" fontWeight="700" m="0" {...T.text}>{all.length} {all.length === 1 ? 'colour' : 'colours'} in use</Txt>
      </Row>
      <Seg value={filter} onChange={setFilter} options={[{ v: 'all', label: 'All' }, { v: 'fill', label: 'Fill' }, { v: 'text', label: 'Text' }, { v: 'stroke', label: 'Border' }]} />
      <Row gap="2" wrap role="list" aria-label="Colours in use">
        {list.map(c => {
          const on = open === c.hex;
          return <Btn key={c.hex} type="button" role="listitem" aria-pressed={on} title={`${c.hex} · ${c.count} ${c.count === 1 ? 'use' : 'uses'} · ${c.roles.map(r => ROLE_LABEL[r]).join(', ')}`} aria-label={`${c.hex}, used ${c.count} times. Select objects`} onClick={() => use(c.hex)}
            w="22px" h="22px" p="0" shrink="0" rounded="full" cursor="pointer" bg={c.hex} border={on ? '2px solid' : '1px solid'} border-color={on ? 'primary' : 'gray-900/15'} dark-border-color={on ? 'white' : 'white/20'} position="relative" hover-opacity="85"
            {...(on ? { shadow: 'md' } : {})} />;
        })}
      </Row>
      {list.length === 0 && <Txt fontSize="sm" m="0" {...T.muted}>No colours of that kind.</Txt>}

      {sel && <Box display="flex" flex-col gap="2" p="3" {...T.card} role="region" aria-label={`Actions for ${sel.hex}`}>
        <Row items="center" gap="2"><Box w="20px" h="20px" rounded="lg" shrink="0" bg={sel.hex} border="1px solid" border-color="gray-900/15" /><Txt fontSize="sm" fontWeight="700" font-mono m="0" flex="1" {...T.text}>{sel.hex}</Txt>
          <IconBtn icon="copy" title="Copy hex" size={26} iconSize={14} onClick={() => copy(sel.hex)} />
          <IconBtn icon="close" title="Close" size={26} iconSize={14} onClick={() => setOpen(null)} /></Row>
        <Txt fontSize="sm" m="0" {...T.muted}>{sel.nodeIds.length} {sel.nodeIds.length === 1 ? 'object' : 'objects'} selected on the canvas.</Txt>
        <Row gap="2" items="center">
          <Box as="input" value={to} aria-label="Replace with" placeholder="#hex" spellCheck={false} onChange={(e: any) => setTo(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') replace(); }} flex="1" min-w="0" h="30px" px="2" fontSize="sm" font-mono {...T.field} />
          <Box w="30px" h="30px" rounded="lg" shrink="0" bg={isHex(to) ? to : 'transparent'} border="1px solid" border-color="gray-900/15" />
        </Row>
        <Row gap="2">
          <Btn type="button" onClick={replace} h="30px" px="3" flex="1" border="0" rounded="lg" cursor="pointer" bg="primary" text="white" fontSize="sm" fontWeight="600">Replace everywhere</Btn>
          <Btn type="button" disabled={palette.has(sel.hex)} onClick={() => addPalette(sel.hex)} h="30px" px="3" cursor="pointer" fontSize="sm" fontWeight="600" {...T.card} {...T.text}>{palette.has(sel.hex) ? 'In palette' : 'Add to palette'}</Btn>
        </Row>
      </Box>}
    </Box>
  );
}
