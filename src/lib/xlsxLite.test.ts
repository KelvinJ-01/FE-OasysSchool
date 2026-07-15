import { describe, it, expect } from 'vitest';
import { parseXlsxFile } from './xlsxLite';

/**
 * Membangun berkas .xlsx minimal di dalam memori.
 *
 * Berkas .xlsx adalah arsip ZIP berisi XML. Agar tes tidak butuh dependensi
 * apa pun, entri ditulis dengan metode STORED (tanpa kompresi) — struktur ZIP
 * tetap sah dan pembaca kita menanganinya lewat jalur `method === 0`.
 */
function makeXlsx(files: Record<string, string>): File {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => ({
    name: encoder.encode(name),
    data: encoder.encode(content),
  }));

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (bytes: Uint8Array) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + entry.name.length + entry.data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.data.length, true);
    lv.setUint32(22, entry.data.length, true);
    lv.setUint16(26, entry.name.length, true);
    local.set(entry.name, 30);
    local.set(entry.data, 30 + entry.name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + entry.name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true); // stored
    cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint32(42, offset, true);
    central.set(entry.name, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new File([...localParts, ...centralParts, eocd], 'test.xlsx');
}

const sheet = (rows: string) =>
  `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;

const wrap = (sheetXml: string, sharedStrings?: string) => {
  const files: Record<string, string> = {
    '[Content_Types].xml': '<?xml version="1.0"?><Types/>',
    'xl/worksheets/sheet1.xml': sheetXml,
  };
  if (sharedStrings) files['xl/sharedStrings.xml'] = sharedStrings;
  return makeXlsx(files);
};

describe('parseXlsxFile', () => {
  it('membaca sel inline string (format yang membuat pustaka lama crash)', async () => {
    const xml = sheet(
      '<row r="1"><c r="A1" t="inlineStr"><is><t>Nama</t></is></c><c r="B1" t="inlineStr"><is><t>NISN</t></is></c></row>' +
        '<row r="2"><c r="A2" t="inlineStr"><is><t>Budi Santoso</t></is></c><c r="B2"><v>1000000137</v></c></row>',
    );
    const rows = await parseXlsxFile(wrap(xml));
    expect(rows).toEqual([
      ['Nama', 'NISN'],
      ['Budi Santoso', '1000000137'],
    ]);
  });

  it('membaca sel shared string', async () => {
    const sst =
      '<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Nama</t></si><si><t>Budi Santoso</t></si></sst>';
    const xml = sheet('<row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml, sst));
    expect(rows).toEqual([['Nama'], ['Budi Santoso']]);
  });

  it('menggabungkan rich text multi-run menjadi satu nilai', async () => {
    const sst =
      '<?xml version="1.0"?><sst><si><r><t>Budi </t></r><r><t>Santoso</t></r></si></sst>';
    const xml = sheet('<row r="1"><c r="A1" t="s"><v>0</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml, sst));
    expect(rows[0][0]).toBe('Budi Santoso');
  });

  it('mengembangkan notasi ilmiah (regresi nomor telepon 6,2881E+13)', async () => {
    const xml = sheet('<row r="1"><c r="A1"><v>6.2881E13</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml));
    expect(rows[0][0]).toBe('62881000000000');
  });

  it('mengisi lubang kolom yang dilewati Excel dengan string kosong', async () => {
    // Kolom B sengaja tidak ada; C harus tetap di indeks 2.
    const xml = sheet('<row r="1"><c r="A1"><v>1</v></c><c r="C1"><v>3</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml));
    expect(rows[0]).toEqual(['1', '', '3']);
  });

  it('menerjemahkan entitas XML', async () => {
    const sst = '<?xml version="1.0"?><sst><si><t>Ani &amp; Wati</t></si></sst>';
    const xml = sheet('<row r="1"><c r="A1" t="s"><v>0</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml, sst));
    expect(rows[0][0]).toBe('Ani & Wati');
  });

  it('membaca sel boolean', async () => {
    const xml = sheet('<row r="1"><c r="A1" t="b"><v>1</v></c><c r="B1" t="b"><v>0</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml));
    expect(rows[0]).toEqual(['TRUE', 'FALSE']);
  });

  it('memetakan kolom di luar Z dengan benar (AA = indeks 26)', async () => {
    const xml = sheet('<row r="1"><c r="A1"><v>pertama</v></c><c r="AA1"><v>ke-27</v></c></row>');
    const rows = await parseXlsxFile(wrap(xml));
    expect(rows[0][0]).toBe('pertama');
    expect(rows[0][26]).toBe('ke-27');
  });

  it('menolak berkas yang bukan arsip ZIP', async () => {
    const bogus = new File(['ini bukan xlsx sama sekali'], 'palsu.xlsx');
    await expect(parseXlsxFile(bogus)).rejects.toThrow(/bukan \.xlsx yang sah/i);
  });

  it('menolak arsip tanpa lembar kerja', async () => {
    const noSheet = makeXlsx({ '[Content_Types].xml': '<?xml version="1.0"?><Types/>' });
    await expect(parseXlsxFile(noSheet)).rejects.toThrow(/lembar kerja tidak ditemukan/i);
  });
});
