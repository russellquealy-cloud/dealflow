import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import { sendViaSMTP } from '@/lib/email';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, subject, message } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    // Get user info if logged in
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const userEmail = session?.user?.email || 'anonymous@example.com';
    const userId = session?.user?.id || null;

    // Determine email subject based on type
    let emailSubject = '';
    switch (type) {
      case 'bug':
        emailSubject = `[BUG REPORT] ${subject || 'Bug Report'}`;
        break;
      case 'feature':
        emailSubject = `[FEATURE REQUEST] ${subject || 'Feature Request'}`;
        break;
      default:
        emailSubject = `[FEEDBACK] ${subject || 'User Feedback'}`;
    }

    // Send feedback email using new SMTP system
    const to = process.env.SUPPORT_EMAIL || 'customerservice@offaxisdeals.com';
    const html = `
      <h2>Feedback</h2>
      <p><b>Type:</b> ${type || "general"}</p>
      <p><b>From:</b> ${userEmail || "anonymous"}</p>
      <p><b>Message:</b></p>
      <pre>${(message || "").replace(/[<>&]/g, (s: string) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s] as string))}</pre>
    `;
    const text = `Type: ${type || "general"}\nFrom: ${userEmail || "anonymous"}\n\n${message || ""}`;
    
    try {
      await sendViaSMTP({ to, subject: emailSubject, html, text });
    } catch (emailError) {
      console.error('Error sending feedback email:', emailError);
      // Don't fail the request if email fails
    }

    // Optionally store in database for tracking
    if (userId) {
      await supabase
        .from('feedback')
        .insert({
          user_id: userId,
          type: type,
          subject: subject || emailSubject,
          message: message,
          created_at: new Date().toISOString()
        } as never)
        .then(({ error }: { error: { message: string; code?: string } | null }) => {
          if (error) {
            console.error('Error storing feedback in database:', error);
            // Don't fail the request if DB insert fails
          }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

