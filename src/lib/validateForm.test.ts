import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseFormData, firstError } from './validateForm';

const schema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter.'),
  umur: z.number().min(0, 'Umur tidak boleh negatif.'),
});

describe('parseFormData', () => {
  it('mengembalikan data terparse saat sah', () => {
    const r = parseFormData(schema, { nama: 'Budi', umur: 30 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ nama: 'Budi', umur: 30 });
  });

  it('memetakan galat ke nama field', () => {
    const r = parseFormData(schema, { nama: 'ab', umur: -1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors.nama).toBe('Nama minimal 3 karakter.');
      expect(r.errors.umur).toBe('Umur tidak boleh negatif.');
    }
  });

  it('mempertahankan galat PERTAMA per field', () => {
    const strict = z.object({
      kode: z.string().min(5, 'Terlalu pendek.').regex(/^\d+$/, 'Harus angka.'),
    });
    const r = parseFormData(strict, { kode: 'ab' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.kode).toBe('Terlalu pendek.');
  });

  it('memakai kunci _form untuk galat tingkat objek', () => {
    const refined = z
      .object({ a: z.string(), b: z.string() })
      .refine((d) => d.a === d.b, { message: 'A dan B harus sama.' });
    const r = parseFormData(refined, { a: 'x', b: 'y' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors._form).toBe('A dan B harus sama.');
  });

  it('memetakan galat bersarang memakai notasi titik', () => {
    const nested = z.object({ wali: z.object({ nama: z.string().min(3, 'Nama wali terlalu pendek.') }) });
    const r = parseFormData(nested, { wali: { nama: 'a' } });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors['wali.nama']).toBe('Nama wali terlalu pendek.');
  });

  it('melaporkan field yang hilang', () => {
    const r = parseFormData(schema, {});
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.errors)).toContain('nama');
  });
});

describe('firstError', () => {
  it('mengembalikan galat pertama', () => {
    expect(firstError({ a: 'galat A', b: 'galat B' })).toBe('galat A');
  });

  it('mengembalikan null bila tidak ada galat', () => {
    expect(firstError({})).toBeNull();
  });
});
