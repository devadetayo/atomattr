/**
 * The .ast container: AtomAttr Studio's own single-file project format (not a zip).
 *
 *   0   8 bytes   magic  89 41 53 54 0D 0A 1A 0A  ("\x89AST\r\n\x1a\n")
 *   8   u16       format version
 *   10  u16       flags (reserved, 0)
 *   12  u32       index length N
 *   16  N bytes   index: UTF-8 JSON { type, version, app, project info, assets[], entries[] }
 *   16+N          data region; every entry is { path, mime, enc, offset, size, rawSize, crc }
 *                 with `offset` relative to the start of the data region.
 *
 * Entries: project.json, history.json (optional) and assets/<id> (binary, one per image/font/file).
 * JSON and text assets are deflated (enc "deflate", raw deflate stream); images stay "raw".
 * Every entry carries a CRC-32 of its decoded bytes, so a damaged file is rejected instead of half-opening.
 */
export const AST_MAGIC = new Uint8Array([0x89, 0x41, 0x53, 0x54, 0x0d, 0x0a, 0x1a, 0x0a]);
export const AST_FORMAT_VERSION = 1;
const HEADER = 16;

export type AstEntry = { path: string; mime: string; enc: 'raw' | 'deflate'; offset: number; size: number; rawSize: number; crc: number };
export type AstFile = { index: Record<string, unknown>; entries: Map<string, Uint8Array> };

let crcTable: Uint32Array | null = null;
export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const canDeflate = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
async function pipe(bytes: Uint8Array, stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }): Promise<Uint8Array> {
  const writer = stream.writable.getWriter(); void writer.write(bytes as unknown as Uint8Array<ArrayBuffer>); void writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
const deflate = (b: Uint8Array) => pipe(b, new CompressionStream('deflate-raw') as any);
const inflate = (b: Uint8Array) => pipe(b, new DecompressionStream('deflate-raw') as any);

export const isCompressible = (mime: string) => /^text\/|json|svg|xml|javascript/i.test(mime);

export type AstInput = { path: string; mime: string; bytes: Uint8Array; compress?: boolean };

export async function writeAst(index: Record<string, unknown>, files: AstInput[]): Promise<Blob> {
  const entries: AstEntry[] = []; const chunks: Uint8Array[] = []; let offset = 0;
  for (const f of files) {
    const wantDeflate = !!f.compress && canDeflate() && f.bytes.length > 64;
    const packed = wantDeflate ? await deflate(f.bytes) : f.bytes;
    const useDeflate = wantDeflate && packed.length < f.bytes.length;
    const data = useDeflate ? packed : f.bytes;
    entries.push({ path: f.path, mime: f.mime, enc: useDeflate ? 'deflate' : 'raw', offset, size: data.length, rawSize: f.bytes.length, crc: crc32(f.bytes) });
    chunks.push(data); offset += data.length;
  }
  const indexBytes = new TextEncoder().encode(JSON.stringify({ ...index, entries }));
  const head = new Uint8Array(HEADER); head.set(AST_MAGIC, 0);
  const view = new DataView(head.buffer); view.setUint16(8, AST_FORMAT_VERSION, true); view.setUint16(10, 0, true); view.setUint32(12, indexBytes.length, true);
  return new Blob([head as BlobPart, indexBytes as BlobPart, ...(chunks as BlobPart[])], { type: 'application/x-atomattr-studio' });
}

export const looksLikeAst = (head: Uint8Array) => head.length >= AST_MAGIC.length && AST_MAGIC.every((b, i) => head[i] === b);

export async function readAst(blob: Blob): Promise<AstFile | null> {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    if (buf.length < HEADER || !looksLikeAst(buf)) return null;
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    if (view.getUint16(8, true) > AST_FORMAT_VERSION) return null;
    const indexLen = view.getUint32(12, true);
    if (HEADER + indexLen > buf.length) return null;
    const index = JSON.parse(new TextDecoder().decode(buf.subarray(HEADER, HEADER + indexLen))) as Record<string, unknown> & { entries?: AstEntry[] };
    const base = HEADER + indexLen; const entries = new Map<string, Uint8Array>();
    for (const e of index.entries || []) {
      if (base + e.offset + e.size > buf.length) return null;
      const raw = buf.subarray(base + e.offset, base + e.offset + e.size);
      const bytes = e.enc === 'deflate' ? await inflate(raw) : raw;
      if (bytes.length !== e.rawSize || crc32(bytes) !== e.crc) return null;
      entries.set(e.path, bytes);
    }
    return { index, entries };
  } catch { return null; }
}
