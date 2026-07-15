import { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, CircleCheck, TriangleAlert } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Spinner } from './Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { parseImportFile, type ParsedImport } from '../../lib/importParser';
import type { ImportResult } from '../../types/dataMaster';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string;
  resourceLabel: string;
  onImported: (result: ImportResult) => void;
}

const ACCEPTED = ['.xlsx', '.csv'];

export function ImportModal({ isOpen, onClose, resource, resourceLabel, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevent = (e: DragEvent) => { e.preventDefault(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, [isOpen]);

  function reset() {
    setFile(null);
    setParsed(null);
    setError(null);
    setIsDragOver(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function acceptFile(candidate: File | undefined | null) {
    setError(null);
    setParsed(null);
    if (!candidate) return;
    const ok = ACCEPTED.some((ext) => candidate.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError('Format berkas tidak didukung. Gunakan .xlsx atau .csv.');
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError('Ukuran berkas maksimum 5 MB.');
      return;
    }
    setFile(candidate);
    setIsParsing(true);
    try {
      const result = await parseImportFile(candidate, resource);
      setParsed(result);
      if (result.totalRows === 0) setError('Berkas tidak berisi baris data.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Berkas tidak dapat dibaca. Pastikan formatnya benar.');
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImport() {
    if (!parsed || parsed.validRows.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<ImportResult>(`/${resource}/import`, {
        rows: parsed.validRows,
        skippedInFile: parsed.errors.length,
      });
      reset();
      onImported(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengimpor data. Coba lagi.'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <h3 className="pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Impor Data {resourceLabel}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
          Unggah berkas .xlsx atau .csv dengan judul kolom di baris pertama. Urutan kolom bebas, dan penulisan singkat
          seperti jenis kelamin "L" atau "P" dikenali otomatis.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
            {error}
          </div>
        )}

        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
              void acceptFile(e.dataTransfer?.files?.[0]);
            }}
            className={`mt-5 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-9 transition-colors ${
              isDragOver ? 'border-brand-400 bg-brand-50/50' : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5'
            }`}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <UploadCloud size={22} aria-hidden="true" />
            </span>
            <span className="text-[13.5px] font-medium text-gray-700 dark:text-gray-300">
              Klik untuk pilih berkas, atau tarik ke sini
            </span>
            <span className="text-theme-xs text-gray-400">.xlsx atau .csv, maksimum 5 MB</span>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 dark:border-gray-800">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
              <FileSpreadsheet size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-gray-800 dark:text-white/90">{file.name}</span>
              <span className="block text-theme-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
            </span>
            <button type="button" onClick={reset} aria-label="Hapus berkas terpilih" className="text-gray-400 hover:text-error-600">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {isParsing && (
          <p className="mt-4 flex items-center gap-2 text-theme-sm text-gray-500">
            <Spinner size="sm" /> Membaca dan memeriksa isi berkas…
          </p>
        )}

        {parsed && !isParsing && parsed.totalRows > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-theme-xs font-medium text-secondary-700">
                <CircleCheck size={13} aria-hidden="true" />
                {parsed.validRows.length} baris siap diimpor
              </span>
              {parsed.errors.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-theme-xs font-medium text-warning-700">
                  <TriangleAlert size={13} aria-hidden="true" />
                  {parsed.errors.length} baris bermasalah (dilewati)
                </span>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                {parsed.errors.slice(0, 6).map((e) => (
                  <li key={`${e.row}-${e.message}`} className="text-theme-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Baris {e.row}:</span> {e.message}
                  </li>
                ))}
                {parsed.errors.length > 6 && (
                  <li className="text-theme-xs text-gray-400">…dan {parsed.errors.length - 6} baris lainnya.</li>
                )}
              </ul>
            )}

            {parsed.unmappedHeaders.length > 0 && (
              <p className="text-theme-xs leading-relaxed text-gray-400">
                Kolom yang tidak dikenali dan diabaikan: {parsed.unmappedHeaders.join(', ')}.
              </p>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => { void acceptFile(e.target.files?.[0]); e.target.value = ''; }}
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="h-10 rounded-md px-4 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsed || parsed.validRows.length === 0 || isUploading || isParsing}
            className="flex h-10 items-center gap-2 rounded-md bg-brand-500 px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {isUploading && <Spinner size="sm" />}
            {parsed && parsed.validRows.length > 0 ? `Impor ${parsed.validRows.length} Data` : 'Impor'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
