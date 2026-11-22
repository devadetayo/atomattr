import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Btn, Input, Option, Row, Select, Txt } from 'atomattr/react';
import { T } from '../theme';
import { Ic } from './Icons';

export function IconBtn({ icon, title, onClick, active, disabled, size = 28, iconSize = 16, danger, ...rest }: { icon: string; title: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; disabled?: boolean; size?: number; iconSize?: number; danger?: boolean; [k: string]: unknown }) {
  return (
    <Btn type="button" title={title} aria-label={title} onClick={disabled ? undefined : onClick} disabled={disabled} display="flex" items="center" justify="center" w={`${size}px`} h={`${size}px`} p="0" border="0" rounded="md" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.35' : '1'}
      {...(active ? T.active : { bg: 'transparent', ...T.hover, text: danger ? 'danger' : 'gray-600', 'dark-text': danger ? 'danger' : 'gray-300' })} {...rest}>
      <Ic n={icon} size={iconSize} />
    </Btn>
  );
}

export function Label({ children }: { children: ReactNode }) { return <Txt fontSize="11px" fontWeight="600" {...T.muted} m="0" whitespace="nowrap">{children}</Txt>; }

/** Number input that commits on Enter or blur, steps with arrow keys, and shows "Mixed" for differing values. */
export function NumField({ label, value, onCommit, step = 1, min, max, suffix, disabled, mixed, w = '100%', title }: { label?: string; value: number | null | undefined; onCommit: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; disabled?: boolean; mixed?: boolean; w?: string; title?: string }) {
  const shown = mixed ? '' : value === null || value === undefined || Number.isNaN(value) ? '' : String(Math.round(value * 100) / 100);
  const [draft, setDraft] = useState(shown); const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(shown); }, [shown]);
  const commit = () => {
    editing.current = false; const n = parseFloat(draft);
    if (!Number.isFinite(n)) { setDraft(shown); return; }
    const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); onCommit(v); setDraft(String(Math.round(v * 100) / 100));
  };
  return (
    <Row items="center" gap="1" w={w} title={title}>
      {label && <Box w="14px" flex="none"><Label>{label}</Label></Box>}
      <Input type="text" inputMode="decimal" value={draft} placeholder={mixed ? 'Mixed' : ''} disabled={disabled} aria-label={title || label || 'value'}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { editing.current = true; e.target.select(); }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'Escape') { editing.current = false; setDraft(shown); (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const base = parseFloat(draft); const n = (Number.isFinite(base) ? base : 0) + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1); const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); setDraft(String(Math.round(v * 100) / 100)); onCommit(v); }
          e.stopPropagation();
        }}
        flex="1" min-w="0" w="100%" h="28px" px="2" fontSize="12px" {...T.field} opacity={disabled ? '0.5' : '1'} />
      {suffix && <Txt fontSize="11px" {...T.muted} m="0">{suffix}</Txt>}
    </Row>
  );
}

export function TextField({ label, value, onCommit, placeholder, multiline, disabled }: { label?: string; value: string; onCommit: (v: string) => void; placeholder?: string; multiline?: boolean; disabled?: boolean }) {
  const [draft, setDraft] = useState(value); const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(value); }, [value]);
  const done = () => { editing.current = false; if (draft !== value) onCommit(draft); };
  const common = { value: draft, placeholder, disabled, 'aria-label': label || placeholder || 'text', onFocus: () => { editing.current = true; }, onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: done, w: '100%', px: '2', fontSize: '12px', ...T.field } as const;
  return (
    <Box w="100%">
      {label && <Box mb="1"><Label>{label}</Label></Box>}
      {multiline
        ? <Box as="textarea" rows={3} {...common} py="2" resize="vertical" onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} />
        : <Input type="text" {...common} h="28px" onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }} />}
    </Box>
  );
}

export function SelectField({ label, value, options, onChange, disabled, w = '100%' }: { label?: string; value: string; options: [string, string][]; onChange: (v: string) => void; disabled?: boolean; w?: string }) {
  return (
    <Box w={w}>
      {label && <Box mb="1"><Label>{label}</Label></Box>}
      <Select value={value} disabled={disabled} aria-label={label || 'select'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} w="100%" h="28px" px="2" fontSize="12px" {...T.field}>
        {options.map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
      </Select>
    </Box>
  );
}

export function Seg<V extends string>({ value, options, onChange, label, disabled }: { value: V | undefined; options: { v: V; label?: string; icon?: string; title?: string }[]; onChange: (v: V) => void; label?: string; disabled?: boolean }) {
  return (
    <Box w="100%">
      {label && <Box mb="1"><Label>{label}</Label></Box>}
      <Row {...T.card} p="1" gap="1" w="100%">
        {options.map(o => (
          <Btn key={o.v} type="button" title={o.title || o.label || o.v} disabled={disabled} onClick={() => onChange(o.v)} flex="1" h="24px" display="flex" items="center" justify="center" border="0" rounded="md" fontSize="11px" fontWeight="600" cursor="pointer" p="0"
            {...(value === o.v ? { bg: 'white', 'dark-bg': 'gray-600', text: 'primary', 'dark-text': 'white', shadow: 'sm' } : { bg: 'transparent', ...T.hover, ...T.muted })}>
            {o.icon ? <Ic n={o.icon} size={14} /> : o.label}
          </Btn>
        ))}
      </Row>
    </Box>
  );
}

export function Section({ title, children, open: initial = true, action }: { title: string; children: ReactNode; open?: boolean; action?: ReactNode }) {
  const [open, setOpen] = useState(initial);
  return (
    <Box border-b="1px solid" border-color="gray-200" dark-border-color="gray-800">
      <Row items="center" justify="between" px="3" h="32px" cursor="pointer" onClick={() => setOpen(!open)}>
        <Row items="center" gap="1"><Box {...T.muted} display="flex"><Ic n={open ? 'chevD' : 'chevR'} size={12} /></Box><Txt fontSize="11px" fontWeight="700" {...T.text} m="0">{title}</Txt></Row>
        {action && <Box onClick={(e: React.MouseEvent) => e.stopPropagation()}>{action}</Box>}
      </Row>
      {open && <Box px="3" pb="3" display="flex" flex-col gap="2">{children}</Box>}
    </Box>
  );
}

export function ColorField({ label, value, onChange, allowNone, title }: { label?: string; value?: string; onChange: (v: string | undefined) => void; allowNone?: boolean; title?: string }) {
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
  const [draft, setDraft] = useState(value || ''); useEffect(() => setDraft(value || ''), [value]);
  return (
    <Box w="100%">
      {label && <Box mb="1"><Label>{label}</Label></Box>}
      <Row items="center" gap="2">
        <Input type="color" value={hex} aria-label={title || label || 'colour'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} w="28px" h="28px" p="0" border="1px solid gray-300" dark-border-color="gray-600" rounded="md" cursor="pointer" bg="transparent" />
        <Input type="text" value={draft} placeholder={allowNone ? 'none' : '#000000'} aria-label={`${title || label || 'colour'} hex`} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onBlur={() => { const v = draft.trim(); if (!v && allowNone) onChange(undefined); else if (/^#?[0-9a-f]{3,8}$/i.test(v)) onChange(v.startsWith('#') ? v : `#${v}`); else setDraft(value || ''); }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }} flex="1" min-w="0" h="28px" px="2" fontSize="12px" {...T.field} />
        {allowNone && value && <IconBtn icon="x" title="Remove" size={24} iconSize={12} onClick={() => onChange(undefined)} />}
      </Row>
    </Box>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <Box display="flex" flex-col items="center" justify="center" gap="1" p="6" text-align="center" {...T.muted}>
      <Ic n={icon} size={22} /><Txt fontSize="12px" fontWeight="600" m="0" {...T.text}>{title}</Txt>{hint && <Txt fontSize="11px" m="0" {...T.muted}>{hint}</Txt>}
    </Box>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <Box as="kbd" px="1" fontSize="10px" fontWeight="600" {...T.card} {...T.muted} font-mono>{children}</Box>;
}
