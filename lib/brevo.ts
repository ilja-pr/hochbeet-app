import nodemailer, { type Transporter } from "nodemailer";

type EmailParams = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
};

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true"; // true = Port 465
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP-Konfiguration unvollständig. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS setzen."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

function getSender(): string {
  // MAIL_FROM kann "Name <mail@domain>" oder nur "mail@domain" sein
  return process.env.MAIL_FROM || "Gießmelder <no-reply@giessmelder.app>";
}

/**
 * Verschickt eine E-Mail über den Brevo-SMTP-Relay.
 * Rückgabeform bleibt kompatibel zur bisherigen API-Variante.
 */
export async function sendBrevoEmail(params: EmailParams): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getSender(),
      to: params.to,
      subject: params.subject,
      text: params.textContent,
      html: params.htmlContent,
    });

    return {
      ok: true,
      status: 200,
      body: info.messageId ?? "sent",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return { ok: false, status: 502, body: message };
  }
}

// ------------------------------------------------------------
//  Gemeinsames, modernes E-Mail-Layout
// ------------------------------------------------------------
function emailShell(opts: {
  accent: string;
  title: string;
  bodyHtml: string;
  dashboardUrl?: string;
  buttonLabel?: string;
}): string {
  const { accent, title, bodyHtml, dashboardUrl, buttonLabel } = opts;
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:24px;background:#f1f5f0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="height:6px;background:${accent};"></div>
      <div style="padding:32px;">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;">
          <span style="display:inline-grid;place-items:center;width:32px;height:32px;border-radius:9px;background:#16a34a;color:#ffffff;font-weight:700;">G</span>
          <span style="font-weight:700;font-size:15px;color:#14532d;">Gießmelder</span>
        </div>
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#0f172a;">${title}</h1>
        ${bodyHtml}
        ${
          dashboardUrl
            ? `<p style="margin:28px 0 0;">
                 <a href="${dashboardUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:600;font-size:15px;">
                   ${buttonLabel ?? "Zum Dashboard"}
                 </a>
               </p>`
            : ""
        }
        <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
          Diese Nachricht kommt von deinem Gießmelder. Die Benachrichtigungen
          lassen sich jederzeit in den Einstellungen ausschalten.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export function buildDryAlertEmail(opts: {
  moisture: number;
  threshold: number;
  status: string;
  measuredAt?: number;
  dashboardUrl?: string;
}) {
  const { moisture, threshold, status, measuredAt, dashboardUrl } = opts;

  const measuredText = measuredAt
    ? new Date(measuredAt).toLocaleString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const subject = `Gießmelder: Hochbeet trocken (${moisture}%)`;

  const textContent = `Hallo!

Die Bodenfeuchte deines Hochbeets liegt gerade bei ${moisture}% (Status: ${status}).
Das ist unter deinem Grenzwert von ${threshold}%.
${measuredText ? `Gemessen am: ${measuredText}` : ""}

Es ist Zeit zu gießen.

${dashboardUrl ? `Dashboard: ${dashboardUrl}` : ""}

Viele Grüße
dein Gießmelder`;

  const bodyHtml = `
    <p style="font-size:16px;line-height:1.65;color:#334155;margin:0 0 12px;">
      Die Bodenfeuchte ist auf <strong style="color:#b91c1c;">${moisture}%</strong>
      gefallen (Status: <strong>${status}</strong>).
    </p>
    <p style="font-size:16px;line-height:1.65;color:#334155;margin:0 0 16px;">
      Dein Grenzwert liegt bei <strong>${threshold}%</strong> – es ist Zeit zu gießen.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 4px;">
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border-radius:10px 10px 0 0;font-size:14px;color:#64748b;">
          Aktuelle Feuchte
        </td>
        <td style="padding:10px 14px;background:#f8fafc;border-radius:0 10px 0 0;font-size:14px;color:#0f172a;text-align:right;font-weight:700;">
          ${moisture}%
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;font-size:14px;color:#64748b;border-top:1px solid #eef2f7;">
          Status
        </td>
        <td style="padding:10px 14px;background:#f8fafc;font-size:14px;color:#0f172a;text-align:right;font-weight:700;border-top:1px solid #eef2f7;">
          ${status}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;font-size:14px;color:#64748b;border-top:1px solid #eef2f7;${
          measuredText ? "" : "border-radius:0 0 0 10px;"
        }">
          Grenzwert
        </td>
        <td style="padding:10px 14px;background:#f8fafc;font-size:14px;color:#0f172a;text-align:right;font-weight:700;border-top:1px solid #eef2f7;${
          measuredText ? "" : "border-radius:0 0 10px 0;"
        }">
          ${threshold}%
        </td>
      </tr>
      ${
        measuredText
          ? `<tr>
        <td style="padding:10px 14px;background:#f8fafc;border-radius:0 0 0 10px;font-size:14px;color:#64748b;border-top:1px solid #eef2f7;">
          Gemessen am
        </td>
        <td style="padding:10px 14px;background:#f8fafc;border-radius:0 0 10px 0;font-size:14px;color:#0f172a;text-align:right;font-weight:700;border-top:1px solid #eef2f7;">
          ${measuredText}
        </td>
      </tr>`
          : ""
      }
    </table>`;

  const htmlContent = emailShell({
    accent: "#dc2626",
    title: "Dein Hochbeet braucht Wasser",
    bodyHtml,
    dashboardUrl,
  });

  return { subject, htmlContent, textContent };
}

export function buildTestEmail(opts: {
  moisture: number;
  status: string;
  dashboardUrl?: string;
}) {
  const { moisture, status, dashboardUrl } = opts;

  const subject = "Gießmelder: Test-Mail";

  const textContent = `Hallo!

Das ist eine Test-Mail von deinem Gießmelder.
Wenn du das liest, funktioniert der E-Mail-Versand.

Aktuelle Bodenfeuchte: ${moisture}% (${status})

${dashboardUrl ? `Dashboard: ${dashboardUrl}` : ""}

Viele Grüße
dein Gießmelder`;

  const bodyHtml = `
    <p style="font-size:16px;line-height:1.65;color:#334155;margin:0 0 12px;">
      Wenn du das liest, funktioniert der E-Mail-Versand deines Gießmelders.
    </p>
    <p style="font-size:16px;line-height:1.65;color:#334155;margin:0;">
      Aktuelle Bodenfeuchte: <strong>${moisture}%</strong> (${status})
    </p>`;

  const htmlContent = emailShell({
    accent: "#16a34a",
    title: "Test-Mail erfolgreich",
    bodyHtml,
    dashboardUrl,
  });

  return { subject, htmlContent, textContent };
}
