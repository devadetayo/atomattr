import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { DOCKERS, DOCKER_GROUPS, DOCKER_META, PRESETS, activePreset, type DockerId, type Preset } from '../state/layout';
import { T } from '../theme';
import { ToolIcon } from './ToolIcons';
import { Kbd } from './ui';
import { confirmResetWorkspace } from '../state/confirm';

/* Top-bar controls for the dock system, built only from AtomAttr attributes.
   PresetMenu  – switch the whole arrangement (Design, Typography, Assets, Code, Responsive QA).
   PanelsMenu  – search every panel by name or by what it does; open it, bring it forward, or close it.
   PanelStrip  – one-click toggles for the panels used most. */

const Chevron = () => <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="m2 3.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** Where a panel currently lives, in words. */
function placeOf(id: DockerId, l = S.getState().layout): string | null {
  const w = S.winOf(id, l); if (!w) return null;
  return `${w.tabs.length > 1 ? 'Tab · ' : ''}${w.dock ? `Docked ${w.dock}` : 'Floating'}`;
}

/** Click-away layer under a popover. */
function Scrim({ onClose }: { onClose: () => void }) {
  return <Box position="fixed" top="0" left="0" w="100vw" h="100vh" z="89" onPointerDown={onClose} />;
}

/* ---------- presets ---------- */

export function PresetMenu() {
  const s = useStudio(); const open = s.presetMenu; const cur = activePreset(s.layout);
  const close = () => S.setState({ presetMenu: false });
  return (
    <Box position="relative">
      <Btn type="button" title="Workspace preset (Alt+1 to Alt+5)" aria-haspopup="menu" aria-expanded={open} onClick={() => S.setState({ presetMenu: !open, panelMenu: false })}
        h="36px" px="2" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" {...(open ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}>
        <Row items="center" gap="2"><ToolIcon n={cur?.icon ?? 'window'} size={18} /><Txt m="0" display="none" md-display="inline" whitespace="nowrap">{cur?.name ?? 'Layout'}</Txt><Chevron /></Row>
      </Btn>
      {open && <>
        <Scrim onClose={close} />
        <Box position="absolute" right="0" top="44px" z="90" {...T.panel} p="1" w="260px" max-w="92vw" role="menu" aria-label="Layout">
          <Txt as="div" fontSize="sm" fontWeight="700" tracking="0.09em" uppercase m="0" pt="8px" px="10px" pb="4px" {...T.muted}>Layout</Txt>
          {PRESETS.map((p, i) => {
            const on = cur?.id === p.id;
            return (
              <Row key={p.id} items="center" gap="3" px="2" h="40px" rounded="lg" role="menuitemradio" aria-checked={on} cursor="pointer" {...(on ? T.active : T.hover)} onClick={() => S.applyPreset(p.id)}>
                <Box w="28px" h="28px" rounded="lg" shrink="0" display="flex" items="center" justify="center" {...(on ? { bg: 'primary/15', 'dark-bg': 'primary/25' } : { ...T.card, ...T.muted })}><ToolIcon n={p.icon} size={18} /></Box>
                <Txt fontSize="sm" fontWeight="600" m="0" flex="1" {...(on ? {} : T.text)}>{p.name}</Txt>
                <Kbd>{`Alt+${i + 1}`}</Kbd>
              </Row>
            );
          })}
          <Box h="1px" my="1" {...T.divider} />
          <Row items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" {...T.hover} onClick={() => { close(); confirmResetWorkspace().then(ok => { if (ok) S.resetWorkspace(); }); }}><ToolIcon n="reset" size={18} /><Txt fontSize="sm" m="0" flex="1">Reset workspace</Txt></Row>
        </Box>
      </>}
    </Box>
  );
}

/* ---------- searchable panel menu ---------- */

const norm = (v: string) => v.toLowerCase();
function search(query: string) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const score = (id: DockerId) => {
    const d = DOCKERS.find(x => x.id === id)!; const m = DOCKER_META[id]; const title = norm(d.title); const hay = `${title} ${norm(d.blurb)} ${m.keys} ${norm(m.group)} ${id}`;
    if (!words.every(w => hay.includes(w))) return -1;
    return words.reduce((n, w) => n + (title.startsWith(w) ? 3 : title.includes(w) ? 2 : 1), 0);
  };
  return DOCKERS.filter(d => d.id !== 'code').map(d => ({ d, sc: score(d.id) })).filter(x => x.sc >= 0).sort((a, b) => b.sc - a.sc).map(x => x.d);
}

export function PanelsMenu() {
  const s = useStudio(); const open = s.panelMenu; const [q, setQ] = useState(''); const [cur, setCur] = useState(0); const input = useRef<HTMLInputElement | null>(null);
  const close = () => S.setState({ panelMenu: false });
  const flat = useMemo(() => (q.trim() ? search(q) : DOCKER_GROUPS.flatMap(g => DOCKERS.filter(d => d.id !== 'code' && DOCKER_META[d.id].group === g))), [q]);
  useEffect(() => { if (open) { setQ(''); setCur(0); requestAnimationFrame(() => input.current?.focus()); } }, [open]);
  useEffect(() => { setCur(c => Math.min(c, Math.max(0, flat.length - 1))); }, [flat.length]);
  const openCount = new Set(s.layout.wins.flatMap(w => w.tabs)).size;

  const row = (d: (typeof DOCKERS)[number]) => {
    const i = flat.indexOf(d); const place = placeOf(d.id, s.layout); const on = i === cur;
    return (
      <Row key={d.id} items="center" gap="3" px="2" rounded="lg" role="option" aria-selected={on} h="40px" cursor="pointer" {...(on ? { bg: 'gray-100', 'dark-bg': 'gray-800' } : {})}
        onPointerEnter={() => setCur(i)} onClick={() => S.focusDocker(d.id)}>
        <Box w="30px" h="30px" rounded="lg" shrink="0" display="flex" items="center" justify="center" {...(place ? { bg: 'primary/15', 'dark-bg': 'primary/25', text: 'primary' } : { ...T.card, ...T.muted })}><ToolIcon n={DOCKER_META[d.id].icon} size={20} /></Box>
        <Txt fontSize="sm" fontWeight="600" m="0" flex="1" truncate {...T.text}>{d.title}</Txt>
        {place && <Btn type="button" title={`Close ${d.title}`} aria-label={`Close ${d.title}`} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={(e: React.MouseEvent) => { e.stopPropagation(); S.closeDocker(d.id); }} w="22px" h="22px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" bg="transparent" {...T.hover} {...T.muted}><ToolIcon n="close" size={14} /></Btn>}
      </Row>
    );
  };

  return (
    <Box position="relative">
      <Btn type="button" title="Panels (Alt+P)" aria-haspopup="dialog" aria-expanded={open} onClick={() => S.setState({ panelMenu: !open, presetMenu: false })}
        h="36px" px="2" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" {...(open ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}>
        <Row items="center" gap="2"><ToolIcon n="panel" size={18} /><Txt m="0" display="none" md-display="inline" whitespace="nowrap">Panels</Txt><Txt m="0" fontSize="sm" fontWeight="700" px="1" rounded="lg" bg="gray-900/8" dark-bg="white/10" {...T.muted}>{openCount}</Txt></Row>
      </Btn>
      {open && <>
        <Scrim onClose={close} />
        <Box position="absolute" right="0" top="44px" z="90" {...T.panel} w="380px" max-w="92vw" overflow="hidden" role="dialog" aria-label="Panels">
          <Row items="center" gap="2" h="44px" px="3" border-b="1px solid" {...T.hairline}>
            <Box {...T.muted} display="flex"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></Box>
            <Input ref={input} type="text" value={q} placeholder="Search panels: layers, font, shadow, links…" aria-label="Search panels" role="combobox" aria-expanded="true"
              onChange={(e: any) => { setQ(e.target.value); setCur(0); }}
              onKeyDown={(e: any) => {
                if (e.key === 'Escape') { close(); e.stopPropagation(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); setCur(c => Math.min(flat.length - 1, c + 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCur(c => Math.max(0, c - 1)); }
                else if (e.key === 'Enter' && flat[cur]) { S.focusDocker(flat[cur].id); close(); }
                e.stopPropagation();
              }} flex="1" h="100%" fontSize="sm" border="0" bg="transparent" {...T.text} />
            <Kbd>Alt+P</Kbd>
          </Row>
          <Box max-h="60vh" overflow-y="auto" p="1" role="listbox">
            {q.trim()
              ? flat.map(row)
              : DOCKER_GROUPS.map(g => (
                <Box key={g}>
                  <Txt fontSize="sm" fontWeight="700" m="0" px="2" pt="2" pb="1" display="block" {...T.muted}>{g.toUpperCase()}</Txt>
                  {flat.filter(d => DOCKER_META[d.id].group === g).map(row)}
                </Box>))}
            {!flat.length && <Txt fontSize="sm" m="0" p="4" display="block" {...T.muted}>No panel matches “{q}”.</Txt>}
          </Box>
          <Row items="center" gap="1" h="38px" px="2" border-t="1px solid" {...T.hairline}>
            <Txt fontSize="sm" m="0" flex="1" {...T.muted}>↑ ↓ choose · Enter open · Esc close</Txt>
            <Btn type="button" onClick={() => { S.tidyFloating(); }} h="26px" px="2" rounded="lg" border="0" bg="transparent" cursor="pointer" fontSize="sm" fontWeight="600" {...T.hover} {...T.text} title="Pull floating panels back into view">Tidy floating</Btn>
            <Btn type="button" onClick={() => { close(); confirmResetWorkspace().then(ok => { if (ok) S.resetWorkspace(); }); }} h="26px" px="2" rounded="lg" border="0" bg="transparent" cursor="pointer" fontSize="sm" fontWeight="600" {...T.hover} {...T.text}>Reset</Btn>
          </Row>
        </Box>
      </>}
    </Box>
  );
}

/* ---------- quick strip ---------- */
const STRIP: DockerId[] = ['layers', 'properties', 'typography', 'assets', 'components', 'checks'];

export function PanelStrip() {
  const s = useStudio();
  return (
    <Row items="center" gap="1" shrink="0" role="toolbar" aria-label="Panels">
      {STRIP.map(id => {
        const d = DOCKERS.find(x => x.id === id)!; const place = placeOf(id, s.layout);
        return (
          <Btn key={id} type="button" title={`${d.title}${place ? ` · ${place}. Click to close` : '. Click to open'}`} aria-label={d.title} aria-pressed={!!place} onClick={() => S.toggleDocker(id)}
            w="28px" h="28px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0"
            {...(place ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}><ToolIcon n={DOCKER_META[id].icon} size={18} /></Btn>
        );
      })}
    </Row>
  );
}
