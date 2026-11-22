import { ToolIcon } from './ToolIcons';

const ICONS: Record<string, React.ReactNode> = {
  html: <><path d="M4.5 3.5h15l-1.4 16L12 21l-6.1-1.5z" /><path d="M8 8h8l-.4 4.5H9l.2 2.2 2.8.9 2.8-.9" /></>,
  css: <path d="M9 4.5C7 4.5 7 6 7 7.5S7 10.5 5 12c2 1.5 2 3 2 4.5S7 19.5 9 19.5M15 4.5c2 0 2 1.5 2 3s0 3 2 4.5c-2 1.5-2 3-2 4.5s0 3-2 3" />,
  react: <><ellipse cx="12" cy="12" rx="9.5" ry="3.7" /><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></>,
  reactnative: <><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(-35 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(35 12 12)" /><rect x="9" y="6.5" width="6" height="11" rx="1.5" /></>,
  vue: <><path d="M3 4.5h4.2L12 13l4.8-8.5H21L12 20z" /><path d="M8.6 4.5 12 10.4l3.4-5.9" /></>,
  svelte: <path d="M16.8 6.4c-1.6-2-4.6-2.3-6.6-.8L7.2 7.8c-1.5 1.1-1.8 3.2-.7 4.7.3.4.7.7 1.1.9M7.2 17.6c1.6 2 4.6 2.3 6.6.8l3-2.2c1.5-1.1 1.8-3.2.7-4.7-.3-.4-.7-.7-1.1-.9M9.5 13.8l5-3.6" />,
  angular: <><path d="M12 3 4 6l1.3 11L12 21l6.7-4L20 6z" /><path d="M8.8 16 12 8l3.2 8M9.9 13.3h4.2" /></>,
  format: <path d="M4 6h16M4 10h10M4 14h16M4 18h8" />,
  wrap: <path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-5M14.5 15.5 12 18l2.5 2.5M4 18h4" />,
};

export function CodeIcon({ n, size = 18 }: { n: string; size?: number }) {
  const own = ICONS[n];
  if (!own) return <ToolIcon n={n} size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{own}</svg>
  );
}