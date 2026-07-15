import { describe, it, expect } from 'vitest';
import type { AxiosError } from 'axios';
import { getApiErrorCode, getApiErrorMessage, getApiErrorDetails } from './apiClient';
import type { ApiErrorResponse } from '../types/api';

function makeAxiosError(body: ApiErrorResponse): AxiosError<ApiErrorResponse> {
  return { response: { data: body } } as AxiosError<ApiErrorResponse>;
}

describe('helper error API', () => {
  const sample = makeAxiosError({
    error: {
      code: 'NISN_NOT_FOUND',
      message: 'NISN tidak ditemukan.',
      details: [{ field: 'studentNisn', message: 'Tidak valid.' }],
      traceId: '00-abc-def-00',
    },
  });

  it('mengekstrak kode error', () => {
    expect(getApiErrorCode(sample)).toBe('NISN_NOT_FOUND');
  });

  it('mengekstrak pesan error', () => {
    expect(getApiErrorMessage(sample)).toBe('NISN tidak ditemukan.');
  });

  it('memakai fallback saat tidak ada response', () => {
    expect(getApiErrorMessage(new Error('network'), 'Gagal.')).toBe('Gagal.');
  });

  it('mengekstrak detail field', () => {
    const details = getApiErrorDetails(sample);
    expect(details).toHaveLength(1);
    expect(details[0].field).toBe('studentNisn');
  });

  it('mengembalikan array kosong bila tidak ada detail', () => {
    expect(getApiErrorDetails(new Error('x'))).toEqual([]);
  });
});
