import AuthButton from "@/components/AuthButton";

const ELEARNING_URL = "https://giessmelder-elearning.vercel.app/anleitung";

export default function DashboardHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
          G
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Gießmelder
          </h1>
          <p className="text-sm text-slate-500">
            Bodenfeuchte, Wetter und Verlauf
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={ELEARNING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 sm:inline-block"
        >
          Anleitung ↗
        </a>
        <AuthButton />
      </div>
    </header>
  );
}
