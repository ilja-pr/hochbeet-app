import { NextResponse } from "next/server";

export async function GET() {
  const lat = "48.4735";
  const lon = "7.9498";

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=auto` +
    `&forecast_days=1`;

  const res = await fetch(url, {
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Wetter konnte nicht geladen werden." }, { status: 500 });
  }

  const data = await res.json();

  return NextResponse.json({
    location: "Offenburg",
    current: data.current,
    daily: {
      temperature_2m_max: data.daily?.temperature_2m_max?.[0] ?? null,
      temperature_2m_min: data.daily?.temperature_2m_min?.[0] ?? null,
      precipitation_probability_max: data.daily?.precipitation_probability_max?.[0] ?? null,
      weather_code: data.daily?.weather_code?.[0] ?? null,
    },
  });
}