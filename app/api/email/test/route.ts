import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { sendViaSMTP } from '@/lib/email';

/**
 * Admin-gated test email endpoint
 * POST /api/email/test
 * Body: { to?: string, subject?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Get test email params
    const body = await request.json().catch(() => ({}));
    const to = body.to || process.env.SUPPORT_EMAIL || process.env.EMAIL_SMTP_USER || user.email;
    const subject = body.subject || 'Test Email from Off Axis Deals';
    const testMessage = `
      <h2>Test Email</h2>
      <p>This is a test email from the Off Axis Deals platform.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>From user: ${user.email}</p>
      <hr>
      <p style="color: #6b7280; font-size: 12px;">If you received this email, the SMTP configuration is working correctly.</p>
    `;

    // Send test email
    const result = await sendViaSMTP({
      to,
      subject,
      html: testMessage,
      text: `Test Email\n\nThis is a test email from the Off Axis Deals platform.\nSent at: ${new Date().toISOString()}\nFrom user: ${user.email}`,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      sentTo: to,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

