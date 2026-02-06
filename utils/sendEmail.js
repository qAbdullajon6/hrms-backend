const nodemailer = require("nodemailer");

/**
 * Lightweight email sender.
 *
 * Env:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASS
 *
 * In dev (or when SMTP is not configured) it logs to console.
 */
async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.log("[sendEmail] SMTP not configured. Email skipped.", {
      to,
      subject,
      text,
    });
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: false,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: user,
    to,
    subject,
    text,
    html,
  });

  return { skipped: false, messageId: info.messageId };
}

module.exports = { sendEmail };

