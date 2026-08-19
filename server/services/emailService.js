const nodemailer = require("nodemailer");

let transporter;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTransporter() {
  if (transporter) return transporter;

  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Email configuration is missing: ${missing.join(", ")}`);
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendVerificationEmail({ name, to, verificationUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(verificationUrl);

  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your Skill Exchange email",
    text: `Hi ${name || "there"}, verify your Skill Exchange account: ${verificationUrl}. This link expires in 24 hours.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#173b2f">
        <h1 style="font-size:28px">Welcome to Skill Exchange</h1>
        <p>Hi ${safeName},</p>
        <p>Confirm your email address to activate your account and start exchanging skills.</p>
        <p style="margin:28px 0">
          <a href="${safeUrl}" style="background:#176b4e;color:white;padding:13px 22px;border-radius:999px;text-decoration:none;font-weight:700">Verify email address</a>
        </p>
        <p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
