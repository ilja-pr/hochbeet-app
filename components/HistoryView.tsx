"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  buildWeek,
  startOfWeek,
  addDays,
  weekRangeLabel,
  type HistoryItem,
  type DayBucket,
} from "@/lib/history";

type Props = {
  history: HistoryItem[];
};

function moistureColor(v: number | null): string {
  if (v == null) return "#e2e8f0";
  if (v < 20) return "#dc2626"; // trocken
  if (v < 40) return "#f59e0b"; // eher trocken
  if (v < 70) return "#16a34a"; // gut
  return "#0ea5e9"; // sehr nass
}

type ChartRow = {
  weekday: string;
  date: string;
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
  hasData: boolean;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  if (!row.hasData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold text-slate-700">
          {row.weekday} {row.date}
        </p>
        <p className="text-slate-400">Keine Messung</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">
        {row.weekday} {row.date}
      </p>
      <p className="text-slate-600">
        Durchschnitt: <strong>{row.avg}%</strong>
      </p>
      <p className="text-slate-500">
        Tagesspanne: {row.min}% – {row.max}%
      </p>
      <p className="mt-1 text-xs text-slate-400">{row.count} Messungen</p>
    </div>
  );
}

export default function HistoryView({ history }: Props) {
  // 0 = aktuelle Woche, -1 = letzte Woche, ...
  const [weekOffset, setWeekOffset] = useState(0);

  const thisWeekStart = useMemo(() => startOfWeek(Date.now()), []);
  const weekStart = addDays(thisWeekStart, weekOffset * 7);

  const buckets = useMemo<DayBucket[]>(
    () => buildWeek(history, weekStart),
    [history, weekStart]
  );

  const rows = useMemo<ChartRow[]>(
    () =>
      buckets.map((b) => ({
        weekday: b.weekdayShort,
        date: b.dateShort,
        avg: b.avg,
        min: b.min,
        max: b.max,
        count: b.count,
        hasData: b.hasData,
      })),
    [buckets]
  );

  // Wochen-Kennzahlen
  const stats = useMemo(() => {
    const withData = buckets.filter((b) => b.hasData);
    if (withData.length === 0) {
      return { avg: null, min: null, max: null, days: 0 };
    }
    const avgs = withData.map((b) => b.avg ?? 0);
    return {
      avg: Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length),
      min: Math.min(...withData.map((b) => b.min ?? 0)),
      max: Math.max(...withData.map((b) => b.max ?? 0)),
      days: withData.length,
    };
  }, [buckets]);

  const isCurrentWeek = weekOffset === 0;
  const earliestTs = history.length ? history[0].ts : Date.now();
  const canGoBack = weekStart > startOfWeek(earliestTs);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
      {/* Kopf mit Navigation */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Verlauf der Bodenfeuchte
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isCurrentWeek
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isCurrentWeek ? "Aktuelle Woche" : "Vergangene Woche"}
            </span>
            <span className="text-sm text-slate-500">
              {weekRangeLabel(weekStart)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            disabled={!canGoBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Woche zurück"
          >
            ‹
          </button>
          <button
            onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
            disabled={isCurrentWeek}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Woche vor"
          >
            ›
          </button>
        </div>
      </div>

      {/* Wochen-Kennzahlen */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Ø Woche
          </p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">
            {stats.avg != null ? `${stats.avg}%` : "–"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Trockenster
          </p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">
            {stats.min != null ? `${stats.min}%` : "–"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Feuchtester
          </p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">
            {stats.max != null ? `${stats.max}%` : "–"}
          </p>
        </div>
      </div>

      {/* Diagramm */}
      <div className="mt-6 h-72 w-full">
        {stats.days === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-slate-50/60 text-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Keine Messungen in dieser Woche
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Wähle eine andere Woche oder warte auf neue Daten.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer>
            <ComposedChart
              data={rows}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="weekday"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "#64748b" }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                width={44}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
              />
              {/* Balken = Tagesdurchschnitt, vom Boden hoch, eingefärbt nach Bereich */}
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={46}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={moistureColor(r.avg)} fillOpacity={0.9} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legende */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
          unter 20% trocken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          20–40% eher trocken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
          40–70% gut
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" />
          über 70% sehr nass
        </span>
      </div>
    </div>
  );
}
