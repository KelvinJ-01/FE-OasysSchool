import { describe, it, expect } from 'vitest';
import { toTitleCase, toUpperCaseClean, toSentenceCase } from './format';

describe('toTitleCase', () => {
  it('mengapitalkan tiap kata', () => {
    expect(toTitleCase('budi santoso')).toBe('Budi Santoso');
  });

  it('membiarkan kata sambung tetap kecil di tengah', () => {
    expect(toTitleCase('ilmu pengetahuan alam dan sosial')).toBe('Ilmu Pengetahuan Alam dan Sosial');
  });

  it('mengapitalkan kata sambung bila berada di awal', () => {
    expect(toTitleCase('dari sabang sampai merauke')).toBe('Dari Sabang Sampai Merauke');
  });

  it('mempertahankan gelar bertitik', () => {
    expect(toTitleCase('budi santoso, s.pd.')).toBe('Budi Santoso, S.Pd.');
    expect(toTitleCase('dewi kartika, m.pd')).toBe('Dewi Kartika, M.Pd');
  });

  it('merapikan spasi berlebih', () => {
    expect(toTitleCase('  budi    santoso  ')).toBe('Budi Santoso');
  });

  it('menurunkan huruf kapital yang berlebihan', () => {
    expect(toTitleCase('BUDI SANTOSO')).toBe('Budi Santoso');
  });

  it('aman untuk masukan kosong', () => {
    expect(toTitleCase('')).toBe('');
    expect(toTitleCase('   ')).toBe('');
  });
});

describe('toUpperCaseClean', () => {
  it('mengapitalkan seluruh huruf (nama kelas)', () => {
    expect(toUpperCaseClean('x ipa 1')).toBe('X IPA 1');
  });

  it('merapikan spasi', () => {
    expect(toUpperCaseClean('  xii   ipa  1 ')).toBe('XII IPA 1');
  });

  it('aman untuk masukan kosong', () => {
    expect(toUpperCaseClean('   ')).toBe('');
  });
});

describe('toSentenceCase', () => {
  it('mengapitalkan huruf pertama saja', () => {
    expect(toSentenceCase('jl. merdeka no. 12')).toBe('Jl. merdeka no. 12');
  });

  it('merapikan spasi berlebih', () => {
    expect(toSentenceCase('  jl.  merdeka ')).toBe('Jl.  merdeka'.replace(/\s+/g, ' '));
  });

  it('aman untuk masukan kosong', () => {
    expect(toSentenceCase('')).toBe('');
    expect(toSentenceCase('   ')).toBe('');
  });
});
