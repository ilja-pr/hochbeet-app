type Row = {
  label: string;
  value: string;
};

export default function OverviewCard({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Übersicht</h2>
      <p className="mt-2 text-lg text-slate-500">Die wichtigsten Werte auf einen Blick.</p>

      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
          >
            <span className="text-slate-500">{row.label}</span>
            <strong className="text-slate-900">{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}