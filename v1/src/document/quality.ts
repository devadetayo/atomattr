import type { Bp, Node, Project } from './types';
import { flatten, pathTo } from './tree';
import { resolveNode } from './style';

export type QualityIssue = { id?: string; breakpoint?: Bp; rule: string; message: string; severity: 'error'|'warning' };
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

export function staticQuality(project: Project, pageId=project.activePageId): QualityIssue[] {
  const page=project.pages.find(p=>p.id===pageId)||project.pages[0];if(!page)return [];
  const nodes=flatten(page.root);const issues:QualityIssue[]=[];
  const add=(node:Node,rule:string,message:string,severity:QualityIssue['severity']='warning')=>issues.push({id:node.id,rule,message,severity});
  for(const n of nodes){
    if(n.type==='image'&&!n.alt?.trim())add(n,'alt',`${n.name}: image is missing alt text.`);
    if(n.type==='button'&&!n.text?.trim())add(n,'empty-button',`${n.name}: button has no label.`,'error');
    if(n.href?.startsWith('page:')&&!project.pages.some(p=>p.id===n.href!.slice(5)))add(n,'page-link',`${n.name}: link points to a page that no longer exists.`,'error');
  }
  const headings=nodes.filter(n=>n.type==='heading');const h1=headings.filter(n=>(n.tag||'h2')==='h1');
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
