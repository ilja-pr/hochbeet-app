"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export default function Home() {
  const [moisture, setMoisture] = useState<number | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    // Abfrage: Gehe in "messungen", sortiere nach "zeitpunkt" absteigend, nimm die letzten 10
    const q = query(
      collection(db, "messungen"),
      orderBy("zeitpunkt", "desc"),
      limit(10)
    );

    // Live-Listener für Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      if (docs.length > 0) {
        // Der neueste Wert (Index 0 wegen desc Sortierung)
        const newest = docs[0];
        setMoisture(newest.feuchtigkeit);
        setBattery(newest.akku);
        
        if (newest.zeitpunkt) {
          const d = newest.zeitpunkt.toDate(); // Firestore Timestamps müssen konvertiert werden
          setLastUpdate(d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
        }

        // Verlauf für das Diagramm (wieder umdrehen für zeitliche Reihenfolge)
        setHistory([...docs].reverse());
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#2e7d32' }}>🌱 Hochbeet Monitor (Firestore)</h1>
        <p>Präzise Überwachung & Statistik</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Kachel Feuchtigkeit */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>Bodenfeuchtigkeit</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1976d2', margin: '15px 0' }}>
            {moisture !== null ? `${moisture}%` : '--'}
          </div>
          <p style={{ fontSize: '12px', color: '#666' }}>Zuletzt: {lastUpdate}</p>
        </div>

        {/* Kachel Akku */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>System-Status</h3>
          <div style={{ fontSize: '24px', margin: '15px 0' }}>
            🔋 Akku: <strong>{battery !== null ? `${battery}V` : '--'}</strong>
          </div>
          <span style={{ color: (moisture || 0) < 30 ? '#d32f2f' : '#388e3c', fontWeight: 'bold' }}>
            {(moisture || 0) < 30 ? '⚠️ Durstig' : '✅ Versorgt'}
          </span>
        </div>

        {/* Statistik-Balken */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', gridColumn: '1 / -1' }}>
          <h3>Feuchtigkeitsverlauf (Letzte Messungen)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', marginTop: '20px', borderBottom: '1px solid #ddd' }}>
            {history.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#4caf50', 
                  height: `${h.feuchtigkeit}%`, 
                  minHeight: '2px',
                  borderRadius: '3px 3px 0 0' 
                }}></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}