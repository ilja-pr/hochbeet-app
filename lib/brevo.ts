type BrevoEmailParams = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail(params: BrevoEmailParams): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Hochbeet Monitor";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY ist nicht gesetzt.");
  }
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL ist nicht gesetzt.");
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
    }),
  });

  const body = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    body,
  };
}

export function buildDryAlertEmail(opts: {
  moisture: number;
  threshold: number;
  status: string;
  dashboardUrl?: string;
}) {
  const { moisture, threshold, status, dashboardUrl } = opts;

  const subject = `Hochbeet trocken: ${moisture}% Bodenfeuchte`;

  const textContent = `Hallo!

Die Bodenfeuchte deines Hochbeets ist gerade bei ${moisture}% (Status: ${status}).
Das liegt unter deinem eingestellten Grenzwert von ${threshold}%.

Es ist Zeit zu gießen.

${dashboardUrl ? `Dashboard: ${dashboardUrl}` : ""}

Viele Grüße,
dein Hochbeet Monitor`;

  const htmlContent = `<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#f6f8fb;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
    <h1 style="margin:0 0 16px;color:#b91c1c;font-size:24px;">Dein Hochbeet braucht Wasser</h1>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      Die Bodenfeuchte ist auf <strong>${moisture}%</strong> gefallen
      (Status: <strong>${status}</strong>).
    </p>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      Dein eingestellter Grenzwert liegt bei <strong>${threshold}%</strong>.
      Es ist Zeit zu gießen.
    </p>
    ${
      dashboardUrl
        ? `<p style="margin-top:24px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;">
          Zum Dashboard
        </a>
      </p>`
        : ""
    }
    <p style="margin-top:32px;font-size:13px;color:#94a3b8;">
      Diese Mail kommt von deinem Hochbeet Monitor.
      Du kannst die Benachrichtigung in den Einstellungen ausschalten.
    </p>
  </div>
</body>
</html>`;

  return { subject, htmlContent, textContent };
}