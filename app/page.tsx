"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/firebase";

type CurrentData = {
  raw?: number;
  moisture?: number;
  updatedAt?: number;
};

type HistoryItem = {
  raw: number;
  moisture: number;
  ts: number;
};

export default function Home() {
  const [current, setCurrent] = useState<CurrentData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const plantRef = ref(db, "plants/plant1");

    const unsubscribe = onValue(plantRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setCurrent(null);
        setHistory([]);
        setLoading(false);
        return;
      }

      setCurrent(data.current ?? null);

      const historyObj = data.history ?? {};
      const historyArray: HistoryItem[] = Object.values(historyObj);
      historyArray.sort((a, b) => b.ts - a.ts);
      setHistory(historyArray.slice(0, 20));

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const statusText = useMemo(() => {
    const m = current?.moisture ?? 0;
    if (m < 15) return "Durstig";
    if (m <= 60) return "Optimal";
    if (m <= 85) return "Sehr feucht";
    return "Sehr nass";
  }, [current]);

  async function handleWaterNow() {
    await set(ref(db, "plants/plant1/commands/waterNow"), true);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ color: "#2e7d32" }}>🌱 Hochbeet Monitor</h1>
        <p>Realtime Database</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <h3>Bodenfeuchtigkeit</h3>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "#1976d2", margin: "15px 0" }}>
            {loading ? "--" : current?.moisture ?? "--"}%
          </div>
          <p>Rohwert: {current?.raw ?? "--"}</p>
          <p>Status: {statusText}</p>
          <p>
            Zuletzt:{" "}
            {current?.updatedAt
              ? new Date(current.updatedAt).toLocaleString("de-DE")
              : "--"}
          </p>
          <button onClick={handleWaterNow}>Jetzt gießen</button>
        </div>

        <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", gridColumn: "1 / -1" }}>
          <h3>Verlauf</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", marginTop: "20px", borderBottom: "1px solid #ddd" }}>
            {history.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#4caf50",
                    height: `${h.moisture}%`,
                    minHeight: "2px",
                    borderRadius: "3px 3px 0 0",
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: "1px solid #eee" }}>
                {new Date(h.ts).toLocaleString("de-DE")} — {h.moisture}% — Rohwert {h.raw}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}