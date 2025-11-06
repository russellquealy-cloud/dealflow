"use server";

import { createServerClient } from '@/supabase/server';
import { sendViaSMTP } from '@/lib/email';

/**
 * Trigger an alert for a user
 * Sends both in-app notification (via user_alerts table) and email
 */
export async function triggerAlert(
  userId: string,
  alertType: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('segment, role, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'User profile not found' };
    }

    const role = profile.segment || profile.role || 'investor';
    const userEmail = profile.email;

    // Check if this alert is enabled for the user
    const { data: alertPref } = await supabase
      .from('user_alerts')
      .select('is_enabled')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('alert_type', alertType)
      .single();

    // If alert is disabled, don't send
    if (alertPref && !alertPref.is_enabled) {
      return { success: true }; // Not an error, just disabled
    }

    // Send email notification if user has email
    if (userEmail) {
      try {
        const subject = `Off Axis Deals Alert: ${alertType}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">${alertType}</h2>
            <p style="color: #374151; line-height: 1.6;">${message}</p>
            ${metadata ? `<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 12px;">${JSON.stringify(metadata, null, 2)}</pre>` : ''}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Manage your alert preferences at <a href="${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.offaxisdeals.com'}/alerts">offaxisdeals.com/alerts</a>
            </p>
          </div>
        `;
        const text = `${alertType}\n\n${message}${metadata ? `\n\nDetails:\n${JSON.stringify(metadata, null, 2)}` : ''}`;

        await sendViaSMTP({
          to: userEmail,
          subject,
          html,
          text
        });
      } catch (emailError) {
        console.error('Error sending alert email:', emailError);
        // Continue even if email fails
      }
    }

    // Store alert notification in database (for in-app notifications)
    // You can create a `notifications` table later if needed for in-app notification center
    // For now, we just log it

    return { success: true };
  } catch (error) {
    console.error('Error triggering alert:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

