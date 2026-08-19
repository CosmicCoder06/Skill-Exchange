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

async function sendWithResend({ html, subject, text, to }) {
  if (!process.env.EMAIL_FROM) {
    throw new Error("Email configuration is missing: EMAIL_FROM");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "skill-exchange/1.0",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 300);
    throw new Error(`Resend API rejected email (${response.status}): ${details}`);
  }

  return response.json();
}

async function sendEmail(message) {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(message);
  }

  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    ...message,
  });
}

async function sendVerificationEmail({ name, to, verificationUrl }) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(verificationUrl);

  return sendEmail({
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

async function sendVerificationOtp({ name, otp, to }) {
  const safeName = escapeHtml(name || "there");
  const safeOtp = escapeHtml(otp);

  return sendEmail({
    to,
    subject: `${otp} is your Skill Exchange verification code`,
    text: `Hi ${name || "there"}, your Skill Exchange verification code is ${otp}. It expires in 10 minutes. Never share this code.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#173b2f">
        <h1 style="font-size:28px">Verify your Skill Exchange account</h1>
        <p>Hi ${safeName},</p>
        <p>Enter this code in Skill Exchange to confirm your email address:</p>
        <div style="margin:28px 0;padding:18px;border-radius:16px;background:#edf7f1;text-align:center;font-size:36px;font-weight:800;letter-spacing:10px;color:#176b4e">${safeOtp}</div>
        <p>This code expires in 10 minutes. Never share it with anyone. If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendVerificationOtp };
