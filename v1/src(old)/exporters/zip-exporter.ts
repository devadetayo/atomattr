const encoder = new TextEncoder();
const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index++) {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  CRC_TABLE[index] = value >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number) { view.setUint32(offset, value >>> 0, true); }

export function createZip(files: Map<string, string | Uint8Array>): Blob {
  if (files.size > 0xffff) throw new Error('ZIP export supports up to 65,535 files.');
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    if (nameBytes.length > 0xffff || data.length > 0xffffffff || offset > 0xffffffff) throw new Error('Export is too large for standard ZIP format.');
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0);
    u16(lv, 10, 0); u16(lv, 12, 0); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length);
    u16(lv, 26, nameBytes.length); u16(lv, 28, 0);
    local.set(nameBytes, 30); local.set(data, 30 + nameBytes.length);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0);
    u16(cv, 12, 0); u16(cv, 14, 0); u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length);
    u16(cv, 28, nameBytes.length); u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u16(cv, 36, 0);
    u32(cv, 38, 0); u32(cv, 42, offset); central.set(nameBytes, 46);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const centralSize = centrals.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.size); u16(ev, 10, files.size);
  u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  const parts = [...locals, ...centrals, end];
  const archive = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let cursor = 0;
  for (const part of parts) { archive.set(part, cursor); cursor += part.length; }
  return new Blob([archive.buffer as ArrayBuffer], { type: 'application/zip' });
}

export function downloadZip(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
