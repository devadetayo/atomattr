import { useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { flatten } from '../document/tree';
import { BPS, BP_LABEL } from '../document/style';
import { elOf } from '../canvas/registry';
import { staticQuality, type QualityIssue } from '../document/quality';
import { EmptyState, IconBtn, Section } from '../components/ui';
import { T } from '../theme';

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
export function Checks() {
  const s=useStudio();const p=s.project!;const [issues,setIssues]=useState<QualityIssue[]|null>(null);const [running,setRunning]=useState(false);
  const run=async()=>{
    if(running)return;setRunning(true);const originalBp=S.getState().bp;const originalViewport=S.getState().viewport;const originalSel=[...S.getState().sel];const found=staticQuality(p).slice();const page=S.page();const nodes=flatten(page.root);
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
    const unique=Array.from(new Map(found.map(i=>[`${i.rule}:${i.id||''}:${i.breakpoint||''}:${i.message}`,i])).values());setIssues(unique);setRunning(false);
  };
  const openIssue=(issue:QualityIssue)=>{if(issue.breakpoint)S.setBp(issue.breakpoint);if(issue.id)S.select([issue.id]);};
  const counts=issues?.reduce((a,i)=>({...a,[i.severity]:a[i.severity]+1}),{error:0,warning:0});
  return <Box p="2" display="flex" flex-col gap="2">
    <Txt fontSize="11px" m="0" {...T.muted}>Checks inspect contrast in light/dark mode, page links and accessibility structure. The breakpoint scan measures rendered DOM boxes.</Txt>
    <Btn type="button" onClick={run} disabled={running} h="32px" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">{running?'Measuring breakpoints…':'Run all checks'}</Btn>
    {issues===null?<EmptyState icon="check" title="Ready to scan" hint="Run checks to measure the active page at each enabled breakpoint."/>:<>
      <Row items="center" gap="2"><Txt fontSize="12px" fontWeight="700" m="0" flex="1">{issues.length?`${issues.length} issue${issues.length===1?'':'s'} found`:'No issues found'}</Txt><Txt fontSize="10px" m="0" {...T.muted}>{counts?.error} errors · {counts?.warning} warnings</Txt></Row>
      {issues.length===0&&<EmptyState icon="check" title="Looks good" hint="No issues were found on the active page."/>}
      {issues.length>0&&<Section title="Issues">{issues.map((issue,i)=><Row key={`${issue.rule}-${issue.id}-${issue.breakpoint}-${i}`} items="start" gap="1" p="2" mb="1" cursor={issue.id?'pointer':'default'} {...T.card} onClick={()=>openIssue(issue)}><Box flex="1"><Txt fontSize="11px" m="0" fontWeight="600">{issue.message}</Txt><Txt fontSize="10px" m="0" {...T.muted}>{issue.rule}{issue.breakpoint?` · ${BP_LABEL[issue.breakpoint]}`:''}</Txt></Box>{issue.id&&<IconBtn icon="target" title="Select object" size={22} iconSize={12}/>}</Row>)}</Section>}
    </>}
  </Box>;
}
