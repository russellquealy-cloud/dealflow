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

// Email Templates
export const EMAIL_TEMPLATES = {
  new_message: {
    subject: 'New Message on Deal Flow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Message on Deal Flow</h2>
        <p>You have received a new message regarding your listing:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>{{listing_title}}</h3>
          <p><strong>Address:</strong> {{listing_address}}</p>
          <p><strong>Price:</strong> ${{listing_price}}</p>
        </div>
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4>Message:</h4>
          <p>{{message_content}}</p>
          <p><strong>From:</strong> {{sender_name}} ({{sender_email}})</p>
        </div>
        <p><a href="{{listing_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Listing</a></p>
      </div>
    `,
    text: `
      New Message on Deal Flow
      
      You have received a new message regarding your listing:
      
      {{listing_title}}
      Address: {{listing_address}}
      Price: ${{listing_price}}
      
      Message: {{message_content}}
      From: {{sender_name}} ({{sender_email}})
      
      View listing: {{listing_url}}
    `
  },
  
  listing_status_change: {
    subject: 'Listing Status Updated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Listing Status Updated</h2>
        <p>Your listing status has been updated:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>{{listing_title}}</h3>
          <p><strong>Address:</strong> {{listing_address}}</p>
          <p><strong>New Status:</strong> <span style="color: {{status_color}}; font-weight: bold;">{{new_status}}</span></p>
          <p><strong>Previous Status:</strong> {{old_status}}</p>
        </div>
        <p><a href="{{listing_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Listing</a></p>
      </div>
    `,
    text: `
      Listing Status Updated
      
      Your listing status has been updated:
      
      {{listing_title}}
      Address: {{listing_address}}
      New Status: {{new_status}}
      Previous Status: {{old_status}}
      
      View listing: {{listing_url}}
    `
  },
  
  subscription_event: {
    subject: 'Subscription Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Subscription Update</h2>
        <p>{{event_message}}</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Subscription Details</h3>
          <p><strong>Plan:</strong> {{plan_name}}</p>
          <p><strong>Status:</strong> {{plan_status}}</p>
          <p><strong>Next Billing:</strong> {{next_billing_date}}</p>
        </div>
        <p><a href="{{account_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Manage Subscription</a></p>
      </div>
    `,
    text: `
      Subscription Update
      
      {{event_message}}
      
      Subscription Details:
      Plan: {{plan_name}}
      Status: {{plan_status}}
      Next Billing: {{next_billing_date}}
      
      Manage subscription: {{account_url}}
    `
  },
  
  ai_analysis_completed: {
    subject: 'AI Analysis Complete',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">AI Analysis Complete</h2>
        <p>Your AI analysis for the following listing is ready:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>{{listing_title}}</h3>
          <p><strong>Address:</strong> {{listing_address}}</p>
          <p><strong>ARV Range:</strong> ${{arv_low}} - ${{arv_high}}</p>
          <p><strong>Repair Estimate:</strong> ${{repair_low}} - ${{repair_high}}</p>
          <p><strong>MAO:</strong> ${{mao_recommended}}</p>
        </div>
        <p><a href="{{analysis_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Analysis</a></p>
      </div>
    `,
    text: `
      AI Analysis Complete
      
      Your AI analysis for the following listing is ready:
      
      {{listing_title}}
      Address: {{listing_address}}
      ARV Range: ${{arv_low}} - ${{arv_high}}
      Repair Estimate: ${{repair_low}} - ${{repair_high}}
      MAO: ${{mao_recommended}}
      
      View analysis: {{analysis_url}}
    `
  },
  
  daily_digest: {
    subject: 'Daily Deal Flow Digest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Daily Deal Flow Digest</h2>
        <p>Here's what happened with your listings today:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Summary</h3>
          <ul>
            <li><strong>New Messages:</strong> {{new_messages_count}}</li>
            <li><strong>New Views:</strong> {{new_views_count}}</li>
            <li><strong>Contact Actions:</strong> {{contact_actions_count}}</li>
            <li><strong>AI Analyses:</strong> {{ai_analyses_count}}</li>
          </ul>
        </div>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Top Performing Listings</h3>
          {{top_listings}}
        </div>
        
        <p><a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Dashboard</a></p>
      </div>
    `,
    text: `
      Daily Deal Flow Digest
      
      Here's what happened with your listings today:
      
      Summary:
      - New Messages: {{new_messages_count}}
      - New Views: {{new_views_count}}
      - Contact Actions: {{contact_actions_count}}
      - AI Analyses: {{ai_analyses_count}}
      
      Top Performing Listings:
      {{top_listings}}
      
      View dashboard: {{dashboard_url}}
    `
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
