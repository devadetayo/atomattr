import { Box, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { flatten } from '../document/tree';
import { ANALYTICS_PROVIDERS, EVENT_ATTR, analyticsProblem, type Analytics, type AnalyticsProvider } from '../document/analytics';
import type { Node } from '../document/types';
import { Checkbox, EmptyState, Section, SelectField, TextField } from '../components/ui';
import { T } from '../theme';

const DASH: Partial<Record<AnalyticsProvider, [string, string]>> = { plausible: ['Open Plausible', 'https://plausible.io/sites'], ga4: ['Open Google Analytics', 'https://analytics.google.com/'], umami: ['Open Umami', 'https://cloud.umami.is/'] };

/** Properties section: tag a button or link so clicks on it are sent as a named event. */
export function EventTag({ node }: { node: Node }) {
  const cur = String(node.attrs?.[EVENT_ATTR] || '');
  const set = (v: string) => { const next = { ...(node.attrs || {}) }; const name = v.trim().replace(/[^\w .:-]/g, '').slice(0, 60); if (name) next[EVENT_ATTR] = name; else delete next[EVENT_ATTR]; S.setCustomAttrs([node.id], next); };
  return <Box px="3" py="2" display="flex" flex-col gap="1"><TextField label="Event name" value={cur} placeholder="signup_click" onCommit={set} />
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Clicks on this object are sent as this event once analytics is on (Analytics panel).</Txt></Box>;
}

/** The Analytics docker: where exported pages send page views and tagged events. */
export function AnalyticsPanel() {
  const s = useStudio(); const p = s.project!; const a: Analytics = p.analytics || { provider: 'none', id: '' };
  const meta = ANALYTICS_PROVIDERS.find(x => x.id === a.provider)!; const problem = analyticsProblem(a);
  const put = (patch: Partial<Analytics>) => S.setProject({ ...p, analytics: { ...a, ...patch } });
  const tagged = p.pages.flatMap(pg => flatten(pg.root).filter(n => n.attrs?.[EVENT_ATTR]).map(n => ({ n, page: pg.name })));
  const names = [...new Set(tagged.map(t => String(t.n.attrs![EVENT_ATTR])))];
  return <Box p="3" display="flex" flex-col gap="3">
    <Box display="flex" flex-col gap="2" p="3" {...T.tile}>
      <SelectField label="Send page views to" value={a.provider} options={ANALYTICS_PROVIDERS.map(x => [x.id, x.label] as [string, string])} onChange={v => put({ provider: v as AnalyticsProvider, id: v === a.provider ? a.id : '' })} />
      {a.provider !== 'none' && <TextField label={meta.field} value={a.id} placeholder={meta.placeholder} onCommit={v => put({ id: v.trim() })} />}
      {(a.provider === 'plausible' || a.provider === 'umami') && <TextField label="Script URL (self-hosted, optional)" value={a.src || ''} placeholder="https://stats.example.com/script.js" onCommit={v => put({ src: v.trim() })} />}
      {a.provider !== 'none' && <Checkbox label="Respect Do Not Track" checked={a.respectDnt !== false} onChange={v => put({ respectDnt: v })} />}
      {problem && <Txt fontSize="sm" m="0" text="danger">{problem}</Txt>}
      <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>{meta.hint}</Txt>
      {a.provider !== 'none' && !problem && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>On. Added to every exported page. Previews inside Studio never send anything.</Txt>}
    </Box>
    <Section title={`Tracked events (${names.length})`} open>
      {tagged.length === 0
        ? <EmptyState icon="star" title="No events yet" hint="Select a button or link and set an Event name under Properties → Analytics event." />
        : <Box display="flex" flex-col gap="1">{tagged.map(({ n, page }) => <Box key={n.id} p="2" cursor="pointer" {...T.tile} onClick={() => { if (page !== S.page(S.getState()).name) { const pg = p.pages.find(x => x.name === page); if (pg) S.switchPage(pg.id); } setTimeout(() => S.select([n.id]), 30); }}>
          <Txt fontSize="sm" fontWeight="600" m="0" truncate {...T.text}>{String(n.attrs![EVENT_ATTR])}</Txt><Txt fontSize="sm" m="0" truncate {...T.muted}>{n.name} · {page}</Txt></Box>)}</Box>}
    </Section>
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Studio has no server, so it sends data but does not store or chart it. {DASH[a.provider] ? <>View your numbers in <a href={DASH[a.provider]![1]} target="_blank" rel="noopener noreferrer">{DASH[a.provider]![0]}</a>.</> : a.provider === 'custom' ? 'Your endpoint receives the data; build or host the dashboard there.' : 'Pick a service to start.'}</Txt>
  </Box>;
}
