type Props = {
  temperature?: number | null;
  weatherText: string;
  rain?: number | null;
};

export default function WeatherCard({ temperature, weatherText, rain }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-lg text-slate-500">Wetter · Offenburg</p>
      <div className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
        {temperature != null ? `${Math.round(temperature)} °C` : "--"}
      </div>
      <p className="mt-3 text-lg text-slate-600">{weatherText}</p>
      <p className="mt-4 text-base text-slate-500">
        Regenwahrscheinlichkeit heute: {rain != null ? `${rain}%` : "--"}
      </p>
    </div>
  );
}