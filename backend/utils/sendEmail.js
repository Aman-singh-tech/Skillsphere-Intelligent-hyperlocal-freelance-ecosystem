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
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "SkillSphere <no-reply@skillsphere.app>",
      to,
      subject,
      html,
    });
    console.log(`✅ Email successfully sent!`);
    console.log(`   To      : ${info.accepted?.join(", ") || to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   MsgID   : ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`\n❌ EMAIL SEND FAILED!`);
    console.error(`   To      : ${to}`);
    console.error(`   Subject : ${subject}`);
    console.error(`   Error   : ${err.message}`);
    console.error(`   Code    : ${err.code || "N/A"}`);
    console.error(`   (Hint: Check SMTP credentials in .env or Gmail App Password)\n`);
    return { failed: true, error: err.message };
  }
}

module.exports = sendEmail;
