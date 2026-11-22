import type { Node, Style } from './types';
import { mk, makeInput } from './factory';
import type { InputKind } from './types';

const known=new Set(['w','h','p','px','py','pt','pr','pb','pl','m','mx','my','mt','mr','mb','ml','gap','bg','text','rounded','shadow','font-size','font-weight','flex-col','flex-row','wrap','items','justify','grid-cols','display','position','left','top','min-w','max-w','min-h','max-h','flex-grow','flex-basis','align-self','opacity','border','border-t','border-r','border-b','border-l','leading','tracking','font-family','text-align','cursor','order']);
const dash=(s:string)=>s.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`).toLowerCase();
/* numbers for most keys; viewport units stay strings for min/max sizes, so callers narrow by key */
const valPx=(v:string,key:string):any=>{const m=v.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);if(m){const n=Number(m[1]);if(!Number.isFinite(n))return;return m[2]==='rem'||m[2]==='em'?n*16:m[2]==='%'?1440*n/100:m[2]?n:['p','px','py','gap','rounded','min-w','max-w','min-h','max-h'].includes(key)?n*4:n;} if(/^(?:-?\d*\.?\d+)(?:vw|vh|svw|svh|lvw|lvh|dvw|dvh|vmin|vmax)$/i.test(v.trim())) return v.trim(); return undefined;};
function attrsStyle(a:Record<string,string|true>,type:string):{style:Style;attrs:Record<string,string|boolean>;href?:string;src?:string;alt?:string} {
  const s:Style={mode:'flow',w:'fill',h:'auto'};let layout:'free'|'flex'|'grid'='free';const custom:Record<string,string|boolean>={};let href:string|undefined,src:string|undefined,alt:string|undefined;
  for(const [raw,v] of Object.entries(a)){const k=dash(raw),x=String(v);if(k==='as')continue;
    if(k==='href'){href=x;continue;}if(k==='src'){src=x;continue;}if(k==='alt'){alt=x;continue;}
    const num=valPx(x,k);
    if(k==='w'&&x==='100%')s.w='fill';else if(k==='w'&&num!==undefined)s.w=num;else if(k==='h'&&num!==undefined)s.h=num;else if(k==='p'&&num!==undefined)s.pad=num;else if(k==='px'&&num!==undefined)s.padX=num;else if(k==='py'&&num!==undefined)s.padY=num;else if(k==='pt'&&num!==undefined)s.padT=num;else if(k==='pr'&&num!==undefined)s.padR=num;else if(k==='pb'&&num!==undefined)s.padB=num;else if(k==='pl'&&num!==undefined)s.padL=num;else if(k==='m'&&num!==undefined)s.m=num;else if(k==='mx'&&num!==undefined)s.mx=num;else if(k==='my'&&num!==undefined)s.my=num;else if(k==='mt'&&num!==undefined)s.mt=num;else if(k==='mr'&&num!==undefined)s.mr=num;else if(k==='mb'&&num!==undefined)s.mb=num;else if(k==='ml'&&num!==undefined)s.ml=num;else if(k==='gap'&&num!==undefined)s.gap=num;
    else if(k==='bg')s.fill=x;else if(k==='text')s.color=x;else if(k==='rounded'&&num!==undefined)s.radius=num;else if(k==='shadow')s.shadow=(x==='none'?'none':x==='sm'||x==='md'||x==='lg'?x:'md');
    else if(k==='font-size'&&num!==undefined)s.fontSize=num;else if(k==='font-weight'&&num!==undefined)s.fontWeight=num;
    else if(k==='flex-col'){layout='flex';s.dir='column';}else if(k==='flex-row'){layout='flex';s.dir='row';}else if(k==='display'&&x==='flex')layout='flex';else if(k==='display'&&x==='grid')layout='grid';
    else if(k==='wrap')s.wrap=true;else if(k==='items')s.items=x as Style['items'];else if(k==='justify')s.justify=x as Style['justify'];else if(k==='grid-cols'&&num!==undefined){layout='grid';s.cols=num;}
    else if(k==='flex-grow'&&num!==undefined)s.grow=num;else if(k==='flex-basis')s.basis=x==='auto'?'auto':x==='0%'?'fill':num??'auto';else if(k==='min-w')s.minW=typeof num === 'number' ? num : x;else if(k==='max-w')s.maxW=typeof num === 'number' ? num : x;else if(k==='min-h')s.minH=typeof num === 'number' ? num : x;else if(k==='max-h')s.maxH=typeof num === 'number' ? num : x;else if(k==='align-self')s.self=x as Style['self'];
    else if(k==='opacity'&&num!==undefined)s.opacity=num>1?num/100:num;else if(k==='leading'&&num!==undefined)s.lineHeight=num;else if(k==='tracking'&&num!==undefined)s.letterSpacing=num;else if(k==='font-family')s.font=x;else if(k==='text-align')s.align=x as Style['align'];
    else if(k==='border'){const m=x.match(/([\d.]+)px\s+solid\s+(.+)/);if(m){s.stroke= m[2];s.strokeWidth=Number(m[1]);}}
    else if(k==='position'&&x==='absolute')s.mode='abs';else if(k==='left'&&num!==undefined)s.x=num;else if(k==='top'&&num!==undefined)s.y=num;
    else if(k.startsWith('hover-')||k.startsWith('focus-')||k.startsWith('active-')||k.startsWith('disabled-')||k.startsWith('dark-'))custom[k]=v;
    else if(!known.has(k))custom[k]=v;
  }
  s.layout=layout;
  return {style:s,attrs:custom,href,src,alt};
}

const ENT:Record<string,string>={nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",copy:'©',reg:'®',trade:'™',mdash:'—',ndash:'–',hellip:'…',rarr:'→',larr:'←',bull:'•',middot:'·',laquo:'«',raquo:'»',times:'×',check:'✓'};
const decode=(s:string)=>s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(m,e:string)=>{
  if(e[0]==='#'){const n=e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);return Number.isFinite(n)&&n>0&&n<0x110000?String.fromCodePoint(n):m;}
  return ENT[e.toLowerCase()]??m;
});

const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const SKIP=new Set(['script','style','noscript','template','head','title']);
const TEXTY=new Set(['p','span','label','strong','em','b','i','small','code','pre','blockquote','figcaption','time','abbr','cite','mark','sub','sup','u','s','legend','dt','dd','caption','td','th']);
const SEMANTIC=new Set(['header','footer','nav','aside','article','ul','ol','li','figure','details','summary','dl','table','thead','tbody','tr','fieldset','address','hgroup','menu','body']);
const INPUT_KINDS=new Set(['text','email','password','number','tel','url','search','date','checkbox','radio','textarea','select','file','range','color','time']);
export type ParseReport={nodes:Node[];notes:string[]};

type Tok={k:'text';v:string}|{k:'open';tag:string;attrs:Record<string,string|true>;self:boolean;at:number;end:number}|{k:'close';tag:string};

/** Reads one tag starting at `<`, honouring quotes and JSX braces, so a `>` inside an attribute value does not end it. */
function readTag(s:string,at:number,notes:string[]):{tag:string;attrs:Record<string,string|true>;self:boolean;end:number;closing:boolean}|null{
  let i=at+1;const closing=s[i]==='/';if(closing)i++;
  const nm=/^[A-Za-z][\w:.-]*/.exec(s.slice(i,i+80));if(!nm)return null;const tag=nm[0];i+=tag.length;
  const attrs:Record<string,string|true>={};let self=false;
  while(i<s.length){
    while(i<s.length&&/\s/.test(s[i]))i++;
    if(s[i]==='>'){return{tag,attrs,self,end:i+1,closing};}
    if(s[i]==='/'&&s[i+1]==='>'){return{tag,attrs,self:true,end:i+2,closing};}
    if(s[i]==='/'){i++;continue;}
    if(s[i]==='{'){let d=0,j=i;for(;j<s.length;j++){if(s[j]==='{')d++;else if(s[j]==='}'&&--d===0)break;}i=j+1;notes.push('a spread or expression attribute was skipped');continue;}
    const am=/^[^\s=/>{}"']+/.exec(s.slice(i));if(!am){i++;continue;}
    const name=am[0];i+=name.length;
    while(i<s.length&&/\s/.test(s[i]))i++;
    if(s[i]!=='='){attrs[name]=true;continue;}
    i++;while(i<s.length&&/\s/.test(s[i]))i++;
    const q=s[i];
    if(q==='"'||q==="'"){const j=s.indexOf(q,i+1);const e=j<0?s.length:j;attrs[name]=decode(s.slice(i+1,e));i=e+1;}
    else if(q==='{'){let d=0,j=i;for(;j<s.length;j++){if(s[j]==='{')d++;else if(s[j]==='}'&&--d===0)break;}
      const inner=s.slice(i+1,j).trim();const lit=/^(["'`])([\s\S]*)\1$/.exec(inner);const num=/^-?[\d.]+$/.test(inner);
      if(lit&&!/\$\{/.test(lit[2]))attrs[name]=lit[2];else if(num)attrs[name]=inner;else if(inner==='true')attrs[name]=true;else notes.push(`${name}={…} is an expression, so it was left out`);
      i=j+1;}
    else{const um=/^[^\s>]+/.exec(s.slice(i));const v=um?um[0]:'';attrs[name]=decode(v);i+=v.length;}
  }
  return null;
}

const CSS_MAP:Record<string,string>={width:'w',height:'h',padding:'p','background-color':'bg',background:'bg',color:'text','font-size':'font-size','font-weight':'font-weight','border-radius':'rounded',gap:'gap',opacity:'opacity','min-width':'min-w','max-width':'max-w','line-height':'leading'};
const JUSTIFY:Record<string,string>={'flex-start':'start','flex-end':'end','space-between':'between','space-around':'around',center:'center',start:'start',end:'end'};
const ALIGN:Record<string,string>={'flex-start':'start','flex-end':'end',center:'center',stretch:'stretch',start:'start',end:'end',baseline:'baseline'};
/** Inline `style="…"` becomes Studio style values where it can; the count of what could not is reported. */
function inlineStyle(css:string,into:Record<string,string|true>,notes:string[]){
  let lost=0;
  for(const decl of css.split(';')){
    const c=decl.indexOf(':');if(c<1)continue;const k=decl.slice(0,c).trim().toLowerCase();const v=decl.slice(c+1).replace(/!important/i,'').trim();if(!v)continue;
    if(CSS_MAP[k]&&!/^(var|calc)\(/.test(v)){into[CSS_MAP[k]]=v;}
    else if(k==='display'&&(v==='flex'||v==='grid'))into.display=v;
    else if(k==='flex-direction'){if(v.startsWith('column'))into['flex-col']=true;else into['flex-row']=true;}
    else if(k==='justify-content'&&JUSTIFY[v])into.justify=JUSTIFY[v];
    else if(k==='align-items'&&ALIGN[v])into.items=ALIGN[v];
    else if(k==='flex-wrap'&&v==='wrap')into.wrap=true;
    else lost++;
  }
  if(lost)notes.push(`${lost} inline style ${lost===1?'rule':'rules'} could not be mapped and ${lost===1?'was':'were'} dropped`);
}

/**
 * A tolerant HTML / JSX reader. It tokenises properly (quoted values and braces may contain `>`), skips head, script and style,
 * keeps semantic tags and ids, turns form controls into real inputs, keeps inline SVG as an embed, and decodes entities.
 * `notes` lists whatever could not be carried over, so applying code is never silently lossy.
 */
export function parseCodeReport(source:string):ParseReport {
  const notes:string[]=[];
  const input=source.replace(/\{\/\*[\s\S]*?\*\/\}/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/^\s*(import|export)\s+[^;\n]+;?\s*$/gm,'').replace(/<!doctype[^>]*>/ig,'');
  const root:Node=mk('page','Imported page',{layout:'free',w:1440,h:'auto',mode:'flow'},{children:[]});const stack:Node[]=[root];
  const top=()=>stack[stack.length-1];
  const addText=(raw:string)=>{
    const text=decode(raw).replace(/\{\s*(['"`])([\s\S]*?)\1\s*\}/g,'$2').replace(/\{[^{}]*\}/g,'').replace(/[ \t\r\n\f]+/g,' ').replace(/^ | $/g,'');if(!text)return;
    const parent=top();
    if(parent.type==='text'||parent.type==='heading'||parent.type==='button')parent.text=((parent.text||'')+' '+text).trim();
    else parent.children?.push(mk('text','Text',{mode:'flow',w:'fill',h:'auto',fontSize:16,color:'#111827'},{text}));
  };
  const skipped:Record<string,number>={};let unmatched=0;let i=0;const n=input.length;
  while(i<n){
    const lt=input.indexOf('<',i);
    if(lt<0){addText(input.slice(i));break;}
    if(lt>i)addText(input.slice(i,lt));
    const next=input[lt+1]||'';
    if(!/[A-Za-z\/]/.test(next)){addText('<');i=lt+1;continue;}
    const tg=readTag(input,lt,notes);
    if(!tg){addText(input.slice(lt,lt+1));i=lt+1;continue;}
    i=tg.end;const low=tg.tag.toLowerCase();
    if(tg.closing){
      if(low==='html'||low==='body')continue;
      const idx=stack.map(x=>x===root?'':String((x as any)._src||x.tag||'').toLowerCase()).lastIndexOf(low);
      if(idx>0)stack.length=idx;else if(!VOID.has(low))unmatched++;
      continue;
    }
    if(low==='html'||low==='body')continue;
    if(SKIP.has(low)){
      skipped[low]=(skipped[low]||0)+1;
      if(!tg.self){const m=new RegExp(`</${tg.tag}\\s*>`,'i').exec(input.slice(i));i=m?i+m.index+m[0].length:n;}
      continue;
    }
    if(low==='svg'){
      const m=/<\/svg\s*>/i.exec(input.slice(i));const end=m?i+m.index+m[0].length:n;
      top().children?.push(mk('embed','SVG',{mode:'flow',w:'auto',h:'auto'},{html:input.slice(lt,end)}));skipped.svg=(skipped.svg||0)+1;i=end;continue;
    }
    const raw=tg.attrs;
    if(typeof raw.style==='string'){inlineStyle(raw.style,raw,notes);delete raw.style;}
    const cls=raw.className??raw.class;if(cls!==undefined){delete raw.className;raw.class=cls;}
    const actual=String(raw.as||tg.tag).toLowerCase();delete raw.as;
    const isComp=/^[A-Z]/.test(tg.tag);
    let node:Node;
    const mapped=attrsStyle(raw,'container');
    /* plain HTML stacks block children; Studio's free layout would collapse them, so default to a column */
    const stacked=mapped.style.layout==='free'?{...mapped.style,layout:'flex' as const,dir:'column' as const}:mapped.style;
    const common={...(mapped.href?{href:mapped.href}:{}),...(Object.keys(mapped.attrs).length?{attrs:mapped.attrs}:{})};
    if(actual==='img'||(isComp&&tg.tag==='Img')){node=mk('image','Image',mapped.style,{src:mapped.src||'',alt:mapped.alt||'',...(Object.keys(mapped.attrs).length?{attrs:mapped.attrs}:{})});}
    else if(actual==='textarea'||actual==='select'||(actual==='input'&&!['submit','button','reset','image'].includes(String(raw.type||'text')))){
      const kind=(actual==='input'?String(raw.type||'text'):actual) as InputKind;const k=(INPUT_KINDS.has(kind)?kind:'text') as InputKind;
      node=makeInput(k,String(raw.name||raw.id||k),String(raw.placeholder||''));
      const keep:Record<string,string|boolean>={};for(const [a,v] of Object.entries(mapped.attrs))if(!['name','placeholder','type'].includes(a))keep[a]=v;
      if(Object.keys(keep).length)node.attrs=keep;
      if(actual!=='input')skipped[actual+' options']=0;
    }
    else if(actual==='input'){node=mk('button','Button',mapped.style,{text:String(raw.value||'Submit'),attrs:{type:'submit'}});}
    else if(actual==='button'||actual==='a'||tg.tag==='Btn'){node=mk('button',actual==='a'?'Link':'Button',mapped.style,{text:'',...common,...(actual==='a'?{tag:'a'}:{})});}
    else if(/^h[1-6]$/.test(actual)){node=mk('heading','Heading',mapped.style,{text:'',tag:actual,...common});}
    else if(TEXTY.has(actual)||tg.tag==='Txt'){node=mk('text','Text',mapped.style,{text:'',...common,...(actual!=='p'&&actual!=='span'&&actual!=='txt'?{tag:actual}:{})});}
    else if(actual==='form'){node=mk('form','Form',{...stacked,layout:'flex',dir:'column'},{tag:'form',children:[],...common});}
    else if(actual==='section'){node=mk('section','Section',stacked,{tag:'section',children:[],...common});}
    else if(actual==='main'&&stack.length===1){node=mk('container','Page content',stacked,{tag:'main',children:[],...common});}
    else{
      const style=isComp&&tg.tag==='Row'?{...mapped.style,layout:'flex' as const,dir:'row' as const}:isComp&&tg.tag==='Col'?{...mapped.style,layout:'flex' as const,dir:'column' as const}:stacked;
      node=mk('container',SEMANTIC.has(actual)?actual[0].toUpperCase()+actual.slice(1):'Container',style,{children:[],...(SEMANTIC.has(actual)||actual==='main'?{tag:actual}:{}),...common});
    }
    (node as any)._src=tg.tag;
    top().children?.push(node);
    const leaf=VOID.has(actual)||node.type==='image'||node.type==='input';
    if(!tg.self&&!leaf)stack.push(node);
  }
  const strip=(x:Node)=>{delete (x as any)._src;(x.children||[]).forEach(strip);};strip(root);
  for(const [k,c] of Object.entries(skipped)){if(k.endsWith('options'))notes.push(`${k.replace(' options','')} options were not imported; add them under the field's properties`);else if(k==='svg')notes.push(`${c} inline SVG kept as a custom HTML block`);else notes.push(`${c} <${k}> ${c===1?'element was':'elements were'} skipped`);}
  if(unmatched)notes.push(`${unmatched} closing ${unmatched===1?'tag had':'tags had'} no matching opener`);
  const first=root.children?.[0];
  const nodes=first?.tag==='main'&&root.children!.length===1?first.children||[]:root.children||[];
  return{nodes,notes:[...new Set(notes)]};
}

/** Nodes only; see parseCodeReport for what could not be carried over. */
export function parseCode(source:string):Node[]{return parseCodeReport(source).nodes;}
