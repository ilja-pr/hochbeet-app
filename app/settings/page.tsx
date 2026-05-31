"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { getIdToken } from "@/lib/auth";
import {
  defaultSettings,
  saveSettings,
  subscribeToSettings,
  type PlantSettings,
} from "@/lib/settings";

type NotificationStatus = {
  lastEmailSentAt?: number;
  lastEmailTo?: string;
  lastEmailMoisture?: number;
};

function formatDate(ts?: number) {
  if (!ts) return "noch keine Mail verschickt";
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlantSettings>(defaultSettings);
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testError, setTestError] = useState("");

  useEffect(() => {
    return subscribeToSettings((nextSettings) => {
      setSettings(nextSettings);
    });
  }, []);

  useEffect(() => {
    const r = ref(db, "plants/plant1/notifications");
    return onValue(r, (snapshot) => {
      setNotificationStatus(snapshot.val() ?? {});
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");

    try {
      await saveSettings(settings);
      setSavedMsg("Einstellungen gespeichert.");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (error) {
      console.error(error);
      setSavedMsg("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTesting(true);
    setTestMsg("");
    setTestError("");

    try {
      const token = await getIdToken();
      if (!token) {
        setTestError("Bitte erneut anmelden.");
        return;
      }

      if (!settings.notifications.email || !settings.notifications.email.includes("@")) {
        setTestError("Bitte erst eine gültige E-Mail-Adresse eintragen und speichern.");
        return;
      }

      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: settings.notifications.email }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestMsg(`Test-Mail an ${data.to} verschickt!`);
      } else {
        setTestError(
          `Mail konnte nicht verschickt werden: ${data.error ?? "unbekannt"}`
        );
      }
    } catch (error) {
      console.error(error);
      setTestError("Fehler beim Versand der Test-Mail.");
    } finally {
      setTesting(false);
      setTimeout(() => {
        setTestMsg("");
        setTestError("");
      }, 6000);
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
                  <p className="mt-2 text-sm text-slate-500">
                    Sinkt die Feuchte unter diesen Wert, bekommst du eine Mail.
                  </p>
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
                  <p className="mt-2 text-sm text-slate-500">
                    Hinweis: aktuell ist das Intervall im ESP32-Code fest auf
                    30 Min eingestellt. Diese Einstellung ist Doku-Wert.
                  </p>
                </div>
              </section>

              <section className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Benachrichtigungen
                </h2>

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
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-slate-700">
                    E-Mail-Benachrichtigung aktivieren
                  </span>
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

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">
                    Cooldown: 6 Stunden
                  </p>
                  <p className="mt-1">
                    Es wird höchstens alle 6 Stunden eine Mail verschickt,
                    auch wenn die Erde länger trocken ist.
                  </p>
                  <p className="mt-2">
                    Letzte Mail:{" "}
                    <strong>
                      {formatDate(notificationStatus.lastEmailSentAt)}
                    </strong>
                  </p>
                  {notificationStatus.lastEmailMoisture !== undefined && (
                    <p className="mt-1">
                      damals bei{" "}
                      <strong>
                        {notificationStatus.lastEmailMoisture}%
                      </strong>{" "}
                      Feuchte
                    </p>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testing}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {testing ? "Sende Test-Mail ..." : "Test-Mail verschicken"}
                  </button>
                  {testMsg ? (
                    <span className="ml-3 text-sm text-emerald-700">
                      {testMsg}
                    </span>
                  ) : null}
                  {testError ? (
                    <span className="ml-3 text-sm text-red-700">
                      {testError}
                    </span>
                  ) : null}
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

                {savedMsg ? (
                  <span className="text-sm text-emerald-700">{savedMsg}</span>
                ) : null}
              </div>
            </form>
          </div>
        </ProtectedRoute>
      </div>
    </main>
  );
}