const { Resend } = require("resend");

/**
 * Sends an email via Resend HTTP API (works on Render free tier).
 * Falls back to console log in development when RESEND_API_KEY is not set.
 * Never throws — email failure should never break a request.
 */
async function sendEmail({ to, subject, html }) {
  // ── DEV MODE: no API key configured ─────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.log("\n📧 [DEV MODE — no RESEND_API_KEY] Email not actually sent:");
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Body    : ${html}\n`);
    return { devMode: true };
  }

  // ── PRODUCTION: send via Resend HTTP API ─────────────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "SkillSphere <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`\n❌ EMAIL SEND FAILED (Resend API error)!`);
      console.error(`   To      : ${to}`);
      console.error(`   Subject : ${subject}`);
      console.error(`   Error   : ${JSON.stringify(error)}\n`);
      return { failed: true, error };
    }

    console.log(`✅ Email successfully sent via Resend!`);
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   MsgID   : ${data?.id}`);
    return data;
  } catch (err) {
    console.error(`\n❌ EMAIL SEND FAILED!`);
    console.error(`   To      : ${to}`);
    console.error(`   Subject : ${subject}`);
    console.error(`   Error   : ${err.message}\n`);
    return { failed: true, error: err.message };
  }
}

module.exports = sendEmail;
