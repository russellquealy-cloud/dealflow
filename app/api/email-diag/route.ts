import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const env = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER ? "[set]" : "[missing]",
      SMTP_PASS: process.env.SMTP_PASS ? "[set]" : "[missing]",
      SMTP_FROM: process.env.SMTP_FROM,
      SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
      SALES_EMAIL: process.env.SALES_EMAIL,
      NOREPLY_EMAIL: process.env.NOREPLY_EMAIL,
      NODE_ENV: process.env.NODE_ENV,
    };

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      requireTLS: process.env.SMTP_SECURE !== "true",
      logger: true,
      debug: true,
    });

    const ok = await transporter.verify();
    return NextResponse.json({ ok, env });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

