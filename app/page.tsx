"use client";

import { useEffect, useState } from "react";
import { onValue, ref, query, limitToLast, orderByChild } from "firebase/database";
import { db } from "@/lib/firebase";
import { weatherCodeToText } from "@/lib/weather-code";
import { getWateringRecommendation } from "@/lib/watering";

import DashboardHeader from "@/components/DashboardHeader";
import MoistureCard from "@/components/MoistureCard";
import HistoryView from "@/components/HistoryView";
import OverviewCard from "@/components/OverviewCard";
import WeatherCard from "@/components/WeatherCard";
import WateringRecommendationCard from "@/components/WateringRecommendationCard";
import type { HistoryItem } from "@/lib/history";

type CurrentData = {
  raw?: number;
  moisture?: number;
  status?: string;
  updatedAt?: number;
};

type WeatherDaily = {
  weather_code?: number | null;
  temperature_2m_max?: number | null;
  temperature_2m_min?: number | null;
  precipitation_probability_max?: number | null;
  precipitation_sum?: number | null;
  rain_sum?: number | null;
};

type WeatherData = {
  location?: string;
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  today?: WeatherDaily;
  tomorrow?: WeatherDaily;
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

function formatRain(prob?: number | null, amount?: number | null) {
  if (prob == null) return "--";
  return `${prob}% · ${amount ?? 0} mm`;
}

export default function HomePage() {
  const [current, setCurrent] = useState<CurrentData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    // Aktueller Wert
    const currentRef = ref(db, "plants/plant1/current");
    const unsubCurrent = onValue(currentRef, (snapshot) => {
      setCurrent(snapshot.val() ?? null);
    });

    // History: bis zu 6000 Einträge laden (ca. mehrere Monate à 48/Tag),
    // damit man in der Verlaufsansicht Wochen zurückblättern kann.
    const historyRef = query(
      ref(db, "plants/plant1/history"),
      orderByChild("ts"),
      limitToLast(6000)
    );
    const unsubHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setHistory([]);
        return;
      }
      const arr: HistoryItem[] = Object.values(data);
      arr.sort((a, b) => a.ts - b.ts);
      setHistory(arr);
    });

    return () => {
      unsubCurrent();
      unsubHistory();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadWeather() {
      try {
        const res = await fetch("/api/weather", { cache: "no-store" });
        const json = await res.json();
        if (mounted) {
          setWeather(json);
        }
      } catch (error) {
        console.error("Wetter konnte nicht geladen werden:", error);
      } finally {
        if (mounted) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();
    const interval = setInterval(loadWeather, 15 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const weatherText = weatherCodeToText(
    weather?.current?.weather_code ?? weather?.today?.weather_code
  );

  const recommendation = getWateringRecommendation({
    moisture: current?.moisture ?? 0,
    rainProbabilityToday: weather?.today?.precipitation_probability_max ?? 0,
    rainProbabilityTomorrow: weather?.tomorrow?.precipitation_probability_max ?? 0,
    precipitationToday: weather?.today?.precipitation_sum ?? 0,
    precipitationTomorrow: weather?.tomorrow?.precipitation_sum ?? 0,
  });

  const overviewRows = [
    { label: "Bodenstatus", value: current?.status ?? "--" },
    { label: "Letzte Messung", value: formatDate(current?.updatedAt) },
    { label: "Empfehlung", value: recommendation.title },
    { label: "Wetterlage", value: weatherLoading ? "Lädt..." : weatherText },
    {
      label: "Außentemperatur",
      value:
        weather?.current?.temperature_2m != null
          ? `${Math.round(weather.current.temperature_2m)} °C`
          : "--",
    },
    {
      label: "Regen heute",
      value: formatRain(
        weather?.today?.precipitation_probability_max,
        weather?.today?.precipitation_sum
      ),
    },
    {
      label: "Regen morgen",
      value: formatRain(
        weather?.tomorrow?.precipitation_probability_max,
        weather?.tomorrow?.precipitation_sum
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <DashboardHeader />

        <div className="mb-5">
          <WateringRecommendationCard
            title={recommendation.title}
            message={recommendation.message}
            badge={recommendation.badge}
            level={recommendation.level}
          />
        </div>

        <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <MoistureCard
            moisture={current?.moisture}
            raw={current?.raw}
            status={current?.status}
            updatedAt={current?.updatedAt}
          />

          <WeatherCard
            temperature={weather?.current?.temperature_2m}
            weatherText={weatherLoading ? "Wetter wird geladen..." : weatherText}
            rain={weather?.today?.precipitation_probability_max}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
          <HistoryView history={history} />
          <OverviewCard rows={overviewRows} />
        </section>
      </div>
    </main>
  );
}