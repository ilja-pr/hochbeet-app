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

export function getWateringRecommendation(
  input: WateringInput
): WateringDecision {
  const moisture = input.moisture ?? 0;
  const rainToday = input.rainProbabilityToday ?? 0;
  const rainTomorrow = input.rainProbabilityTomorrow ?? 0;
  const precipToday = input.precipitationToday ?? 0;
  const precipTomorrow = input.precipitationTomorrow ?? 0;

  const strongRainSoon =
    (rainToday >= 70 && precipToday >= 2) ||
    (rainTomorrow >= 70 && precipTomorrow >= 2);

  const likelyRainSoon =
    (rainToday >= 60 && precipToday >= 1) ||
    (rainTomorrow >= 60 && precipTomorrow >= 1);

  if (moisture <= 20) {
    if (strongRainSoon) {
      return {
        level: "wait_for_rain",
        title: "Regen abwarten",
        message:
          "Die Erde ist trocken, aber es wird bald relevanter Regen erwartet. Du kannst wahrscheinlich noch warten.",
        badge: "Warten",
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
    if (strongRainSoon || likelyRainSoon) {
      return {
        level: "wait_for_rain",
        title: "Noch warten",
        message:
          "Die Erde ist eher trocken, aber Regen ist wahrscheinlich. Beobachte den Boden und warte zunächst ab.",
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
    message: "Die Erde ist bereits sehr feucht. Zusätzliche Bewässerung ist nicht nötig.",
    badge: "Feucht",
  };
}