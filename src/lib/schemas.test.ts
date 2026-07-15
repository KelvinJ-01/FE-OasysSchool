import { describe, it, expect } from 'vitest';
import {
  personNameSchema,
  teacherSchema,
  academicTermSchema,
  scheduleSchema,
  changePasswordSchema,
  parentSchema,
  nisnSchema,
} from './schemas';
import { parseFormData, firstError } from './validateForm';

describe('personNameSchema', () => {
  it('menolak nama yang diawali tanda baca (regresi "..Sri Wahyuni")', () => {
    expect(personNameSchema.safeParse('..Sri Wahyuni').success).toBe(false);
    expect(personNameSchema.safeParse('.. Agus').success).toBe(false);
  });

  it('menolak tanda baca berurutan (regresi "Sri Wahyuni ..")', () => {
    expect(personNameSchema.safeParse('Sri Wahyuni ..').success).toBe(false);
  });

  it('menolak angka dan nama yang terlalu pendek', () => {
    expect(personNameSchema.safeParse('Sri123').success).toBe(false);
    expect(personNameSchema.safeParse('A B').success).toBe(false);
    expect(personNameSchema.safeParse('   ').success).toBe(false);
  });

  it('menerima nama bergelar dan nama bertanda hubung', () => {
    expect(personNameSchema.safeParse('Budi Santoso, S.Pd.').success).toBe(true);
    expect(personNameSchema.safeParse('Anna-Maria').success).toBe(true);
    expect(personNameSchema.safeParse("O'Brien").success).toBe(true);
  });

  it('merapikan spasi berlebih', () => {
    const r = personNameSchema.safeParse('  budi   santoso  ');
    expect(r.success && r.data).toBe('budi santoso');
  });
});

describe('teacherSchema — ketentuan kepegawaian', () => {
  const base = { fullName: 'Budi Santoso', email: 'budi@oasys.sch.id' };

  it('menolak NIP bila status kepegawaian bukan PNS/PPPK', () => {
    const r = parseFormData(teacherSchema, { ...base, nip: '198503152010011012', employmentStatus: 'gty' });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstError(r.errors)).toContain('PNS atau PPPK');
  });

  it('menerima NIP 18 digit untuk PNS', () => {
    expect(parseFormData(teacherSchema, { ...base, nip: '198503152010011012', employmentStatus: 'pns' }).success).toBe(true);
  });

  it('menolak NIP yang bukan 18 digit', () => {
    expect(parseFormData(teacherSchema, { ...base, nip: '123', employmentStatus: 'pns' }).success).toBe(false);
  });

  it('menolak NUPTK yang bukan 16 digit', () => {
    expect(parseFormData(teacherSchema, { ...base, nuptk: '123' }).success).toBe(false);
  });
});

describe('academicTermSchema', () => {
  const base = { yearLabel: '2025/2026', semester: 'ganjil' as const };

  it('menolak tanggal selesai sebelum tanggal mulai', () => {
    expect(parseFormData(academicTermSchema, { ...base, startDate: '2026-01-01', endDate: '2025-01-01' }).success).toBe(false);
  });

  it('menolak format tahun ajaran yang salah', () => {
    expect(parseFormData(academicTermSchema, { ...base, yearLabel: '2025', startDate: '2025-07-01', endDate: '2025-12-31' }).success).toBe(false);
  });

  it('menerima data yang benar', () => {
    expect(parseFormData(academicTermSchema, { ...base, startDate: '2025-07-01', endDate: '2025-12-31' }).success).toBe(true);
  });
});

describe('scheduleSchema', () => {
  const base = {
    classId: 'c1', subjectId: 's1', teacherId: 't1', academicTermId: 'a1',
    sessionDate: '2026-07-15',
  };

  it('menolak jam selesai sebelum jam mulai', () => {
    expect(parseFormData(scheduleSchema, { ...base, startTime: '10:00', endTime: '09:00' }).success).toBe(false);
  });

  it('menolak field wajib yang kosong', () => {
    expect(parseFormData(scheduleSchema, { ...base, classId: '', startTime: '08:00', endTime: '09:00' }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('menolak kata sandi baru yang sama dengan yang lama', () => {
    const r = parseFormData(changePasswordSchema, {
      currentPassword: 'samaSekali123', newPassword: 'samaSekali123', confirmNewPassword: 'samaSekali123',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstError(r.errors)).toContain('berbeda');
  });

  it('menolak konfirmasi yang tidak cocok', () => {
    expect(parseFormData(changePasswordSchema, {
      currentPassword: 'lama12345', newPassword: 'baru12345', confirmNewPassword: 'salah999',
    }).success).toBe(false);
  });
});

describe('nisnSchema & parentSchema', () => {
  it('mensyaratkan NISN 10 digit', () => {
    expect(nisnSchema.safeParse('1000000137').success).toBe(true);
    expect(nisnSchema.safeParse('123').success).toBe(false);
  });

  it('menolak daftar NISN anak yang mengandung nilai tidak sah', () => {
    expect(parseFormData(parentSchema, {
      fullName: 'Rina Melati', email: 'rina@mail.com', studentNisns: '1000000137, 999',
    }).success).toBe(false);
  });

  it('menormalkan email menjadi huruf kecil', () => {
    const r = parseFormData(parentSchema, { fullName: 'Rina Melati', email: 'RINA@MAIL.COM' });
    expect(r.success && r.data.email).toBe('rina@mail.com');
  });
});
