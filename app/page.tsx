"use client"; // Zwingend erforderlich für useState/useEffect in Next.js

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
// WICHTIG: Achte auf diesen Pfad! Er zeigt auf die firebase.js eine Ebene höher.
import { db } from '@/firebase';

export default function Home() {
  const [moisture, setMoisture] = useState(0);
  const [battery, setBattery] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const [status, setStatus] = useState('Lade...');

  useEffect(() => {
    // Referenz auf unsere Datenbank
    const currentDataRef = ref(db, 'hochbeet_1/aktuell');

    // Live-Listener
    const unsubscribe = onValue(currentDataRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        setMoisture(data.feuchtigkeit);
        setBattery(data.akku);
        
        const date = new Date(data.timestamp);
        const timeString = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        setLastUpdate(`Heute, ${timeString}`);

        // Status-Logik aus deinen Anforderungen
        if (data.feuchtigkeit < 30) {
          setStatus('Trocken');
        } else {
          setStatus('Gut');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-container">
      <header>
        <h1>🌱 Hochbeet Monitor</h1>
        <p>Bodenfeuchte, Wetter und Verlauf</p>
      </header>

      <main className="grid-layout">
        {/* Kachel 1: Bodenfeuchte */}
        <div className="card">
          <div className="card-header">
            <h3>Bodenfeuchte</h3>
            <span className={`badge ${status === 'Trocken' ? 'badge-red' : 'badge-green'}`}>
              {status}
            </span>
          </div>
          <div className="card-value">{moisture}%</div>
          <div className="card-footer">Letztes Update: {lastUpdate}</div>
        </div>

        {/* Kachel 2: Akku */}
        <div className="card">
          <h3>Akku</h3>
          <div className="card-value">{battery} V</div>
          <div className="card-footer">Letztes Update: {lastUpdate}</div>
        </div>

        {/* Kachel 3: Wetter */}
        <div className="card">
          <h3>Wetter</h3>
          <div className="card-value">18 °C</div>
          <div className="card-footer">Leicht bewölkt</div>
        </div>
      </main>
    </div>
  );
}