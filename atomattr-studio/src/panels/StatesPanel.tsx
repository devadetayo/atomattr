import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import type { Style } from '../document/types';
import { EmptyState, IconBtn, NumField, Section } from '../components/ui';
import { T } from '../theme';

/* States: how a layer looks on hover, focus, press, when disabled, and in dark mode.
   Pick a state, then use Properties, Typography, Fill and Effects as usual: while a state is picked, every change there
   belongs to that state only. Anything a state does not set falls back to the base look. */

type St = 'hover' | 'focus' | 'active' | 'disabled' | 'dark';
const STATES: { id: 'base' | St; label: string; hint: string }[] = [
  { id: 'base', label: 'Base', hint: 'The normal look' },
  { id: 'hover', label: 'Hover', hint: 'Pointer is over it' },
  { id: 'focus', label: 'Focus', hint: 'Has keyboard focus' },
  { id: 'active', label: 'Pressed', hint: 'While it is clicked' },
  { id: 'disabled', label: 'Disabled', hint: 'Cannot be used' },
  { id: 'dark', label: 'Dark', hint: 'Page is in dark mode' },
];
export const stateLabel = (id: string) => STATES.find(x => x.id === id)?.label || id;

const PRESETS: { name: string; patch: Style }[] = [
  { name: 'Lift', patch: { translateY: -4, shadow: 'lg' } },
  { name: 'Grow', patch: { scale: 1.05 } },
  { name: 'Press in', patch: { scale: 0.97 } },
  { name: 'Dim', patch: { opacity: 0.7 } },
];

const NAMES: Record<string, string> = { fill: 'Fill', color: 'Text colour', stroke: 'Border colour', strokeWidth: 'Border width', radius: 'Radius', shadow: 'Shadow', opacity: 'Opacity', scale: 'Scale', translateX: 'Move X', translateY: 'Move Y', rotation: 'Rotation', w: 'Width', h: 'Height', fontSize: 'Font size', fontWeight: 'Weight', letterSpacing: 'Letter spacing', lineHeight: 'Line height', padT: 'Padding top', padR: 'Padding right', padB: 'Padding bottom', padL: 'Padding left', pad: 'Padding', gap: 'Gap', blur: 'Blur', bgBlur: 'Background blur', italic: 'Italic', underline: 'Underline', upper: 'Uppercase', align: 'Align', font: 'Font' };
const nice = (k: string) => NAMES[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
const show = (v: unknown) => (typeof v === 'string' ? (v.length > 18 ? v.slice(0, 17) + '…' : v) : typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v));

/** Sits above the design panels while a state is being edited, so it is never a surprise. */
export function StateBanner() {
  const s = useStudio(); const st = s.attrState; if (st === 'base') return null;
  return <Row items="center" gap="2" px="3" py="2" bg="primary/10" dark-bg="primary/20" role="status">
    <Box w="8px" h="8px" rounded="full" bg="primary" shrink="0" />
    <Txt fontSize="sm" fontWeight="600" m="0" flex="1" min-w="0" truncate text="primary" dark-text="white">Editing the {stateLabel(st)} look</Txt>
    <Btn type="button" onClick={() => S.setAttrState('base')} h="24px" px="2" border="0" rounded="lg" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" text="white">Back to base</Btn>
  </Row>;
}

export function StatesPanel() {
  const s = useStudio(); const nodes = S.selNodes(s); const node = nodes[0]; const st = s.attrState;
  if (!node) return <EmptyState icon="sparkle" title="Select an object" hint="Then choose a state to change how it looks on hover, focus, press, disabled or in dark mode." />;
  const ids = nodes.map(n => n.id); const own = st === 'base' ? {} : ((node.states?.[st] || {}) as Record<string, unknown>); const keys = Object.keys(own);
  const withState = (id: St) => nodes.some(n => n.states?.[id] && Object.keys(n.states[id]!).length);
  return (
    <Box display="flex" flex-col gap="3" p="3">
      <Box display="grid" grid-cols="3" gap="2" role="group" aria-label="State">
        {STATES.map(x => { const on = st === x.id; const has = x.id !== 'base' && withState(x.id);
          return <Btn key={x.id} type="button" aria-pressed={on} title={x.hint} onClick={() => S.setAttrState(x.id)} display="flex" flex-col items="start" gap="1" p="2" min-w="0" text-align="left" cursor="pointer" rounded="14px" border="2px solid" border-color={on ? 'primary' : 'transparent'} bg={on ? 'primary/10' : 'gray-900/5'} dark-bg={on ? 'primary/20' : 'white/6'} hover-bg={on ? 'primary/10' : 'gray-900/9'}>
            <Row items="center" gap="1" w="100%" min-w="0"><Txt fontSize="sm" fontWeight="700" m="0" flex="1" min-w="0" truncate {...T.text}>{x.label}</Txt>{has && <Box w="6px" h="6px" rounded="full" bg="primary" shrink="0" title="This layer has changes in this state" />}</Row>
            <Txt fontSize="sm" leading="tight" m="0" {...T.muted}>{x.hint}</Txt>
          </Btn>; })}
      </Box>

      {st === 'base'
        ? <Box p="3" {...T.card} display="flex" flex-col gap="1"><Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Editing the normal look</Txt><Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Pick Hover, Focus, Pressed, Disabled or Dark mode above, then change anything in Properties, Typography, Fill and Effects. Only that state changes.</Txt></Box>
        : <>
          <Box p="3" {...T.card} display="flex" flex-col gap="1"><Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Editing {stateLabel(st)} on {node.name || node.type}{nodes.length > 1 ? ` and ${nodes.length - 1} more` : ''}</Txt><Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Change anything in Properties, Typography, Fill or Effects. Size, spacing, colour, shadow, text, transform: all of it can differ here. The canvas shows this state.</Txt></Box>

          {(st === 'hover' || st === 'active' || st === 'focus') && <Section title="Quick looks">
            <Row gap="1" wrap>{PRESETS.map(p => <Btn key={p.name} type="button" onClick={() => S.patchStateStyle(ids, p.patch, st)} h="26px" px="3" border="0" rounded="full" cursor="pointer" fontSize="sm" fontWeight="600" bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/10" dark-hover-bg="white/10" {...T.text}>{p.name}</Btn>)}</Row>
            <NumField label="Transition (ms)" value={node.style.transition ?? 200} min={0} max={3000} step={50} onCommit={v => S.patchNodesBase(ids, { transition: v })} suffix="ms" />
          </Section>}

          <Section title={`Changes in ${stateLabel(st)}`} action={keys.length ? <Btn type="button" onClick={() => S.resetStateStyle(ids, st)} h="22px" px="2" border="0" rounded="lg" cursor="pointer" fontSize="sm" bg="transparent" {...T.muted} hover-text="danger">Reset all</Btn> : undefined}>
            {keys.length === 0 && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Nothing yet. This state looks like the base.</Txt>}
            <Box display="flex" flex-col gap="1">{keys.map(k => <Row key={k} items="center" gap="2" h="30px" px="2" {...T.card}>
              <Txt fontSize="sm" fontWeight="600" m="0" flex="1" min-w="0" truncate {...T.text}>{nice(k)}</Txt>
              <Txt fontSize="sm" font-mono m="0" shrink="0" {...T.muted}>{show(own[k])}</Txt>
              <IconBtn icon="close" title={`Remove ${nice(k)} from ${stateLabel(st)}`} size={22} iconSize={12} onClick={() => S.resetStateStyle(ids, st, [k])} />
            </Row>)}</Box>
          </Section>
        </>}
    </Box>
  );
}
