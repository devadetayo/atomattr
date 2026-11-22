/** Minimal ZIP writer (store, no compression). No dependency, runs in the browser. */
const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (data: Uint8Array) => { let c = 0xffffffff; for (let i = 0; i < data.length; i += 1) c = TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export type ZipFile = { path: string; data: Uint8Array | string };
const enc = new TextEncoder();

export function makeZip(files: ZipFile[]): Blob {
  const chunks: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  const u16 = (v: number) => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = (v: number) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
  const cat = (...parts: Uint8Array[]) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out; };
  const now = new Date(); const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1); const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  files.forEach(f => {
    const name = enc.encode(f.path); const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data; const crc = crc32(data);
    const local = cat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(time), u16(date), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data);
    chunks.push(local);
    central.push(cat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(time), u16(date), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name));
    offset += local.length;
  });
  const dir = cat(...central);
  const end = cat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(dir.length), u32(offset), u16(0));
  return new Blob([...chunks, dir, end].map(p => p.slice().buffer as ArrayBuffer), { type: 'application/zip' });
}

export function dataUrlToBytes(url: string): Uint8Array {
  const [, b64] = url.split(',');
  const bin = atob(b64 || ''); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
