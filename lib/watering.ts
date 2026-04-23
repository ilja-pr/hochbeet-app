export type WateringDecisionLevel =
  | "water_now"
  | "wait_for_rain"
  | "watch"
  | "no_water";

export type WateringDecision = {
  level: WateringDecisionLevel;
  title: string;
  message: string;
  badge: string;
};

type WateringInput = {
  moisture: number;
  rainProbabilityToday?: number | null;
  rainProbabilityTomorrow?: number | null;
  precipitationToday?: number | null;
  precipitationTomorrow?: number | null;
};

function rainText(prob?: number | null, mm?: number | null, day = "heute") {
  const p = prob ?? 0;
  const m = mm ?? 0;
  return `${day} sind ${p}% Regenwahrscheinlichkeit und etwa ${m} mm Niederschlag zu erwarten.`;
}

export function getWateringRecommendation(
  input: WateringInput
): WateringDecision {
  const moisture = input.moisture ?? 0;
  const rainToday = input.rainProbabilityToday ?? 0;
  const rainTomorrow = input.rainProbabilityTomorrow ?? 0;
  const precipToday = input.precipitationToday ?? 0;
  const precipTomorrow = input.precipitationTomorrow ?? 0;

  const strongRainToday = rainToday >= 70 && precipToday >= 2;
  const strongRainTomorrow = rainTomorrow >= 70 && precipTomorrow >= 2;

  const likelyRainToday = rainToday >= 60 && precipToday >= 1;
  const likelyRainTomorrow = rainTomorrow >= 60 && precipTomorrow >= 1;

  if (moisture <= 20) {
    if (strongRainToday) {
      return {
        level: "wait_for_rain",
        title: "Regen abwarten",
        message: `Die Erde ist trocken, aber ${rainText(
          rainToday,
          precipToday,
          "heute"
        )} Du kannst wahrscheinlich noch warten.`,
        badge: "Warten",
      };
    }

    if (strongRainTomorrow) {
      return {
        level: "watch",
        title: "Heute beobachten",
        message: `Die Erde ist trocken. ${rainText(
          rainTomorrow,
          precipTomorrow,
          "morgen"
        )} Wenn die Pflanze schon schlapp wirkt, lieber heute leicht gießen.`,
        badge: "Beobachten",
      };
    }

    return {
      level: "water_now",
      title: "Jetzt gießen",
      message:
        "Die Erde ist trocken und es ist kein ausreichender Regen zu erwarten.",
      badge: "Gießen",
    };
  }

  if (moisture <= 40) {
    if (strongRainToday || likelyRainToday) {
      return {
        level: "wait_for_rain",
        title: "Noch warten",
        message: `Die Erde ist eher trocken, aber ${rainText(
          rainToday,
          precipToday,
          "heute"
        )} Erst einmal abwarten.`,
        badge: "Warten",
      };
    }

    if (strongRainTomorrow || likelyRainTomorrow) {
      return {
        level: "wait_for_rain",
        title: "Regen wahrscheinlich",
        message: `Die Erde ist eher trocken, aber ${rainText(
          rainTomorrow,
          precipTomorrow,
          "morgen"
        )} Wahrscheinlich musst du noch nicht gießen.`,
        badge: "Warten",
      };
    }

    return {
      level: "watch",
      title: "Bald gießen",
      message:
        "Die Erde wird trockener. Wenn kein Regen kommt, solltest du bald gießen.",
      badge: "Beobachten",
    };
  }

  if (moisture <= 70) {
    return {
      level: "no_water",
      title: "Nicht gießen",
      message: "Die Bodenfeuchte ist aktuell im guten Bereich.",
      badge: "Okay",
    };
  }

  return {
    level: "no_water",
    title: "Nicht gießen",
    message:
      "Die Erde ist bereits sehr feucht. Zusätzliche Bewässerung ist nicht nötig.",
    badge: "Feucht",
  };
}