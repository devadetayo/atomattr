import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import { T } from '../theme';
import { IconBtn } from './ui';
import { BETA, FEEDBACK_EMAIL, buildReport } from '../state/diagnostics';
import { download } from '../exporters/zip';
import * as S from '../state/store';

let isOpen = false; const subs = new Set<() => void>(); const emit = () => subs.forEach(f => f());
export const openFeedback = () => { isOpen = true; emit(); };
const close = () => { isOpen = false; emit(); };
const useOpen = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => isOpen);

const LIMITS = [
  'Everything runs in your browser. Projects are saved in this browser only: export or "Save to file" regularly, and before clearing site data.',
  'No server features: hosting, GitHub sync, AI, live co-editing and analytics are not available.',
  'Library view and save counts are per browser.',
  'Imports are best-effort: React imports keep static markup only; PDFs cannot be imported.',
  'Dark mode for Library blocks is automatic; hover colours are not re-mapped in dark.',
];

export function FeedbackDialog() {
  const open = useOpen(); const [note, setNote] = useState(''); const [diag, setDiag] = useState(true); const [done, setDone] = useState('');
  if (!open) return null;
  const report = () => buildReport(note, diag);
  const field = { w: '100%', h: '120px', p: '3', fontSize: 'sm', resize: 'vertical', outline: 'none' } as const;
  const btn = (primary = false) => ({ h: '34px', px: '4', rounded: '12px', border: '0', cursor: 'pointer', fontSize: 'sm', fontWeight: primary ? '700' : '500', ...(primary ? { bg: 'primary', text: 'white' } : { bg: 'gray-900/6', 'dark-bg': 'white/8', ...T.text }) } as const);
  return createPortal(
    <Box position="fixed" inset="0" z="1100" display="flex" items="center" justify="center" p="4" bg="black/45" backdrop-blur="sm" role="dialog" aria-modal="true" aria-label="Send feedback" onMouseDown={(e: React.MouseEvent) => { if (e.target === e.currentTarget) close(); }} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') close(); }}>
      <Box w="min(560px, 100%)" max-h="100%" overflow-y="auto" rounded="24px" p="5" display="flex" flex-col gap="4" bg="white/92" dark-bg="gray-900/92" backdrop-blur="xl" border="1px solid" border-color="white/40" dark-border-color="white/10" shadow="2xl">
        <Row items="center" justify="between"><Box><Txt fontSize="lg" fontWeight="700" m="0" {...T.text}>Send feedback</Txt><Txt fontSize="xs" m="0" {...T.muted}>AtomAttr Studio {BETA.version}</Txt></Box><IconBtn icon="x" title="Close" onClick={close} /></Row>
        <Box display="flex" flex-col gap="1">
          <Txt fontSize="xs" fontWeight="700" m="0" {...T.muted}>What happened, or what would you like?</Txt>
          <Box as="textarea" value={note} onChange={(e: any) => setNote(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} placeholder="Steps to reproduce, what you expected, what you saw…" aria-label="Your feedback" {...field} {...T.field} rounded="14px" />
        </Box>
        <Row as="label" items="center" gap="2" cursor="pointer"><input type="checkbox" checked={diag} onChange={e => setDiag(e.target.checked)} /><Txt fontSize="sm" m="0" {...T.text}>Include technical details (browser, project size, recent errors). No project content is included.</Txt></Row>
        <Row gap="2" wrap>
          <Btn type="button" {...btn(true)} onClick={async () => { try { await navigator.clipboard.writeText(report()); setDone('Copied. Paste it into your message.'); } catch { setDone('Could not copy. Use Download instead.'); } }}>Copy report</Btn>
          <Btn type="button" {...btn()} onClick={() => { download(new Blob([report()], { type: 'text/plain' }), `studio-report-${Date.now()}.txt`); setDone('Report downloaded.'); }}>Download report</Btn>
          {FEEDBACK_EMAIL && <Btn type="button" {...btn()} onClick={() => { location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Studio beta feedback')}&body=${encodeURIComponent(report().slice(0, 1800))}`; }}>Email it</Btn>}
          <Btn type="button" {...btn()} onClick={() => { S.saveNow(); const p = S.getState().project; if (p) download(new Blob([JSON.stringify(p)], { type: 'application/json' }), `studio-backup-${Date.now()}.json`); setDone('Project backup downloaded.'); }}>Download project backup</Btn>
        </Row>
        {done && <Txt fontSize="sm" m="0" role="status" {...T.muted}>{done}</Txt>}
        <Box display="flex" flex-col gap="1" pt="3" border-t="1px solid" {...T.hairline}>
          <Txt fontSize="xs" fontWeight="700" m="0" {...T.muted}>Known limits in this beta</Txt>
          {LIMITS.map(l => <Txt key={l} fontSize="xs" leading="snug" m="0" {...T.muted}>• {l}</Txt>)}
        </Box>
      </Box>
    </Box>, document.body);
}
