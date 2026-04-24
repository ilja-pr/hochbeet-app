"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  defaultSettings,
  saveSettings,
  subscribeToSettings,
  type PlantSettings,
} from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlantSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    return subscribeToSettings((nextSettings) => {
      setSettings(nextSettings);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved("");

    try {
      await saveSettings(settings);
      setSaved("Einstellungen gespeichert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <ProtectedRoute>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                ← Zurück zum Dashboard
              </Link>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Einstellungen
            </h1>
            <p className="mt-2 text-slate-500">
              Lege Grenzwert, Messintervall und Benachrichtigungen fest.
            </p>

            <form onSubmit={handleSave} className="mt-8 space-y-8">
              <section className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900">Allgemein</h2>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Grenzwert Bodenfeuchte (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.threshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        threshold: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Messintervall (Minuten)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={settings.measurementIntervalMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        measurementIntervalMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  />
                </div>
              </section>

              <section className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900">Benachrichtigungen</h2>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailEnabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="text-slate-700">E-Mail-Benachrichtigung aktivieren</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={settings.notifications.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    placeholder="deine@mail.de"
                  />
                </div>
              </section>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Speichert ..." : "Speichern"}
                </button>

                {saved ? <span className="text-sm text-emerald-700">{saved}</span> : null}
              </div>
            </form>
          </div>
        </ProtectedRoute>
      </div>
    </main>
  );
}