import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import { settleDialog, useDialog, type ActiveDialog, type ChoiceAction, type InputField } from '../state/dialogs';
import { ToolIcon } from './ToolIcons';
import { T } from '../theme';

/**
 * Renders the dialog on top of the queue (state/dialogs.ts): confirm, choice (Save / Discard / Cancel) and input.
 * Same glass as every other dialog (T.panel + T.overlay). Esc, the backdrop and Cancel all dismiss; Enter confirms;
 * Tab stays inside; focus returns to where it was; keystrokes never reach the editor's shortcuts while it is open.
 */
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DISMISSED = (d: ActiveDialog) => (d.spec.kind === 'confirm' ? false : d.spec.kind === 'choice' ? 'cancel' : null);

const Plain = ({ children, onClick, safe }: { children: React.ReactNode; onClick: () => void; safe?: boolean }) => (
  <Btn type="button" onClick={onClick} data-safe={safe ? '' : undefined} h="34px" px="4" rounded="8px" border="1px solid" border-color="gray-900/10" dark-border-color="white/12" bg="white/50" dark-bg="white/6" hover-bg="white/85" dark-hover-bg="white/12" {...T.text} focus-border-color="primary" fontSize="sm" fontWeight="600" cursor="pointer">{children}</Btn>
);
const Solid = ({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) => (
  <Btn type="button" onClick={onClick} disabled={disabled} data-confirm="" h="34px" px="4" rounded="8px" border="1px solid" border-color="transparent" focus-border-color="white" shadow={danger ? '0 4px 14px -4px rgba(220,38,38,0.55)' : '0 4px 14px -4px color-mix(in srgb, var(--primary) 55%, transparent)'} bg={danger ? 'danger' : 'primary'} text="white" fontSize="sm" fontWeight="600" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.5' : '1'} hover-opacity={disabled ? '0.5' : '0.9'}>{children}</Btn>
);

function Frame({ d, labelId, descId, children, footer }: { d: ActiveDialog; labelId: string; descId?: string; children?: React.ReactNode; footer: React.ReactNode }) {
  const { spec } = d; const danger = spec.tone === 'danger';
  return (
    <>
      <Row items="start" gap="4" px="5" pt="5" pb={spec.message || children ? '4' : '5'}>
        <Box w="40px" h="40px" shrink="0" rounded="12px" display="flex" items="center" justify="center" bg={danger ? 'danger/16' : 'primary/16'} text={danger ? 'danger' : 'primary'} shadow={danger ? 'inset 0 0 0 1px color-mix(in srgb, var(--danger) 28%, transparent)' : 'inset 0 0 0 1px color-mix(in srgb, var(--primary) 26%, transparent)'} aria-hidden="true">
          <ToolIcon n={spec.icon || (danger ? 'trash' : 'info')} size={20} />
        </Box>
        <Box flex="1" min-w="0" pt="1">
          <Txt as="h2" id={labelId} fontSize="15px" fontWeight="700" m="0" {...T.text}>{spec.title}</Txt>
          {spec.message && <Txt as="p" id={descId} fontSize="sm" m="0" mt="1" leading="snug" {...T.muted}>{spec.message}</Txt>}
        </Box>
      </Row>
      {children && <Box px="5" pb="3" pl="72px">{children}</Box>}
      <Box h="1px" w="100%" shrink="0" {...T.divider} />
      <Row justify="end" items="center" gap="2" px="4" py="3" wrap="wrap" {...T.well}>{footer}</Row>
    </>
  );
}

function InputBody({ d }: { d: ActiveDialog }) {
  const spec = d.spec as Extract<ActiveDialog['spec'], { kind: 'input' }>;
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(spec.fields.map(f => [f.key, f.value ?? ''])));
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const bad = spec.validate?.(values) ?? null;
    if (bad) { setError(bad); return; }
    settleDialog(d.id, values);
  };
  const field = (f: InputField, i: number) => (
    <Box key={f.key} flex="1" min-w="0">
      <Txt as="label" htmlFor={`dlg-${d.id}-${f.key}`} display="block" fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>{f.label}</Txt>
      <Row items="center" gap="2">
        <Input id={`dlg-${d.id}-${f.key}`} type={f.type || 'text'} min={f.min} max={f.max} value={values[f.key]} placeholder={f.placeholder} data-autofocus={i === 0 ? '' : undefined}
          aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `dlg-${d.id}-err` : undefined}
          onFocus={(e: any) => { if (i === 0) e.target.select(); }}
          onChange={(e: any) => { setValues(v => ({ ...v, [f.key]: e.target.value })); setError(null); }}
          onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        {f.suffix && <Txt as="span" fontSize="sm" m="0" shrink="0" {...T.muted}>{f.suffix}</Txt>}
      </Row>
    </Box>
  );
  return (
    <Frame d={d} labelId={`dlg-${d.id}-t`} descId={spec.message ? `dlg-${d.id}-m` : undefined}
      footer={<><Plain safe onClick={() => settleDialog(d.id, null)}>{spec.cancelLabel || 'Cancel'}</Plain><Solid onClick={submit} danger={spec.tone === 'danger'}>{spec.confirmLabel || 'OK'}</Solid></>}>
      <Row gap="3" items="start">{spec.fields.map(field)}</Row>
      {error && <Txt as="p" id={`dlg-${d.id}-err`} role="alert" fontSize="sm" m="0" mt="2" text="danger" dark-text="danger">{error}</Txt>}
    </Frame>
  );
}

const EXIT_MS = 140;

export function DialogHost() {
  const live = useDialog();
  /* the dialog that just closed stays on screen (inert) for its exit animation */
  const [ghost, setGhost] = useState<ActiveDialog | null>(null);
  useEffect(() => {
    if (live) { setGhost(live); return; }
    if (!ghost) return;
    const t = setTimeout(() => setGhost(null), EXIT_MS);
    return () => clearTimeout(t);
  }, [live]);
  const d = live;
  const box = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!d) return;
    returnTo.current = document.activeElement;
    const root = box.current;
    /* initial focus: the first input; else the safe button (Cancel on destructive dialogs, the confirming one otherwise) */
    const t = setTimeout(() => {
      const el = root?.querySelector<HTMLElement>('[data-autofocus]') || root?.querySelector<HTMLElement>(d.spec.tone === 'danger' ? '[data-safe]' : '[data-confirm]') || root?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    }, 0);
    /* capture phase: Esc dismisses, Tab wraps inside the dialog, and nothing reaches the editor's shortcuts */
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); settleDialog(d.id, DISMISSED(d)); return; }
      if (e.key === 'Tab' && root) {
        const els = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)); if (!els.length) return;
        const first = els[0], last = els[els.length - 1], at = document.activeElement;
        if (!root.contains(at)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
        e.stopPropagation(); return;
      }
      if (!root?.contains(e.target as Node)) { e.stopPropagation(); e.preventDefault(); }
    };
    window.addEventListener('keydown', key, true);
    return () => {
      clearTimeout(t); window.removeEventListener('keydown', key, true);
      const back = returnTo.current as HTMLElement | null; if (back && document.contains(back)) back.focus?.();
    };
  }, [d?.id]);

  const shown = live || ghost; if (!shown) return null;
  const leaving = !live;
  const { spec } = shown; const labelId = `dlg-${shown.id}-t`, descId = spec.message ? `dlg-${shown.id}-m` : undefined;
  const danger = spec.tone === 'danger';

  let body: React.ReactNode;
  if (spec.kind === 'input') body = <InputBody d={shown} />;
  else if (spec.kind === 'confirm') {
    body = (
      <Frame d={shown} labelId={labelId} descId={descId} footer={<>
        <Plain safe onClick={() => settleDialog(shown.id, false)}>{spec.cancelLabel || 'Cancel'}</Plain>
        <Solid onClick={() => settleDialog(shown.id, true)} danger={danger}>{spec.confirmLabel || 'Confirm'}</Solid>
      </>} />
    );
  } else {
    const tone = (a: ChoiceAction) => a.tone || 'quiet';
    body = (
      <Frame d={shown} labelId={labelId} descId={descId} footer={spec.actions.map(a => tone(a) === 'quiet'
        ? <Plain key={a.id} onClick={() => settleDialog(shown.id, a.id)}>{a.label}</Plain>
        : <Solid key={a.id} danger={tone(a) === 'danger'} onClick={() => settleDialog(shown.id, a.id)}>{a.label}</Solid>)} />
    );
  }

  return (
    <Box position="fixed" top="0" left="0" w="100%" h="100%" z="130" display="flex" items="center" justify="center" p="3" {...T.overlay}
      pointer-events={leaving ? 'none' : 'auto'} animate={leaving ? `studio-fade-out ${EXIT_MS}ms ease-in both` : 'studio-fade 160ms ease-out both'}
      onPointerDown={() => { if (live) settleDialog(live.id, DISMISSED(live)); }}>
      <Box ref={box} {...T.dialog} w="min(440px, 100%)" max-h="90vh" overflow="auto" display="flex" flex-col
        role={spec.kind === 'input' ? 'dialog' : 'alertdialog'} aria-modal="true" aria-labelledby={labelId} aria-describedby={descId}
        animate={leaving ? `studio-pop-out ${EXIT_MS}ms ease-in both` : 'studio-pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both'}
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}>
        {body}
      </Box>
    </Box>
  );
}
