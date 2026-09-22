import fs from 'fs';
import path from 'path';
import { mixOklch } from '../src/style-data/color-utils.js';
import { COLORS as EXISTING_COLORS } from '../src/style-data/variables.js';

const families = [
  'gray','slate','blue','sky','powder-blue','cyan','teal','emerald','green','lime','yellow','amber','orange','dark-orange','red','rose','pink','purple','violet','indigo'
];
const SHADES = ['50','100','200','300','400','500','600','700','800','900','950'];

const out = {};

for (const fam of families) {
  const baseKey = `${fam}-500`;
  const base = EXISTING_COLORS[baseKey];
  if (!base || !base.startsWith('#')) continue;

  for (let i = 0; i < SHADES.length; i++) {
    const shade = SHADES[i];
    const idx = i; // 0..10
    const t = Math.abs(idx - 5) / 5; // 0..1 distance from center
    let color;
    if (idx === 5) color = base;
    else if (idx < 5) {
      // lighter: mix with white
      const percent = Math.round((1 - (idx / 5)) * 80); // 80% -> lighter
      color = mixOklch(base, '#ffffff', percent);
    } else {
      // darker: mix with black
      const percent = Math.round((idx / 10) * 80);
      color = mixOklch(base, '#000000', percent);
    }
    out[`${fam}-${shade}`] = color;
  }
}

const dest = path.resolve('./src/style-data/palette.generated.js');
const content = `export const GENERATED_COLORS = ${JSON.stringify(out, null, 2)};\nexport default GENERATED_COLORS;\n`;
fs.writeFileSync(dest, content, 'utf8');
console.log('Wrote', dest);
