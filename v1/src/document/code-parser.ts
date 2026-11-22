import type { Node, Style } from './types';
import { mk } from './factory';

const known=new Set(['w','h','p','px','py','gap','bg','text','rounded','shadow','font-size','font-weight','flex-col','flex-row','wrap','items','justify','grid-cols','display','position','left','top','min-w','max-w','min-h','flex-grow','flex-basis','align-self','opacity','border','leading','tracking','font-family','text-align','cursor','m','order']);
const dash=(s:string)=>s.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`).toLowerCase();
const valPx=(v:string,key:string):number|undefined=>{const m=v.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);if(!m)return;const n=Number(m[1]);if(!Number.isFinite(n))return;return m[2]==='rem'||m[2]==='em'?n*16:m[2]==='%'?1440*n/100:m[2]?n:['p','px','py','gap','rounded','min-w','max-w','min-h'].includes(key)?n*4:n;};
function attrsStyle(a:Record<string,string|true>,type:string):{style:Style;attrs:Record<string,string|boolean>;href?:string;src?:string;alt?:string} {
  const s:Style={mode:'flow',w:'fill',h:'auto'};let layout:'free'|'flex'|'grid'='free';const custom:Record<string,string|boolean>={};let href:string|undefined,src:string|undefined,alt:string|undefined;
  for(const [raw,v] of Object.entries(a)){const k=dash(raw),x=String(v);if(k==='as')continue;
    if(k==='href'){href=x;continue;}if(k==='src'){src=x;continue;}if(k==='alt'){alt=x;continue;}
    const num=valPx(x,k);
    if(k==='w'&&x==='100%')s.w='fill';else if(k==='w'&&num!==undefined)s.w=num;else if(k==='h'&&num!==undefined)s.h=num;else if(k==='p'&&num!==undefined)s.pad=num;else if(k==='px'&&num!==undefined)s.padX=num;else if(k==='py'&&num!==undefined)s.padY=num;else if(k==='gap'&&num!==undefined)s.gap=num;
    else if(k==='bg')s.fill=x;else if(k==='text')s.color=x;else if(k==='rounded'&&num!==undefined)s.radius=num;else if(k==='shadow')s.shadow=(x==='none'?'none':x==='sm'||x==='md'||x==='lg'?x:'md');
    else if(k==='font-size'&&num!==undefined)s.fontSize=num;else if(k==='font-weight'&&num!==undefined)s.fontWeight=num;
    else if(k==='flex-col'){layout='flex';s.dir='column';}else if(k==='flex-row'){layout='flex';s.dir='row';}else if(k==='display'&&x==='flex')layout='flex';else if(k==='display'&&x==='grid')layout='grid';
    else if(k==='wrap')s.wrap=true;else if(k==='items')s.items=x as Style['items'];else if(k==='justify')s.justify=x as Style['justify'];else if(k==='grid-cols'&&num!==undefined){layout='grid';s.cols=num;}
    else if(k==='flex-grow'&&num!==undefined)s.grow=num;else if(k==='flex-basis')s.basis=x==='auto'?'auto':x==='0%'?'fill':num??'auto';else if(k==='min-w'&&num!==undefined)s.minW=num;else if(k==='max-w'&&num!==undefined)s.maxW=num;else if(k==='min-h'&&num!==undefined)s.minH=num;else if(k==='align-self')s.self=x as Style['self'];
    else if(k==='opacity'&&num!==undefined)s.opacity=num>1?num/100:num;else if(k==='leading'&&num!==undefined)s.lineHeight=num;else if(k==='tracking'&&num!==undefined)s.letterSpacing=num;else if(k==='font-family')s.font=x;else if(k==='text-align')s.align=x as Style['align'];
    else if(k==='border'){const m=x.match(/([\d.]+)px\s+solid\s+(.+)/);if(m){s.stroke= m[2];s.strokeWidth=Number(m[1]);}}
    else if(k==='position'&&x==='absolute')s.mode='abs';else if(k==='left'&&num!==undefined)s.x=num;else if(k==='top'&&num!==undefined)s.y=num;
    else if(k.startsWith('hover-')||k.startsWith('focus-')||k.startsWith('active-')||k.startsWith('disabled-')||k.startsWith('dark-'))custom[k]=v;
    else if(!known.has(k))custom[k]=v;
  }
  s.layout=layout;
  return {style:s,attrs:custom,href,src,alt};
}
const decode=(s:string)=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&');

/** Small tolerant parser for generated HTML/JSX with quoted attributes and bare boolean props. */
export function parseCode(source:string):Node[] {
  const input=source.replace(/\{\/\*[\s\S]*?\*\/\}/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/^\s*(import|export)\s+[^;]+;?\s*$/gm,'').replace(/<!doctype[^>]*>/ig,'');
  const root:Node=mk('page','Imported page',{layout:'free',w:1440,h:'auto',mode:'flow'},{children:[]});const stack:Node[]=[root];
  const re=/<\/?([A-Za-z][\w:.-]*)([^<>]*?)\/?\s*>|([^<]+)/gs;let m:RegExpExecArray|null;
  while((m=re.exec(input))){if(m[3]!==undefined){const text=decode(m[3]).replace(/\{\s*(['"])([\s\S]*?)\1\s*\}/g,'$2').trim();if(text){const parent=stack[stack.length-1];if(parent.type==='text'||parent.type==='heading'||parent.type==='button')parent.text=(parent.text||'')+text;else parent.children?.push(mk('text','Text',{mode:'flow',w:'fill',h:'auto',fontSize:16,color:'#111827'},{text}));}continue;}
    const full=m[0],tag=m[1],tail=m[2]||'';if(full.startsWith('</')){const idx=stack.map(n=>n.tag?.toLowerCase()).lastIndexOf(tag.toLowerCase());if(idx>0)stack.length=idx;continue;}
    const raw:Record<string,string|true>={};const attrRe=/([:\w.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*}))?/g;let am:RegExpExecArray|null;while((am=attrRe.exec(tail)))raw[am[1]]=am[2]??am[3]??am[4]??am[5]??true;
    const actual=String(raw.as||tag).toLowerCase();const isHead=/^h[1-6]$/.test(actual);const type=tag==='img'||actual==='img'?'image':tag==='button'||actual==='button'||actual==='a'||tag==='Btn'?'button':isHead?'heading':actual==='p'||tag==='Txt'||tag==='span'?'text':actual==='section'||actual==='main'?'section':'container';
    const mapped=attrsStyle(raw,type);const node=mk(type,type==='section'?'Section':type==='container'?'Container':type[0].toUpperCase()+type.slice(1),mapped.style,{...(type==='heading'||actual==='main'||actual==='section'?{tag:actual}:{}),...(type==='text'||type==='heading'||type==='button'?{text:''}:{}),...(mapped.href?{href:mapped.href}:{}),...(mapped.src?{src:mapped.src}:{}),...(mapped.alt?{alt:mapped.alt}:{}),...(Object.keys(mapped.attrs).length?{attrs:mapped.attrs}:{}),...(type==='container'||type==='section'?{children:[]}: {})});
    if(actual==='main'&&stack.length===1){node.type='container';node.tag='main';node.name='Page content';root.children?.push(node);stack.push(node);continue;}
    stack[stack.length-1].children?.push(node);if(!/\/\s*>$/.test(full)&&type!=='image'&&!['input','br','hr'].includes(actual))stack.push(node);
  }
  const first=root.children?.[0];return first?.tag==='main'?first.children||[]:root.children||[];
}
