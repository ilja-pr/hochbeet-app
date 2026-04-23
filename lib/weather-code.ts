export function weatherCodeToText(code?: number | null) {
  if (code == null) return "Unbekannt";
  if (code === 0) return "Klar";
  if ([1, 2, 3].includes(code)) return "Leicht bewölkt";
  if ([45, 48].includes(code)) return "Neblig";
  if ([51, 53, 55].includes(code)) return "Nieselregen";
  if ([61, 63, 65].includes(code)) return "Regen";
  if ([71, 73, 75, 77].includes(code)) return "Schnee";
  if ([80, 81, 82].includes(code)) return "Regenschauer";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  return "Unbekannt";
}