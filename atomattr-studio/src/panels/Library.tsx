import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { Node } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { uid } from '../document/tree';
import { buildGen } from '../document/gen';
import { RenderTree } from '../canvas/Render';
import { IconBtn, SelectField, TextField, EmptyState } from '../components/ui';
import { Ic } from '../components/Icons';
import { ToolIcon } from '../components/ToolIcons';
import { T } from '../theme';
import { setKitDrag } from './kit-drag';
import { useCols } from '../components/useCols';
import { ensureKeyframes } from '../document/animations';
import { ensureUiCss } from '../document/ui-css';
import { type KitItem, buildGroups, STOCK_ASSETS, remapFill, stockIdsIn } from './kit';
import { registerAsset } from '../state/assets';
import { makeHeading, makeText, makeButton, makeSection, makeShape, makeInput, makeForm, makeEmbed } from '../document/factory';

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
 ['Navbar',()=>{const n=block('Navbar','row',[],'#ffffff');n.style={...n.style,layout:'flex',dir:'row',justify:'between',items:'center',wrap:true,gap:24,padX:24,padY:16,minH:72,h:'auto',stroke:'#e5e7eb',strokeWidth:1};const brand=makeHeading(0,0,'Brand',22);brand.name='Brand';brand.style={mode:'flow',w:'auto',h:'auto',fontSize:22,fontWeight:700,color:'#111827'};const links={id:uid(),type:'container' as const,name:'Navigation links',style:{mode:'flow' as const,w:'auto' as const,h:'auto' as const,layout:'flex' as const,dir:'row' as const,items:'center' as const,justify:'center' as const,gap:24,wrap:true},children:[] as Node[]};[['Products','#products'],['Pricing','#pricing'],['About','#about']].forEach(([label,href])=>{const a=makeText(0,0,label,14);a.name=`${label} link`;a.tag='a';a.href=href;a.style={mode:'flow',w:'auto',h:'auto',fontSize:14,color:'#333333'};links.children.push(a);});const action=makeButton(0,0,'Sign in');action.style={mode:'flow',w:100,h:40,fill:'#171717',color:'#ffffff',radius:999,fontSize:14,align:'center'};n.children=[brand,links,action];return n;}],
 ['FAQ details',()=>{const n=block('FAQ','column',[makeHeading(0,0,'Questions',30)]);const d=makeText(0,0,'What is included?  Everything you need.',16);d.tag='details';const summary=makeText(0,0,'What is included?',16);summary.tag='summary';d.children=[summary,makeText(0,0,'Everything you need to get started.',14)];n.children!.push(d);return n;}],
 ['Custom HTML embed',()=>makeEmbed()],
 ['Tabs',()=>block('Tabs','column',[block('Tab labels','row',['Overview','Activity','Settings'].map(t=>makeButton(0,0,t))),makeText(0,0,'Selected tab content',16)])],
 ['Modal',()=>block('Modal','column',[makeHeading(0,0,'Confirm action',24),makeText(0,0,'Are you sure you want to continue?',16),block('Modal actions','row',[makeButton(0,0,'Cancel'),makeButton(0,0,'Continue')])],'#ffffff')],
 ['Sidebar',()=>block('App sidebar','column',['Workspace','Overview','Projects','Settings'].map(t=>makeText(0,0,t,15)),'#f8fafc')],
 ['Image hero (background photo)',()=>{const a=S.getState().project?.assets[0];const n=block('Image hero','column',[makeHeading(0,0,'Make it unforgettable',52),makeText(0,0,'Pick the section, then use Fill → Background image to swap the photo.',18),makeButton(0,0,'Get started')],a?undefined:'#1e1b4b');n.style.h=520;n.style.fill=a?undefined:'linear-gradient(135deg, #1e1b4b 0%, #6366f1 100%)';if(a){n.style.fillImg=a.id;n.style.bgSize='cover';n.style.bgPos='center';n.style.bgRepeat='no-repeat';n.style.bgTint='rgba(15,23,42,0.55)';}n.children!.slice(0,2).forEach(c=>{c.style.color='#ffffff';});return n;}],
 ['Gradient hero',()=>{const n=block('Gradient hero','column',[makeHeading(0,0,'Design that moves',52),makeText(0,0,'A bold gradient behind a short promise.',18),makeButton(0,0,'Start free')]);n.style.h=480;n.style.fill='linear-gradient(135deg, #6366f1 0%, #ec4899 100%)';n.children!.slice(0,2).forEach(c=>{c.style.color='#ffffff';});return n;}],
 ['Gradient text heading',()=>{const h=makeHeading(0,0,'Gradient headline',56);h.style.clipText=true;h.style.fill='linear-gradient(90deg, #6366f1 0%, #ec4899 100%)';h.style.w='auto';return block('Gradient headline','column',[h]);}],
 ['Glass card',()=>{const n=block('Glass card','column',[makeHeading(0,0,'Frosted glass',26),makeText(0,0,'Blurs whatever sits behind it.',16)]);n.style.fill='rgba(255,255,255,0.35)';n.style.bgBlur=14;n.style.radius=20;n.style.stroke='rgba(255,255,255,0.6)';n.style.strokeWidth=1;return n;}],
 ['Image card',()=>{const a=S.getState().project?.assets[0];const n=block('Image card','column',[makeHeading(0,0,'Card title',24),makeText(0,0,'Short supporting text for this card.',15)],'#ffffff');n.style.radius=16;n.style.shadowCss='0px 12px 32px rgba(0,0,0,0.18)';const img:Node={id:uid(),type:'container',name:'Card image',style:{mode:'flow',w:'fill',h:180,radius:12,fill:a?undefined:'linear-gradient(135deg, #a5b4fc 0%, #f9a8d4 100%)',...(a?{fillImg:a.id,bgSize:'cover',bgPos:'center',bgRepeat:'no-repeat'}:{}),layout:'free'},children:[]};n.children=[img,...(n.children||[])];return n;}],
 ['Logo cloud',()=>block('Logo cloud','row',['Acme','Globex','Initech','Umbrella','Hooli'].map(t=>makeHeading(0,0,t,22)),'#f8fafc')],
 ['Team grid',()=>block('Team grid','row',['Alex','Sam','Jordan'].map(t=>{const c=block(t,'column',[makeShape('ellipse',0,0,96,96),makeHeading(0,0,t,20),makeText(0,0,'Role title',14)]);return c;}))],
 ['Blog cards',()=>block('Blog cards','row',[1,2,3].map(i=>{const c=block(`Post ${i}`,'column',[makeText(0,0,'CATEGORY',12),makeHeading(0,0,`Article title ${i}`,22),makeText(0,0,'A two-line teaser for the article goes here.',15),makeButton(0,0,'Read more')],'#ffffff');c.style.radius=14;return c;}))],
 ['Newsletter signup',()=>{const n=block('Newsletter','column',[makeHeading(0,0,'Stay in the loop',30),makeText(0,0,'One short email a month.',16),makeInput('email','email','you@example.com'),Object.assign(makeButton(0,0,'Subscribe'),{href:undefined,tag:'button'})],'#eef2ff');return n;}],
 ['Gallery grid',()=>{const n=block('Gallery','column',[]);n.style.layout='grid';n.style.cols=3;n.children=Array.from({length:6},(_,i)=>({id:uid(),type:'container' as const,name:`Photo ${i+1}`,style:{mode:'flow' as const,w:'fill' as const,h:160,radius:10,fill:`linear-gradient(135deg, hsl(${i*50},80%,70%) 0%, hsl(${i*50+40},80%,55%) 100%)`,layout:'free' as const},children:[]}));return n;}],
 ['Alert banner',()=>{const n=block('Alert','row',[makeText(0,0,'Heads up: a short message for your visitors.',15),makeButton(0,0,'Dismiss')],'#fef3c7');n.style.radius=10;return n;}],
 ['Badge',()=>{const b=makeButton(0,0,'New');b.style.radius=999;b.style.fontSize=12;b.style.fill='#dcfce7';b.style.color='#166534';return b;}],
 ['Progress bar',()=>{const n=block('Progress','column',[makeText(0,0,'Upload 70%',14)]);const bar:Node={id:uid(),type:'container',name:'Track',style:{mode:'flow',w:'fill',h:10,radius:999,fill:'#e5e7eb',layout:'free'},children:[{id:uid(),type:'container',name:'Fill',style:{x:0,y:0,w:70,h:10,radius:999,fill:'linear-gradient(90deg, #6366f1, #ec4899)',layout:'free'},children:[]}]};n.children!.push(bar);return n;}],
 ['Steps timeline',()=>block('Steps','row',[1,2,3].map(i=>block(`Step ${i}`,'column',[makeHeading(0,0,`0${i}`,36),makeText(0,0,['Plan','Design','Launch'][i-1],16)])))],
 ['Breadcrumbs',()=>block('Breadcrumbs','row',[makeText(0,0,'Home',13),makeText(0,0,'/',13),makeText(0,0,'Products',13),makeText(0,0,'/',13),makeText(0,0,'Detail',13)])],
];
ensureKeyframes(); ensureUiCss();
const kitGroups = buildGroups(kit);
/** Items that share a `section` label sit under one sub-heading, in the order the sections first appear. */
const sectionsOf = (items: KitItem[]) => { const out: { name: string; items: KitItem[] }[] = []; items.forEach(it => { const n = it.section || 'More'; let g = out.find(x => x.name === n); if (!g) { g = { name: n, items: [] }; out.push(g); } g.items.push(it); }); return out; };
export const rekey = (n: Node): Node => ({ ...n, id: uid(), ...(n.children ? { children: n.children.map(rekey) } : {}) });
/** Navigation bars go to the top of the page; everything else is added at the end. */
/** Placeholder photos are added to the project's assets the first time a block that uses them is inserted. */
const withStock = (n: Node): Node => {
  const ids = [...new Set(stockIdsIn(n))]; if (!ids.length) return n;
  const map: Record<string, string> = {}; for (const id of ids) { const a = STOCK_ASSETS.find(x => x.id === id); if (a) map[id] = registerAsset({ ...a }).id; }
  return remapFill(n, map);
};
const insertKit = (mk: () => Node, name = '') => { S.addNode(withStock(rekey(mk())), S.root().id, /navbar|app header/i.test(name) ? 0 : undefined); };
/** Library thumbnails sit inside a scaled box, so fixed and sticky bars would float out of it: show them in place, and show phone-only items. */
const thumbSafe = (n: Node): Node => {
  const st = { ...n.style };
  if (st.position === 'fixed' || st.position === 'sticky') { st.position = 'relative'; delete st.top; delete st.left; delete st.right; delete st.bottom; delete st.inset; }
  if (st.display === 'none' && n.bp?.mobile?.display) st.display = n.bp.mobile.display;
  return { ...n, style: st, ...(n.children ? { children: n.children.map(thumbSafe) } : {}) };
};

/**
 * A small live picture of a kit block. It renders the real block (the same Gen tree the canvas uses), measures it, and scales it to fit,
 * so the card always matches what will be inserted. Rendering waits until the card is on screen.
 */
function KitPreview({ make, h = 84, bare = false }: { make: () => Node; h?: number; bare?: boolean }) {
  const box = useRef<HTMLDivElement | null>(null); const inner = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false); const [k, setK] = useState(0);
  useEffect(() => {
    const el = box.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: '120px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  const node = useMemo(() => (seen ? thumbSafe(rekey(make())) : null), [seen, make]);
  const wide = !!node && (node.type === 'section' || node.style.w === 'fill');
  const gen = useMemo(() => {
    if (!node) return null;
    const st = S.getState(); const page = { ...S.root(st), children: [node] } as Node;
    try { return buildGen(page, 'desktop', 'editor', [], null, null, (st.project ? { ...st.project, assets: [...(st.project.assets || []), ...STOCK_ASSETS] } : st.project) as any); } catch { return null; }
  }, [node]);
  // Fit the measured block inside the box. Re-runs when the panel is resized.
  useLayoutEffect(() => {
    const el = box.current; const it = inner.current; if (!el || !it) return;
    const fit = () => { const w = it.offsetWidth || 1; const h = it.offsetHeight || 1; setK(Math.min((el.clientWidth - 28) / w, ((el.clientHeight - 24) / h) * 1.5, 1)); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [gen]);
  return (
    <Box ref={box} position="relative" w="100%" bg="transparent" h={`${h}px`} overflow="hidden" {...(bare ? {} : { rounded: 'md'})} aria-hidden="true">
      {gen && <Box ref={inner} position="absolute" left="50%" top="50%" w={wide ? '900px' : 'max-content'} pointer-events="none" opacity={k ? '1' : '0'} transform={`translate(-50%, -50%) scale(${k || 1})`} bg="transparent">
        <RenderTree g={gen} editId={null} interactive={false} register={false} onCommit={() => {}} onCancel={() => {}} />
      </Box>}
    </Box>
  );
}


/* ---------- favorites (per browser) ---------- */
const FAV_KEY = 'atomattr.studio.kitFavs';
const loadFavs = (): string[] => { try { const v = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; } };
const saveFavs = (f: string[]) => { try { localStorage.setItem(FAV_KEY, JSON.stringify(f)); } catch { /* storage unavailable: favorites last for this session */ } };

/* View counts live in this browser only (a shared, global count would need a server). A card counts one view the first time it is shown. */
const VIEW_KEY = 'atomattr.studio.kitViews';
const loadViews = (): Record<string, number> => { try { const v = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
let views = loadViews(); const counted = new Set<string>();
export const viewsOf = (name: string) => views[name] || 0;
export const countView = (name: string) => { if (counted.has(name)) return views[name] || 0; counted.add(name); views = { ...views, [name]: (views[name] || 0) + 1 }; try { localStorage.setItem(VIEW_KEY, JSON.stringify(views)); } catch { /* session only */ } return views[name]; };
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

type Item = { name: string; blurb: string; make: () => Node };
type View = { k: 'home' } | { k: 'group'; id: string } | { k: 'mine' } | { k: 'favs' };
const allItems = () => kitGroups.flatMap(g => g.items.map(it => ({ ...it, group: g.name })));

const Bookmark = ({ on, size = 15 }: { on: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
);

/** One variant, dark like the reference: a rounded dark card, the live block on its stage, and underneath the name on the left with a view counter (eye) and a save counter (bookmark) on the right. Click the stage to add; drag to place. */
function VariantRow({ it, fav, onFav, tall = 150, onAdd }: { it: Item & { group?: string }; fav: boolean; onFav: () => void; tall?: number; onAdd?: () => void }) {
  const [v, setV] = useState(() => viewsOf(it.name));
  useEffect(() => { setV(countView(it.name)); }, [it.name]);
  return <Box display="flex" flex-col draggable title="Click to add, or drag onto the canvas" onDragStart={(e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('application/x-aa-kit', it.name); setKitDrag(it.make); }}>
    <Btn type="button" title={it.blurb ? `${it.name}: ${it.blurb}` : it.name} aria-label={`Add ${it.name}`} onClick={() => { insertKit(it.make, it.name); onAdd?.(); }} display="flex" w="100%" p="0" items="center" justify="center" overflow="hidden" cursor="pointer" bg="grey-100" dark-bg="grey-800" rounded="lg" hover-opacity="0.8" min-h="200px">
      <KitPreview make={it.make} h={tall} bare />
    </Btn>
    <Row items="center" gap="3" px="1" min-w="0">
      <Txt fontSize="sm" fontWeight="700" leading="tight" m="0" flex="1" min-w="0" truncate text="text">{it.name}</Txt>
      <Row items="center" gap="1" shrink="0" title="Views in this browser" aria-label={`${v} views`} text="gray-400"><Ic n="eye" size={15} /><Txt fontSize="xs" fontWeight="600" m="0" text="gray-400">{short(v)}</Txt></Row>
      <Btn type="button" onClick={onFav} aria-pressed={fav} aria-label={fav ? 'Saved. Click to remove' : 'Save'} title={fav ? 'Saved: click to remove' : 'Save to your collection'} display="flex" items="center" gap="1" h="26px" px="1" border="0" bg="transparent" cursor="pointer" shrink="0" text={fav ? 'primary' : 'gray-300'} hover-text="white"><Bookmark on={fav} /><Txt fontSize="xs" fontWeight="700" m="0" text="inherit">{fav ? 1 : 0}</Txt></Btn>
    </Row>
  </Box>;
}

/** Quick links (Saved, My components): a plain pill with the count. */
function QuickChip({ name, count, onOpen }: { name: string; count: number; onOpen: () => void }) {
  return <Btn type="button" onClick={onOpen} aria-label={`${name}, ${count}`} display="flex" items="center" gap="2" h="44px" px="4" min-w="0" rounded="full" cursor="pointer" border="1px solid" border-color="gray-900/10" dark-border-color="white/12" bg="transparent" hover-bg="gray-900/4" dark-hover-bg="white/6">
    <Txt fontSize="sm" fontWeight="700" m="0" flex="1" min-w="0" truncate text-align="left" {...T.text}>{name}</Txt>
    <Txt fontSize="sm" m="0" shrink="0" {...T.muted}>{count}</Txt>
  </Btn>;
}

/* One soft colour wash per category, like the reference tiles. */
const WASH = ['#a5b4fc', '#f9a8d4', '#fdba74', '#86efac', '#7dd3fc', '#c4b5fd', '#fcd34d', '#5eead4'];
const washOf = (name: string) => WASH[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % WASH.length];

/** A category card, like the reference: a soft gradient stage with the live preview floating on it, then the name and a line about it, all inside one rounded card. */
function CategoryCard({ name, count, blurb, make, onOpen, tall = 320 }: { name: string; count: number; blurb?: string; onOpen: () => void; make?: () => Node; tall?: number }) {
  const c = washOf(name);
  return <Btn type="button" onClick={onOpen} aria-label={`${name}, ${count} ${count === 1 ? 'variant' : 'variants'}`} display="flex" flex-col gap="0" p="0" min-w="0" overflow="hidden" text-align="left" cursor="pointer">
    <Box w="100%" display="flex" items="center" justify="center" style={{ background: `radial-gradient(70% 90% at 25% 15%, ${c}99, transparent 70%), radial-gradient(70% 90% at 85% 85%, ${c}66, transparent 70%)` }}>
      <Box w="100%" rounded="lg" overflow="hidden" bg="grey-50" dark-bg="grey-900" border="1px solid" border-color="gray-900/6" dark-border-color="white/10" h="200px" display="flex" items="center">
        {make ? <KitPreview make={make} h={tall} bare /> : <Box h={`${tall}px`} />}
      </Box>
    </Box>
    <Box pt="4" display="flex" flex-col gap="1" min-w="0" w="100%">
      <Row items="baseline" gap="2" min-w="0"><Txt fontSize="md" fontWeight="700" leading="tight" m="0" flex="1" min-w="0" truncate {...T.text}>{name}</Txt><Txt fontSize="xs" fontWeight="600" m="0" shrink="0" {...T.muted}>{count}</Txt></Row>
      {/* {blurb && <Txt fontSize="sm" leading="snug" m="0" {...T.muted} style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blurb}</Txt>} */}
    </Box>
  </Btn>;
}

/** The same category as a list row: name, a line about it, count and a chevron. */
function CategoryRow({ name, count, blurb, onOpen }: { name: string; count: number; blurb?: string; onOpen: () => void }) {
  return <Btn type="button" onClick={onOpen} aria-label={`${name}, ${count}`} display="flex" items="center" gap="3" px="3" py="3" border="0" rounded="14px" cursor="pointer" bg="transparent" {...T.hover}>
    <Box flex="1" min-w="0" display="flex" flex-col text-align="left"><Txt fontSize="sm" fontWeight="700" leading="tight" m="0" truncate {...T.text}>{name}</Txt><Txt fontSize="xs" leading="snug" m="0" truncate {...T.muted}>{blurb || `${count} ${count === 1 ? 'variant' : 'variants'}`}</Txt></Box>
    <Txt fontSize="xs" m="0" shrink="0" {...T.muted}>{count}</Txt>
    <Box display="flex" shrink="0" {...T.muted}><ToolIcon n="chevron" size={14} /></Box>
  </Btn>;
}

/**
 * The component library: a searchable home of category tiles; open one to browse its variants as live thumbnails.
 * Favorites and your own components sit alongside. Searching flattens everything into one list.
 */
export function Components({ wide = false, onAdd }: { wide?: boolean; onAdd?: () => void } = {}) {
  const s = useStudio(); const p = s.project!;
  const [open, setOpen] = useState(false);
  const { ref: gridRef, cols } = useCols(wide ? 260 : 190, 1, 12, 24);
  const tall = wide ? 190 : 150;
  const [layout, setLayout] = useState<'grid' | 'list'>(() => { try { return localStorage.getItem('atomattr.studio.kitLayout') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } });
  const pickLayout = (v: 'grid' | 'list') => { setLayout(v); try { localStorage.setItem('atomattr.studio.kitLayout', v); } catch { /* session only */ } };
  const [view, setView] = useState<View>({ k: 'home' }); const [query, setQuery] = useState(''); const [favs, setFavs] = useState<string[]>(loadFavs); const [variantName, setVariantName] = useState('Default');
  const q = query.trim().toLowerCase();
  const toggleFav = (name: string) => setFavs(f => { const n = f.includes(name) ? f.filter(x => x !== name) : [...f, name]; saveFavs(n); return n; });
  const active = S.selNodes(s)[0]; const master = active?.inst ? p.components.find(c => c.id === active.inst) : undefined;
  const items = useMemo(allItems, []);
  const favItems = items.filter(it => favs.includes(it.name));
  const mine = p.components.filter(c => c.name.toLowerCase().includes(q));
  const group = view.k === 'group' ? kitGroups.find(g => g.id === view.id) : undefined;
  const create = () => { if (!s.sel.length) { S.toast('Select an object first.'); return; } S.createComponentFromSelection(); };
  const back = () => setView({ k: 'home' });
  const title = view.k === 'group' ? group?.name : view.k === 'mine' ? 'My components' : view.k === 'favs' ? 'Saved' : '';

  const myList = (list: typeof p.components) => <>
    {list.map(c => <Row key={c.id} draggable items="center" gap="2" h="40px" px="2" cursor="grab" {...T.tile} onDragStart={(e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('application/x-aa-component', c.id); }}>
      <Box display="flex" shrink="0" text="primary"><Ic n="component" size={15} /></Box>
      <Txt fontSize="sm" fontWeight="500" m="0" flex="1" min-w="0" truncate {...T.text}>{c.name}</Txt>
      <IconBtn icon="plus" title="Insert linked instance" size={24} iconSize={13} onClick={() => S.insertComponent(c.id)} />
      <IconBtn icon="refresh" title="Update all instances" size={24} iconSize={13} onClick={() => S.updateComponent(c.id)} />
      <IconBtn icon="trash" title="Delete component master" size={24} iconSize={13} danger onClick={() => S.deleteComponent(c.id)} />
    </Row>)}
  </>;
  const rows = (list: (Item & { group?: string })[]) => list.map(it => <VariantRow key={`${it.group || ''}${it.name}`} it={it} tall={tall} onAdd={onAdd} fav={favs.includes(it.name)} onFav={() => toggleFav(it.name)} />);

  return <Box pb="3">
    {/* Search stays pinned; sub-views add a back row under it */}
    <Box position="sticky" top="0" z="3" px="3" py="2" display="flex" flex-col gap="2" border-b="1px solid" {...T.hairline} bg="white/80" dark-bg="gray-900/80" backdrop-blur="md">
      <Row items="center" gap="2">
        <Btn type="button" onClick={back} aria-label="Back to the library" display="flex" items="center" gap="1" p="2.5" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="500" bg="transparent" {...T.hover} {...T.text}><Box display="flex" transform="rotate(90deg)"><ToolIcon n="chevron" size={20} /></Box></Btn>
        <Row items="center" gap="2" py="2.5" px="3" {...T.field} rounded="lg" focus-within-border-color="primary" w="full">
          <Box display="flex" shrink="0" {...T.label}><Ic n="zoom" size={14} /></Box>
          <Box as="input" value={query} onChange={(e: any) => setQuery(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setQuery(''); e.stopPropagation(); }} placeholder="Search sections, components…" aria-label="Search the component library" flex="1" min-w="0" p="0" fontSize="sm" border="0" bg="transparent" outline="none" text="gray-800" dark-text="gray-100" />
          {query && <IconBtn icon="x" title="Clear search" size={20} iconSize={12} onClick={() => setQuery('')} />}
        </Row>
      </Row>
      
      {/* {!q && view.k !== 'home' && <Row items="center" gap="1">
        <Txt fontSize="sm" fontWeight="600" m="0" flex="1" min-w="0" truncate text-align="right" {...T.text}>{title}</Txt>
      </Row>} */}
    </Box>

    <Box ref={gridRef} display="flex" flex-col gap="3" px="3" pt="3">
      {/* Selected instance controls stay reachable on the home view */}
      {master && active && !q && view.k === 'home' && <Box display="flex" flex-col gap="2" p="3" {...T.tile}>
        <Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Selected instance · {master.name}</Txt>
        <Row gap="2"><Btn type="button" onClick={() => S.updateComponent(active.inst!)} flex="1" h="30px" fontSize="sm" fontWeight="600" cursor="pointer" {...T.tile} {...T.text}>Update master</Btn><Btn type="button" onClick={() => S.updateMasterFromInstance(active.id)} flex="1" h="30px" fontSize="sm" fontWeight="600" cursor="pointer" {...T.tile} {...T.text}>Update from this</Btn></Row>
        <Row gap="2"><Btn type="button" onClick={() => S.resetInstance(active.id)} flex="1" h="30px" fontSize="sm" fontWeight="500" cursor="pointer" {...T.tile} {...T.text}>Reset overrides</Btn><Btn type="button" onClick={() => S.detachInstances([active.id])} flex="1" h="30px" fontSize="sm" fontWeight="500" cursor="pointer" {...T.tile} {...T.text}>Detach</Btn></Row>
        <SelectField label="Variant" value={active.variant || ''} options={[['', 'Base'], ...(master.variants || []).map(v => [v.id, v.name] as [string, string])]} onChange={v => S.applyComponentVariant(active.id, v)} />
        <Row gap="2" items="end"><Box flex="1"><TextField label="Save as variant" value={variantName} onCommit={setVariantName} /></Box><IconBtn icon="plus" title="Save selected instance as variant" onClick={() => S.saveComponentVariant(active.inst!, variantName)} /></Row>
      </Box>}

      {/* Search results: one flat list across the whole library */}
      {q && <>
        {!!mine.length && <Box display="flex" flex-col gap="2"><Txt fontSize="sm" fontWeight="600" m="0" {...T.label}>My components</Txt>{myList(mine)}</Box>}
        {(() => { const hits = items.filter(it => `${it.name} ${it.blurb} ${it.group}`.toLowerCase().includes(q)); return hits.length
          ? <Box display="flex" flex-col gap="2"><Txt fontSize="sm" fontWeight="600" m="0" {...T.label}>Library · {hits.length}</Txt><Box display="grid" grid-cols={cols} gap="3">{rows(hits)}</Box></Box>
          : !mine.length && <EmptyState icon="zoom" title={`Nothing matches “${query}”`} hint="Try a shorter word, like hero or button." />; })()}
      </>}

      {/* Home: quick links, then the categories as cards or as a list */}
      {!q && view.k === 'home' && <>
        <Box display="grid" grid-cols={cols === '1' ? '1' : '2'} gap="2">
          <QuickChip name="Saved" count={favItems.length} onOpen={() => setView({ k: 'favs' })} />
          <QuickChip name="My components" count={p.components.length} onOpen={() => setView({ k: 'mine' })} />
        </Box>
        <Row items="center" justify="between">
          <Txt fontSize="sm" fontWeight="700" m="0" {...T.text}>Component library</Txt>
          <Row gap="1" p="1" {...T.field} role="group" aria-label="Library layout">
            {!wide && <Btn type="button" onClick={() => setOpen(true)} title="Open the library in a wide view" h="24px" px="2" rounded="lg" border="0" cursor="pointer" fontSize="xs" fontWeight="700" bg="transparent" {...T.hover} {...T.text}>Expand</Btn>}
            <IconBtn icon="grid" title="Cards" size={24} iconSize={13} active={layout === 'grid'} onClick={() => pickLayout('grid')} />
            <IconBtn icon="list" title="List" size={24} iconSize={13} active={layout === 'list'} onClick={() => pickLayout('list')} />
          </Row>
        </Row>
        {layout === 'grid'
          ? <Box display="grid" grid-cols={cols} gap="3">{kitGroups.map(g => <CategoryCard key={g.id} name={g.name} count={g.items.length} blurb={g.blurb} tall={wide ? 150 : 110} make={g.items[0]?.make} onOpen={() => setView({ k: 'group', id: g.id })} />)}</Box>
          : <Box display="flex" flex-col gap="1">{kitGroups.map(g => <CategoryRow key={g.id} name={g.name} count={g.items.length} blurb={g.blurb} onOpen={() => setView({ k: 'group', id: g.id })} />)}</Box>}
      </>}

      {/* Category */}
      {!q && group && <>
        {group.blurb && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>{group.blurb}</Txt>}
        {group.items.some(it => it.section)
          ? sectionsOf(group.items).map(sec => <Box key={sec.name} display="flex" flex-col gap="2">
              <Row items="center" gap="2"><Txt fontSize="sm" fontWeight="700" m="0" {...T.text}>{sec.name}</Txt><Txt fontSize="xs" m="0" {...T.muted}>{sec.items.length}</Txt></Row>
              <Box display="grid" grid-cols={cols} gap="3">{rows(sec.items)}</Box>
            </Box>)
          : <Box display="grid" grid-cols={cols} gap="3">{rows(group.items)}</Box>}
      </>}

      {/* Favorites */}
      {!q && view.k === 'favs' && (favItems.length
        ? <Box display="grid" grid-cols={cols} gap="3">{rows(favItems)}</Box>
        : <EmptyState icon="component" title="Nothing saved yet" hint="Press Save under any variant to keep it here." />)}

      {/* My components */}
      {!q && view.k === 'mine' && <>
        <Btn type="button" onClick={create} h="32px" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" hover-bg="primary/90" text="white" display="flex" items="center" justify="center" gap="2"><Ic n="component" size={14} />Make component from selection</Btn>
        {p.components.length ? <Box display="flex" flex-col gap="2">{myList(p.components)}</Box> : <EmptyState icon="component" title="No components yet" hint="Select something on the canvas and make it a component to reuse it." />}
      </>}
      {!q && view.k !== 'home' && view.k !== 'mine' && <Txt fontSize="xs" leading="snug" m="0" {...T.muted}>View and Save counts are kept in this browser only.</Txt>}
    </Box>
    {open && createPortal(
      <Box position="fixed" inset="0" z="1000" display="flex" items="center" justify="center" p="6" bg="black/80" backdrop-blur="sm" role="dialog" aria-modal="true" aria-label="Component library" onMouseDown={(e: React.MouseEvent) => { if (e.target === e.currentTarget) setOpen(false); }} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }}>
        <Box w="min(1280px, 100%)" h="min(860px, 100%)" rounded="28px" overflow="hidden" display="flex" flex-col bg="white/92" dark-bg="gray-900/92" backdrop-blur="xl" border="1px solid" border-color="white/40" dark-border-color="white/10" shadow="2xl">
          <Row items="center" justify="between" px="5" py="3" border-b="1px solid" {...T.hairline}>
            <Txt fontSize="md" fontWeight="700" m="0" {...T.text}>Component library</Txt>
            <IconBtn icon="x" title="Close" onClick={() => setOpen(false)} />
          </Row>
          <Box flex="1" min-h="0" overflow-y="auto"><Components wide onAdd={() => setOpen(false)} /></Box>
        </Box>
      </Box>, document.body)}
  </Box>;
}
