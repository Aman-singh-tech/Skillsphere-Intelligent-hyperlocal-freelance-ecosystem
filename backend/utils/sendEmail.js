const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

/**
 * Sends an email. If SMTP credentials are not configured (local dev),
 * it logs the email to the console instead of throwing, so the rest
 * of the auth flow (register/verify/reset) can still be tested.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log("\n📧 [DEV MODE — no SMTP configured] Email not actually sent:");
    console.log(`   To: ${to}\n   Subject: ${subject}\n   Body: ${html}\n`);
    return { devMode: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || "SkillSphere <no-reply@skillsphere.app>",
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
