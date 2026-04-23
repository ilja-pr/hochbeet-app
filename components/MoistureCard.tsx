type Props = {
  moisture?: number;
  raw?: number;
  status?: string;
  updatedAt?: number;
};

function formatDate(ts?: number) {
  if (!ts) return "--";
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeClass(status?: string) {
  if (status === "Trocken") return "bg-red-500 text-white";
  if (status === "Eher trocken") return "bg-amber-400 text-slate-900";
  if (status === "Gut") return "bg-emerald-500 text-white";
  if (status === "Sehr nass") return "bg-sky-500 text-white";
  return "bg-slate-200 text-slate-700";
}

export default function MoistureCard({ moisture, raw, status, updatedAt }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg text-slate-500">Bodenfeuchte</p>
          <div className="mt-3 text-6xl font-extrabold tracking-tight text-slate-900">
            {moisture ?? "--"}%
          </div>
          <p className="mt-4 text-base text-slate-500">
            Raw: {raw ?? "--"} · Aktualisiert: {formatDate(updatedAt)}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${badgeClass(status)}`}>
          {status ?? "—"}
        </span>
      </div>
    </div>
  );
}