
export function toTitleCase(value: string): string {
  const minor = new Set(['dan', 'atau', 'di', 'ke', 'dari', 'yang', 'untuk', 'bin', 'binti', 'van', 'der']);
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => {
      if (i > 0 && minor.has(word)) return word;
      if (word.includes('.')) {
        return word.split('.').map((seg) => (seg ? seg[0].toUpperCase() + seg.slice(1) : seg)).join('.');
      }
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function toUpperCaseClean(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

export function toSentenceCase(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

export function validatePersonName(value: string): string | null {
  const name = value.replace(/\s+/g, ' ').trim();
  if (!name) return 'Nama wajib diisi.';
  const letterCount = (name.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (letterCount < 3) return 'Nama lengkap minimal 3 huruf.';
  if (!/^[A-Za-zÀ-ÿ]/.test(name)) return 'Nama harus diawali huruf, bukan tanda baca atau angka.';
  if (!/^[A-Za-zÀ-ÿ' .,-]+$/.test(name)) return 'Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, dan tanda hubung.';
  if (/[.,'-]{2,}/.test(name.replace(/\s/g, ''))) return 'Tanda baca pada nama tidak boleh berurutan.';
  if (/[,'-]$/.test(name)) return 'Nama tidak boleh diakhiri tanda baca menggantung.';
  return null;
}
