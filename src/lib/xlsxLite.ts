const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function findZipEntries(buf: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buf);
  let eocd = -1;
  const start = Math.max(0, buf.byteLength - 65557);
  for (let i = buf.byteLength - 22; i >= start; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('Berkas bukan .xlsx yang sah (struktur ZIP tidak ditemukan).');

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();

  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== CENTRAL_SIG) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(new Uint8Array(buf, offset + 46, nameLen));
    entries.push({ name, method, compressedSize, localHeaderOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function readZipEntry(buf: ArrayBuffer, entry: ZipEntry): Promise<string> {
  const view = new DataView(buf);
  const lo = entry.localHeaderOffset;
  const nameLen = view.getUint16(lo + 26, true);
  const extraLen = view.getUint16(lo + 28, true);
  const dataStart = lo + 30 + nameLen + extraLen;
  const raw = new Uint8Array(buf, dataStart, entry.compressedSize);

  if (entry.method === 0) return new TextDecoder().decode(raw);
  if (entry.method !== 8) throw new Error('Metode kompresi ZIP tidak didukung.');

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser Anda belum mendukung pembacaan .xlsx. Gunakan berkas .csv.');
  }
  const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(stream).text();
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

function extractTexts(inner: string): string {
  let out = '';
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) out += decodeXmlEntities(m[1] ?? '');
  return out;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) strings.push(extractTexts(m[1]));
  return strings;
}

function columnIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? 'A';
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function expandScientific(v: string): string {
  if (!/^-?\d+(?:\.\d+)?[eE][+-]?\d+$/.test(v)) return v;
  const num = Number(v);
  if (!Number.isFinite(num)) return v;
  return Number.isInteger(num) ? num.toFixed(0) : String(num);
}

function parseSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1];
      const inner = cellMatch[2] ?? '';
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="(\w+)"/.exec(attrs)?.[1];
      const col = ref ? columnIndex(ref) : cells.length;

      let value = '';
      if (type === 's') {
        const idx = Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '-1');
        value = shared[idx] ?? '';
      } else if (type === 'inlineStr') {
        value = extractTexts(inner);
      } else if (type === 'b') {
        value = /<v>1<\/v>/.test(inner) ? 'TRUE' : 'FALSE';
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '';
        value = expandScientific(decodeXmlEntities(v));
      }
      cells[col] = value;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
    rows.push(cells);
  }
  return rows;
}

export async function parseXlsxFile(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  const entries = findZipEntries(buf);

  const sheetEntry =
    entries.find((e) => e.name === 'xl/worksheets/sheet1.xml') ??
    entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!sheetEntry) throw new Error('Lembar kerja tidak ditemukan di dalam berkas .xlsx.');

  const sharedEntry = entries.find((e) => e.name === 'xl/sharedStrings.xml');
  const shared = sharedEntry ? parseSharedStrings(await readZipEntry(buf, sharedEntry)) : [];
  const sheetXml = await readZipEntry(buf, sheetEntry);
  return parseSheet(sheetXml, shared);
}
