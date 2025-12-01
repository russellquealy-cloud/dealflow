import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/supabase/server';

export const runtime = 'nodejs';

const PREFERENCE_FIELDS = [
  'buyer_interest',
  'lead_message',
  'listing_performance',
  'repair_estimate_ready',
  'property_verification',
  'market_trend',
  'subscription_renewal',
  'feedback_rating',
] as const;

type PreferenceField = (typeof PREFERENCE_FIELDS)[number];
type NotificationPreferences = Record<PreferenceField, boolean>;
type PreferencesPayload = Partial<NotificationPreferences>;

function isPreferencesPayload(input: unknown): input is PreferencesPayload {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  return Object.entries(input).every(([key, value]) => {
    return (
      PREFERENCE_FIELDS.includes(key as PreferenceField) &&
      typeof value === 'boolean'
    );
  });
}

async function fetchOrCreatePreferences(
  userId: string,
  supabaseClient: SupabaseClient
) {
  const supabase = supabaseClient;
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load notification preferences', error);
    // Don't throw NextResponse here - throw a regular Error that can be caught
    throw new Error(`Failed to load notification preferences: ${error.message}`);
  }

  if (data) {
    return data as NotificationPreferences & { id: string; user_id: string };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('notification_preferences')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (insertError || !inserted) {
    console.error('Failed to create notification preferences', insertError);
    // Don't throw NextResponse here - throw a regular Error that can be caught
    throw new Error(`Failed to create notification preferences: ${insertError?.message || 'Unknown error'}`);
  }

  return inserted as NotificationPreferences & { id: string; user_id: string };
}

export async function GET(request: NextRequest) {
  try {
    // Use modern auth pattern - same as other working routes
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await fetchOrCreatePreferences(user.id, supabase);
    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Error loading notification preferences', error);
    return NextResponse.json(
      { error: 'Failed to load notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use modern auth pattern - same as other working routes
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (!isPreferencesPayload(body) || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Ensure the row exists before attempting to update.
    await fetchOrCreatePreferences(user.id, supabase);

    const { data: updated, error: updateError } = await supabase
      .from('notification_preferences')
      .update(body as never)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      console.error('Failed to update notification preferences', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating notification preferences', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}


