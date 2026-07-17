import { describe, it, expect } from 'vitest';
import {
  toLocalIsoDate,
  dayOfWeekFromIso,
  dayName,
  formatDayAndDate,
  nextDateForDayOfWeek,
} from './dateUtils';

describe('dateUtils', () => {
  describe('toLocalIsoDate', () => {
    it('memakai komponen tanggal LOKAL, bukan UTC (regresi bug 14 vs 15 Juli)', () => {
      const lokal = new Date(2026, 6, 15, 6, 51);
      expect(toLocalIsoDate(lokal)).toBe('2026-07-15');
      expect(toLocalIsoDate(lokal)).toBe(
        `${lokal.getFullYear()}-${String(lokal.getMonth() + 1).padStart(2, '0')}-${String(lokal.getDate()).padStart(2, '0')}`,
      );
    });

    it('memberi padding nol pada bulan & tanggal satu digit', () => {
      expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('dayOfWeekFromIso', () => {
    it('memetakan Senin=1 sampai Minggu=7', () => {
      expect(dayOfWeekFromIso('2026-07-13')).toBe(1);
      expect(dayOfWeekFromIso('2026-07-15')).toBe(3);
      expect(dayOfWeekFromIso('2026-07-19')).toBe(7);
    });

    it('mengembalikan undefined untuk masukan kosong atau tidak sah', () => {
      expect(dayOfWeekFromIso('')).toBeUndefined();
      expect(dayOfWeekFromIso('bukan-tanggal')).toBeUndefined();
    });
  });

  describe('dayName', () => {
    it('mengembalikan nama hari Indonesia', () => {
      expect(dayName(1)).toBe('Senin');
      expect(dayName(7)).toBe('Minggu');
    });

    it('mengembalikan em dash untuk nomor hari di luar rentang', () => {
      expect(dayName(0)).toBe('—');
      expect(dayName(99)).toBe('—');
    });
  });

  describe('formatDayAndDate', () => {
    it('memformat sebagai "Rabu, 15 Juli 2026"', () => {
      expect(formatDayAndDate('2026-07-15')).toBe('Rabu, 15 Juli 2026');
    });

    it('aman terhadap masukan kosong atau tidak sah', () => {
      expect(formatDayAndDate('')).toBe('—');
      expect(formatDayAndDate('bukan-tanggal')).toBe('—');
    });
  });

  describe('nextDateForDayOfWeek', () => {
    const rabu15Juli = new Date(2026, 6, 15);

    it('mengembalikan tanggal itu sendiri bila harinya sudah cocok', () => {
      expect(nextDateForDayOfWeek(3, rabu15Juli)).toBe('2026-07-15');
    });

    it('mengembalikan kemunculan berikutnya untuk hari lain', () => {
      expect(nextDateForDayOfWeek(4, rabu15Juli)).toBe('2026-07-16');
      expect(nextDateForDayOfWeek(1, rabu15Juli)).toBe('2026-07-20');
    });

    it('hasilnya selalu jatuh pada hari yang diminta', () => {
      for (let dow = 1; dow <= 7; dow++) {
        expect(dayOfWeekFromIso(nextDateForDayOfWeek(dow, rabu15Juli))).toBe(dow);
      }
    });
  });
});
