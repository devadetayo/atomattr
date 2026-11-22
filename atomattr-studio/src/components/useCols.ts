import { useEffect, useRef, useState } from 'react';

/** How many columns of at least `min` px fit in the element's width (2 or more by default, so cards stay two per row in a normal drawer). */
export function useCols(min: number, floor = 1, gap = 12, pad = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState(Math.max(floor, 2));
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const read = () => { const w = el.clientWidth - pad; if (w > 0) setCols(Math.max(floor, Math.min(6, Math.floor((w + gap) / (min + gap))))); };
    read(); const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [min, floor, gap, pad]);
  return { ref, cols: String(cols) as '1' | '2' | '3' | '4' | '5' | '6' };
}
