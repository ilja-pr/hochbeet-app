import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildDryAlertEmail, sendBrevoEmail } from "@/lib/brevo";

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 Stunden
const HISTORY_KEEP_MS = 28 * 24 * 60 * 60 * 1000; // 4 Wochen

type HistoryEntry = { ts?: number };

async function cleanupOldHistory(
  db: ReturnType<typeof getAdminDb>
): Promise<{ deleted: number }> {
  const cutoff = Date.now() - HISTORY_KEEP_MS;

  // Alle Einträge bis zum cutoff serverseitig holen
  const oldSnap = await db
    .ref("plants/plant1/history")
    .orderByChild("ts")
    .endAt(cutoff)
    .get();

  const oldEntries = oldSnap.val() as Record<string, HistoryEntry> | null;
  if (!oldEntries) {
    return { deleted: 0 };
  }

  // Multi-Delete in einem einzigen Call
  const updates: Record<string, null> = {};
  for (const key of Object.keys(oldEntries)) {
    updates[`plants/plant1/history/${key}`] = null;
  }

  await db.ref().update(updates);
  return { deleted: Object.keys(updates).length };
}

export async function GET(request: NextRequest) {
  // Sicherheit: Nur Vercel Cron oder mit gültigem Secret darf das aufrufen
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const db = getAdminDb();

    // ALTE EINTRÄGE LÖSCHEN (> 4 Wochen)
    let cleanedCount = 0;
    try {
      const cleanup = await cleanupOldHistory(db);
      cleanedCount = cleanup.deleted;
      if (cleanedCount > 0) {
        console.log(`History cleanup: ${cleanedCount} alte Einträge gelöscht`);
      }
    } catch (cleanupError) {
      console.error("Cleanup fehlgeschlagen:", cleanupError);
      // Cleanup-Fehler darf den Mail-Check nicht blockieren
    }

    // Aktuelle Messung holen
    const currentSnap = await db.ref("plants/plant1/current").get();
    const current = currentSnap.val() as
      | {
          moisture?: number;
          status?: string;
          updatedAt?: number;
        }
      | null;

    if (!current || typeof current.moisture !== "number") {
      return NextResponse.json({
        ok: true,
        skipped: "no_measurement",
        cleaned: cleanedCount,
      });
    }

    // Settings holen
    const settingsSnap = await db.ref("plants/plant1/settings").get();
    const settings = settingsSnap.val() as
      | {
          threshold?: number;
          notifications?: {
            emailEnabled?: boolean;
            email?: string;
          };
        }
      | null;

    const threshold = settings?.threshold ?? 30;
    const emailEnabled = settings?.notifications?.emailEnabled ?? false;
    const email = settings?.notifications?.email ?? "";

    if (!emailEnabled) {
      return NextResponse.json({ ok: true, skipped: "email_disabled", cleaned: cleanedCount });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: true, skipped: "no_email", cleaned: cleanedCount });
    }

    if (current.moisture >= threshold) {
      return NextResponse.json({
        ok: true,
        skipped: "above_threshold",
        cleaned: cleanedCount,
        moisture: current.moisture,
        threshold,
      });
    }

    // Cooldown prüfen: wann wurde zuletzt eine Mail geschickt?
    const lastSnap = await db
      .ref("plants/plant1/notifications/lastEmailSentAt")
      .get();
    const lastSentAt = (lastSnap.val() as number | null) ?? 0;
    const now = Date.now();

    if (now - lastSentAt < COOLDOWN_MS) {
      const remainingMin = Math.ceil(
        (COOLDOWN_MS - (now - lastSentAt)) / 60000
      );
      return NextResponse.json({
        ok: true,
        skipped: "cooldown",
        cleaned: cleanedCount,
        remainingMinutes: remainingMin,
      });
    }

    // Mail schicken
    const dashboardUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined;

    const mail = buildDryAlertEmail({
      moisture: current.moisture,
      threshold,
      status: current.status ?? "Trocken",
      dashboardUrl,
    });

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
          body: result.body,
        },
        { status: 502 }
      );
    }

    // Erfolg protokollieren
    await db.ref("plants/plant1/notifications").update({
      lastEmailSentAt: now,
      lastEmailTo: email,
      lastEmailMoisture: current.moisture,
    });

    return NextResponse.json({
      ok: true,
      sent: true,
      cleaned: cleanedCount,
      to: email,
      moisture: current.moisture,
      threshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("check-and-notify failed:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}