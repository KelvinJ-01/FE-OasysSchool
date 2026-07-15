import { z } from 'zod';

const NAME_ALLOWED = /^[A-Za-zÀ-ÿ' .,-]+$/;
const NAME_NO_DOUBLE_PUNCT = /[.,'-]{2,}/;
const NAME_NO_TRAILING_PUNCT = /[,'-]$/;

export const personNameSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ' '))
  .refine((v) => v.length > 0, 'Nama wajib diisi.')
  .refine((v) => (v.match(/[A-Za-zÀ-ÿ]/g) ?? []).length >= 3, 'Nama lengkap minimal 3 huruf.')
  .refine((v) => /^[A-Za-zÀ-ÿ]/.test(v), 'Nama harus diawali huruf, bukan tanda baca atau angka.')
  .refine((v) => NAME_ALLOWED.test(v), 'Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, dan tanda hubung.')
  .refine((v) => !NAME_NO_DOUBLE_PUNCT.test(v.replace(/\s/g, '')), 'Tanda baca pada nama tidak boleh berurutan.')
  .refine((v) => !NAME_NO_TRAILING_PUNCT.test(v), 'Nama tidak boleh diakhiri tanda baca menggantung.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email wajib diisi.')
  .regex(/^\S+@\S+\.\S+$/, 'Format email tidak valid.');

export const nisnSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'NISN harus terdiri dari 10 digit angka.');

export const passwordSchema = z.string().min(8, 'Kata sandi minimal 8 karakter.');

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

export const parentSignUpSchema = z.object({
  fullName: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: passwordSchema,
  studentNisn: nisnSchema,
  consent: z.literal(true, { message: 'Persetujuan wajib dicentang untuk melanjutkan.' }),
});

export const teacherSignUpSchema = z
  .object({
    fullName: personNameSchema,
    phone: optionalPhoneSchema,
    nuptk: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{16}$/.test(v), 'NUPTK harus 16 digit angka, atau kosongkan bila belum punya.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama.',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
    path: ['newPassword'],
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Konfirmasi kata sandi tidak sama.',
    path: ['confirmNewPassword'],
  });

export const studentSchema = z.object({
  fullName: personNameSchema,
  nisn: nisnSchema,
  classId: z.string().optional(),
  gender: z.enum(['laki_laki', 'perempuan']).optional(),
  religion: z.enum(['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu']).optional(),
  email: z.union([emailSchema, z.literal('')]).optional(),
  phone: optionalPhoneSchema,
  address: z.string().trim().optional(),
  fatherName: z.union([personNameSchema, z.literal('')]).optional(),
  motherName: z.union([personNameSchema, z.literal('')]).optional(),
  guardian1Name: z.union([personNameSchema, z.literal('')]).optional(),
  guardian2Name: z.union([personNameSchema, z.literal('')]).optional(),
});

export const classSchema = z.object({
  name: z.string().trim().min(1, 'Nama kelas wajib diisi.'),
  educationLevel: z.enum(['sd', 'smp', 'sma', 'smk'], { message: 'Jenjang wajib dipilih.' }),
  gradeLevel: z.string().trim().optional(),
  homeroomTeacherId: z.string().optional(),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Nama mata pelajaran wajib diisi.'),
  code: z.string().trim().optional(),
  teacherIds: z.array(z.string()).optional(),
});

export const academicTermSchema = z
  .object({
    yearLabel: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Tahun ajaran wajib berformat 2025/2026.'),
    semester: z.enum(['ganjil', 'genap']),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi.'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi.'),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'Tanggal selesai harus setelah tanggal mulai.',
    path: ['endDate'],
  });

export const scheduleSchema = z
  .object({
    classId: z.string().min(1, 'Kelas wajib dipilih.'),
    subjectId: z.string().min(1, 'Mata pelajaran wajib dipilih.'),
    teacherId: z.string().min(1, 'Guru wajib dipilih.'),
    academicTermId: z.string().min(1, 'Tahun ajaran wajib dipilih.'),
    sessionDate: z.string().min(1, 'Tanggal wajib dipilih.'),
    startTime: z.string().min(1, 'Jam mulai wajib diisi.'),
    endTime: z.string().min(1, 'Jam selesai wajib diisi.'),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'Jam selesai harus setelah jam mulai.',
    path: ['endTime'],
  });

export const teacherSchema = z
  .object({
    fullName: personNameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    nip: z.string().trim().optional(),
    nuptk: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{16}$/.test(v), 'NUPTK harus terdiri dari 16 digit angka.'),
    employmentStatus: z.enum(['pns', 'pppk', 'gty', 'gtt', 'honorer']).optional(),
    expertiseField: z.string().trim().optional(),
    expertiseType: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .refine((d) => !d.nip || /^\d{18}$/.test(d.nip), {
    message: 'NIP harus terdiri dari 18 digit angka.',
    path: ['nip'],
  })
  .refine((d) => !d.nip || d.employmentStatus === 'pns' || d.employmentStatus === 'pppk', {
    message: 'NIP hanya berlaku untuk status kepegawaian PNS atau PPPK.',
    path: ['nip'],
  });

export const parentSchema = z.object({
  fullName: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  address: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  studentNisns: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || v.split(',').every((n) => /^\d{10}$/.test(n.trim())),
      'Setiap NISN anak harus 10 digit angka. Pisahkan dengan koma bila lebih dari satu.',
    ),
});

export const inviteTeacherSchema = z.object({
  email: emailSchema,
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka.'),
});
