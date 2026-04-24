import { onValue, ref, set, update } from "firebase/database";
import { db } from "@/lib/auth";

export type PlantSettings = {
  threshold: number;
  measurementIntervalMinutes: number;
  notifications: {
    emailEnabled: boolean;
    email: string;
  };
};

export const defaultSettings: PlantSettings = {
  threshold: 30,
  measurementIntervalMinutes: 30,
  notifications: {
    emailEnabled: false,
    email: "",
  },
};

export function subscribeToSettings(
  callback: (settings: PlantSettings) => void
) {
  const settingsRef = ref(db, "plants/plant1/settings");

  return onValue(settingsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ?? defaultSettings);
  });
}

export async function saveSettings(settings: PlantSettings) {
  const settingsRef = ref(db, "plants/plant1/settings");
  return set(settingsRef, settings);
}

export async function patchSettings(partial: Partial<PlantSettings>) {
  const settingsRef = ref(db, "plants/plant1/settings");
  return update(settingsRef, partial);
}