import { getStripe } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

/**
 * Get or create a Stripe customer ID for a user
 * Stores the customer ID in the profiles table for future use
 */
export async function getOrCreateStripeCustomerId({
  user,
  supabase,
}: {
  user: User;
  supabase: SupabaseClient;
}): Promise<string | null> {
  // First, check if user already has a Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile for Stripe customer:', profileError);
    return null;
  }

  // If customer ID exists, return it
  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    // Store customer ID in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update stripe_customer_id in profile:', updateError);
      // Still return the customer ID even if DB update fails
      // The customer exists in Stripe, we can try to update DB later
    }

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return null;
  }
}

