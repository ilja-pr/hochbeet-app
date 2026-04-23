"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Item = {
  time: string;
  moisture: number;
};

export default function MoistureChart({ data }: { data: Item[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">
        Verlauf der Bodenfeuchte
      </h2>
      <p className="mt-2 text-lg text-slate-500">Die letzten Messwerte vom Sensor.</p>

      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="moisture"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}