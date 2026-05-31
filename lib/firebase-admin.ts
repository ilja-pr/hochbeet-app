import {
  initializeApp,
  cert,
  getApps,
  getApp,
  type App,
} from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      "Firebase Admin Konfiguration unvollständig. Bitte FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und NEXT_PUBLIC_FIREBASE_DATABASE_URL setzen."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
}

export function getAdminDb() {
  return getDatabase(getFirebaseAdminApp());
}