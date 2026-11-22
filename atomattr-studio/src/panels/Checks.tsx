import { useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { flatten } from '../document/tree';
import { BPS, BP_LABEL } from '../document/style';
import { elOf } from '../canvas/registry';
import { projectQuality, type QualityIssue } from '../document/quality';
import { analyzePerformance, type PerfReport } from '../document/performance';
import { formatBytes } from '../document/image-opt';
import { EmptyState, IconBtn, Section } from '../components/ui';
import { T } from '../theme';

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const sec=(ms:number)=>ms>=1000?`${(ms/1000).toFixed(1)} s`:`${ms} ms`;
function PerfSummary({r}:{r:PerfReport}){
  const tone=r.grade==='good'?'success':r.grade==='okay'?'warning':'danger';
  const rows:[string,string][]=[['HTML',formatBytes(r.bytes.html)],['CSS',formatBytes(r.bytes.css)],['Scripts',formatBytes(r.bytes.js)],[`Images (${r.images.length})`,formatBytes(r.bytes.images)],['Total',formatBytes(r.bytes.total)]];
  return <Section title={`Performance · ${r.pageName}`}>
    <Row items="center" gap="2" mb="1"><Box w="44px" h="44px" rounded="full" display="flex" items="center" justify="center" bg={tone} text="white" fontWeight="700" fontSize="lg" aria-label={`Performance score ${r.score} of 100`}>{r.score}</Box><Box flex="1"><Txt as="p" fontSize="sm" m="0" fontWeight="700">{r.grade==='good'?'Good':r.grade==='okay'?'Needs work':'Poor'}</Txt><Txt as="p" fontSize="sm" m="0" {...T.muted}>{r.requests} requests · {r.nodes.toLocaleString()} elements · depth {r.depth}</Txt></Box></Row>
    {rows.map(([k,v])=><Row key={k} items="center" mb="1"><Txt fontSize="sm" m="0" flex="1" {...T.muted}>{k}</Txt><Txt fontSize="sm" m="0" fontWeight={k==='Total'?'700':'500'}>{v}</Txt></Row>)}
    <Txt fontSize="sm" m="0" fontWeight="600">Estimated load</Txt>
    <Txt fontSize="sm" m="0" {...T.muted}>Fast 4G {sec(r.estimate.fast4g)} · Slow 4G {sec(r.estimate.slow4g)} · Slow 3G {sec(r.estimate.slow3g)}</Txt>
    <Txt fontSize="sm" m="0" {...T.muted}>Measured from the real export. Load times are a model (round trips plus transfer), and third-party resources are not included.</Txt>
  </Section>;
}
/** Lists every external link in the project and tries to reach it. Browsers hide the status of other sites, so only addresses that cannot be reached at all are flagged; a 404 on a live site is not detectable here. */
function ExternalLinks() {
  const p=useStudio().project!;const [res,setRes]=useState<{url:string;ok:boolean;names:string[]}[]|null>(null);const [busy,setBusy]=useState(false);
  const run=async()=>{
    setBusy(true);const urls=new Map<string,string[]>();
    p.pages.forEach(pg=>flatten(pg.root).forEach(n=>{if(n.href&&/^https?:\/\//i.test(n.href.trim())){const u=n.href.trim();urls.set(u,[...(urls.get(u)||[]),n.name]);}}));
    const out=await Promise.all([...urls].map(async([url,names])=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),7000);try{await fetch(url,{mode:'no-cors',method:'GET',signal:c.signal,cache:'no-store'});return{url,ok:true,names};}catch{return{url,ok:false,names};}finally{clearTimeout(t);}}));
    setRes(out.sort((a,b)=>Number(a.ok)-Number(b.ok)));setBusy(false);
  };
  const bad=res?.filter(r=>!r.ok)||[];
  return <Section title="External links" open={false}>
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Tries to reach each http(s) link in the project. Only addresses that cannot be reached at all are flagged; the browser does not reveal 404s on other sites.</Txt>
    <Btn type="button" onClick={run} disabled={busy} h="30px" {...T.card} fontSize="sm" cursor="pointer">{busy?'Checking…':'Check external links'}</Btn>
    {res&&(res.length===0?<Txt fontSize="sm" m="0" {...T.muted}>No external links in this project.</Txt>:<><Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>{bad.length?`${bad.length} of ${res.length} could not be reached`:`All ${res.length} responded`}</Txt>{bad.map(r=><Box key={r.url} p="2" {...T.card}><Txt fontSize="sm" m="0" fontWeight="600" truncate {...T.text}>{r.url}</Txt><Txt fontSize="sm" m="0" {...T.muted}>Used by {r.names.slice(0,3).join(', ')}</Txt></Box>)}</>)}
  </Section>;
}

export function Checks() {
  const s=useStudio();const p=s.project!;const [issues,setIssues]=useState<QualityIssue[]|null>(null);const [perf,setPerf]=useState<PerfReport|null>(null);const [running,setRunning]=useState(false);
  const run=async()=>{
    if(running)return;setRunning(true);const originalBp=S.getState().bp;const originalViewport=S.getState().viewport;const originalSel=[...S.getState().sel];let report:PerfReport|null=null;try{report=analyzePerformance(p);}catch{report=null;}const found=[...projectQuality(p),...(report?.issues||[])];const page=S.page();const nodes=flatten(page.root);
    try{
      for(const bp of BPS.filter(x=>x==='desktop'||p.settings?.[x]!==false)){
        S.setBp(bp);await frame();const rootEl=elOf(page.root.id);const rootRect=rootEl?.getBoundingClientRect();const zoom=Math.max(.01,S.getState().view.zoom);
        for(const n of nodes){if(n.id===page.root.id||n.hidden)continue;const el=elOf(n.id);if(!el)continue;const r=el.getBoundingClientRect();if(!r.width&&!r.height)continue;
          if(rootRect&&(r.left<rootRect.left-1||r.top<rootRect.top-1||r.right>rootRect.right+1))found.push({id:n.id,breakpoint:bp,rule:'overflow',severity:'warning',message:`${BP_LABEL[bp]}: ${n.name} extends beyond the page bounds.`});
          if((n.type==='button'||n.type==='input'||(n.href&&['text','heading'].includes(n.type)))&&bp!=='desktop'&&(r.width/zoom<44||r.height/zoom<44))found.push({id:n.id,breakpoint:bp,rule:'tap-target',severity:'warning',message:`${BP_LABEL[bp]}: ${n.name} is smaller than 44 × 44 px.`});
          if(bp==='mobile'&&(n.type==='text'||n.type==='heading')){const size=Number.parseFloat(getComputedStyle(el).fontSize);if(size>0&&size<12)found.push({id:n.id,breakpoint:bp,rule:'small-text',severity:'warning',message:`Mobile: ${n.name} uses ${size}px text (minimum 12px).`});}
        }
      }
    }finally{S.setState({bp:originalBp,viewport:originalViewport});S.fit('page');await frame();if(originalSel.length)S.select(originalSel);}
    const unique=Array.from(new Map(found.map(i=>[`${i.rule}:${i.id||''}:${i.breakpoint||''}:${i.message}`,i])).values());setIssues(unique);setPerf(report);setRunning(false);
  };
  const openIssue=(issue:QualityIssue)=>{if(issue.pageId&&issue.pageId!==S.getState().project?.activePageId)S.switchPage(issue.pageId);if(issue.breakpoint)S.setBp(issue.breakpoint);if(issue.id)setTimeout(()=>S.select([issue.id!]),30);};
  const counts=issues?.reduce((a,i)=>({...a,[i.severity]:a[i.severity]+1}),{error:0,warning:0});
  return <Box p="2" display="flex" flex-col gap="2">
    <Txt fontSize="sm" m="0" {...T.muted}>Checks cover every page: contrast, links and anchors, form fields, headings, CMS bindings and SEO fields. The active page also gets a performance score from the real export. The breakpoint scan measures rendered DOM boxes.</Txt>
    <Btn type="button" onClick={run} disabled={running} h="32px" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">{running?'Measuring breakpoints…':'Run all checks'}</Btn>
    <ExternalLinks />
    {issues===null?<EmptyState icon="check" title="Ready to scan" hint="Run checks to measure the active page at each enabled breakpoint."/>:<>
      <Row items="center" gap="2"><Txt fontSize="sm" fontWeight="700" m="0" flex="1">{issues.length?`${issues.length} issue${issues.length===1?'':'s'} found`:'No issues found'}</Txt><Txt fontSize="sm" m="0" {...T.muted}>{counts?.error} errors · {counts?.warning} warnings</Txt></Row>
      {perf&&<PerfSummary r={perf}/>}
      {issues.length===0&&<EmptyState icon="check" title="Looks good" hint="No issues were found on the active page."/>}
      {issues.length>0&&<Section title="Issues">{issues.map((issue,i)=><Row key={`${issue.rule}-${issue.id}-${issue.breakpoint}-${i}`} items="start" gap="1" p="2" mb="1" cursor={issue.id?'pointer':'default'} {...T.card} onClick={()=>openIssue(issue)}><Box flex="1"><Txt as="p" fontSize="sm" m="0" fontWeight="600">{issue.message}</Txt><Txt as="p" fontSize="sm" m="0" {...T.muted}>{issue.rule}{issue.breakpoint?` · ${BP_LABEL[issue.breakpoint]}`:''}</Txt></Box>{issue.id&&<IconBtn icon="target" title="Select object" size={22} iconSize={12}/>}</Row>)}</Section>}
    </>}
  </Box>;
}
