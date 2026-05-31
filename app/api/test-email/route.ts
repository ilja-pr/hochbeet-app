import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendBrevoEmail } from "@/lib/brevo";
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

    const subject = "Test-Mail vom Hochbeet Monitor";
    const moisture = current?.moisture ?? 0;
    const status = current?.status ?? "Unbekannt";

    const textContent = `Hallo!

Das ist eine Test-Mail von deinem Hochbeet Monitor.
Wenn du das liest, funktioniert der E-Mail-Versand.

Aktuelle Bodenfeuchte: ${moisture}% (${status})

Viele Grüße,
dein Hochbeet`;

    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#f6f8fb;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
    <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Test-Mail erfolgreich</h1>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      Wenn du das liest, funktioniert der E-Mail-Versand deines Hochbeet Monitors.
    </p>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      Aktuelle Bodenfeuchte: <strong>${moisture}%</strong> (${status})
    </p>
  </div>
</body>
</html>`;

    const result = await sendBrevoEmail({
      to: email,
      subject,
      htmlContent,
      textContent,
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