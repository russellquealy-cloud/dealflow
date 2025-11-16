import { NextRequest, NextResponse } from 'next/server';
import { analyzeStructured, type UserRole, type InvestorQuestionInput, type WholesalerQuestionInput } from '@/lib/ai-analyzer-structured';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { getAuthUser } from '@/lib/auth/server';
import { checkAndIncrementAiUsage } from '@/lib/ai/usage';
import type { SubscriptionTier } from '@/lib/stripe';
import { notifyRepairEstimateReady } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  let subscriptionTier: SubscriptionTier = 'FREE';

  try {
    const body = await request.json();
    const { role, input }: { role: UserRole; input: InvestorQuestionInput | WholesalerQuestionInput } = body;

    if (!role || !input) {
      return NextResponse.json({ error: 'Missing required fields: role, input' }, { status: 400 });
    }

    if (role !== 'investor' && role !== 'wholesaler') {
      return NextResponse.json({ error: 'Invalid role. Must be "investor" or "wholesaler"' }, { status: 400 });
    }

    // Get user from session
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role matches
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment, tier, membership_tier')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role ?? null;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && userRole === 'investor' && role !== 'investor') {
      return NextResponse.json({ error: 'This analysis is only available for investors' }, { status: 403 });
    }

    if (!isAdmin && userRole === 'wholesaler' && role !== 'wholesaler') {
      return NextResponse.json({ error: 'This analysis is only available for wholesalers' }, { status: 403 });
    }

    subscriptionTier = await getUserSubscriptionTier(user.id, supabase);

    // Get plan and test status from profile
    const profileTier = profile?.tier?.toLowerCase() ?? 'free';
    const membershipTier = profile?.membership_tier?.toLowerCase();
    const plan = membershipTier ?? profileTier ?? 'free';
    
    // Check if user is a test account
    // Check profile.is_test field first, then fallback to email/segment checks
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('is_test')
      .eq('id', user.id)
      .single();
    
    const email = (user.email ?? '').toLowerCase();
    const isTestAccount =
      fullProfile?.is_test === true ||
      email.endsWith('@test.com') ||
      email.endsWith('@example.com') ||
      profile?.segment?.toLowerCase() === 'test';

    const quota = await checkAndIncrementAiUsage(user.id, plan, isAdmin || isTestAccount);
    if (!quota.allowed) {
      const status = quota.reason === 'quota_exceeded' ? 429 : 500;
      return NextResponse.json({ error: quota.reason ?? 'quota_error' }, { status });
    }

    // Perform structured analysis
    const result = await analyzeStructured(user.id, role, input, supabase, {
      bypassLimits: isAdmin,
      planTier: subscriptionTier,
      isTestAccount: isAdmin || isTestAccount,
    });

    // Notify if repair estimate was completed for a listing
    // Check if input has listingId (may be in metadata or direct field)
    const listingId = 'listingId' in input && typeof input.listingId === 'string' 
      ? input.listingId 
      : null;

    if (role === 'wholesaler' && input.questionType === 'repair_estimate' && listingId) {
      try {
        const { data: listingData } = await supabase
          .from('listings')
          .select('owner_id, title')
          .eq('id', listingId)
          .maybeSingle();

        if (listingData?.owner_id && listingData.owner_id === user.id) {
          const repairCost = result.result && typeof result.result === 'object' && 'answer' in result.result
            ? typeof result.result.answer === 'number' ? result.result.answer : null
            : null;

          await notifyRepairEstimateReady({
            ownerId: listingData.owner_id,
            listingTitle: typeof listingData.title === 'string' ? listingData.title : null,
            listingId,
            repairCost,
            supabaseClient: supabase,
          });
        }
      } catch (notificationError) {
        console.error('Failed to send repair estimate notification', notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Structured analysis error:', error);
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Rate limit')) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      if (error.message.includes('limit reached') || error.message.includes('Upgrade')) {
        return NextResponse.json({ 
          error: error.message,
          upgrade_required: true,
          tier: subscriptionTier,
        }, { status: 403 });
      }
      if (error.message.includes('Missing required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
