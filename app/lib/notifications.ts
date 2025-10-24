import { createClient } from '@/lib/supabase/server';

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationData {
  to: string;
  template: string;
  data: Record<string, unknown>;
  type: 'email' | 'push';
}

// Email Templates - Temporarily disabled for build
export const EMAIL_TEMPLATES = {
  new_message: {
    subject: 'New Message on Deal Flow',
    html: '<div>New message received</div>',
    text: 'New message received'
  },
  
  listing_status_change: {
    subject: 'Listing Status Updated',
    html: '<div>Listing status updated</div>',
    text: 'Listing status updated'
  },
  
  subscription_event: {
    subject: 'Subscription Update',
    html: '<div>Subscription updated</div>',
    text: 'Subscription updated'
  },
  
  ai_analysis_completed: {
    subject: 'AI Analysis Complete',
    html: '<div>AI analysis completed</div>',
    text: 'AI analysis completed'
  },
  
  daily_digest: {
    subject: 'Daily Deal Flow Digest',
    html: '<div>Daily digest</div>',
    text: 'Daily digest'
  }
};

export async function sendEmail(notification: NotificationData): Promise<boolean> {
  try {
    const template = EMAIL_TEMPLATES[notification.template as keyof typeof EMAIL_TEMPLATES];
    if (!template) {
      throw new Error(`Template ${notification.template} not found`);
    }

    // Replace template variables
    let html = template.html;
    let text = template.text;
    let subject = template.subject;

    for (const [key, value] of Object.entries(notification.data)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
      text = text.replace(new RegExp(placeholder, 'g'), String(value));
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Send email based on configured provider
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(notification.to, subject, html, text);
    } else if (process.env.POSTMARK_API_TOKEN) {
      return await sendViaPostmark(notification.to, subject, html, text);
    } else if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(notification.to, subject, html, text);
    } else {
      console.warn('No email provider configured');
      return false;
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Deal Flow <noreply@dealflow.com>',
      to: [to],
      subject,
      html,
      text,
    }),
  });

  return response.ok;
}

async function sendViaPostmark(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN!,
    },
    body: JSON.stringify({
      From: 'noreply@dealflow.com',
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
    }),
  });

  return response.ok;
}

async function sendViaSendGrid(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@dealflow.com', name: 'Deal Flow' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  return response.ok;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get user's push subscription
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !subscription) {
      console.warn('No push subscription found for user:', userId);
      return false;
    }

    // Send push notification
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload: JSON.stringify({
          title,
          body,
          data: data || {},
        }),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Push notification failed:', error);
    return false;
  }
}

export async function logNotification(
  userId: string,
  type: 'email' | 'push',
  template: string,
  status: 'sent' | 'failed',
  error?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: type,
        template_name: template,
        status,
        error_message: error,
      });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}
