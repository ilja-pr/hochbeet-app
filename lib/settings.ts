import { onValue, ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase";

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
    // Merge mit Defaults, falls in DB Felder fehlen
    if (!data) {
      callback(defaultSettings);
      return;
    }
    callback({
      threshold: data.threshold ?? defaultSettings.threshold,
      measurementIntervalMinutes:
        data.measurementIntervalMinutes ??
        defaultSettings.measurementIntervalMinutes,
      notifications: {
        emailEnabled:
          data.notifications?.emailEnabled ??
          defaultSettings.notifications.emailEnabled,
        email:
          data.notifications?.email ?? defaultSettings.notifications.email,
      },
    });
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