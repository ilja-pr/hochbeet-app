// Hilfsfunktionen für die Wochen-Verlaufsansicht.

export type HistoryItem = {
  raw: number;
  moisture: number;
  status?: string;
  ts: number;
};

export type DayBucket = {
  dayStart: number; // Mitternacht (lokale Zeit) als Timestamp
  label: string; // z. B. "Mo 09.06."
  weekdayShort: string; // "Mo"
  dateShort: string; // "09.06."
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  hasData: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Mitternacht (lokale Zeit) eines Timestamps
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Montag 00:00 der Woche, in der ts liegt
export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = So, 1 = Mo, ...
  const diff = day === 0 ? 6 : day - 1; // Tage seit Montag
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function addDays(ts: number, days: number): number {
  return ts + days * DAY_MS;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Baut die 7 Tagesbuckets (Mo–So) für die Woche, die bei weekStart beginnt
export function buildWeek(
  items: HistoryItem[],
  weekStart: number
): DayBucket[] {
  const weekEnd = addDays(weekStart, 7);
  const inWeek = items.filter((it) => it.ts >= weekStart && it.ts < weekEnd);

  const buckets: DayBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = addDays(weekStart, i);
    const dayEnd = addDays(dayStart, 1);
    const dayItems = inWeek.filter(
      (it) => it.ts >= dayStart && it.ts < dayEnd
    );

    const d = new Date(dayStart);
    const weekdayShort = WEEKDAYS[d.getDay()];
    const dateShort = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;

    if (dayItems.length === 0) {
      buckets.push({
        dayStart,
        label: `${weekdayShort} ${dateShort}`,
        weekdayShort,
        dateShort,
        count: 0,
        avg: null,
        min: null,
        max: null,
        hasData: false,
      });
      continue;
    }

    const values = dayItems.map((it) => it.moisture);
    const sum = values.reduce((a, b) => a + b, 0);
    buckets.push({
      dayStart,
      label: `${weekdayShort} ${dateShort}`,
      weekdayShort,
      dateShort,
      count: dayItems.length,
      avg: Math.round(sum / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      hasData: true,
    });
  }

  return buckets;
}

// Lesbarer Bereichstext einer Woche, z. B. "09.06. – 15.06.2026"
export function weekRangeLabel(weekStart: number): string {
  const start = new Date(weekStart);
  const end = new Date(addDays(weekStart, 6));
  const s = `${pad(start.getDate())}.${pad(start.getMonth() + 1)}.`;
  const e = `${pad(end.getDate())}.${pad(end.getMonth() + 1)}.${end.getFullYear()}`;
  return `${s} – ${e}`;
}

export function isSameWeek(a: number, b: number): boolean {
  return startOfWeek(a) === startOfWeek(b);
}
