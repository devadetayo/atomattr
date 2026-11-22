import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as RPE, ReactNode } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import { CODE_EXT, CODE_TARGETS, generateCode, previewSize } from '../exporters/code-generator';
import type { CodeSource, CodeTarget } from '../exporters/code-generator';
import { BAR, GHOST, I, IconButton } from './Studio-Ui';

type View = 'split' | 'code' | 'preview';
type Props = { source: CodeSource; viewport: string; onViewportChange: (viewport: string) => void; onClose: () => void };

/* One small tokenizer for markup, JSX, TS and JSON: comments, strings, tag names, attribute names, keywords. */
const TOKEN = /(<!--[\s\S]*?-->|\/\/[^\n]*)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|(<\/?[A-Za-z][\w.-]*|\/?>)|([A-Za-z_][\w:-]*)(?==)|\b(import|from|export|default|function|return|const|class|true|false|null)\b/g;
const COLORS = ['#64748b', '#86efac', '#f9a8d4', '#7dd3fc', '#c4b5fd'];

export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of code.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) out.push(code.slice(last, start));
    const group = match.findIndex((value, index) => index > 0 && value !== undefined) - 1;
    out.push(<Box as="span" key={key++} text={COLORS[group]}>{match[0]}</Box>);
    last = start + match[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/* The preview renders the HTML output with the same AtomAttr runtime Export ships, fetched once. */
let runtime: Promise<{ js: string; css: string }> | null = null;
function loadRuntime() {
  if (!runtime) {
    const base = import.meta.env.BASE_URL;
    runtime = Promise.all([fetch(`${base}atomattr-runtime/atomattr.min.js`), fetch(`${base}atomattr-runtime/defaults.css`)])
      .then(async ([engine, defaults]) => {
        if (!engine.ok || !defaults.ok) throw new Error('missing runtime');
        return { js: await engine.text(), css: await defaults.text() };
      })
      .catch(error => { runtime = null; throw error; });
  }
  return runtime;
}

function Preview({ source, html }: { source: CodeSource; html: string }) {
  const [files, setFiles] = useState<{ js: string; css: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(400);
  useEffect(() => { let live = true; loadRuntime().then(value => { if (live) setFiles(value); }).catch(() => { if (live) setFailed(true); }); return () => { live = false; }; }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setAvailable(el.clientWidth));
    observer.observe(el); setAvailable(el.clientWidth);
    return () => observer.disconnect();
  }, []);
  const { width, height } = previewSize(source);
  const scale = Math.min(1, Math.max(0.1, (available - 24) / width));
  const srcDoc = useMemo(() => (files
    ? `<!doctype html><html><head><meta charset="utf-8"><style>${files.css}</style><script>${files.js.replace(/<\/script/gi, '<\\/script')}</script><style>html,body{margin:0}*{box-sizing:border-box}</style></head><body bg="white" text="foreground">${html}</body></html>`
    : ''), [files, html]);
  return (
    <Box ref={box} flex="1" minW="0" overflow="auto" bg="gray-100" dark-bg="gray-950" p="3">
      {failed && <Txt fontSize="sm" text="muted" m="0">The preview needs the AtomAttr runtime files in <code>/atomattr-runtime/</code> (the same ones Export uses).</Txt>}
      {!failed && !files && <Txt fontSize="sm" text="muted" m="0">Loading preview…</Txt>}
      {files && (
        <Box w={`${Math.round(width * scale)}px`} h={`${Math.round(height * scale)}px`} mx="auto" flex="none">
          <Box as="iframe" title="Live preview of the generated code" srcDoc={srcDoc} sandbox="allow-scripts"
            w={`${width}px`} h={`${height}px`} max-w="none" border="0" bg="white" shadow="xl" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} />
        </Box>
      )}
    </Box>
  );
}

const VIEWPORTS = [{ id: 'desktop', icon: I.desktop }, { id: 'tablet', icon: I.tablet }, { id: 'mobile', icon: I.mobile }] as const;

/** Bottom code drawer: every target language, a live preview, copy and download. Drag the top edge to resize. */
export function CodeDrawer({ source, viewport, onViewportChange, onClose }: Props) {
  const [target, setTarget] = useState<CodeTarget>('HTML');
  const [view, setView] = useState<View>('split');
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(() => { try { return Number(localStorage.getItem('atomattr-studio:code-height')) || 320; } catch { return 320; } });
  const resize = useRef<{ y: number; h: number } | null>(null);
  const code = useMemo(() => generateCode(target, source), [target, source]);
  const html = useMemo(() => generateCode('HTML', source), [source]);
  const rendered = useMemo(() => highlight(code), [code]);

  function startResize(event: RPE) { event.preventDefault(); resize.current = { y: event.clientY, h: height }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); }
  function doResize(event: RPE) { const r = resize.current; if (r) setHeight(Math.min(Math.round(window.innerHeight * 0.7), Math.max(160, r.h - (event.clientY - r.y)))); }
  function endResize() { if (!resize.current) return; resize.current = null; try { localStorage.setItem('atomattr-studio:code-height', String(height)); } catch {} }

  async function copy() { try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setCopied(false); } }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${source.mode === 'design' ? 'design' : 'page'}.${CODE_EXT[target]}`; link.click();
    URL.revokeObjectURL(url);
  }

  const showCode = view !== 'preview';
  const showPreview = view !== 'code';
  const pill = (active: boolean) => ({ bg: active ? 'primary' : undefined, 'dark-bg': active ? 'primary' : undefined, text: active ? 'white' : undefined }) as const;

  return (
    <Box as="section" aria-label="Generated code" {...BAR} border-t="1px solid gray-200" display="flex" flex-col flex="none" h={`${height}px`} position="relative">
      <Box h="2" w="full" cursor="ns-resize" touchAction="none" aria-label="Drag to resize the code drawer" flex="none"
        bg="gray-100" dark-bg="gray-800" onPointerDown={startResize} onPointerMove={doResize} onPointerUp={endResize} onPointerCancel={endResize} />
      <Row items="center" justify="between" gap="3" px="3" py="2" flex="none" flexWrap="wrap">
        <Row role="tablist" aria-label="Code language" gap="1" flexWrap="wrap">
          {CODE_TARGETS.map(item => <Btn key={item} type="button" role="tab" aria-selected={target === item} onClick={() => setTarget(item)} {...GHOST} {...pill(target === item)}>{item}</Btn>)}
        </Row>
        <Row items="center" gap="2">
          <Row gap="1" items="center" aria-label="Drawer view">
            {(['code', 'split', 'preview'] as View[]).map(item => <Btn key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} {...GHOST} {...pill(view === item)}>{item === 'code' ? 'Code' : item === 'split' ? 'Split' : 'Preview'}</Btn>)}
          </Row>
          {source.mode === 'web' && (
            <Row gap="1" items="center" aria-label="Responsive preview">
              {VIEWPORTS.map(item => <IconButton key={item.id} label={`${item.id[0].toUpperCase()}${item.id.slice(1)} width`} onClick={() => onViewportChange(item.id)} active={viewport === item.id} size="8">{item.icon}</IconButton>)}
            </Row>
          )}
          <Btn type="button" onClick={() => void copy()} {...GHOST}>{copied ? 'Copied' : 'Copy'}</Btn>
          <Btn type="button" onClick={download} {...GHOST}>Download .{CODE_EXT[target]}</Btn>
          <IconButton label="Close code drawer" onClick={onClose} size="8">{I.close}</IconButton>
        </Row>
      </Row>
      <Row flex="1" minH="0" gap="0">
        {showCode && (
          <Box as="pre" m="0" p="3" flex="1" minW="0" overflow="auto" bg="gray-950" text="gray-100" fontSize="xs" whitespace="pre-wrap" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', wordBreak: 'break-word' }}><code>{rendered}</code></Box>
        )}
        {showPreview && <Preview source={source} html={html} />}
      </Row>
      {showPreview && target !== 'HTML' && (
        <Txt fontSize="xs" text="muted" m="0" px="3" py="1" flex="none">The preview renders the HTML output; {target} describes the same layout.</Txt>
      )}
    </Box>
  );
}
