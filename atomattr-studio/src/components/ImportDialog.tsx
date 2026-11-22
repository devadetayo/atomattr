import { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import { T } from '../theme';
import { IconBtn } from './ui';
import { ACCEPT, KIND_LABEL, importInputs, readFiles, readPasted, type ImportInput, type ImportResult } from '../state/import-files';

/** One small open/close store so the menu, the Export panel and shortcuts can all open the same window. */
let isOpen = false; const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
export const openImportDialog = () => { isOpen = true; emit(); };
const close = () => { isOpen = false; emit(); };
const useOpen = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => isOpen);

const FORMATS: [string, string][] = [
  ['HTML', 'Rebuilt as objects. Drop its .css with it to keep the styling.'],
  ['React (.jsx, .tsx)', 'Static markup only. State, props and logic are dropped.'],
  ['CSS', 'Added to your site CSS (or used to style a page dropped with it).'],
  ['JavaScript', 'Added to your site JS. Runs on the exported site only.'],
  ['Word (.docx)', 'Headings, text, lists, tables, links and pictures.'],
  ['Markdown, text', 'Headings, paragraphs, lists, tables, code.'],
  ['SVG, CSV', 'SVG becomes a vector; CSV becomes a Data collection.'],
];

export function ImportDialog() {
  const open = useOpen(); const [items, setItems] = useState<ImportInput[]>([]); const [text, setText] = useState('');
  const [busy, setBusy] = useState(false); const [results, setResults] = useState<ImportResult[] | null>(null); const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  if (!open) return null;
  const reset = () => { setItems([]); setText(''); setResults(null); };
  const add = async (files: File[]) => { if (!files.length) return; const n = await readFiles(files); setItems(x => [...x, ...n]); };
  const go = async () => {
    const all = [...items, ...(text.trim() ? [readPasted(text)] : [])]; if (!all.length || busy) return;
    setBusy(true); const r = await importInputs(all); setBusy(false); setResults(r); setItems([]); setText('');
  };
  const count = items.length + (text.trim() ? 1 : 0);
  return createPortal(
    <Box position="fixed" inset="0" z="1100" display="flex" items="center" justify="center" p="4" bg="black/45" backdrop-blur="sm" role="dialog" aria-modal="true" aria-label="Import" onMouseDown={(e: React.MouseEvent) => { if (e.target === e.currentTarget) { close(); reset(); } }} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') { close(); reset(); } }}>
      <Box w="min(640px, 100%)" max-h="100%" overflow-y="auto" rounded="24px" p="5" display="flex" flex-col gap="4" bg="white/92" dark-bg="gray-900/92" backdrop-blur="xl" border="1px solid" border-color="white/40" dark-border-color="white/10" shadow="2xl">
        <Row items="center" justify="between"><Txt fontSize="lg" fontWeight="700" m="0" {...T.text}>Import</Txt><IconBtn icon="x" title="Close" onClick={() => { close(); reset(); }} /></Row>

        {!results && <>
          <Box role="button" tabIndex={0} aria-label="Choose files or drop them here" onClick={() => input.current?.click()} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') input.current?.click(); }}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e: React.DragEvent) => { e.preventDefault(); setOver(false); add(Array.from(e.dataTransfer.files)); }}
            display="flex" flex-col items="center" justify="center" gap="1" h="120px" rounded="18px" cursor="pointer" border="2px dashed" border-color={over ? 'primary' : 'gray-900/20'} dark-border-color={over ? 'primary' : 'white/20'} bg={over ? 'primary/8' : 'transparent'}>
            <Txt fontSize="sm" fontWeight="700" m="0" {...T.text}>Drop files here, or click to choose</Txt>
            <Txt fontSize="xs" m="0" {...T.muted}>Several at once is fine: a .jsx with its .css keeps its look</Txt>
            <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { add(Array.from(e.target.files || [])); e.target.value = ''; }} />
          </Box>
          {!!items.length && <Box display="flex" flex-col gap="1">{items.map((it, i) => <Row key={i} items="center" gap="2" px="3" h="34px" rounded="10px" bg="gray-900/5" dark-bg="white/6">
            <Txt fontSize="sm" fontWeight="600" m="0" flex="1" min-w="0" truncate {...T.text}>{it.name}</Txt><Txt fontSize="xs" m="0" shrink="0" {...T.muted}>{KIND_LABEL[it.kind]}</Txt>
            <IconBtn icon="x" title="Remove" size={22} iconSize={12} onClick={() => setItems(x => x.filter((_, j) => j !== i))} /></Row>)}</Box>}
          <Box display="flex" flex-col gap="1">
            <Txt fontSize="xs" fontWeight="700" m="0" {...T.muted}>Or paste code or text</Txt>
            <Box as="textarea" value={text} onChange={(e: any) => setText(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} placeholder="Paste HTML, JSX, CSS, JavaScript, Markdown or plain text. The type is detected for you." spellCheck={false} aria-label="Paste code or text" w="100%" h="110px" p="3" fontSize="sm" font-mono resize="vertical" outline="none" {...T.field} rounded="14px" />
          </Box>
          <Box display="flex" flex-col gap="1">{FORMATS.map(([n, d]) => <Row key={n} gap="2" items="baseline"><Txt fontSize="xs" fontWeight="700" m="0" w="130px" shrink="0" {...T.text}>{n}</Txt><Txt fontSize="xs" m="0" {...T.muted}>{d}</Txt></Row>)}</Box>
          <Txt fontSize="xs" leading="snug" m="0" {...T.muted}>Imports are best-effort and add a new section to the current page (Undo removes it). PDFs and live apps with state cannot be converted.</Txt>
          <Row gap="2" justify="end"><Btn type="button" onClick={() => { close(); reset(); }} h="34px" px="4" rounded="12px" border="0" cursor="pointer" fontSize="sm" fontWeight="500" bg="gray-900/6" dark-bg="white/8" {...T.text}>Cancel</Btn>
            <Btn type="button" disabled={!count || busy} onClick={go} h="34px" px="5" rounded="12px" border="0" cursor={count ? 'pointer' : 'not-allowed'} fontSize="sm" fontWeight="700" bg="primary" text="white" opacity={count && !busy ? '100' : '50'}>{busy ? 'Importing…' : count ? `Import ${count} item${count > 1 ? 's' : ''}` : 'Import'}</Btn></Row>
        </>}

        {results && <>
          <Box display="flex" flex-col gap="2">{results.map((r, i) => <Box key={i} p="3" rounded="12px" bg={r.ok ? 'gray-900/5' : 'red-500/10'} dark-bg={r.ok ? 'white/6' : 'red-500/15'}>
            <Row items="center" gap="2"><Txt fontSize="sm" fontWeight="700" m="0" flex="1" min-w="0" truncate {...T.text}>{r.name}</Txt><Txt fontSize="xs" m="0" {...T.muted}>{KIND_LABEL[r.kind]}</Txt></Row>
            <Txt fontSize="xs" leading="snug" m="0" {...T.muted}>{r.message}</Txt></Box>)}</Box>
          <Row gap="2" justify="end"><Btn type="button" onClick={reset} h="34px" px="4" rounded="12px" border="0" cursor="pointer" fontSize="sm" fontWeight="500" bg="gray-900/6" dark-bg="white/8" {...T.text}>Import more</Btn>
            <Btn type="button" onClick={() => { close(); reset(); }} h="34px" px="5" rounded="12px" border="0" cursor="pointer" fontSize="sm" fontWeight="700" bg="primary" text="white">Done</Btn></Row>
        </>}
      </Box>
    </Box>, document.body);
}
