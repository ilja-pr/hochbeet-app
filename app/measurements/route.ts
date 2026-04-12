// app/api/measurements/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Firebase Admin nur einmal initialisieren
 */
function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase Admin ENV fehlt. Bitte FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL und FIREBASE_PRIVATE_KEY setzen."
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return getFirestore();
}

type MeasurementBody = {
  deviceId?: string;
  moisture?: number;
  battery?: number;
  temperature?: number | null;
  weatherText?: string | null;
  rainChance?: number | null;
  signalStrength?: number | null;
  firmwareVersion?: string | null;
  measuredAt?: string | null; // optional ISO string vom Gerät
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Measurements API is running",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const deviceSecret = req.headers.get("x-device-secret");
    const expectedSecret = process.env.ESP_DEVICE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Server-Konfiguration fehlt: ESP_DEVICE_SECRET ist nicht gesetzt.",
        },
        { status: 500 }
      );
    }

    if (deviceSecret !== expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    let body: MeasurementBody;

    try {
      body = (await req.json()) as MeasurementBody;
    } catch {
      return badRequest("Ungültiges JSON im Request-Body.");
    }

    const deviceId =
      typeof body.deviceId === "string" && body.deviceId.trim().length > 0
        ? body.deviceId.trim()
        : "beet-1";

    const moisture = body.moisture;
    const battery = body.battery;
    const temperature =
      body.temperature === null || body.temperature === undefined
        ? null
        : body.temperature;
    const weatherText =
      typeof body.weatherText === "string" && body.weatherText.trim().length > 0
        ? body.weatherText.trim()
        : null;
    const rainChance =
      body.rainChance === null || body.rainChance === undefined
        ? null
        : body.rainChance;
    const signalStrength =
      body.signalStrength === null || body.signalStrength === undefined
        ? null
        : body.signalStrength;
    const firmwareVersion =
      typeof body.firmwareVersion === "string" && body.firmwareVersion.trim().length > 0
        ? body.firmwareVersion.trim()
        : null;

    if (!isFiniteNumber(moisture)) {
      return badRequest("Feld 'moisture' fehlt oder ist keine Zahl.");
    }

    if (!isFiniteNumber(battery)) {
      return badRequest("Feld 'battery' fehlt oder ist keine Zahl.");
    }

    if (moisture < 0 || moisture > 100) {
      return badRequest("Feld 'moisture' muss zwischen 0 und 100 liegen.");
    }

    if (battery < 0 || battery > 10) {
      return badRequest("Feld 'battery' wirkt ungültig.");
    }

    if (temperature !== null && !isFiniteNumber(temperature)) {
      return badRequest("Feld 'temperature' muss eine Zahl sein oder null.");
    }

    if (rainChance !== null && !isFiniteNumber(rainChance)) {
      return badRequest("Feld 'rainChance' muss eine Zahl sein oder null.");
    }

    if (signalStrength !== null && !isFiniteNumber(signalStrength)) {
      return badRequest("Feld 'signalStrength' muss eine Zahl sein oder null.");
    }

    const db = getDb();

    const measuredAt =
      body.measuredAt && !Number.isNaN(Date.parse(body.measuredAt))
        ? new Date(body.measuredAt)
        : null;

    const status =
      moisture < 30 ? "trocken" : moisture <= 60 ? "okay" : "feucht";

    const measurementData = {
      deviceId,
      moisture,
      battery,
      temperature,
      weatherText,
      rainChance,
      signalStrength,
      firmwareVersion,
      status,
      measuredAt: measuredAt ?? FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      source: "esp32",
    };

    const measurementRef = await db.collection("measurements").add(measurementData);

    await db
      .collection("devices")
      .doc(deviceId)
      .set(
        {
          deviceId,
          lastMeasurementId: measurementRef.id,
          lastMoisture: moisture,
          lastBattery: battery,
          lastTemperature: temperature,
          lastWeatherText: weatherText,
          lastRainChance: rainChance,
          lastSignalStrength: signalStrength,
          lastStatus: status,
          lastMeasuredAt: measuredAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json(
      {
        ok: true,
        id: measurementRef.id,
        deviceId,
        status,
        saved: {
          moisture,
          battery,
          temperature,
          weatherText,
          rainChance,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/measurements error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Interner Serverfehler",
      },
      { status: 500 }
    );
  }
}