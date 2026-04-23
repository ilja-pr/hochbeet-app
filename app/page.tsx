"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { weatherCodeToText } from "@/lib/weather-code";
import DashboardHeader from "@/components/DashboardHeader";
import MoistureCard from "@/components/MoistureCard";
import WeatherCard from "@/components/WeatherCard";
import OverviewCard from "@/components/OverviewCard";
import MoistureChart from "@/components/MoistureChart";

type CurrentData = {
  raw?: number;
  moisture?: number;
  status?: string;
  updatedAt?: number;
};

type HistoryItem = {
  raw: number;
  moisture: number;
  status?: string;
  ts: number;
};

type WeatherData = {
  location?: string;
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    temperature_2m_max?: number;
    temperature_2m_min?: number;
    precipitation_probability_max?: number;
    weather_code?: number;
  };
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

function formatTime(ts?: number) {
  if (!ts) return "--";
  return new Date(ts).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [current, setCurrent] = useState<CurrentData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const plantRef = ref(db, "plants/plant1");

    const unsubscribe = onValue(plantRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setCurrent(data.current ?? null);

      const historyObj = data.history ?? {};
      const historyArray: HistoryItem[] = Object.values(historyObj);
      historyArray.sort((a, b) => a.ts - b.ts);
      setHistory(historyArray.slice(-12));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadWeather() {
      const res = await fetch("/api/weather");
      const json = await res.json();
      setWeather(json);
    }

    loadWeather();
  }, []);

  const chartData = useMemo(() => {
    return history.map((item) => ({
      time: formatTime(item.ts),
      moisture: item.moisture,
    }));
  }, [history]);

  const weatherText = weatherCodeToText(
    weather?.current?.weather_code ?? weather?.daily?.weather_code
  );

  const overviewRows = [
    { label: "Bodenstatus", value: current?.status ?? "--" },
    { label: "Letzte Messung", value: formatDate(current?.updatedAt) },
    { label: "Wetterlage", value: weatherText },
    {
      label: "Außentemperatur",
      value:
        weather?.current?.temperature_2m != null
          ? `${Math.round(weather.current.temperature_2m)} °C`
          : "--",
    },
    {
      label: "Regenwahrscheinlichkeit",
      value:
        weather?.daily?.precipitation_probability_max != null
          ? `${weather.daily.precipitation_probability_max}%`
          : "--",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <DashboardHeader />

        <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <MoistureCard
            moisture={current?.moisture}
            raw={current?.raw}
            status={current?.status}
            updatedAt={current?.updatedAt}
          />

          <WeatherCard
            temperature={weather?.current?.temperature_2m}
            weatherText={weatherText}
            rain={weather?.daily?.precipitation_probability_max}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
          <MoistureChart data={chartData} />
          <OverviewCard rows={overviewRows} />
        </section>
      </div>
    </main>
  );
}