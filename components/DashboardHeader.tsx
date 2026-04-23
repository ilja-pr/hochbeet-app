export default function DashboardHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Hochbeet Monitor
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Bodenfeuchte, Wetter und Verlauf
        </p>
      </div>
    </header>
  );
}