"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail, subscribeToAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToAuth((user) => {
      if (user) {
        router.replace("/settings");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.replace("/settings");
    } catch (error: any) {
      setErrorText("Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Anmelden
          </h1>
          <p className="mt-2 text-slate-500">
            Melde dich an, um Einstellungen zu ändern.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="deine@mail.de"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="••••••••"
                required
              />
            </div>

            {errorText ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Anmeldung läuft ..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}