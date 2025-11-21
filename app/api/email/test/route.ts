// app/api/email/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/app/lib/admin";
import { sendViaSMTP } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "This endpoint is for POST requests to send test emails. GET is for diagnostics only.",
    isAdmin: true,
    emailConfigured: !!(process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_HOST),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const to = body.to || admin.profile?.email || admin.user?.email || "admin@offaxisdeals.com";
    const subject = body.subject || "Test Email from Off Axis Deals";

    const testMessage = `
      <h2>Test Email</h2>
      <p>This is a test email from the Off Axis Deals platform.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>From user: ${admin.user?.email || "admin"}</p>
      <hr>
      <p style="color: #6b7280; font-size: 12px;">If you received this email, the SMTP configuration is working correctly.</p>
    `;

    const result = await sendViaSMTP({
      to,
      subject,
      html: testMessage,
      text: `Test Email\n\nThis is a test email from the Off Axis Deals platform.\nSent at: ${new Date().toISOString()}\nFrom user: ${admin.user?.email || "admin"}`,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      sentTo: to,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
