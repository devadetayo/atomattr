import type { Bp, Node, Project } from './types';
import { flatten, pathTo } from './tree';
import { resolveNode } from './style';
import { bindingKeys, builtinKeys } from './cms';
import { langValid } from './lang';

export type QualityIssue = { id?: string; pageId?: string; breakpoint?: Bp; rule: string; message: string; severity: 'error'|'warning' };
const rgba = (v?: string): [number,number,number] | null => {
  if(!v)return null;const hex=v.trim().match(/^#([\da-f]{3,8})$/i);if(hex){let h=hex[1];if(h.length===3||h.length===4)h=h.slice(0,3).split('').map(x=>x+x).join('');if(h.length===6||h.length===8)return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  const rgb=v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);return rgb?[Number(rgb[1]),Number(rgb[2]),Number(rgb[3])]:null;
};
export function contrastRatio(foreground: string, background: string): number | null {
  const f=rgba(foreground),b=rgba(background);if(!f||!b)return null;
  const lum=(c:number[])=>{const x=c.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return .2126*x[0]+.7152*x[1]+.0722*x[2];};
  const a=lum(f),z=lum(b);return (Math.max(a,z)+.05)/(Math.min(a,z)+.05);
}
const tokenColor=(project:Project,id:string|undefined,dark:boolean)=>id?project.tokens?.find(t=>t.id===id)?.[dark?'dark':'light']||project.tokens?.find(t=>t.id===id)?.light:undefined;
const fillOf=(n:Node,project:Project,dark:boolean)=>tokenColor(project,n.style.fillToken,dark)||n.style.fill;
const colorOf=(n:Node,project:Project,dark:boolean)=>tokenColor(project,n.style.colorToken,dark)||n.style.color;

const hasName=(n:Node)=>!!String(n.attrs?.['aria-label']??'').trim()||!!String(n.attrs?.['aria-labelledby']??'').trim()||!!String(n.attrs?.title??'').trim();
const ROLES=new Set(['alert','alertdialog','application','article','banner','button','cell','checkbox','combobox','complementary','contentinfo','dialog','directory','document','feed','figure','form','grid','gridcell','group','heading','img','link','list','listbox','listitem','log','main','marquee','math','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','navigation','none','note','option','presentation','progressbar','radio','radiogroup','region','row','rowgroup','search','searchbox','separator','slider','spinbutton','status','switch','tab','table','tablist','tabpanel','term','textbox','timer','toolbar','tooltip','tree','treegrid','treeitem']);
const FILENAME_ALT=/\.(jpe?g|png|gif|webp|avif|svg)$|^(img|dsc|image|photo|screenshot)[-_ ]?\d*$/i;
const REDUNDANT_ALT=/^(image|picture|photo|graphic|icon)( of|:)?\s/i;
const FOCUSABLE=new Set(['button','input','form']);
type Ctx=Node;
/** Accessibility checks that need no rendering: ARIA misuse, focus order, duplicate ids, target size, iframe titles, alt quality. */
function a11yIssues(n:Node,add:Add,seenIds:Map<string,number>,_root:Ctx){
  const a=n.attrs||{};const id=typeof a.id==='string'?a.id.trim():'';
  if(id){const c=(seenIds.get(id)||0)+1;seenIds.set(id,c);if(c===2)add(n,'duplicate-id',`${n.name}: the id "${id}" is used more than once on this page, so links and labels can point at the wrong element.`,'error');}
  const role=typeof a.role==='string'?a.role.trim().toLowerCase():'';
  if(role&&!ROLES.has(role))add(n,'aria-role',`${n.name}: "${a.role}" is not a valid ARIA role.`);
  if(String(a['aria-hidden'])==='true'&&(FOCUSABLE.has(n.type)||n.href))add(n,'aria-hidden-focusable',`${n.name}: it is hidden from screen readers but can still be focused. Remove aria-hidden or make it unfocusable.`,'error');
  const ti=a.tabindex!==undefined?Number(a.tabindex):NaN;
  if(Number.isFinite(ti)&&ti>0)add(n,'tabindex-positive',`${n.name}: tabindex ${ti} forces a custom tab order. Use 0, or arrange the layers in reading order instead.`);
  if(n.href&&a.target==='_blank'&&!/noopener|noreferrer/.test(String(a.rel||'')))add(n,'target-blank',`${n.name}: opens in a new tab without rel="noopener noreferrer".`);
  if(n.type==='image'&&n.alt?.trim()){const alt=n.alt.trim();
    if(FILENAME_ALT.test(alt))add(n,'alt-filename',`${n.name}: alt text "${alt}" looks like a file name. Describe what the image shows.`);
    else if(REDUNDANT_ALT.test(alt))add(n,'alt-redundant',`${n.name}: alt text starts with "${alt.split(' ')[0]}". Screen readers already say it is an image.`);}
  if(n.type==='embed'&&/<iframe\b(?![^>]*\btitle=)/i.test(n.html||''))add(n,'iframe-title',`${n.name}: an embedded frame has no title attribute, so screen readers cannot name it.`);
  const s=resolveNode(n,'desktop').s;
  if((n.type==='text'||n.type==='heading')&&(s.fontSize||16)<12&&n.text?.trim())add(n,'small-text-static',`${n.name}: text is ${s.fontSize}px. Under 12px is hard to read.`);
  if((n.type==='button'||n.type==='input')&&typeof s.h==='number'&&s.h<24)add(n,'target-size',`${n.name}: ${s.h}px tall is below the 24px minimum target size (WCAG 2.2).`);
  const kids=(n.children||[]).filter(c=>!c.hidden&&(c.style.mode==='abs'||s.layout==='free'));
  if(kids.length>1){let maxY=-Infinity,flagged=false;for(const c of kids){const y=Number(c.style.y);if(!Number.isFinite(y))continue;if(y+40<maxY&&!flagged){flagged=true;add(n,'reading-order',`${n.name}: layers are stacked in a different order than they appear. Screen readers and Tab follow layer order, so reorder "${c.name}" in Layers.`);}maxY=Math.max(maxY,y);}}
}
const GENERIC_LINK=/^(click here|here|read more|more|link|learn more|this|this link)$/i;
const KNOWN_SCHEME=/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/|#|page:)/i;
export const LARGE_IMAGE_BYTES=500_000;
const approxBytes=(dataUrl:string)=>{const i=dataUrl.indexOf(',');return i<0?0:Math.floor((dataUrl.length-i-1)*0.75);};
type Add=(node:Node,rule:string,message:string,severity?:QualityIssue['severity'])=>void;
/** Syntax-level link checks. A browser cannot test whether an external URL answers (CORS), so reachability is not checked. */
function linkIssues(n:Node,add:Add,anchors:Set<string>){
  const href=(n.href||'').trim();
  if(!href){add(n,'empty-link',`${n.name}: link has no destination.`);return;}
  if(/^javascript:/i.test(href)){add(n,'unsafe-link',`${n.name}: javascript: links are blocked by strict security policies and unusable without scripts.`,'error');return;}
  if(href.startsWith('#')){const id=href.slice(1);if(id&&id!=='top'&&!anchors.has(id))add(n,'anchor-link',`${n.name}: no element on this page has the id "${id}".`,'error');return;}
  if(/^http:\/\//i.test(href))add(n,'insecure-link',`${n.name}: link uses http:// instead of https://.`);
  if(/^https?:\/\//i.test(href)){try{new URL(href);}catch{add(n,'link-format',`${n.name}: "${href}" is not a valid URL.`,'error');}return;}
  if(!KNOWN_SCHEME.test(href))add(n,'link-format',`${n.name}: "${href}" has no scheme, so it is treated as a relative path. Use https://, /, # or a page link.`);
}

const textsOf=(n:Node)=>[n.text,n.href,n.src,n.alt,n.field?.placeholder];
/** Repeater checks: the data source exists, has published items, and every {{binding}} in the template names a real field. */
function repeaterIssues(n:Node,project:Project,add:Add){
  const r=n.repeat!;const template=n.children?.[0];
  if(!template){add(n,'repeater-empty',`${n.name}: repeater has no child to repeat.`);return;}
  let known:Set<string>|null=null;
  if(r.collectionId){
    const c=project.collections?.find(x=>x.id===r.collectionId);
    if(!c){add(n,'cms-missing',`${n.name}: its CMS collection was deleted, so nothing renders.`,'error');return;}
    if(!c.items.some(i=>!i.draft))add(n,'cms-empty',`${n.name}: collection "${c.name}" has no published items.`);
    known=new Set([...c.fields.map(f=>f.key),...builtinKeys]);
  }else{const first=r.rows?.[0];if(first)known=new Set(Object.keys(first));}
  if(!known)return;
  const seen=new Set<string>();
  for(const t of flatten(template))for(const k of textsOf(t).flatMap(bindingKeys))if(!known.has(k)&&!seen.has(k)){seen.add(k);add(n,'cms-binding',`${n.name}: {{${k}}} does not match any field.`);}
  const cid=r.collectionId;
  if(cid&&!seen.has('item-url')&&flatten(template).some(t=>textsOf(t).flatMap(bindingKeys).includes('item-url'))&&!project.pages.some(p=>p.templateOf===cid)){
    const c=project.collections?.find(x=>x.id===cid);add(n,'cms-no-item-page',`${n.name}: {{item-url}} links to each item's own page, but "${c?.name||'this collection'}" has no Item page yet. Make one in the CMS panel (Use it tab).`);}
}

export function staticQuality(project: Project, pageId=project.activePageId): QualityIssue[] {
  const page=project.pages.find(p=>p.id===pageId)||project.pages[0];if(!page)return [];
  const nodes=flatten(page.root);const issues:QualityIssue[]=[];
  const inRepeat=new Set<string>();for(const n of nodes)if(n.repeat)for(const c of flatten(n).slice(1))inRepeat.add(c.id);
  const seenIds=new Map<string,number>();
  const anchors=new Set<string>();for(const n of nodes){anchors.add(n.id);const a=n.attrs?.id;if(typeof a==='string'&&a)anchors.add(a);}
  const add=(node:Node,rule:string,message:string,severity:QualityIssue['severity']='warning')=>issues.push({id:node.id,rule,message,severity});
  if(page.templateOf){
    const c=project.collections?.find(x=>x.id===page.templateOf);
    if(!c)add(page.root,'cms-missing',`${page.name}: its collection was deleted, so no item pages will be made.`,'error');
    else if(!c.items.some(i=>!i.draft))add(page.root,'cms-empty',`${page.name}: "${c.name}" has no published items, so no item pages will be made.`);
  }
  for(const n of nodes){
    if(n.type==='image'&&!n.alt?.trim())add(n,'alt',`${n.name}: image is missing alt text.`);
    if(n.type==='button'&&!n.text?.trim()&&!hasName(n))add(n,'empty-button',`${n.name}: button has no label. Add text, or an aria-label under Properties > Custom attributes.`,'error');
    if(n.type!=='button'&&n.href&&!n.text?.trim()&&!hasName(n)&&!(n.children||[]).some(c=>c.alt?.trim()||c.text?.trim()))add(n,'link-name',`${n.name}: link has no accessible name. Add text or an aria-label.`,'error');
    a11yIssues(n,add,seenIds,page.root);
    if(n.href?.startsWith('page:')&&!project.pages.some(p=>p.id===n.href!.slice(5)))add(n,'page-link',`${n.name}: link points to a page that no longer exists.`,'error');
    if(n.repeat)repeaterIssues(n,project,add);
    if(n.type==='embed'&&!n.html?.trim())add(n,'embed-empty',`${n.name}: custom HTML block is empty.`);
    if(page.templateOf&&textsOf(n).some(t=>bindingKeys(t).length)){
      const c=project.collections?.find(x=>x.id===page.templateOf);const ok=new Set([...(c?.fields.map(f=>f.key)||[]),...builtinKeys]);
      for(const k of new Set(textsOf(n).flatMap(bindingKeys)))if(!ok.has(k))add(n,'cms-binding',`${n.name}: {{${k}}} does not match any field of "${c?.name||'this collection'}".`);
    }else if(!inRepeat.has(n.id)&&textsOf(n).some(t=>bindingKeys(t).length))add(n,'stray-binding',`${n.name}: contains a {{binding}} outside a repeater, so it will show as plain text.`);
    if(n.href!==undefined&&n.href.startsWith('page:')===false&&!bindingKeys(n.href).length)linkIssues(n,add,anchors);
    if(n.href&&['text','heading','button'].includes(n.type)&&GENERIC_LINK.test((n.text||'').trim()))add(n,'link-text',`${n.name}: link text "${(n.text||'').trim()}" says nothing about where it goes.`);
    if(n.type==='input'&&n.field){const labelled=!!n.field.placeholder?.trim()||!!n.attrs?.['aria-label']||!!n.attrs?.['aria-labelledby'];
      if(!labelled)add(n,'input-label',`${n.name}: field has no label, placeholder or aria-label.`);
      if(!n.field.name?.trim())add(n,'input-name',`${n.name}: field has no name, so its value is not submitted.`);}
    if(n.type==='form'){
      if(!flatten(n).some(c=>c.type==='button'))add(n,'form-submit',`${n.name}: form has no submit button.`);
      if(!n.attrs?.action&&!n.attrs?.['data-netlify'])add(n,'form-action',`${n.name}: form is not connected, so submitting it sends nothing. Pick a destination under Properties > Form submission.`);
    }
    if(n.type==='image'&&n.assetId){const a=project.assets.find(x=>x.id===n.assetId);const bytes=a?approxBytes(a.dataUrl):0;if(bytes>LARGE_IMAGE_BYTES)add(n,'large-image',`${n.name}: embedded image is ${(bytes/1048576).toFixed(1)} MB. Resize or compress it before export.`);}
  }
  const headings=nodes.filter(n=>n.type==='heading');
  const mains=nodes.filter(n=>n.tag==='main'&&n.type!=='page');if(mains.length)for(const m of mains)add(m,'nested-main',`${m.name}: the page itself is already <main>, so a second main landmark is invalid. Use section or div.`);const h1=headings.filter(n=>(n.tag||'h2')==='h1');
  if(h1.length!==1)issues.push({rule:'h1-count',message:`Page should have one H1; found ${h1.length}.`,severity:'warning'});
  let previous=0;for(const n of headings){const level=Number((n.tag||'h2').slice(1));if(previous&&level>previous+1)add(n,'heading-order',`Heading order skips from H${previous} to H${level}.`);previous=level;}
  for(const bp of ['light','dark'] as const){
    for(const n of nodes){if(!['text','heading','button'].includes(n.type)||n.hidden)continue;
      const color=colorOf(n,project,bp==='dark')|| (bp==='dark'?'#f3f4f6':'#111827');const chain=pathTo(page.root,n.id)||[n];let bg=bp==='dark'?'#0b1020':'#ffffff';
      for(let i=chain.length-1;i>=0;i--){const fill=fillOf(chain[i],project,bp==='dark');if(fill&&fill!=='transparent'&&fill!=='none'){bg=fill;break;}}
      const ratio=contrastRatio(color,bg);const s=resolveNode(n,'desktop').s;const min=(s.fontSize||16)>=24||((s.fontSize||16)>=18.66&&(s.fontWeight||400)>=700)?3:4.5;
      if(ratio!==null&&ratio<min)add(n,'contrast',`${bp==='dark'?'Dark':'Light'} contrast ${ratio.toFixed(2)}:1 (needs ${min}:1).`);
    }
  }
  return issues;
}

const len=(v?:string)=>(v||'').trim().length;
/** Project-wide SEO checks: titles, descriptions, duplicates, social image and site URL. */
export function seoQuality(project: Project): QualityIssue[] {
  const issues:QualityIssue[]=[];const titles=new Map<string,string[]>();const descs=new Map<string,string[]>();
  const add=(pageId:string|undefined,rule:string,message:string)=>issues.push({pageId,rule,message,severity:'warning'});
  for(const pg of project.pages){
    const t=pg.seo?.title?.trim(),d=pg.seo?.description?.trim();
    if(!t)add(pg.id,'seo-title',`${pg.name}: no SEO title. The export falls back to "${pg.name} · ${project.name}".`);
    else{if(len(t)<15||len(t)>60)add(pg.id,'seo-title-length',`${pg.name}: SEO title is ${len(t)} characters (aim for 15–60).`);titles.set(t.toLowerCase(),[...(titles.get(t.toLowerCase())||[]),pg.id]);}
    if(!d)add(pg.id,'seo-description',`${pg.name}: no meta description.`);
    else{if(len(d)<70||len(d)>160)add(pg.id,'seo-description-length',`${pg.name}: meta description is ${len(d)} characters (aim for 70–160).`);descs.set(d.toLowerCase(),[...(descs.get(d.toLowerCase())||[]),pg.id]);}
  }
  const dup=(m:Map<string,string[]>,rule:string,what:string)=>m.forEach(ids=>{if(ids.length>1)ids.slice(1).forEach(id=>add(id,rule,`${project.pages.find(p=>p.id===id)?.name}: ${what} is the same as another page's.`));});
  dup(titles,'seo-duplicate-title','SEO title');dup(descs,'seo-duplicate-description','meta description');
  if(!langValid(project.site?.lang))add(undefined,'seo-lang','No page language is set, so exports say <html lang="en">. Set it under Project settings if the site is not English.');
  const linked=new Set<string>();for(const pg of project.pages)for(const n of flatten(pg.root)){if(n.href?.startsWith('page:'))linked.add(n.href.slice(5));}
  project.pages.forEach((pg,i)=>{
    if(i>0&&!pg.sharedSection&&!linked.has(pg.id)&&pg.inNav===false)add(pg.id,'seo-orphan',`${pg.name}: no link and no menu entry leads here, so visitors and search engines cannot find it.`);
    const nodes=flatten(pg.root);const words=nodes.filter(n=>['text','heading','button'].includes(n.type)&&!n.hidden).map(n=>n.text||'').join(' ').split(/\s+/).filter(Boolean).length;
    if(words<50&&!nodes.some(n=>n.repeat||n.type==='embed'))add(pg.id,'seo-thin',`${pg.name}: only ${words} words of text. Pages with very little text rarely rank.`);
    const h1=nodes.find(n=>n.type==='heading'&&(n.tag||'h2')==='h1');
    if(h1&&!(h1.text||'').trim())add(pg.id,'seo-h1-empty',`${pg.name}: the H1 is empty.`);else if(h1&&(h1.text||'').length>70)add(pg.id,'seo-h1-long',`${pg.name}: the H1 is ${(h1.text||'').length} characters. Keep it under about 70.`);
    const sl=pg.slug?.trim();if(sl&&!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sl))add(pg.id,'seo-slug',`${pg.name}: the address "${sl}" should be lowercase words joined by hyphens.`);
  });
  if(!project.site?.socialImage&&!project.pages.some(p=>p.seo?.socialImage))add(undefined,'seo-social-image','No social share image is set on the site or any page.');
  if(!project.site?.baseUrl?.trim())add(undefined,'seo-base-url','No site URL is set, so og:url is left out of the export.');
  return issues;
}

/** Static checks on every page plus the SEO checks. Rendered (breakpoint) checks run separately in the Checks panel. */
export function projectQuality(project: Project): QualityIssue[] {
  const many=project.pages.length>1;const out:QualityIssue[]=[];
  for(const pg of project.pages)for(const i of staticQuality(project,pg.id))out.push({...i,pageId:pg.id,message:many?`${pg.name} · ${i.message}`:i.message});
  return [...out,...seoQuality(project)];
}
