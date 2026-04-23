type Props = {
  title: string;
  message: string;
  badge: string;
  level: "water_now" | "wait_for_rain" | "watch" | "no_water";
};

function levelClasses(level: Props["level"]) {
  if (level === "water_now") {
    return {
      ring: "border-red-200 bg-red-50",
      badge: "bg-red-500 text-white",
      title: "text-red-700",
    };
  }

  if (level === "wait_for_rain") {
    return {
      ring: "border-amber-200 bg-amber-50",
      badge: "bg-amber-400 text-slate-900",
      title: "text-amber-700",
    };
  }

  if (level === "watch") {
    return {
      ring: "border-orange-200 bg-orange-50",
      badge: "bg-orange-500 text-white",
      title: "text-orange-700",
    };
  }

  return {
    ring: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-500 text-white",
    title: "text-emerald-700",
  };
}

export default function WateringRecommendationCard({
  title,
  message,
  badge,
  level,
}: Props) {
  const styles = levelClasses(level);

  return (
    <section
      className={`rounded-3xl border p-7 shadow-sm ${styles.ring}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-lg text-slate-500">Gießempfehlung</p>
          <h2 className={`mt-3 text-4xl font-extrabold tracking-tight ${styles.title}`}>
            {title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            {message}
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${styles.badge}`}
        >
          {badge}
        </span>
      </div>
    </section>
  );
}