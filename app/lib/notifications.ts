'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRole } from '@/lib/supabase/service';
import { sendViaSMTP } from '@/lib/email';
import { logger } from '@/lib/logger';

export type NotificationType =
  | 'buyer_interest'
  | 'lead_message'
  | 'listing_performance'
  | 'repair_estimate_ready'
  | 'property_verification'
  | 'market_trend'
  | 'subscription_renewal'
  | 'feedback_rating';

type PreferenceColumn =
  | 'buyer_interest'
  | 'lead_message'
  | 'listing_performance'
  | 'repair_estimate_ready'
  | 'property_verification'
  | 'market_trend'
  | 'subscription_renewal'
  | 'feedback_rating';

const TYPE_TO_COLUMN: Record<NotificationType, PreferenceColumn> = {
  buyer_interest: 'buyer_interest',
  lead_message: 'lead_message',
  listing_performance: 'listing_performance',
  repair_estimate_ready: 'repair_estimate_ready',
  property_verification: 'property_verification',
  market_trend: 'market_trend',
  subscription_renewal: 'subscription_renewal',
  feedback_rating: 'feedback_rating',
};

type NotificationPreferencesRow = Record<PreferenceColumn, boolean>;

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  listingId?: string | null;
  metadata?: Record<string, unknown> | null;
  supabaseClient?: SupabaseClient;
  sendEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
};

async function ensurePreferencesRow(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferencesRow | null> {
  const columns = Object.values(TYPE_TO_COLUMN);

  const { data, error } = await supabase
    .from('notification_preferences')
    .select(columns.join(', '))
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch notification preferences', { error, userId });
    return null;
  }

  if (data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    const preferences: Partial<NotificationPreferencesRow> = {};
    columns.forEach((key) => {
      const value = row[key];
      if (typeof value === 'boolean') {
        preferences[key] = value;
      }
    });

    if (Object.keys(preferences).length === columns.length) {
      return preferences as NotificationPreferencesRow;
    }
  }

  const { error: upsertError } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: userId },
      { onConflict: 'user_id', ignoreDuplicates: false }
    );

  if (upsertError) {
    logger.error('Failed to upsert notification preferences', { error: upsertError, userId });
    return null;
  }

  const { data: createdPreferences, error: fetchError } = await supabase
    .from('notification_preferences')
    .select(columns.join(', '))
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    logger.error('Failed to fetch notification preferences', { error: fetchError, userId });
    return null;
  }

  if (createdPreferences && typeof createdPreferences === 'object') {
    const row = createdPreferences as Record<string, unknown>;
    const preferences: Partial<NotificationPreferencesRow> = {};
    columns.forEach((key) => {
      const value = row[key];
      if (typeof value === 'boolean') {
        preferences[key] = value;
      }
    });

    if (Object.keys(preferences).length === columns.length) {
      return preferences as NotificationPreferencesRow;
    }
  }

  return null;
}

async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    // Try to get email from auth.users first (requires service role)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (!authError && authData?.user?.email) {
        return authData.user.email;
      }
    } catch (adminError) {
      // Admin API might not be available, try profiles table
      logger.log('Admin API not available, trying profiles table', { userId });
    }

    // Fallback to profiles table (if email is stored there)
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data && typeof data === 'object' && 'email' in data) {
      const email = data.email;
      if (typeof email === 'string' && email.length > 0) {
        return email;
      }
    }

    logger.warn('User email not found', { userId });
    return null;
  } catch (error) {
    logger.error('Failed to get user email', { error, userId });
    return null;
  }
}

/**
 * Central notification dispatcher
 * Creates in-app notification and optionally sends email
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  listingId = null,
  metadata = null,
  supabaseClient,
  sendEmail = false,
  emailSubject,
  emailBody,
}: CreateNotificationParams): Promise<{ skipped: boolean; emailSent?: boolean }> {
  let supabase = supabaseClient ?? null;

  if (!supabase) {
    try {
      supabase = await getSupabaseServiceRole();
    } catch (serviceError) {
      logger.warn(
        'Notifications service: service role client unavailable, notification skipped.',
        { error: serviceError }
      );
      return { skipped: true };
    }
  }

  const preferences =
    (await ensurePreferencesRow(supabase, userId)) ??
    ({
      buyer_interest: true,
      lead_message: true,
      listing_performance: true,
      repair_estimate_ready: true,
      property_verification: true,
      market_trend: true,
      subscription_renewal: true,
      feedback_rating: true,
    } satisfies NotificationPreferencesRow);

  const preferenceColumn = TYPE_TO_COLUMN[type];
  if (!preferences[preferenceColumn]) {
    logger.log('Notification skipped due to user preference', { userId, type });
    return { skipped: true };
  }

  // Create in-app notification
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    listing_id: listingId ?? null,
    metadata: metadata ?? null,
  });

  if (error) {
    logger.error('Failed to create notification', { error, userId, type });
    return { skipped: false, emailSent: false };
  }

  // Send email if requested and user has preference enabled
  let emailSent = false;
  if (sendEmail && emailSubject && emailBody) {
    try {
      const userEmail = await getUserEmail(supabase, userId);
      if (userEmail) {
        await sendViaSMTP({
          to: userEmail,
          subject: emailSubject,
          html: emailBody,
          text: emailBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        });
        emailSent = true;
        logger.log('Notification email sent', { userId, type, email: userEmail });
      } else {
        logger.warn('Cannot send notification email: user email not found', { userId });
      }
    } catch (emailError) {
      logger.error('Failed to send notification email', { error: emailError, userId, type });
    }
  }

  return { skipped: false, emailSent };
}

// ============================================================================
// SPECIFIC NOTIFICATION HELPERS
// ============================================================================

export async function notifyLeadMessage(params: {
  ownerId: string;
  listingTitle?: string | null;
  senderEmail?: string | null;
  listingId?: string | null;
  threadId?: string | null;
  followUp?: boolean;
  supabaseClient?: SupabaseClient;
}) {
  const { ownerId, listingTitle, senderEmail, listingId, threadId, followUp, supabaseClient } = params;
  const metadata: Record<string, unknown> | null =
    threadId || listingId
      ? {
          ...(threadId ? { threadId } : {}),
          ...(listingId ? { listingId } : {}),
        }
      : null;

  const title = listingTitle
    ? followUp
      ? `New message on ${listingTitle}`
      : `New inquiry on ${listingTitle}`
    : followUp
      ? 'New message about your listing'
      : 'New lead message';

  const body = senderEmail
    ? followUp
      ? `${senderEmail} replied to the ongoing conversation.`
      : `${senderEmail} sent a message about your listing.`
    : followUp
      ? 'A buyer sent another message about your listing.'
      : 'A prospect sent a message about your listing.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const messageUrl = listingId ? `${siteUrl}/messages/${listingId}${threadId ? `?thread=${threadId}` : ''}` : `${siteUrl}/messages`;

  const emailSubject = title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${body}</p>
      ${listingId ? `<p style="margin-top: 24px;"><a href="${messageUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Message</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: ownerId,
    type: 'lead_message',
    title,
    body,
    listingId: listingId ?? null,
    metadata,
    supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyBuyerInterest(params: {
  ownerId: string;
  listingTitle?: string | null;
  buyerEmail?: string | null;
  listingId?: string | null;
  action?: 'saved' | 'analyzed' | 'viewed';
  supabaseClient?: SupabaseClient;
}) {
  const { ownerId, listingTitle, buyerEmail, listingId, action = 'saved', supabaseClient } = params;
  
  const actionText = action === 'saved' ? 'saved' : action === 'analyzed' ? 'analyzed' : 'viewed';
  const title = listingTitle
    ? `Buyer interest on ${listingTitle}`
    : 'New buyer interest';
  
  const body = buyerEmail
    ? `${buyerEmail} ${actionText} your listing.`
    : `A buyer ${actionText} your listing.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const listingUrl = listingId ? `${siteUrl}/listing/${listingId}` : `${siteUrl}/my-listings`;

  const emailSubject = title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${body}</p>
      ${listingId ? `<p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: ownerId,
    type: 'buyer_interest',
    title,
    body,
    listingId: listingId ?? null,
    metadata: { action, buyerEmail: buyerEmail ?? null },
    supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyFeedbackRating(params: {
  ownerId: string;
  listingTitle?: string | null;
  reviewerName?: string | null;
  listingId?: string | null;
  supabaseClient?: SupabaseClient;
}) {
  const { ownerId, listingTitle, reviewerName, listingId, supabaseClient } = params;
  const title = listingTitle
    ? `New feedback on ${listingTitle}`
    : 'New feedback received';
  const body = reviewerName
    ? `${reviewerName} left feedback on your listing.`
    : 'A buyer left feedback on your listing.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const listingUrl = listingId ? `${siteUrl}/listing/${listingId}` : `${siteUrl}/my-listings`;

  const emailSubject = title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${body}</p>
      ${listingId ? `<p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: ownerId,
    type: 'feedback_rating',
    title,
    body,
    listingId: listingId ?? null,
    supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyListingPerformanceSummary(options: {
  ownerId: string;
  summaryTitle: string;
  summaryBody: string;
  supabaseClient?: SupabaseClient;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const emailSubject = options.summaryTitle;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${options.summaryTitle}</h2>
      <div style="color: #374151; font-size: 16px; line-height: 1.6;">${options.summaryBody.replace(/\n/g, '<br>')}</div>
      <p style="margin-top: 24px;"><a href="${siteUrl}/my-listings" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View My Listings</a></p>
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: options.ownerId,
    type: 'listing_performance',
    title: options.summaryTitle,
    body: options.summaryBody,
    supabaseClient: options.supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyRepairEstimateReady(options: {
  ownerId: string;
  listingTitle?: string | null;
  listingId?: string | null;
  repairCost?: number | null;
  supabaseClient?: SupabaseClient;
}) {
  const title = options.listingTitle
    ? `Repair estimate ready for ${options.listingTitle}`
    : 'Repair estimate is ready';
  const body = options.repairCost
    ? `Your AI repair estimate has finished processing. Estimated cost: $${options.repairCost.toLocaleString()}.`
    : 'Your AI repair estimate has finished processing.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const listingUrl = options.listingId ? `${siteUrl}/listing/${options.listingId}` : `${siteUrl}/my-listings`;

  const emailSubject = title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${body}</p>
      ${options.listingId ? `<p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: options.ownerId,
    type: 'repair_estimate_ready',
    title,
    body,
    listingId: options.listingId ?? null,
    metadata: options.repairCost ? { repairCost: options.repairCost } : null,
    supabaseClient: options.supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyPropertyVerification(options: {
  ownerId: string;
  listingTitle?: string | null;
  statusMessage: string;
  listingId?: string | null;
  supabaseClient?: SupabaseClient;
}) {
  const title = options.listingTitle
    ? `Verification update for ${options.listingTitle}`
    : 'Listing verification update';
  const body = options.statusMessage;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const listingUrl = options.listingId ? `${siteUrl}/listing/${options.listingId}` : `${siteUrl}/my-listings`;

  const emailSubject = title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${body}</p>
      ${options.listingId ? `<p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: options.ownerId,
    type: 'property_verification',
    title,
    body,
    listingId: options.listingId ?? null,
    supabaseClient: options.supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifyMarketTrend(options: {
  ownerId: string;
  title: string;
  body: string;
  listingId?: string | null;
  supabaseClient?: SupabaseClient;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';
  const listingUrl = options.listingId ? `${siteUrl}/listing/${options.listingId}` : `${siteUrl}/listings`;

  const emailSubject = options.title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${options.title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${options.body}</p>
      ${options.listingId ? `<p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Listing</a></p>` : ''}
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: options.ownerId,
    type: 'market_trend',
    title: options.title,
    body: options.body,
    listingId: options.listingId ?? null,
    supabaseClient: options.supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifySubscriptionRenewal(options: {
  ownerId: string;
  title: string;
  body: string;
  daysUntilRenewal?: number;
  supabaseClient?: SupabaseClient;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offaxisdeals.com';

  const emailSubject = options.title;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${options.title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">${options.body}</p>
      ${options.daysUntilRenewal !== undefined ? `<p style="color: #dc2626; font-weight: 600; margin-top: 16px;">${options.daysUntilRenewal} day${options.daysUntilRenewal !== 1 ? 's' : ''} until renewal</p>` : ''}
      <p style="margin-top: 24px;"><a href="${siteUrl}/account" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Subscription</a></p>
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">You can manage your notification preferences in your <a href="${siteUrl}/settings/notifications">account settings</a>.</p>
    </div>
  `;

  await createNotification({
    userId: options.ownerId,
    type: 'subscription_renewal',
    title: options.title,
    body: options.body,
    metadata: options.daysUntilRenewal !== undefined ? { daysUntilRenewal: options.daysUntilRenewal } : null,
    supabaseClient: options.supabaseClient,
    sendEmail: true,
    emailSubject,
    emailBody,
  });
}

export async function notifySavedSearchMatch(params: {
  userId: string;
  searchName: string;
  listingTitle?: string | null;
  listingId?: string | null;
  matchCount?: number;
  supabaseClient?: SupabaseClient;
}) {
  const { userId, searchName, listingTitle, listingId, matchCount = 1, supabaseClient } = params;
  
  const title = `New listing matches "${searchName}"`;
  const body = listingTitle
    ? `${listingTitle} matches your saved search criteria.`
    : `${matchCount} new ${matchCount === 1 ? 'listing' : 'listings'} match your saved search.`;

  await notifyMarketTrend({
    ownerId: userId,
    title,
    body,
    listingId: listingId ?? null,
    supabaseClient,
  });
}
