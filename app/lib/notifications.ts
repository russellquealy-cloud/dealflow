'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRole } from '@/lib/supabase/service';

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
    console.error('Failed to fetch notification preferences', error);
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
    console.error('Failed to upsert notification preferences', upsertError);
    return null;
  }

  const { data: createdPreferences, error: fetchError } = await supabase
    .from('notification_preferences')
    .select(columns.join(', '))
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch notification preferences', fetchError);
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

export async function createNotification({
  userId,
  type,
  title,
  body,
  listingId = null,
  metadata = null,
  supabaseClient,
}: CreateNotificationParams): Promise<{ skipped: boolean }> {
  let supabase = supabaseClient ?? null;

  if (!supabase) {
    try {
      supabase = await getSupabaseServiceRole();
    } catch (serviceError) {
      console.warn(
        'Notifications service: service role client unavailable, notification skipped.',
        serviceError
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
    return { skipped: true };
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    listing_id: listingId ?? null,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error('Failed to create notification', error);
  }

  return { skipped: false };
}

export async function notifyLeadMessage(params: {
  ownerId: string;
  listingTitle?: string | null;
  senderEmail?: string | null;
  listingId?: string | null;
}) {
  const { ownerId, listingTitle, senderEmail, listingId } = params;
  await createNotification({
    userId: ownerId,
    type: 'lead_message',
    title: listingTitle
      ? `New inquiry on ${listingTitle}`
      : 'New lead message',
    body: senderEmail
      ? `${senderEmail} sent a message about your listing.`
      : 'A prospect sent a message about your listing.',
    listingId: listingId ?? null,
  });
}

export async function notifyFeedbackRating(params: {
  ownerId: string;
  listingTitle?: string | null;
  reviewerName?: string | null;
  listingId?: string | null;
}) {
  const { ownerId, listingTitle, reviewerName, listingId } = params;
  await createNotification({
    userId: ownerId,
    type: 'feedback_rating',
    title: listingTitle
      ? `New feedback on ${listingTitle}`
      : 'New feedback received',
    body: reviewerName
      ? `${reviewerName} left feedback on your listing.`
      : 'A buyer left feedback on your listing.',
    listingId: listingId ?? null,
  });
}

// TODO: Hook these helpers into scheduled jobs / workflows once they are implemented.
export async function notifyListingPerformanceSummary(options: {
  ownerId: string;
  summaryTitle: string;
  summaryBody: string;
}) {
  await createNotification({
    userId: options.ownerId,
    type: 'listing_performance',
    title: options.summaryTitle,
    body: options.summaryBody,
  });
}

export async function notifyRepairEstimateReady(options: {
  ownerId: string;
  listingTitle?: string | null;
  listingId?: string | null;
}) {
  await createNotification({
    userId: options.ownerId,
    type: 'repair_estimate_ready',
    title: options.listingTitle
      ? `Repair estimate ready for ${options.listingTitle}`
      : 'Repair estimate is ready',
    body: 'Your AI repair estimate has finished processing.',
    listingId: options.listingId ?? null,
  });
}

export async function notifyPropertyVerification(options: {
  ownerId: string;
  listingTitle?: string | null;
  statusMessage: string;
  listingId?: string | null;
}) {
  await createNotification({
    userId: options.ownerId,
    type: 'property_verification',
    title: options.listingTitle
      ? `Verification update for ${options.listingTitle}`
      : 'Listing verification update',
    body: options.statusMessage,
    listingId: options.listingId ?? null,
  });
}

export async function notifyMarketTrend(options: {
  ownerId: string;
  title: string;
  body: string;
}) {
  await createNotification({
    userId: options.ownerId,
    type: 'market_trend',
    title: options.title,
    body: options.body,
  });
}

export async function notifySubscriptionRenewal(options: {
  ownerId: string;
  title: string;
  body: string;
}) {
  await createNotification({
    userId: options.ownerId,
    type: 'subscription_renewal',
    title: options.title,
    body: options.body,
  });
}
