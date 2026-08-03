// One lap around the Imperial Palace is approximately 5 km.
export const KM_PER_LAP = 5;

export function lapsToKm(laps: number): number {
  return laps * KM_PER_LAP;
}

// e.g. formatDistance(2) => "2周 (10km)"
export function formatDistance(laps: number): string {
  return `${laps}周 (${lapsToKm(laps)}km)`;
}

// Returns an array of the last `count` months (including the current one),
// newest first, as { value: "YYYY-MM", label: "YYYY年M月" }.
export function recentMonths(
  count: number,
  now: Date = new Date()
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(year, month - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: `${y}年${m}月`,
    });
  }
  return out;
}

// Parse "YYYY-MM" into an inclusive UTC start / exclusive end range.
export function monthRange(value: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]); // 1-12
  if (month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function currentMonthValue(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
