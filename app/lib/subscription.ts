import { createClient } from '@/lib/supabase/server';
import { STRIPE_PLANS, type SubscriptionTier, type PlanLimits } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

async function resolveClient(existing?: SupabaseClient) {
  if (existing) {
    return existing;
  }
  return createClient();
}

export async function getUserSubscription(userId: string, client?: SupabaseClient) {
  const supabase = await resolveClient(client);
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get subscription: ${error.message}`);
  }

  return subscription;
}

export async function getUserSubscriptionTier(userId: string, client?: SupabaseClient): Promise<SubscriptionTier> {
  const supabase = await resolveClient(client);
  
  const { data, error } = await supabase.rpc('get_user_subscription_tier', {
    user_uuid: userId
  });

  if (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }

  return (data as SubscriptionTier) || 'free';
}

export async function canUserPerformAction(
  userId: string,
  actionType: 'contacts' | 'ai_analyses' | 'listings',
  actionCount: number = 1,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = await resolveClient(client);
  
  const { data, error } = await supabase.rpc('can_user_perform_action', {
    user_uuid: userId,
    action_type: actionType,
    action_count: actionCount
  });

  if (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }

  return data || false;
}

export async function incrementUsage(
  userId: string,
  actionType: 'contacts' | 'ai_analyses' | 'listings',
  actionCount: number = 1,
  client?: SupabaseClient
): Promise<void> {
  const supabase = await resolveClient(client);
  
  const { error } = await supabase.rpc('increment_subscription_usage', {
    user_uuid: userId,
    action_type: actionType,
    action_count: actionCount
  });

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`);
  }
}

export async function getUserUsage(userId: string, client?: SupabaseClient) {
  const supabase = await resolveClient(client);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const { data: usage, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get usage: ${error.message}`);
  }

  return usage || {
    contacts_used: 0,
    ai_analyses_used: 0,
    listings_created: 0,
  };
}

// Map lowercase SubscriptionTier to uppercase SubscriptionTierLegacy for STRIPE_PLANS
function mapTierToLegacy(tier: SubscriptionTier): 'FREE' | 'INVESTOR_BASIC' | 'INVESTOR_PRO' | 'WHOLESALER_BASIC' | 'WHOLESALER_PRO' {
  switch (tier) {
    case 'free': return 'FREE';
    case 'basic': return 'INVESTOR_BASIC'; // Default to investor basic
    case 'pro': return 'INVESTOR_PRO'; // Default to investor pro
    case 'enterprise': return 'INVESTOR_PRO'; // Map enterprise to pro for now
    default: return 'FREE';
  }
}

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  const legacyTier = mapTierToLegacy(tier);
  return STRIPE_PLANS[legacyTier].limits;
}

export function getPlanFeatures(tier: SubscriptionTier) {
  const legacyTier = mapTierToLegacy(tier);
  return STRIPE_PLANS[legacyTier].features;
}

export async function logContactAction(
  userId: string,
  listingId: string,
  contactType: 'call' | 'email' | 'text',
  contactData: Record<string, unknown>,
  client?: SupabaseClient
) {
  const supabase = await resolveClient(client);
  
  const { error } = await supabase
    .from('contact_logs')
    .insert({
      user_id: userId,
      listing_id: listingId,
      contact_type: contactType,
      contact_data: contactData,
    });

  if (error) {
    throw new Error(`Failed to log contact action: ${error.message}`);
  }
}

export async function logAIAnalysis(
  userId: string,
  listingId: string,
  analysisType: 'arv' | 'repairs' | 'mao' | 'comps',
  inputData: Record<string, unknown>,
  outputData: Record<string, unknown>,
  costCents: number = 0,
  client?: SupabaseClient
) {
  const supabase = await resolveClient(client);
  
  const { error } = await supabase
    .from('ai_analysis_logs')
    .insert({
      user_id: userId,
      listing_id: listingId,
      analysis_type: analysisType,
      input_data: inputData,
      output_data: outputData,
      cost_cents: costCents,
    });

  if (error) {
    throw new Error(`Failed to log AI analysis: ${error.message}`);
  }
}
