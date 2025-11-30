// lib/subscription.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/stripe";

// Basic plan limits you can expand later
type PlanLimits = {
  ai_analyses: number;
};

const planLimits: Record<SubscriptionTier, PlanLimits> = {
  free: { ai_analyses: 2 },        // Free: 2 AI analyses / month
  basic: { ai_analyses: 20 },      // Basic: 20
  pro: { ai_analyses: 100 },       // Pro: 100
  enterprise: { ai_analyses: 999999 }, // Enterprise: effectively unlimited
};

// Return plan limits for a given tier
export function getPlanLimits(
  tier: SubscriptionTier | null | undefined
): PlanLimits {
  if (!tier) return planLimits.free;

  const t = tier.toLowerCase() as SubscriptionTier;

  return planLimits[t] ?? planLimits.free;
}

// Fetch user subscription tier from the profiles table
// This keeps the API route working without errors.
export async function getUserSubscriptionTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tier, membership_tier")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return "free";
  }

  const tier =
    (data.membership_tier ?? data.tier ?? "free").toLowerCase() as SubscriptionTier;

  return tier;
}

// Minimal stubs for ai-analyzer-structured compatibility
export async function getUserUsage(
  userId: string,
  supabase: SupabaseClient
): Promise<{ ai_analyses_used?: number } | null> {
  // Stub implementation - expand later
  return { ai_analyses_used: 0 };
}

export async function incrementUsage(
  userId: string,
  field: string,
  amount: number,
  supabase: SupabaseClient
): Promise<void> {
  // Stub implementation - expand later
  // This would increment usage counters in the database
}

// Minimal stub for ai-analyzer compatibility
export async function canUserPerformAction(
  userId: string,
  actionType: 'contacts' | 'ai_analyses' | 'listings',
  actionCount: number = 1,
  client?: SupabaseClient
): Promise<boolean> {
  // Stub implementation - expand later
  // This would check if user can perform the action based on their subscription
  return true;
}

// Minimal stub for ai-analyzer compatibility
export async function logAIAnalysis(
  userId: string,
  listingId: string,
  analysisType: 'arv' | 'repairs' | 'mao' | 'comps',
  inputData: Record<string, unknown>,
  outputData: Record<string, unknown>,
  costCents: number = 0,
  client?: SupabaseClient
): Promise<void> {
  // Stub implementation - expand later
  // This would log the AI analysis to the database
}

