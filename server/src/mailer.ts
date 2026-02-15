import { config } from "./config.js";

function verificationEmailHtml(verifyUrl: string, userName: string) {
  return `
  <div style="margin:0;padding:0;background:#050c1a;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5ecff;">
    <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid rgba(73,101,141,.45);border-radius:18px;background:linear-gradient(180deg,#0b1529,#08111f);padding:28px;">
        <p style="margin:0;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#25d2df;font-weight:700;">Portfolio Studio</p>
        <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;color:#f4f8ff;">Verify Your Email</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#b9c5de;">
          Hi ${userName}, welcome to Portfolio Studio. Please verify your email to activate your account and start building portfolio sites.
        </p>
        <div style="margin:24px 0;">
          <a href="${verifyUrl}" style="display:inline-block;background:#25d2df;color:#041424;text-decoration:none;padding:13px 20px;border-radius:12px;font-weight:700;font-size:14px;">
            Verify Email Address
          </a>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#98a8c6;">This verification link expires in 30 minutes.</p>
        <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:#98a8c6;">
          If the button does not work, copy and paste this URL into your browser:
          <br />
          <span style="color:#7be3eb;word-break:break-all;">${verifyUrl}</span>
        </p>
      </div>
      <p style="margin:12px 4px 0;color:#7d8aa4;font-size:12px;">Sent by Portfolio Studio. If you did not request this, you can ignore this email.</p>
    </div>
  </div>
  `.trim();
}

export async function sendVerificationEmail(payload: { to: string; userName: string; verifyUrl: string }) {
  const lowerFrom = config.mailFrom.toLowerCase();
  if (lowerFrom.includes("@gmail.com")) {
    throw new Error("MAIL_FROM cannot be a personal Gmail address. Use a verified sender/domain in Resend.");
  }

  if (!config.resendApiKey) {
    if (config.nodeEnv === "production") {
      throw new Error("Email service is not configured (missing RESEND_API_KEY).");
    }
    console.log(`[verification-email] missing RESEND_API_KEY, link for ${payload.to}: ${payload.verifyUrl}`);
    return { queued: false as const, fallback: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [payload.to],
      subject: "Verify your email - Portfolio Studio",
      html: verificationEmailHtml(payload.verifyUrl, payload.userName)
    })
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Failed to send verification email: ${response.status} ${errorPayload}`);
  }

  return { queued: true as const, fallback: false as const };
}
