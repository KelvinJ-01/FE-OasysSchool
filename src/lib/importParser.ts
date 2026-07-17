import { parseXlsxFile } from './xlsxLite';

export interface ImportFieldSpec {
  key: string;
  aliases: string[];
  required?: boolean;
  normalize?: (raw: string) => { value: unknown } | { error: string };
}

export interface ParsedImport {
  totalRows: number;
  validRows: Record<string, unknown>[];
  errors: Array<{ row: number; message: string }>;
  unmappedHeaders: string[];
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function enumNormalizer(label: string, map: Record<string, string[]>): NonNullable<ImportFieldSpec['normalize']> {
  return (raw) => {
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [canonical, variants] of Object.entries(map)) {
      if (variants.some((v) => cleaned === v)) return { value: canonical };
    }
    return { error: `${label} "${raw}" tidak dikenali.` };
  };
}

const genderNormalize = enumNormalizer('Jenis kelamin', {
  laki_laki: ['l', 'laki', 'lakilaki', 'pria', 'male', 'm', 'cowok'],
  perempuan: ['p', 'perempuan', 'wanita', 'female', 'f', 'cewek'],
});

const religionNormalize = enumNormalizer('Agama', {
  islam: ['islam', 'muslim'],
  kristen: ['kristen', 'protestan', 'kristenprotestan'],
  katolik: ['katolik', 'katholik', 'kristenkatolik'],
  hindu: ['hindu'],
  buddha: ['buddha', 'budha', 'buddhis'],
  konghucu: ['konghucu', 'khonghucu', 'confucius'],
});

const employmentNormalize = enumNormalizer('Status kepegawaian', {
  pns: ['pns', 'pegawainegerisipil', 'asnpns'],
  pppk: ['pppk', 'p3k'],
  gty: ['gty', 'gurutetapyayasan'],
  gtt: ['gtt', 'gurutidaktetap'],
  honorer: ['honorer', 'honor'],
});

const emailNormalize: NonNullable<ImportFieldSpec['normalize']> = (raw) => {
  const v = raw.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(v)) return { error: `Email "${raw}" tidak valid.` };
  return { value: v };
};

const nisnNormalize: NonNullable<ImportFieldSpec['normalize']> = (raw) => {
  const v = raw.replace(/\D/g, '');
  if (!/^\d{10}$/.test(v)) return { error: `NISN "${raw}" harus 10 digit angka.` };
  return { value: v };
};

export const IMPORT_SPECS: Record<string, ImportFieldSpec[]> = {
  students: [
    { key: 'fullName', aliases: ['nama', 'namalengkap', 'namasiswa', 'name', 'fullname'], required: true },
    { key: 'nisn', aliases: ['nisn', 'nomorinduksiswanasional'], required: true, normalize: nisnNormalize },
    { key: 'className', aliases: ['kelas', 'namakelas', 'class', 'rombel'] },
    { key: 'gender', aliases: ['jeniskelamin', 'jk', 'gender', 'kelamin', 'lp'], normalize: genderNormalize },
    { key: 'religion', aliases: ['agama', 'religion'], normalize: religionNormalize },
    { key: 'email', aliases: ['email', 'surel', 'emailsiswa'], normalize: emailNormalize },
    { key: 'phone', aliases: ['telepon', 'nomortelepon', 'nohp', 'hp', 'notelp', 'telp', 'phone', 'whatsapp', 'wa'] },
    { key: 'address', aliases: ['alamat', 'address', 'alamatrumah'] },
    { key: 'fatherName', aliases: ['namaayah', 'ayah', 'father'] },
    { key: 'motherName', aliases: ['namaibu', 'ibu', 'mother'] },
    { key: 'guardian1Name', aliases: ['wali1', 'namawali1', 'walisiswa1', 'wali'] },
    { key: 'guardian2Name', aliases: ['wali2', 'namawali2', 'walisiswa2'] },
  ],
  classes: [
    { key: 'name', aliases: ['nama', 'namakelas', 'kelas', 'name'], required: true },
    { key: 'educationLevel', aliases: ['jenjang', 'level'], normalize: enumNormalizer('Jenjang', { sd: ['sd', 'sekolahdasar'], smp: ['smp'], sma: ['sma'], smk: ['smk'] }) },
    { key: 'gradeLevel', aliases: ['tingkat', 'tingkatan', 'grade'] },
    { key: 'homeroomTeacherName', aliases: ['walikelas', 'namawalikelas', 'homeroom'] },
  ],
  subjects: [
    { key: 'name', aliases: ['nama', 'namamatapelajaran', 'matapelajaran', 'mapel', 'name'], required: true },
    { key: 'code', aliases: ['kode', 'kodemapel', 'kodematapelajaran', 'code'] },
  ],
  teachers: [
    { key: 'fullName', aliases: ['nama', 'namalengkap', 'namaguru', 'name'], required: true },
    { key: 'email', aliases: ['email', 'surel'], required: true, normalize: emailNormalize },
    { key: 'phone', aliases: ['telepon', 'nomortelepon', 'nohp', 'hp', 'telp'] },
    { key: 'nip', aliases: ['nip'] },
    { key: 'nuptk', aliases: ['nuptk'] },
    { key: 'employmentStatus', aliases: ['statuskepegawaian', 'kepegawaian', 'status'], normalize: employmentNormalize },
    { key: 'expertiseField', aliases: ['bidangkeahlian', 'bidang', 'keahlian'] },
    { key: 'expertiseType', aliases: ['jeniskeahlian', 'jenisguru'] },
    { key: 'address', aliases: ['alamat'] },
  ],
  parents: [
    { key: 'fullName', aliases: ['nama', 'namalengkap', 'namaorangtua', 'name'], required: true },
    { key: 'email', aliases: ['email', 'surel'], required: true, normalize: emailNormalize },
    { key: 'phone', aliases: ['telepon', 'nomortelepon', 'nohp', 'hp', 'telp', 'whatsapp', 'wa'] },
    { key: 'occupation', aliases: ['pekerjaan', 'profesi'] },
    { key: 'address', aliases: ['alamat'] },
    { key: 'studentNisns', aliases: ['nisnanak', 'nisn', 'anaknisn'] },
  ],
};

export function parseCsvText(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

async function readFileAsMatrix(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    return parseXlsxFile(file);
  }
  const text = await file.text();
  return parseCsvText(text);
}

export async function parseImportFile(file: File, resource: string): Promise<ParsedImport> {
  const spec = IMPORT_SPECS[resource];
  if (!spec) throw new Error(`Impor untuk "${resource}" belum didukung.`);

  const matrix = await readFileAsMatrix(file);
  if (matrix.length < 2) {
    return { totalRows: 0, validRows: [], errors: [{ row: 1, message: 'Berkas kosong atau hanya berisi judul kolom.' }], unmappedHeaders: [] };
  }

  const headerRow = matrix[0].map((h) => h.trim());
  const columnMap: Array<ImportFieldSpec | null> = headerRow.map((h) => {
    const norm = normalizeHeader(h);
    return spec.find((f) => f.aliases.includes(norm)) ?? null;
  });
  const unmappedHeaders = headerRow.filter((_, i) => headerRow[i] && !columnMap[i]);

  const mappedKeys = new Set(columnMap.filter(Boolean).map((f) => f!.key));
  const missingRequired = spec.filter((f) => f.required && !mappedKeys.has(f.key));
  if (missingRequired.length > 0) {
    return {
      totalRows: matrix.length - 1,
      validRows: [],
      errors: [{ row: 1, message: `Kolom wajib tidak ditemukan: ${missingRequired.map((f) => f.key).join(', ')}. Periksa judul kolom di baris pertama.` }],
      unmappedHeaders,
    };
  }

  const validRows: Record<string, unknown>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const record: Record<string, unknown> = {};
    const rowErrors: string[] = [];

    columnMap.forEach((field, c) => {
      if (!field) return;
      const raw = (cells[c] ?? '').trim();
      if (!raw) {
        if (field.required) rowErrors.push(`${field.key} kosong`);
        return;
      }
      if (field.normalize) {
        const result = field.normalize(raw);
        if ('error' in result) rowErrors.push(result.error);
        else record[field.key] = result.value;
      } else {
        record[field.key] = raw;
      }
    });

    if (rowErrors.length > 0) {
      errors.push({ row: r + 1, message: rowErrors.join(' · ') });
    } else {
      validRows.push(record);
    }
  }

  return { totalRows: matrix.length - 1, validRows, errors, unmappedHeaders };
}
