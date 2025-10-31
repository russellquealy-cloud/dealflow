/**
 * Email service integration
 * Supports SMTP, Resend, and SendGrid
 * Set EMAIL_SERVICE in .env.local to 'smtp', 'resend', 'sendgrid', or 'console'
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const service = process.env.EMAIL_SERVICE || 'console';
  
  // Determine from email - use provided or default
  let fromEmail = options.from || process.env.EMAIL_FROM || 'noreply@offaxisdeals.com';
  
  // Parse "Name <email>" format if needed
  if (fromEmail.includes('<')) {
    // Already formatted
  } else {
    // Use SMTP_FROM format if available
    const smtpFrom = process.env.SMTP_FROM;
    if (smtpFrom) {
      fromEmail = smtpFrom;
    }
  }

  try {
    switch (service) {
      case 'smtp':
        return await sendViaSMTP({ ...options, from: fromEmail });
      case 'resend':
        return await sendViaResend({ ...options, from: fromEmail });
      case 'sendgrid':
        return await sendViaSendGrid({ ...options, from: fromEmail });
      case 'console':
      default:
        console.log('=== EMAIL (CONSOLE MODE) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('From:', fromEmail);
        console.log('Text:', options.text || options.html);
        console.log('===========================');
        return true;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

async function sendViaSMTP(options: EmailOptions & { from: string }): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error('SMTP configuration incomplete. Need SMTP_HOST, SMTP_USER, and SMTP_PASS');
    return false;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // Parse from email format
    let fromName = 'Off Axis Deals';
    let fromAddress = options.from;
    if (options.from.includes('<')) {
      const match = options.from.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        fromName = match[1].replace(/['"]/g, '');
        fromAddress = match[2];
      }
    }

    // Send mail
    const info = await transporter.sendMail({
      from: options.from, // Use full format if provided
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
      replyTo: options.replyTo || process.env.SMTP_REPLY_TO || fromAddress,
    });

    console.log('Email sent via SMTP:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    return false;
  }
}

async function sendViaResend(options: EmailOptions & { from: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html || options.text,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return false;
  }
}

async function sendViaSendGrid(options: EmailOptions & { from: string }): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not set');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: { email: options.from },
        subject: options.subject,
        content: [
          {
            type: options.html ? 'text/html' : 'text/plain',
            value: options.html || options.text || '',
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}

/**
 * Send feedback email
 */
export async function sendFeedbackEmail(type: string, subject: string, message: string, userEmail?: string): Promise<boolean> {
  const supportEmail = process.env.SUPPORT_EMAIL || 'customerservice@offaxisdeals.com';
  const fromEmail = process.env.SMTP_FROM || 'Off Axis Deals Support <customerservice@offaxisdeals.com>';
  
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

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>${emailSubject}</h2>
        ${userEmail ? `<p><strong>From:</strong> ${userEmail}</p>` : '<p><strong>From:</strong> Anonymous</p>'}
        <p><strong>Type:</strong> ${type}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </body>
    </html>
  `;

  return await sendEmail({
    to: supportEmail,
    from: fromEmail,
    replyTo: userEmail || supportEmail,
    subject: emailSubject,
    html,
    text: `From: ${userEmail || 'Anonymous'}\nType: ${type}\n\n${message}`,
  });
}

/**
 * Send message notification email
 */
export async function sendMessageNotificationEmail(
  recipientEmail: string,
  senderName: string,
  listingTitle: string,
  messagePreview: string,
  messageLink: string
): Promise<boolean> {
  const noreplyEmail = process.env.NOREPLY_EMAIL || 'noreply@offaxisdeals.com';
  const fromEmail = `Off Axis Deals <${noreplyEmail}>`;
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Message from ${senderName}</h2>
        <p>You have received a new message about: <strong>${listingTitle}</strong></p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
          "${messagePreview}"
        </p>
        <p>
          <a href="${messageLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View Message
          </a>
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from Off Axis Deals. Please do not reply to this email.
          <br>To respond, visit your messages at: <a href="${messageLink}">${messageLink}</a>
        </p>
      </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    from: fromEmail,
    subject: `New message about ${listingTitle}`,
    html,
    text: `You have received a new message from ${senderName} about ${listingTitle}.\n\n"${messagePreview}"\n\nView message: ${messageLink}\n\n---\nThis is an automated notification. Please do not reply to this email.`,
  });
}

/**
 * Send sales inquiry email
 */
export async function sendSalesEmail(
  name: string,
  email: string,
  company: string | undefined,
  message: string
): Promise<boolean> {
  const salesEmail = process.env.SALES_EMAIL || 'sales@offaxisdeals.com';
  const fromEmail = process.env.SMTP_FROM || 'Off Axis Deals Support <customerservice@offaxisdeals.com>';
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Sales Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </body>
    </html>
  `;

  return await sendEmail({
    to: salesEmail,
    from: fromEmail,
    replyTo: email,
    subject: `Sales Inquiry from ${name}`,
    html,
    text: `Name: ${name}\nEmail: ${email}\n${company ? `Company: ${company}\n` : ''}\nMessage:\n${message}`,
  });
}

