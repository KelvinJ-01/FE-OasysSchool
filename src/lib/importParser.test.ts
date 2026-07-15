import { describe, it, expect } from 'vitest';
import { parseCsvText, parseImportFile, IMPORT_SPECS } from './importParser';

function csvFile(text: string, name = 'data.csv'): File {
  return new File([text], name, { type: 'text/csv' });
}

describe('parseCsvText', () => {
  it('mendeteksi pemisah koma', () => {
    const rows = parseCsvText('a,b,c\n1,2,3');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('mendeteksi pemisah titik koma (lazim pada Excel lokal Indonesia)', () => {
    const rows = parseCsvText('a;b;c\n1;2;3');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('membuang BOM di awal berkas', () => {
    const rows = parseCsvText('\uFEFFnama,nisn\nAgus,1000000137');
    expect(rows[0][0]).toBe('nama');
  });

  it('menghormati koma di dalam tanda kutip', () => {
    const rows = parseCsvText('nama,kelas\n"Santoso, Budi",XII IPA 1');
    expect(rows[1]).toEqual(['Santoso, Budi', 'XII IPA 1']);
  });

  it('menangani tanda kutip ganda yang di-escape', () => {
    const rows = parseCsvText('a\n"dia bilang ""halo"""');
    expect(rows[1][0]).toBe('dia bilang "halo"');
  });

  it('melewati baris kosong', () => {
    const rows = parseCsvText('a,b\n1,2\n\n\n3,4');
    expect(rows).toHaveLength(3);
  });

  it('menangani akhir baris CRLF', () => {
    const rows = parseCsvText('a,b\r\n1,2\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseImportFile — urutan kolom bebas', () => {
  it('memetakan kolom lewat alias, apa pun urutannya', async () => {
    const csv = 'JK;Kelas;NISN;Nama Lengkap;Agama\nL;XII IPA 1;1000000137;Budi Santoso;islam';
    const result = await parseImportFile(csvFile(csv), 'students');

    expect(result.errors).toEqual([]);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({
      fullName: 'Budi Santoso',
      nisn: '1000000137',
      className: 'XII IPA 1',
      gender: 'laki_laki',
      religion: 'islam',
    });
  });

  it('mengabaikan kolom yang tidak dikenali dan melaporkannya', async () => {
    const csv = 'Nama,NISN,Kolom Aneh\nBudi Santoso,1000000137,xyz';
    const result = await parseImportFile(csvFile(csv), 'students');

    expect(result.validRows).toHaveLength(1);
    expect(result.unmappedHeaders).toContain('Kolom Aneh');
  });

  it('menolak berkas bila kolom wajib tidak ada', async () => {
    const csv = 'Kelas,Agama\nXII IPA 1,islam';
    const result = await parseImportFile(csvFile(csv), 'students');

    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].message).toContain('Kolom wajib tidak ditemukan');
  });

  it('melaporkan berkas yang hanya berisi judul kolom', async () => {
    const result = await parseImportFile(csvFile('Nama,NISN'), 'students');
    expect(result.totalRows).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});

describe('parseImportFile — normalisasi nilai', () => {
  it.each([
    ['L', 'laki_laki'],
    ['l', 'laki_laki'],
    ['Laki-Laki', 'laki_laki'],
    ['pria', 'laki_laki'],
    ['P', 'perempuan'],
    ['Perempuan', 'perempuan'],
    ['wanita', 'perempuan'],
  ])('mengenali jenis kelamin "%s" sebagai %s', async (input, expected) => {
    const csv = `Nama,NISN,JK\nBudi Santoso,1000000137,${input}`;
    const result = await parseImportFile(csvFile(csv), 'students');
    expect(result.validRows[0]?.gender).toBe(expected);
  });

  it('menolak jenis kelamin yang tidak dikenali, dengan nomor baris', async () => {
    const csv = 'Nama,NISN,JK\nBudi Santoso,1000000137,X';
    const result = await parseImportFile(csvFile(csv), 'students');

    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].message).toContain('Jenis kelamin');
  });

  it.each([
    ['islam', 'islam'],
    ['Kristen', 'kristen'],
    ['protestan', 'kristen'],
    ['katholik', 'katolik'],
    ['budha', 'buddha'],
  ])('mengenali agama "%s" sebagai %s', async (input, expected) => {
    const csv = `Nama,NISN,Agama\nBudi Santoso,1000000137,${input}`;
    const result = await parseImportFile(csvFile(csv), 'students');
    expect(result.validRows[0]?.religion).toBe(expected);
  });

  it.each([
    ['PNS', 'pns'],
    ['p3k', 'pppk'],
    ['PPPK', 'pppk'],
    ['GTY', 'gty'],
    ['honorer', 'honorer'],
  ])('mengenali status kepegawaian "%s" sebagai %s', async (input, expected) => {
    const csv = `Nama,Email,Status Kepegawaian\nBudi Santoso,budi@oasys.sch.id,${input}`;
    const result = await parseImportFile(csvFile(csv), 'teachers');
    expect(result.validRows[0]?.employmentStatus).toBe(expected);
  });

  it('menormalkan email menjadi huruf kecil', async () => {
    const csv = 'Nama,Email\nBudi Santoso,BUDI@OASYS.SCH.ID';
    const result = await parseImportFile(csvFile(csv), 'teachers');
    expect(result.validRows[0]?.email).toBe('budi@oasys.sch.id');
  });

  it('menolak email yang tidak sah', async () => {
    const csv = 'Nama,Email\nBudi Santoso,bukan-email';
    const result = await parseImportFile(csvFile(csv), 'teachers');
    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].message).toContain('Email');
  });

  it('membuang karakter non-digit pada NISN', async () => {
    const csv = 'Nama,NISN\nBudi Santoso,10-0000-0137';
    const result = await parseImportFile(csvFile(csv), 'students');
    expect(result.validRows[0]?.nisn).toBe('1000000137');
  });

  it('menolak NISN yang bukan 10 digit', async () => {
    const csv = 'Nama,NISN\nBudi Santoso,123';
    const result = await parseImportFile(csvFile(csv), 'students');
    expect(result.errors[0].message).toContain('10 digit');
  });
});

describe('parseImportFile — baris sehat tetap lolos', () => {
  it('memisahkan baris sehat dari baris bermasalah', async () => {
    const csv = [
      'Nama,NISN,JK',
      'Budi Santoso,1000000137,L',
      'Ani Wijaya,999,P',
      'Citra Dewi,1000000274,X',
      'Dedi Kurnia,1000000411,P',
    ].join('\n');
    const result = await parseImportFile(csvFile(csv), 'students');

    expect(result.totalRows).toBe(4);
    expect(result.validRows).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((e) => e.row)).toEqual([3, 4]);
  });

  it('menandai baris yang kolom wajibnya kosong', async () => {
    const csv = 'Nama,NISN\n,1000000137';
    const result = await parseImportFile(csvFile(csv), 'students');
    expect(result.errors[0].message).toContain('fullName kosong');
  });
});

describe('IMPORT_SPECS', () => {
  it('mendukung seluruh sumber daya Data Master', () => {
    expect(Object.keys(IMPORT_SPECS).sort()).toEqual(
      ['classes', 'parents', 'students', 'subjects', 'teachers'].sort(),
    );
  });

  it('menolak sumber daya yang tidak dikenal', async () => {
    await expect(parseImportFile(csvFile('a,b\n1,2'), 'entah-apa')).rejects.toThrow();
  });
});
