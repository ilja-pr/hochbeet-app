import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendBrevoEmail, buildTestEmail } from "@/lib/brevo";
import { getAuth } from "firebase-admin/auth";
import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";

function ensureAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
  return getApp();
}

export async function POST(request: NextRequest) {
  try {
    // Login-Prüfung über Firebase ID Token
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "missing_token" },
        { status: 401 }
      );
    }

    ensureAdmin();
    try {
      await getAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 401 }
      );
    }

    // E-Mail aus Body holen
    const body = await request.json().catch(() => ({}));
    const email = body?.email as string | undefined;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    // Aktueller Wert für die Test-Mail
    const db = getAdminDb();
    const currentSnap = await db.ref("plants/plant1/current").get();
    const current = currentSnap.val() as {
      moisture?: number;
      status?: string;
    } | null;

    const moisture = current?.moisture ?? 0;
    const status = current?.status ?? "Unbekannt";

    const dashboardUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

    const mail = buildTestEmail({ moisture, status, dashboardUrl });

    const result = await sendBrevoEmail({
      to: email,
      subject: mail.subject,
      htmlContent: mail.htmlContent,
      textContent: mail.textContent,
    });

    if (!result.ok) {
      console.error("Brevo Fehler:", result.status, result.body);
      return NextResponse.json(
        {
          ok: false,
          error: "brevo_failed",
          status: result.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, to: email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}