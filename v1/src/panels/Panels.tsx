import { useEffect, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { DockerId } from '../state/layout';
import type { DesignToken, Node, Style, TextStyle } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { explicitStyle, hasOverride } from '../document/style';
import { flatten, isContainer, uid } from '../document/tree';
import { IconBtn, NumField, Section, SelectField, Seg, TextField, ColorField, EmptyState, Label } from '../components/ui';
import { Ic } from '../components/Icons';
import { T, SWATCHES } from '../theme';
import { SHAPES, shapeNode, type ShapeDef } from './shapes';
import { pickImages, pickFile, readImage, registerAsset, removeAsset } from '../state/assets';
import { generate, TARGETS, TARGET_LABEL, assetNamesFor } from '../exporters/codegen';
import { buildSiteZip } from '../exporters/site';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { buildGen, parseCsv, type Gen } from '../document/gen';
import { cloneDeep } from '../document/tree';
import { makeHeading, makeText, makeButton, makeSection, makeShape, makeInput, makeForm } from '../document/factory';
import { importSvg } from '../document/svg-import';
import { Checks } from './Checks';
import { buildReactProjectZip } from '../exporters/react-project';

const sty = (n: Node, bp: any): Style => explicitStyle(n, bp);
const same = <T,>(vals: T[]) => (vals.every(v => v === vals[0]) ? vals[0] : undefined);

/* ---------- Layers ---------- */
function LayerRow({ n, depth, s }: { n: Node; depth: number; s: ReturnType<typeof useStudio> }) {
  const [open, setOpen] = useState(true); const [rename, setRename] = useState(false); const kids = n.children || []; const sel = s.sel.includes(n.id);
  const icon = n.type === 'text' ? 'text' : n.type === 'heading' ? 'heading' : n.type === 'image' ? 'image' : n.type === 'button' ? 'button' : n.type === 'group' ? 'group' : n.type === 'section' ? 'section' : n.type === 'container' ? 'container' : n.type === 'path' ? 'pen' : 'shapes';
  return (
    <Box>
      <Row items="center" gap="1" h="28px" pl={`${6 + depth * 12}px`} pr="1" cursor="pointer" draggable={n.type !== 'page'}
        onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-layer', n.id)} onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={(e: React.DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData('application/x-aa-layer'); if (id && id !== n.id) { if (isContainer(n)) S.moveInto(id, n.id, kids.length); } }}
        onClick={(e: React.MouseEvent) => (e.shiftKey ? S.toggleSelect(n.id) : S.select([n.id]))} onDoubleClick={() => n.type !== 'page' && setRename(true)}
        {...(sel ? T.active : { ...T.hover })} opacity={n.hidden ? '0.5' : '1'}>
        <Box w="14px" display="flex" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(!open); }}>{kids.length > 0 && <Ic n={open ? 'chevD' : 'chevR'} size={12} />}</Box>
        <Ic n={icon} size={13} />
        {rename ? <Box as="input" autoFocus defaultValue={n.name} onBlur={(e: any) => { setRename(false); S.patchNodeProps([n.id], { name: e.target.value || n.name }); }} onKeyDown={(e: any) => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); }} flex="1" min-w="0" h="22px" fontSize="12px" {...T.field} />
          : <Txt fontSize="12px" m="0" flex="1" min-w="0" truncate>{n.name}</Txt>}
        {n.type !== 'page' && <><IconBtn icon={n.hidden ? 'eyeoff' : 'eye'} title="Show / hide" size={22} iconSize={13} onClick={(e) => { e.stopPropagation(); S.toggleFlag('hidden', [n.id]); }} /><IconBtn icon={n.locked ? 'lock' : 'unlock'} title="Lock / unlock" size={22} iconSize={13} onClick={(e) => { e.stopPropagation(); S.patchNodeProps([n.id], { locked: !n.locked }); }} /></>}
      </Row>
      {open && [...kids].reverse().map(c => <LayerRow key={c.id} n={c} depth={depth + 1} s={s} />)}
    </Box>
  );
}
function Layers() { const s = useStudio(); return <Box py="1">{[...(S.root(s).children || [])].reverse().map(c => <LayerRow key={c.id} n={c} depth={0} s={s} />)}{!(S.root(s).children || []).length && <EmptyState icon="layers" title="Nothing on this page yet" hint="Draw with the tool palette." />}</Box>; }

/* ---------- Properties ---------- */
function Properties() {
  const s = useStudio(); const nodes = S.selNodes(s); const bp = s.bp;
  if (!nodes.length) return <EmptyState icon="sliders" title="Nothing selected" hint="Select an object to edit it." />;
  const ids = nodes.map(n => n.id); const n0 = nodes[0]; const st = nodes.map(n => sty(n, bp));
  const num = (k: keyof Style) => same(st.map(x => (typeof x[k] === 'number' ? (x[k] as number) : undefined)));
  const put = (patch: Style) => S.patchNodes(ids, patch);
  const only = nodes.length === 1; const container = only && isContainer(n0) && n0.type !== 'group'; const isText = nodes.every(n => n.type === 'text' || n.type === 'heading' || n.type === 'button');
  const free = nodes.every(n => (n.style.mode ?? 'abs') === 'abs');
  const ov = (k: keyof Style) => bp !== 'desktop' && nodes.some(n => hasOverride(n, bp, k));
  const setNodeAttr = (key: string, value: string) => { const attrs={...n0.attrs}; if(value) attrs[key]=value; else delete attrs[key]; S.patchNodeProps(ids,{attrs}); };
  return (
    <Box>
      {bp !== 'desktop' && <Row px="3" py="2" gap="2" items="center" {...T.card} m="2"><Txt fontSize="11px" m="0" flex="1" {...T.muted}>Editing {bp} overrides. Other sizes keep their own values.</Txt><Btn type="button" onClick={() => ids.forEach(id => S.resetKey(id))} fontSize="11px" px="2" h="24px" rounded="md" border="0" bg="primary" text="white" cursor="pointer">Reset</Btn></Row>}
      <Section title={only ? n0.name : `${nodes.length} objects`}>
        {only && <TextField label="Name" value={n0.name} onCommit={v => S.patchNodeProps(ids, { name: v || n0.name })} />}
        <Row gap="2"><NumField label="X" value={num('x') ?? 0} mixed={num('x') === undefined} disabled={!free} onCommit={v => put({ x: v })} /><NumField label="Y" value={num('y') ?? 0} mixed={num('y') === undefined} disabled={!free} onCommit={v => put({ y: v })} /></Row>
        <Row gap="2"><NumField label="W" value={num('w')} onCommit={v => put({ w: v })} min={1} /><NumField label="H" value={num('h')} onCommit={v => put({ h: v })} min={1} disabled={isText} /></Row>
        <Row gap="2"><NumField label="°" title="Rotation" value={num('rotation') ?? 0} onCommit={v => put({ rotation: v })} suffix="deg" /><NumField label="%" title="Opacity" value={Math.round((num('opacity') ?? 1) * 100)} min={0} max={100} onCommit={v => put({ opacity: v / 100 })} /></Row>
        {ov('x') || ov('w') ? <Txt fontSize="10px" m="0" {...T.muted}>Position or size overridden at {bp}.</Txt> : null}
      </Section>
      {container && <Section title="Layout">
        <Seg label="Layout" value={sty(n0, bp).layout ?? 'free'} options={[{ v: 'free', label: 'Free' }, { v: 'flex', label: 'Flex' }, { v: 'grid', label: 'Grid' }]} onChange={v => put({ layout: v })} />
        {sty(n0, bp).layout === 'flex' && <><Seg label="Direction" value={sty(n0, bp).dir ?? 'column'} options={[{ v: 'column', label: 'Column' }, { v: 'row', label: 'Row' }]} onChange={v => put({ dir: v })} /><SelectField label="Align items" value={sty(n0, bp).items ?? 'stretch'} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End'], ['stretch', 'Stretch']]} onChange={v => put({ items: v as any })} /><SelectField label="Justify" value={sty(n0, bp).justify ?? 'start'} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End'], ['between', 'Space between']]} onChange={v => put({ justify: v as any })} /><Row as="label" items="center" gap="2" fontSize="12px"><Box as="input" type="checkbox" checked={!!sty(n0,bp).wrap} onChange={(e:any)=>put({wrap:e.target.checked})} />Wrap children</Row></>}
        {sty(n0, bp).layout === 'grid' && <NumField label="Cols" value={sty(n0, bp).cols ?? 2} min={1} max={12} onCommit={v => put({ cols: Math.round(v) })} />}
        {sty(n0, bp).layout !== 'free' && <Row gap="2"><NumField label="Gap" value={sty(n0, bp).gap ?? 0} min={0} onCommit={v => put({ gap: v })} /></Row>}
        <Row gap="2"><NumField label="Pad" title="All sides" value={sty(n0, bp).pad ?? 0} min={0} onCommit={v => put({ pad: v })} /><NumField label="X" title="Horizontal padding" value={sty(n0,bp).padX} min={0} onCommit={v=>put({padX:v})} /><NumField label="Y" title="Vertical padding" value={sty(n0,bp).padY} min={0} onCommit={v=>put({padY:v})} /></Row>
        {sty(n0,bp).layout === 'flex' && <><Label>Selected child sizing</Label><Row gap="2"><SelectField value={sty(n0,bp).basis === 'fill' ? 'fill' : sty(n0,bp).basis === 'auto' ? 'hug' : 'fixed'} options={[['fixed','Fixed'],['hug','Hug'],['fill','Fill']]} onChange={v=>S.patchNodes(ids,{basis:v==='fill'?'fill':v==='hug'?'auto':(typeof n0.style.w==='number'?n0.style.w:160),grow:v==='fill'?1:0})} /><NumField label="Grow" value={num('grow') ?? 0} min={0} onCommit={v=>put({grow:v})} /></Row><Row gap="2"><NumField label="Min W" value={num('minW')} min={0} onCommit={v=>put({minW:v})} /><NumField label="Max W" value={num('maxW')} min={0} onCommit={v=>put({maxW:v})} /><SelectField label="Self" value={sty(n0,bp).self ?? 'auto'} options={[['auto','Auto'],['start','Start'],['center','Center'],['end','End'],['stretch','Stretch']]} onChange={v=>put({self:v as any})} /></Row></>}
        {sty(n0,bp).layout !== 'free' && <Btn type="button" onClick={()=>put({layout:'free'})} h="28px" {...T.card} fontSize="12px" cursor="pointer">Back to free</Btn>}
      </Section>}
      <Section title="Appearance">
        {nodes.some(n => n.type !== 'image') && <Row gap="1"><ColorField label="Fill" value={same(st.map(x => x.fill))} allowNone onChange={v => { put({ fill: v }); if (v) S.pushRecentColor(v); }} /><SelectField value={n0.style.fillToken||''} options={[['','Custom'],...(s.project?.tokens||[]).map(t=>[t.id,t.name] as [string,string])]} onChange={v=>S.patchNodeProps(ids,{style:{...n0.style,fillToken:v||undefined}} as any)} /></Row>}
        {nodes.some(n => n.type !== 'image') && <TextField label="CSS fill (solid, gradient, or fade)" value={same(st.map(x=>x.fill))||''} placeholder="linear-gradient(135deg, #6366f1, #ec4899)" onCommit={v=>put({fill:v||undefined})} />}
        <Row gap="1"><ColorField label="Stroke" value={same(st.map(x => x.stroke))} allowNone onChange={v => put({ stroke: v, strokeWidth: v ? (num('strokeWidth') || 2) : 0 })} /><SelectField value={n0.style.strokeToken||''} options={[['','Custom'],...(s.project?.tokens||[]).map(t=>[t.id,t.name] as [string,string])]} onChange={v=>S.patchNodeProps(ids,{style:{...n0.style,strokeToken:v||undefined}} as any)} /></Row>
        <Row gap="2"><NumField label="▭" title="Stroke width" value={num('strokeWidth') ?? 0} min={0} onCommit={v => put({ strokeWidth: v })} /><NumField label="◜" title="Corner radius" value={num('radius') ?? 0} min={0} onCommit={v => put({ radius: v })} /></Row>
        <SelectField label="Shadow" value={same(st.map(x => x.shadow ?? 'none')) ?? 'none'} options={[['none', 'None'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} onChange={v => put({ shadow: v as any })} />
      </Section>
      {only && (isText || n0.type === 'image') && <Section title={n0.type === 'image' ? 'Image' : 'Content'}>
        {isText && <TextField label="Text" multiline value={n0.text || ''} onCommit={v => S.patchNodeProps(ids, { text: v })} />}
        {(n0.type === 'button'||n0.type==='text'||n0.type==='heading') && <TextField label="Link (URL, #anchor, page:id)" value={n0.href || ''} onCommit={v => S.patchNodeProps(ids, { href: v })} />}
        {(n0.type === 'button'||n0.type==='text'||n0.type==='heading') && <SelectField label="Link to page" value={n0.href?.startsWith('page:')?n0.href.slice(5):''} options={[['','No page link'],...(s.project?.pages||[]).map(p=>[p.id,p.name] as [string,string])]} onChange={v=>S.patchNodeProps(ids,{href:v?`page:${v}`:undefined})} />}
        {n0.type === 'heading' && <SelectField label="Level" value={n0.tag || 'h2'} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(h => [h, h.toUpperCase()] as [string, string])} onChange={v => S.patchNodeProps(ids, { tag: v })} />}
        {n0.type === 'image' && <>
          <TextField label="Alt text" value={n0.alt || ''} onCommit={v => S.patchNodeProps(ids, { alt: v })} />
          <Btn type="button" h="30px" {...T.card} fontSize="12px" cursor="pointer" onClick={async()=>{const file=await pickFile('image/*');if(!file)return;const result=await readImage(file);if(!result)return;const asset=registerAsset(result.asset);S.patchNodeProps(ids,{src:asset.dataUrl,assetId:asset.id,name:asset.name});}}>Replace image</Btn>
          <SelectField label="Fit" value={String(n0.attrs?.['object-fit']||'cover')} options={['cover','contain','fill','none','scale-down'].map(x=>[x,x[0].toUpperCase()+x.slice(1)])} onChange={v=>setNodeAttr('object-fit',v)} />
          <TextField label="Crop position" value={String(n0.attrs?.['object-position']||'center')} placeholder="50% 50%" onCommit={v=>setNodeAttr('object-position',v||'center')} />
          <TextField label="Image filter" value={String(n0.attrs?.filter||'')} placeholder="grayscale(0.2) contrast(1.1)" onCommit={v=>setNodeAttr('filter',v)} />
          <Section title="Overlay">
            <Row gap="2" items="end"><ColorField label="Tint" value={n0.overlay?.color||'#0f172a'} allowNone onChange={v=>S.patchNodeProps(ids,{overlay:v?{color:v,opacity:n0.overlay?.opacity??0.28}:undefined})} /><NumField label="Opacity" value={Math.round((n0.overlay?.opacity??0.28)*100)} min={0} max={100} onCommit={v=>S.patchNodeProps(ids,{overlay:{color:n0.overlay?.color||'#0f172a',opacity:v/100}})} suffix="%" /></Row>
            {n0.overlay&&<Btn type="button" h="28px" {...T.card} fontSize="11px" cursor="pointer" onClick={()=>S.patchNodeProps(ids,{overlay:undefined})}>Remove overlay</Btn>}
          </Section>
        </>}
      </Section>}
      {only && n0.type === 'input' && <Section title="Form control">
        {(() => { const f = n0.field || { type: 'text' as const, name: 'field' }; const save = (patch: Partial<typeof f>) => S.patchNodeProps(ids, { field: { ...f, ...patch } }); return <>
          <SelectField label="Control" value={f.type} options={(['text','email','password','number','textarea','select','checkbox'] as const).map(v => [v, v[0].toUpperCase()+v.slice(1)] as [string,string])} onChange={v => save({ type: v as typeof f.type })} />
          <TextField label="Name" value={f.name} onCommit={v => save({ name: v || 'field' })} />
          {f.type !== 'checkbox' && f.type !== 'select' && <TextField label="Placeholder" value={f.placeholder || ''} onCommit={v => save({ placeholder: v })} />}
          {f.type !== 'checkbox' && f.type !== 'select' && <TextField label="Initial value" value={f.value || ''} onCommit={v => save({ value: v })} />}
          {f.type === 'select' && <><TextField label="Options (comma separated)" value={(f.options || []).join(', ')} onCommit={v => save({ options: v.split(',').map(x => x.trim()).filter(Boolean) })} /><TextField label="Selected option" value={f.value || ''} onCommit={v => save({ value: v })} /></>}
          {f.type === 'checkbox' && <Row as="label" items="center" gap="2" fontSize="12px"><Box as="input" type="checkbox" checked={f.value === 'true'} onChange={(e:any) => save({ value: e.target.checked ? 'true' : 'false' })} />Checked by default</Row>}
          {f.type !== 'checkbox' && <Row as="label" items="center" gap="2" fontSize="12px"><Box as="input" type="checkbox" checked={!!f.required} onChange={(e:any) => save({ required: e.target.checked })} />Required</Row>}
        </>; })()}
      </Section>}
      {only && isContainer(n0) && <Section title="Repeater">
        <Txt fontSize="11px" m="0" {...T.muted}>Repeats the first child once per CSV row. Use {'{{field}}'} in its text, image alt/src, or link.</Txt>
        <Row as="label" items="center" gap="2" fontSize="12px"><Box as="input" type="checkbox" checked={!!n0.repeat} onChange={(e:any) => { const csv = n0.repeat?.csv || 'title,description\nFirst item,Description'; S.patchNodeProps(ids, { repeat: e.target.checked ? { csv, rows: parseCsv(csv) } : undefined }); }} />Repeat first child</Row>
        {n0.repeat && <><TextField label="Data (CSV)" multiline value={n0.repeat.csv} onCommit={csv => S.patchNodeProps(ids, { repeat: { csv, rows: parseCsv(csv) } })} /><Txt fontSize="10px" m="0" {...T.muted}>{n0.repeat.rows.length} data row(s). Keep a single child as the template.</Txt></>}
      </Section>}
    </Box>
  );
}

/* ---------- Typography ---------- */
function Typography() {
  const s = useStudio(); const nodes = S.selNodes(s).filter(n => n.type === 'text' || n.type === 'heading' || n.type === 'button');
  if (!nodes.length) return <EmptyState icon="type" title="Select text" hint="Typography applies to text, headings and buttons." />;
  const ids = nodes.map(n => n.id); const st = nodes.map(n => sty(n, s.bp)); const put = (p: Style) => S.patchNodes(ids, p);
  return <Box p="3" display="flex" flex-col gap="3">
    <SelectField label="Linked style" value={st[0].tstyle || ''} options={[['','Unlinked'],...(s.project?.textStyles||[]).map(x=>[x.id,x.name] as [string,string])]} onChange={v=>{const ts=s.project?.textStyles?.find(x=>x.id===v);ts?S.applyTextStyle(ids,ts):S.unlinkTextStyle(ids);}} />
    <Row gap="2"><NumField label="Aa" title="Font size" value={same(st.map(x => x.fontSize))} min={8} max={200} onCommit={v => {S.unlinkTextStyle(ids);put({ fontSize: v });}} suffix="px" /><SelectField value={String(same(st.map(x => x.fontWeight)) ?? 400)} options={[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold']]} onChange={v => {S.unlinkTextStyle(ids);put({ fontWeight: Number(v) });}} /></Row>
    <Seg label="Alignment" value={same(st.map(x => x.align)) ?? 'left'} options={[{ v: 'left', label: 'Left' }, { v: 'center', label: 'Center' }, { v: 'right', label: 'Right' }]} onChange={v => put({ align: v })} />
    <Row gap="2"><NumField label="↕" title="Line height" step={0.1} value={same(st.map(x => x.lineHeight)) ?? 1.4} min={0.8} max={3} onCommit={v => {S.unlinkTextStyle(ids);put({ lineHeight: v });}} /><NumField label="↔" title="Letter spacing" step={0.5} value={same(st.map(x => x.letterSpacing)) ?? 0} onCommit={v => {S.unlinkTextStyle(ids);put({ letterSpacing: v });}} suffix="px" /></Row>
    <Row gap="1"><ColorField label="Colour" value={same(st.map(x => x.color))} onChange={v => {S.unlinkTextStyle(ids);if(v)put({ color: v });}} /><SelectField value={nodes[0].style.colorToken||''} options={[['','Custom'],...(s.project?.tokens||[]).map(t=>[t.id,t.name] as [string,string])]} onChange={v=>S.patchNodeProps(ids,{style:{...nodes[0].style,colorToken:v||undefined}} as any)} /></Row>
  </Box>;
}

/* ---------- Tokens and linked styles ---------- */
function Styles() {
  const s=useStudio(); const p=s.project!; const tokens=p.tokens||[]; const styles=p.textStyles||[]; const selected=S.selNodes(s); const node=selected[0]; const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const update=(t:DesignToken)=>S.setToken(t);
  return <Box p="2" display="flex" flex-col gap="2">
    <Row items="center" justify="between"><Label>Page appearance</Label><Seg value={(p as any).pageTheme||'light'} options={[{v:'light',label:'Light'},{v:'dark',label:'Dark'}]} onChange={v=>S.setPageTheme(v as 'light'|'dark')} /></Row>
    <Section title="Colour tokens" action={<IconBtn icon="plus" title="Add colour token" size={22} iconSize={13} onClick={S.addToken} />}>
      {tokens.map(t=><Box key={t.id} p="2" mb="2" {...T.card}><Row items="center" gap="2"><Box w="22px" h="22px" rounded="sm" bg={t.light} border="1px solid gray-300" title="Light value"/><TextField value={t.name} onCommit={v=>update({...t,name:v||t.name})}/>{node&&<IconBtn icon="check" title="Apply as fill token" size={22} iconSize={13} onClick={()=>S.replaceNode(node.id,n=>({...n,style:{...n.style,fillToken:t.id}}))}/>}<IconBtn icon="trash" title="Delete token" size={22} iconSize={13} onClick={()=>S.deleteToken(t.id)}/></Row>
        <Row gap="2"><ColorField label="Light" value={t.light} onChange={v=>v&&update({...t,light:v})}/><ColorField label="Dark" value={t.dark||t.light} onChange={v=>update({...t,dark:v})}/></Row></Box>)}
    </Section>
    <Section title="Linked text styles" action={<IconBtn icon="plus" title="Add text style" size={22} iconSize={13} onClick={()=>S.setTextStyle({id:`type-${Date.now()}`,name:'New style',fontSize:18,fontWeight:400})} />}>
      {styles.map(ts=><Row key={ts.id} items="center" gap="1" mb="1"><TextField value={ts.name} onCommit={v=>S.setTextStyle({...ts,name:v||ts.name})}/><NumField value={ts.fontSize} min={8} max={200} suffix="px" onCommit={v=>S.setTextStyle({...ts,fontSize:v})}/>{selected.length>0&&<IconBtn icon="type" title={`Apply ${ts.name} to selection`} size={22} iconSize={13} onClick={()=>S.applyTextStyle(selected.map(n=>n.id),ts)}/>}</Row>)}
    </Section>
    {tokens.length>1&&<Section title="Find & replace token"><SelectField label="Find" value={from} options={tokens.map(t=>[t.id,t.name] as [string,string])} onChange={setFrom}/><SelectField label="Replace with" value={to} options={tokens.map(t=>[t.id,t.name] as [string,string])} onChange={setTo}/><Btn type="button" disabled={!from||!to||from===to} onClick={()=>{S.replaceTokenReferences(from,to);S.toast('Token references replaced across pages and components.');}} h="28px" {...T.card} fontSize="11px" cursor="pointer">Replace references</Btn></Section>}
    <Section title="Version snapshots" action={<IconBtn icon="plus" title="Create named snapshot" size={22} iconSize={13} onClick={()=>{const name=prompt('Name this snapshot',`Snapshot ${new Date().toLocaleString()}`);if(name!==null)S.createSnapshot(name);}}/>}>
      {!(p.snapshots||[]).length?<Txt fontSize="10px" m="0" {...T.muted}>Save a named restore point before a major change.</Txt>:(p.snapshots||[]).slice().reverse().map(snap=><Row key={snap.id} items="center" gap="1" mb="1" p="1" {...T.card}><Box flex="1"><Txt fontSize="11px" m="0" fontWeight="600">{snap.name}</Txt><Txt fontSize="9px" m="0" {...T.muted}>{new Date(snap.createdAt).toLocaleString()}</Txt></Box><IconBtn icon="refresh" title="Restore snapshot" size={22} iconSize={12} onClick={()=>confirm(`Restore “${snap.name}”? Current changes remain undoable.`)&&S.restoreSnapshot(snap.id)}/><IconBtn icon="trash" title="Delete snapshot" size={22} iconSize={12} onClick={()=>S.deleteSnapshot(snap.id)}/></Row>)}
    </Section>
    <Section title="Font stacks"><TextField label="Headings" value={p.fontStacks?.heading||'Inter, sans-serif'} onCommit={v=>S.setProject({...p,fontStacks:{...(p.fontStacks||{body:'Inter, sans-serif'}),heading:v}})}/><TextField label="Body" value={p.fontStacks?.body||'Inter, sans-serif'} onCommit={v=>S.setProject({...p,fontStacks:{...(p.fontStacks||{heading:'Inter, sans-serif'}),body:v}})}/></Section>
  </Box>;
}

/* ---------- Align ---------- */
function AlignPanel() {
  const s = useStudio(); const [to, setTo] = useState<'selection' | 'parent' | 'page'>('selection'); const L = s.layout;
  const A: [string, any][] = [['alignL', 'left'], ['alignCH', 'hcenter'], ['alignR', 'right'], ['alignT', 'top'], ['alignCV', 'vcenter'], ['alignB', 'bottom']];
  return <Box p="3" display="flex" flex-col gap="3">
    <Seg label="Align to" value={to} options={[{ v: 'selection', label: 'Selection' }, { v: 'parent', label: 'Parent' }, { v: 'page', label: 'Page' }]} onChange={setTo} />
    <Row gap="1">{A.map(([i, k]) => <IconBtn key={k} icon={i} title={`Align ${k}`} onClick={() => S.doAlign(k, to)} disabled={!s.sel.length} />)}<IconBtn icon="distH" title="Distribute horizontally" onClick={() => S.doDistribute('x')} disabled={s.sel.length < 3} /><IconBtn icon="distV" title="Distribute vertically" onClick={() => S.doDistribute('y')} disabled={s.sel.length < 3} /></Row>
    <Label>Snapping & guides</Label>
    {([['snap', 'Snap to objects and guides'], ['grid', 'Show grid (8px)'], ['guides', 'Show guides'], ['safeArea', 'Show safe area'], ['rulers', 'Show rulers']] as const).map(([k, t]) => <Row key={k} as="label" items="center" gap="2" fontSize="12px" cursor="pointer"><Box as="input" type="checkbox" checked={L[k]} onChange={(e: any) => S.setLayoutFlag({ [k]: e.target.checked })} />{t}</Row>)}
    <Btn type="button" onClick={() => S.setGuides([])} h="28px" {...T.card} fontSize="12px" cursor="pointer">Clear all guides</Btn>
  </Box>;
}

/* ---------- Shapes ---------- */
function Thumb({ d }: { d: ShapeDef }) {
  return <svg viewBox="0 0 40 40" width="36" height="36">{d.kind === 'ellipse' ? <ellipse cx="20" cy="20" rx="16" ry="16" fill="currentColor" /> : d.kind ? <rect x="4" y="8" width="32" height="24" rx={d.kind === 'rounded' ? 7 : 0} fill="currentColor" /> : <polygon points={d.pts!.map(([x, y]) => `${4 + x * 32},${4 + y * 32}`).join(' ')} fill="currentColor" />}</svg>;
}
function Shapes() {
  return <Box p="2" display="grid" grid-cols="4" gap="1">{SHAPES.map(d => <Btn key={d.id} type="button" title={`${d.name} · click to insert or drag onto the canvas`} draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-shape', d.id)} onClick={() => S.addNode(shapeNode(d))} h="52px" border="0" rounded="md" cursor="pointer" bg="transparent" {...T.hover} text="primary" dark-text="primary" display="flex" items="center" justify="center"><Thumb d={d} /></Btn>)}</Box>;
}

/* ---------- Assets ---------- */
function Assets() {
  const s = useStudio(); const p = s.project!;
  const add = async () => { for (const f of await pickImages(true)) { const r = await readImage(f); if (r) registerAsset(r.asset); } };
  const addSvg = async () => { const f=await pickFile('.svg,image/svg+xml');if(!f)return;try{S.addNode(importSvg(await f.text(),f.name));S.toast('SVG imported as editable vector paths.');}catch(e){S.toast(e instanceof Error?e.message:'Could not import this SVG.','error');} };
  return <Box p="2" display="flex" flex-col gap="2">
    <Btn type="button" onClick={add} h="30px" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">Upload images</Btn>
    <Btn type="button" onClick={addSvg} h="28px" {...T.card} fontSize="12px" cursor="pointer">Import SVG artwork</Btn>
    {!p.assets.length && <EmptyState icon="image" title="No images yet" hint="Upload, or drop an image on the canvas." />}
    <Box display="grid" grid-cols="2" gap="2">{p.assets.map(a => <Box key={a.id} {...T.card} p="1" draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-asset', a.id)}>
      <Box as="img" src={a.dataUrl} alt={a.name} w="100%" h="64px" object-fit="cover" rounded="sm" cursor="pointer" onClick={() => { const n = { ...cloneDeep(makeText(0, 0)), type: 'image' as const, name: a.name, src: a.dataUrl, assetId: a.id, alt: '', text: undefined, style: { x: 40, y: 40, w: 320, h: 220 } }; S.addNode(n); }} />
      <Row items="center" justify="between"><Txt fontSize="10px" m="0" truncate flex="1">{a.name}</Txt><IconBtn icon="trash" title="Remove" size={20} iconSize={12} onClick={() => removeAsset(a.id)} /></Row></Box>)}</Box></Box>;
}

/* ---------- Components and UI Kit ---------- */
const block=(name:string,dir:'row'|'column',children:Node[],fill?:string):Node=>{
  const n=makeSection(name,dir==='row'?340:420,fill);n.style.layout='flex';n.style.dir=dir;n.style.gap=24;n.style.pad=40;n.style.items='center';n.style.justify='center';
  n.children=children.map(c=>({...c,style:{...c.style,mode:'flow',...(dir==='row'?{w:Math.min(460,Number(c.style.w)||320)}:{w:'fill'})}}));return n;
};
const kit: [string,()=>Node][]=[
 ['Centered hero',()=>block('Centered hero','column',[makeHeading(0,0,'A clear promise for your customers',48),makeText(0,0,'Explain the value in one concise sentence.',18),makeButton(0,0,'Get started')],'#eef2ff')],
 ['Split hero',()=>block('Split hero','row',[block('Hero copy','column',[makeHeading(0,0,'Build with confidence',44),makeText(0,0,'A flexible product for ambitious teams.',18),makeButton(0,0,'Explore')]),makeShape('ellipse',0,0,300,300)])],
 ['Feature cards',()=>block('Feature cards','row',[1,2,3].map(i=>{const c=block(`Feature ${i}`,'column',[makeHeading(0,0,`Feature ${i}`,24),makeText(0,0,'A short description of this benefit.',16)],'#ffffff');c.style.radius=14;c.style.pad=24;return c;}))],
 ['Pricing card',()=>block('Pricing','column',[makeHeading(0,0,'Pro plan',28),makeHeading(0,0,'$19 / month',40),makeText(0,0,'Everything you need to get started.',16),makeButton(0,0,'Choose plan')],'#f8fafc')],
 ['Stats row',()=>block('Stats','row',[1,2,3].map(i=>block(`Stat ${i}`,'column',[makeHeading(0,0,['10k+','99.9%','24/7'][i-1],32),makeText(0,0,['Customers','Uptime','Support'][i-1],14)])))],
 ['Testimonial',()=>block('Testimonial','column',[makeText(0,0,'“This made our workflow much simpler.”',24),makeText(0,0,'Alex Morgan · Product lead',14)],'#f8fafc')],
 ['FAQ',()=>{const n=block('FAQ','column',[makeHeading(0,0,'Frequently asked questions',32),makeText(0,0,'Add your question and answer here.',16)]);n.children![1].tag='details';return n;}],
 ['Call to action',()=>block('Call to action','row',[makeHeading(0,0,'Ready to begin?',32),makeButton(0,0,'Start now')],'#eef2ff')],
 ['Footer',()=>block('Footer','row',[makeText(0,0,'© Your company',14),makeText(0,0,'About   Contact   Privacy',14)],'#111827')],
 ['Text input',()=>makeInput('text','name','Your name')],
 ['Email input',()=>makeInput('email','email','you@example.com')],
 ['Select input',()=>makeInput('select','choice','')],
 ['Checkbox',()=>makeInput('checkbox','consent','')],
 ['Contact form',()=>{const n=makeForm('Contact form',[makeHeading(0,0,'Contact us',32),makeInput('text','name','Your name'),makeInput('email','email','you@example.com'),makeInput('textarea','message','How can we help?'),Object.assign(makeButton(0,0,'Send message'),{href:undefined,tag:'button',attrs:{type:'submit'}})]);n.children=n.children?.map(c=>({...c,style:{...c.style,mode:'flow',w:'fill'}}));return n;}],
 ['Sign-in form',()=>{const n=makeForm('Sign in',[makeHeading(0,0,'Welcome back',32),makeInput('email','email','Email address'),makeInput('password','password','Password'),Object.assign(makeButton(0,0,'Sign in'),{href:undefined,tag:'button',attrs:{type:'submit'}})]);n.children=n.children?.map(c=>({...c,style:{...c.style,mode:'flow',w:'fill'}}));return n;}],
 ['Dashboard shell',()=>block('Dashboard','row',[block('Sidebar','column',[makeText(0,0,'Overview',15),makeText(0,0,'Reports',15),makeText(0,0,'Settings',15)],'#f8fafc'),block('Dashboard content','column',[makeHeading(0,0,'Overview',32),makeText(0,0,'Your workspace at a glance.',16)])])],
 ['Data table',()=>block('Data table','column',[makeHeading(0,0,'Recent activity',24),...['Name             Status             Date','Project Alpha    Active             Today','Project Beta     Review             Yesterday'].map(t=>makeText(0,0,t,14))])],
 ['Stat tile',()=>block('Stat tile','column',[makeText(0,0,'Total revenue',14),makeHeading(0,0,'$24,680',32),makeText(0,0,'↑ 12% this month',14)],'#f8fafc')],
 ['Mobile list screen',()=>block('Mobile list screen','column',[makeHeading(0,0,'Your items',28),...['First item','Second item','Third item'].map(t=>makeText(0,0,t,16)),makeText(0,0,'Home     Search     Profile',14)])],
 ['Navbar',()=>block('Navbar','row',[makeHeading(0,0,'Brand',22),makeText(0,0,'Product   Pricing   About',14),makeButton(0,0,'Sign in')])],
 ['FAQ details',()=>{const n=block('FAQ','column',[makeHeading(0,0,'Questions',30)]);const d=makeText(0,0,'What is included?  Everything you need.',16);d.tag='details';const summary=makeText(0,0,'What is included?',16);summary.tag='summary';d.children=[summary,makeText(0,0,'Everything you need to get started.',14)];n.children!.push(d);return n;}],
 ['Tabs',()=>block('Tabs','column',[block('Tab labels','row',['Overview','Activity','Settings'].map(t=>makeButton(0,0,t))),makeText(0,0,'Selected tab content',16)])],
 ['Modal',()=>block('Modal','column',[makeHeading(0,0,'Confirm action',24),makeText(0,0,'Are you sure you want to continue?',16),block('Modal actions','row',[makeButton(0,0,'Cancel'),makeButton(0,0,'Continue')])],'#ffffff')],
 ['Sidebar',()=>block('App sidebar','column',['Workspace','Overview','Projects','Settings'].map(t=>makeText(0,0,t,15)),'#f8fafc')],
];
function Components() {
  const s=useStudio();const p=s.project!;const [variantName,setVariantName]=useState('Default');
  const create=()=>{if(!s.sel.length){S.toast('Select an object first.');return;}S.createComponentFromSelection();};
  const active=S.selNodes(s)[0];
  return <Box p="2" display="flex" flex-col gap="2">
    <Btn type="button" onClick={create} h="30px" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">Make component from selection</Btn>
    {active?.inst&&<><Btn type="button" onClick={()=>S.updateComponent(active.inst!)} h="28px" {...T.card} fontSize="12px" cursor="pointer">Update linked component</Btn><Btn type="button" onClick={()=>S.updateMasterFromInstance(active.id)} h="28px" {...T.card} fontSize="12px" cursor="pointer">Update master from instance</Btn><Row gap="1"><TextField value={variantName} onCommit={setVariantName}/><IconBtn icon="plus" title="Save selected instance as variant" onClick={()=>S.saveComponentVariant(active.inst!,variantName)} /></Row><SelectField label="Variant" value={active.variant||''} options={[['','Base'],...(p.components.find(c=>c.id===active.inst)?.variants||[]).map(v=>[v.id,v.name] as [string,string])]} onChange={v=>S.applyComponentVariant(active.id,v)} /></>}
    <Label>Components · drag onto canvas to place</Label>{p.components.map(c=><Box key={c.id} draggable {...T.card} p="2" mb="1" cursor="grab" onDragStart={(e:React.DragEvent)=>{e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-aa-component',c.id);}}><Row items="center" gap="1"><Ic n="component" size={13}/><Txt fontSize="12px" m="0" flex="1">{c.name}</Txt><IconBtn icon="plus" title="Insert linked instance" onClick={()=>S.insertComponent(c.id)}/><IconBtn icon="refresh" title="Update all instances" onClick={()=>S.updateComponent(c.id)}/><IconBtn icon="trash" title="Delete component master" onClick={()=>S.deleteComponent(c.id)}/></Row>{(c.variants||[]).map(v=><Txt key={v.id} fontSize="10px" m="0" {...T.muted}>{v.name}</Txt>)}</Box>)}
    <Label>UI Kit · insert a block</Label>{kit.map(([name,mk])=><Btn key={name} type="button" onClick={()=>{const rekey=(n:Node):Node=>({...n,id:uid(),...(n.children?{children:n.children.map(rekey)}:{})});S.addNode(rekey(mk()),S.root().id);}} h="30px" px="2" text-align="left" {...T.card} fontSize="12px" cursor="pointer">{name}</Btn>)}
  </Box>;
}

/* ---------- Structure ---------- */
function Structure() {
  const s = useStudio(); const all = flatten(S.root(s)); const outline = all.filter(n => n.type === 'section' || n.type === 'heading');
  const issues = all.filter(n => n.type === 'image' && !n.alt).length;
  return <Box py="1">{outline.map(n => <Row key={n.id} items="center" gap="2" h="28px" px="3" cursor="pointer" {...T.hover} onClick={() => S.select([n.id])} pl={n.type === 'heading' ? '24px' : '12px'}><Ic n={n.type === 'section' ? 'section' : 'heading'} size={13} /><Txt fontSize="12px" m="0" flex="1" truncate>{n.type === 'heading' ? n.text : n.name}</Txt>{n.type === 'heading' && <Txt fontSize="10px" m="0" {...T.muted}>{n.tag || 'h2'}</Txt>}</Row>)}
    {!outline.length && <EmptyState icon="section" title="No sections or headings" />}
    {issues > 0 && <Txt fontSize="11px" m="0" px="3" py="2" text="warning">{issues} image{issues > 1 ? 's' : ''} without alt text.</Txt>}</Box>;
}

/* ---------- Code & export ---------- */
export function exportZip() { const p = S.getState().project!; download(buildSiteZip(p), `${(p.name || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`); S.toast('Exported ZIP'); }
export function exportReactZip() { const p=S.getState().project!;download(buildReactProjectZip(p),`${(p.name||'site').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-react.zip`);S.toast('Exported runnable React project'); }
export function downloadProject() { const p = S.getState().project!; download(new Blob([JSON.stringify(p)], { type: 'application/json' }), `${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'project'}.atomattr.json`); }
function Export() {
  const s = useStudio();const p=s.project!;const pg=S.page(s);
  return <Box p="3" display="flex" flex-col gap="2">
    <Section title="Page SEO"><TextField label="Title" value={pg.seo?.title||''} placeholder={`${pg.name} · ${p.name}`} onCommit={v=>S.setPageSeo(pg.id,{...pg.seo,title:v})}/><TextField label="Description" value={pg.seo?.description||''} multiline placeholder="A short summary for search results" onCommit={v=>S.setPageSeo(pg.id,{...pg.seo,description:v})}/><Txt fontSize="10px" m="0" {...T.muted}>Applied to the exported page’s title and description tags.</Txt></Section>
    <Btn type="button" onClick={exportZip} h="32px" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">Export site as ZIP</Btn>
    <Btn type="button" onClick={exportReactZip} h="30px" {...T.card} fontSize="12px" cursor="pointer">Export runnable React project</Btn>
    <Btn type="button" onClick={downloadProject} h="30px" {...T.card} fontSize="12px" cursor="pointer">Download project file</Btn>
    <Label>Open code panel</Label><Box display="grid" grid-cols="2" gap="1">{TARGETS.map(t => <Btn key={t} type="button" onClick={() => S.toggleCode(t)} h="28px" rounded="md" {...(s.layout.code.open && s.layout.code.target === t ? T.active : T.card)} fontSize="11px" cursor="pointer">{TARGET_LABEL[t]}</Btn>)}</Box></Box>;
}

function AttributesPanel() {
  const s=useStudio();const nodes=S.selNodes(s);const node=nodes[0];
  if(!node)return <EmptyState icon="sliders" title="Select an object" hint="Generated and custom AtomAttr attributes appear here."/>;
  const gen=buildGen(S.root(s),s.bp,'editor',[],null,null,{...s.project!,activeState:s.attrState==='base'?undefined:s.attrState});
  const findGen=(g:Gen,id:string):Gen|undefined=>g.id===id?g:g.children.map(c=>findGen(c,id)).find(Boolean);
  const attrs=findGen(gen,node.id)?.attrs||{};const [draft,setDraft]=useState(Object.entries(node.attrs||{}).map(([k,v])=>v===true?k:`${k}=${v}`).join('\n'));
  useEffect(()=>setDraft(Object.entries(node.attrs||{}).map(([k,v])=>v===true?k:`${k}=${v}`).join('\n')),[node.id,node.attrs]);
  const save=()=>{const out:Record<string,string|boolean>={};for(const line of draft.split('\n')){const t=line.trim();if(!t)continue;const i=t.indexOf('=');if(i<0){if(/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(t))out[t]=true;}else{const k=t.slice(0,i).trim();if(/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(k))out[k]=t.slice(i+1).trim();}}S.setCustomAttrs([node.id],out);};
  const stateKeys=['base','hover','focus','active','disabled','dark'] as const;const state=s.attrState;
  const patch=(p:Style)=>state==='base'?S.patchNodes([node.id],p):S.patchStateStyle([node.id],p,state);
  return <Box p="3" display="flex" flex-col gap="2">
    <Seg label="State" value={state} options={stateKeys.map(v=>({v,label:v==='disabled'?'Off':v[0].toUpperCase()+v.slice(1)}))} onChange={S.setAttrState}/>
    <Section title="Generated attributes · read only"><Box as="pre" m="0" p="2" overflow="auto" max-h="180px" fontSize="11px" whitespace="pre-wrap" {...T.card}>{JSON.stringify(attrs,null,2)}</Box></Section>
    <Section title="Your attributes"><Txt fontSize="10px" m="0" {...T.muted}>One per line: name=value. Bare names are boolean attributes. Custom values export last.</Txt><Box as="textarea" value={draft} onChange={(e:any)=>setDraft(e.target.value)} onBlur={save} w="100%" min-h="100px" p="2" fontSize="11px" font-mono {...T.field}/><Btn type="button" onClick={save} h="26px" {...T.card} fontSize="11px" cursor="pointer">Apply attributes</Btn></Section>
    {state!=='base'&&<Section title={`${state} appearance`}><ColorField label="Fill" value={node.states?.[state]?.fill} allowNone onChange={v=>patch({fill:v})}/><ColorField label="Text" value={node.states?.[state]?.color} allowNone onChange={v=>patch({color:v})}/><ColorField label="Border" value={node.states?.[state]?.stroke} allowNone onChange={v=>patch({stroke:v,strokeWidth:v?1:0})}/><Row gap="2"><NumField label="Radius" value={node.states?.[state]?.radius} min={0} onCommit={v=>patch({radius:v})}/><NumField label="Opacity" value={node.states?.[state]?.opacity??1} min={0} max={1} step={0.1} onCommit={v=>patch({opacity:v})}/></Row><SelectField label="Shadow" value={node.states?.[state]?.shadow||'none'} options={[['none','None'],['sm','Small'],['md','Medium'],['lg','Large']]} onChange={v=>patch({shadow:v as any})}/></Section>}
  </Box>;
}

export const PANELS: Record<DockerId, () => React.ReactElement> = { layers: Layers, properties: Properties, structure: Structure, styles: Styles, typography: Typography, align: AlignPanel, shapes: Shapes, assets: Assets, components: Components, attributes: AttributesPanel, checks: Checks, export: Export };
void thumbSvg; void generate; void assetNamesFor;
