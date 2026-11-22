import { memo, useEffect, useRef } from 'react';
import { Box, Btn, H2, Txt } from 'atomattr/react';
import type { Gen } from '../document/gen';
import { toReactProps } from '../document/attrs';
import { reg } from './registry';

/**
 * Renders the shared Gen tree with AtomAttr components. The attribute map is the same one the exporters print,
 * so the canvas shows exactly what the exported code does at this breakpoint.
 */
type Props = { g: Gen; editId: string | null; onCommit: (id: string, text: string) => void; onCancel: () => void; onNavigate?: (href:string)=>void; interactive: boolean; register?:boolean };

function Editable({ g, onCommit, onCancel, children }: { g: Gen; onCommit: Props['onCommit']; onCancel: Props['onCancel']; children: (p: Record<string, unknown>) => React.ReactElement }) {
  const ref = useRef<HTMLElement | null>(null);
  const done = useRef(false);
  // The AtomAttr React adapter only forwards a fixed list of DOM props, so contentEditable never reaches the
  // element. Set it directly, then focus and select the text so typing replaces the placeholder.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'false'); el.setAttribute('role', 'textbox');
    const focus = () => { el.focus({ preventScroll: true }); const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); };
    focus(); const raf = requestAnimationFrame(() => { if (document.activeElement !== el) focus(); });
    return () => cancelAnimationFrame(raf);
  }, []);
  const commit = () => { if (done.current) return; done.current = true; onCommit(g.id, ref.current?.innerText.replace(/\n$/, '') ?? g.text ?? ''); };
  return children({
    ref: (el: HTMLElement | null) => { ref.current = el; reg(g.id)(el); },
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      e.stopPropagation(); // typed letters must never reach the tool shortcuts
      if (e.key === 'Escape') { e.preventDefault(); commit(); }
      else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); (ref.current as HTMLElement).blur(); }
      else if (e.key === 'Enter' && !e.shiftKey && g.node.type !== 'text') { e.preventDefault(); (ref.current as HTMLElement).blur(); }
    },
    onPaste: (e: React.ClipboardEvent) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); },
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    cursor: 'text', 'user-select': 'text', outline: '2px solid primary',
  });
}

function SvgArt({ g }: { g: Gen }) {
  const s = g.svg!; const Tag = s.kind as 'path';
  return (
    <svg viewBox={`0 0 ${s.vbw} ${s.vbh}`} width="100%" height="100%" preserveAspectRatio="none" overflow="visible" pointerEvents="none">
      {s.defs?.length ? <defs>{s.defs.map(d => { const G = d.tag as 'linearGradient'; return <G key={d.id} id={d.id} {...d.attrs}>{d.stops.map((st, i) => <stop key={i} offset={st.offset} stopColor={st.color} stopOpacity={st.opacity} />)}</G>; })}</defs> : null}
      <Tag {...(Object.fromEntries(Object.entries(s.props as Record<string, string>).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v])) as Record<string, string>)} {...(Object.fromEntries(Object.entries(s.paint).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v])) as Record<string, string>)} />
    </svg>
  );
}

function Node({ g, editId, onCommit, onCancel, onNavigate, interactive, register=interactive }: Props): React.ReactElement {
  const common = { ...toReactProps(g.attrs), ref: register ? reg(g.id) : undefined } as Record<string, unknown>;
  if (!interactive) common['pointerEvents'] = undefined;
  const kids = g.children.map(c => <Node key={c.id} g={c} editId={editId} onCommit={onCommit} onCancel={onCancel} onNavigate={onNavigate} interactive={interactive} register={register} />);
  const editing = editId === g.id;
  const nt = g.node.type;

  if (nt === 'text' || nt === 'heading') {
    const Cmp = nt === 'heading' ? H2 : Txt;
    const as = nt === 'heading' ? g.tag : (g.node.tag || 'p');
    return editing
      ? <Editable g={g} onCommit={onCommit} onCancel={onCancel}>{p => <Cmp as={as} {...common} {...p}>{g.text}</Cmp>}</Editable>
      : <Cmp as={g.href?'a':as} href={g.href} {...common} onClick={g.href?(e:React.MouseEvent)=>{e.preventDefault();onNavigate?.(g.href!);}:undefined}>{g.text}</Cmp>;
  }
  if (nt === 'button') {
    return editing
      ? <Editable g={g} onCommit={onCommit} onCancel={onCancel}>{p => <Btn as="div" {...common} {...p}>{g.text}</Btn>}</Editable>
      : <Btn as={g.href?'a':g.tag} href={g.href} {...common} onClick={g.href?(e: React.MouseEvent) => {e.preventDefault();onNavigate?.(g.href!);}:undefined}>{g.text}</Btn>;
  }
  if (nt === 'image') {
    if(g.src&&g.node.overlay){
      const frame={...common,position:'relative',overflow:'hidden'};const imageProps={src:g.src,alt:g.alt||'',draggable:false,w:'100%',h:'100%',objectFit:g.attrs['object-fit']||'cover',objectPosition:g.attrs['object-position']||'center',filter:g.attrs.filter};const overlay=g.node.overlay;
      return <Box {...frame}><Box as="img" {...imageProps}/><Box position="absolute" top="0" left="0" w="100%" h="100%" bg={overlay.color} opacity={String(overlay.opacity)} pointerEvents="none" /></Box>;
    }
    return g.src
      ? <Box as="img" {...common} src={g.src} alt={g.alt || ''} draggable={false} />
      : <Box {...common} bg="gray-200" dark-bg="gray-700" display="flex" items="center" justify="center" text="gray-500" fontSize="sm">No image</Box>;
  }
  if (nt === 'input') {
    const field = g.node.field || { type: 'text' as const, name: 'field' };
    const control = { ...common, name: field.name, placeholder: field.placeholder, required: field.required || undefined };
    if (field.type === 'textarea') return <Box as="textarea" {...control} defaultValue={field.value || ''} />;
    if (field.type === 'select') return <Box as="select" {...control} defaultValue={field.value || field.options?.[0] || ''}>{kids}</Box>;
    if (field.type === 'checkbox') {
      // Uncontrolled, so it toggles in Preview (a controlled `checked` with no onChange is read-only). The key re-syncs it when
      // "Checked by default" changes. While editing, clicks (also the ones a <label> forwards to the box) only select the layer.
      return <Box as="input" key={field.value === 'true' ? 'on' : 'off'} {...control} type="checkbox" defaultChecked={field.value === 'true'} onClick={interactive ? (e: React.MouseEvent) => e.preventDefault() : undefined} />;
    }
    if (field.type === 'radio') return <Box as="input" key={field.checked ? 'on' : 'off'} {...control} type="radio" name={field.name} value={field.value || ''} defaultChecked={!!field.checked} onClick={interactive ? (e: React.MouseEvent) => e.preventDefault() : undefined} />;
    if (field.type === 'range') return <Box as="input" {...control} type="range" min={field.min || '0'} max={field.max || '100'} step={field.step || '1'} defaultValue={field.value || field.min || '0'} />;
    return <Box as="input" {...control} type={field.type} defaultValue={field.value || ''} />;
  }
  if (nt === 'embed') {
    // Untrusted markup is never put into the editor's own DOM. Exports and sandboxed previews show the real thing.
    const html = g.node.html || '';
    return <Box {...common} bg="gray-100" dark-bg="gray-800" border="1px dashed gray-400" display="flex" flex-col items="center" justify="center" gap="1" text="gray-600" dark-text="gray-300" fontSize="sm" overflow="hidden"><Txt m="0" fontWeight="600">{'</>'} Custom HTML</Txt><Txt m="0" fontSize="xs">{html.trim() ? `${html.length.toLocaleString()} characters · shown in Preview and exports` : 'Empty. Add code in Properties.'}</Txt></Box>;
  }
  if (g.svg) return <Box {...common}><SvgArt g={g} /></Box>;
  if (nt === 'form') return <Box as="form" {...common} onSubmit={interactive ? (e: React.FormEvent) => e.preventDefault() : undefined}>{kids}</Box>;
  return <Box as={g.tag === 'main' ? 'div' : g.tag} {...common}>{kids}</Box>;
}
export const RenderTree = memo(Node);
