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
  try {
    const from = process.env.SMTP_FROM!;
    const replyTo = process.env.SMTP_REPLY_TO || process.env.SUPPORT_EMAIL || undefined;

    // Safety: From must match authenticated mailbox for Namecheap
    const authMailbox = (process.env.SMTP_USER || "").toLowerCase();
    const fromAddr = (from.match(/<([^>]+)>/)?.[1] || from).toLowerCase();

    if (authMailbox !== fromAddr) {
      const error = new Error(
        `SMTP_FROM (${fromAddr}) must equal SMTP_USER (${authMailbox}) for Namecheap. Update env vars.`
      );
      console.error('Email configuration error:', error.message);
      throw error;
    }

    // Validate required env vars
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const error = new Error('Missing required SMTP environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
      console.error('Email configuration error:', error.message);
      throw error;
    }

    const t = getTransporter();
    const info = await t.sendMail({ 
      from, 
      to, 
      subject, 
      html, 
      text, 
      replyTo,
      // Add proper headers for deliverability
      headers: {
        'X-Mailer': 'Off Axis Deals',
        'X-Priority': '3',
      }
    });
    
    // Log success
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return { 
      messageId: info.messageId, 
      accepted: info.accepted, 
      rejected: info.rejected, 
      response: info.response 
    };
  } catch (error) {
    // Enhanced error logging
    console.error('Email send failure:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      smtpHost: process.env.SMTP_HOST,
      smtpUser: process.env.SMTP_USER ? '***configured***' : 'MISSING',
    });
    throw error;
  }
}

export async function sendBasicTest() {
  const to = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;
  return sendViaSMTP({ to, subject: "SMTP test", html: "<p>SMTP OK</p>", text: "SMTP OK" });
}
