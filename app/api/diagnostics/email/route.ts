// app/api/diagnostics/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminServer } from '@/app/lib/admin';
import { sendViaSMTP } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const to = body.email || body.to || admin.profile?.email || admin.user?.email || 'admin@offaxisdeals.com';

    const subject = 'OffAxis Deals Test Email';
    const htmlContent = `
      <h1>Hello from OffAxis Deals!</h1>
      <p>This is a test email sent from the admin diagnostics endpoint.</p>
      <p>If you received this, your email delivery is working correctly.</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
      <p>Best regards,<br/>The OffAxis Deals Team</p>
    `;

    const { success, details, messageId, accepted, rejected } = await sendViaSMTP({
      to,
      subject,
      htmlContent,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully.',
        sentTo: to,
        messageId,
        accepted,
        rejected,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test email.', details },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
