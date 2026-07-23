const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  connectionTimeout: 8000, // fail fast instead of hanging for minutes
  greetingTimeout: 8000,
  socketTimeout: 8000,
});

/**
 * Sends an email. Never throws and never blocks the caller for long —
 * email delivery is a nice-to-have, not something that should be able to
 * fail a registration/login/reset request. If SMTP isn't configured, or
 * the SMTP server is unreachable/misconfigured, this logs the issue and
 * resolves gracefully instead of bubbling an error up.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log("\n📧 [DEV MODE — no SMTP configured] Email not actually sent:");
    console.log(`   To: ${to}\n   Subject: ${subject}\n   Body: ${html}\n`);
    return { devMode: true };
  }

  try {
    return await transporter.sendMail({
      from: process.env.EMAIL_FROM || "SkillSphere <no-reply@skillsphere.app>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`⚠️  Email send failed (non-fatal, request continues): ${err.message}`);
    return { failed: true, error: err.message };
  }
}

module.exports = sendEmail;
