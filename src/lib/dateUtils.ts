
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toLocalIsoDate(new Date());
}

export function dayOfWeekFromIso(iso: string): number | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? '—';
}

export function nextDateForDayOfWeek(dayOfWeek: number, from: Date = new Date()): string {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const currentDow = base.getDay() === 0 ? 7 : base.getDay();
  const delta = (dayOfWeek - currentDow + 7) % 7;
  base.setDate(base.getDate() + delta);
  return toLocalIsoDate(base);
}

export function formatDayAndDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
