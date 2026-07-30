const sgMail = require("@sendgrid/mail");

/**
 * Sends an email via SendGrid HTTP API (works on Render free tier).
 * Falls back to console log in development when SENDGRID_API_KEY is not set.
 * Never throws — email failure should never break a request.
 */
async function sendEmail({ to, subject, html }) {
  // ── DEV MODE: no API key configured ─────────────────────────────────
  if (!process.env.SENDGRID_API_KEY) {
    console.log("\n📧 [DEV MODE — no SENDGRID_API_KEY] Email not actually sent:");
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Body    : ${html}\n`);
    return { devMode: true };
  }

  // ── PRODUCTION: send via SendGrid HTTP API ───────────────────────────
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: process.env.EMAIL_FROM || "bablooaman.p2@gmail.com",
      subject,
      html,
    };

    const [response] = await sgMail.send(msg);

    console.log(`✅ Email successfully sent via SendGrid!`);
    console.log(`   To         : ${to}`);
    console.log(`   Subject    : ${subject}`);
    console.log(`   StatusCode : ${response.statusCode}`);
    return response;
  } catch (err) {
    console.error(`\n❌ EMAIL SEND FAILED (SendGrid)!`);
    console.error(`   To      : ${to}`);
    console.error(`   Subject : ${subject}`);
    console.error(`   Error   : ${err.message}`);
    if (err.response) {
      console.error(`   Details : ${JSON.stringify(err.response.body)}`);
    }
    console.error();
    return { failed: true, error: err.message };
  }
}

module.exports = sendEmail;
