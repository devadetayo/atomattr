import { useEffect, useMemo } from 'react';
import { Box } from 'atomattr/react';
import { DEFAULT_THEME, themeById, tokenize, type Lang } from './highlight';
import { reportHex, useHexOk, usePaint } from './paint';

export function SyntaxCode({ code, lang = 'text', wrap = true, theme = DEFAULT_THEME }: { code: string; lang?: Lang; wrap?: boolean; theme?: string }) {
  const paint = usePaint();
  const ok = useHexOk();
  const th = themeById(theme);

  /* one-time check that atomattr paints hex colours; see paint.ts */
  useEffect(() => {
    if (ok !== null) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector('[data-hex-probe]');
      if (el) reportHex(getComputedStyle(el).color.replace(/\s/g, '') === 'rgb(18,52,86)');
    }, 120);
    return () => window.clearTimeout(t);
  }, [ok]);

  const tokens = useMemo(() => tokenize(code, lang), [code, lang]);
  const parts = useMemo(
    () => tokens.map((t, i) => t.k === 'plain'
      ? t.v
      : <Box key={i} as="span" {...paint.text(th.light.c[t.k], th.dark.c[t.k])} {...(t.k === 'comment' ? { 'font-style': 'italic' } : {})}>{t.v}</Box>),
    [tokens, th, paint],
  );

  return (
    <Box as="pre" flex="1" min-h="0" m="0" p="3" overflow="auto" fontSize="sm" leading="relaxed" font-mono {...paint.surface(th)}
      {...(wrap ? { whitespace: 'pre-wrap', 'overflow-wrap': 'anywhere' } : { whitespace: 'pre' })} aria-label="Syntax highlighted code">
      {ok === null && <Box as="span" data-hex-probe="" text="#123456" position="absolute" opacity="0" pointerEvents="none" aria-hidden="true">.</Box>}
      <Box as="code">{parts}</Box>
    </Box>
  );
}