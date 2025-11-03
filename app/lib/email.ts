"use server";

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true"; // true for 465, false for 587
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure, // STARTTLS on 587
    // Enable verbose logs in non-production to aid debugging
    logger: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV !== "production",
  });

  return transporter;
}

export type SendParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendViaSMTP({ to, subject, html, text }: SendParams) {
  const from = process.env.SMTP_FROM!;
  const replyTo = process.env.SMTP_REPLY_TO || undefined;

  // Safety: From must match authenticated mailbox for Namecheap
  const authMailbox = (process.env.SMTP_USER || "").toLowerCase();
  const fromAddr = (from.match(/<([^>]+)>/)?.[1] || from).toLowerCase();

  if (authMailbox !== fromAddr) {
    throw new Error(
      `SMTP_FROM (${fromAddr}) must equal SMTP_USER (${authMailbox}) for Namecheap. Update env vars.`
    );
  }

  const t = getTransporter();
  const info = await t.sendMail({ from, to, subject, html, text, replyTo });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response };
}

export async function sendBasicTest() {
  const to = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;
  return sendViaSMTP({ to, subject: "SMTP test", html: "<p>SMTP OK</p>", text: "SMTP OK" });
}
