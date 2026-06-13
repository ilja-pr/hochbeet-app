import { NextRequest, NextResponse } from "next/server";
import { sendBrevoEmail, buildTestEmail } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Einfacher Schutz: geheimes Wort muss mitgeschickt werden und
    // mit der Umgebungsvariable MAIL_SECRET übereinstimmen.
    const secret = body?.secret as string | undefined;
    const expected = process.env.MAIL_SECRET;

    if (expected && secret !== expected) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // Empfänger-Adresse
    const email = body?.email as string | undefined;
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    // Aktueller Messwert kommt direkt vom Browser mit
    const moisture =
      typeof body?.moisture === "number" ? body.moisture : 0;
    const status =
      typeof body?.status === "string" && body.status
        ? body.status
        : "Unbekannt";

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
        { ok: false, error: "brevo_failed", status: result.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, to: email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}