import { Box } from 'atomattr/react';

const TOKEN = /(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<\/?[A-Za-z][^>]*>|\b(?:import|export|from|function|return|const|let|default|new|class)\b)/g;
export function SyntaxCode({ code }: { code: string }) {
  const parts: React.ReactNode[]=[];let cursor=0;let i=0;let match:RegExpExecArray|null;
  while((match=TOKEN.exec(code))){if(match.index>cursor)parts.push(code.slice(cursor,match.index));const value=match[0];const color=value.startsWith('<!--')||value.startsWith('/*')?'gray-500':value.startsWith('"')||value.startsWith("'")?'success':value.startsWith('<')?'primary':'accent';parts.push(<Box key={`token-${i++}`} as="span" text={color}>{value}</Box>);cursor=match.index+value.length;}
  if(cursor<code.length)parts.push(code.slice(cursor));
  return <Box as="pre" flex="1" m="0" p="3" overflow="auto" fontSize="12px" leading="normal" font-mono {...({text:'gray-900','dark-text':'gray-100'})} bg="gray-50" dark-bg="gray-950" whitespace="pre" aria-label="Syntax highlighted code"><Box as="code">{parts}</Box></Box>;
}
