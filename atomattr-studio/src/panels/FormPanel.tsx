import { Box, Txt } from 'atomattr/react';
import type { Node } from '../document/types';
import * as S from '../state/store';
import { FORM_PROVIDERS, detectProvider, formAttrs, formProblem, type FormProvider } from '../document/forms';
import { SelectField, Seg, TextField } from '../components/ui';
import { T } from '../theme';

/** Properties section for a form: where the submitted data goes. */
export function FormSubmission({ node }: { node: Node }) {
  const cur = detectProvider(node.attrs); const meta = FORM_PROVIDERS.find(p => p.id === cur.provider)!;
  const write = (provider: FormProvider, value: string, method = cur.method) => S.setCustomAttrs([node.id], formAttrs(node.attrs, provider, value, method));
  const problem = formProblem(cur.provider, cur.value);
  return <Box display="flex" flex-col gap="2" px="3" py="2">
    <SelectField label="Send submissions to" value={cur.provider} options={FORM_PROVIDERS.map(p => [p.id, p.label] as [string, string])} onChange={v => write(v as FormProvider, v === cur.provider ? cur.value : '')} />
    {cur.provider !== 'none' && <TextField label={meta.field} value={cur.value} placeholder={meta.placeholder} onCommit={v => write(cur.provider, v)} />}
    {cur.provider === 'custom' && <Seg label="Method" value={cur.method} options={[{ v: 'post', label: 'POST' }, { v: 'get', label: 'GET' }]} onChange={m => write('custom', cur.value, m)} />}
    {problem && <Txt fontSize="sm" m="0" text="danger">{problem}</Txt>}
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>{meta.hint} Every input needs a name to be submitted.</Txt>
  </Box>;
}
