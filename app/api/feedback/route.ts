import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import { sendFeedbackEmail } from '@/lib/email';

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

    // Send feedback email
    await sendFeedbackEmail(type, subject || emailSubject, message, userEmail || undefined);

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
        })
        .catch(err => {
          console.error('Error storing feedback in database:', err);
          // Don't fail the request if DB insert fails
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

