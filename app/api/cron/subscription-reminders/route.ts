import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { notifySubscriptionRenewal } from '@/lib/notifications';
import { logger } from '@/lib/logger';

/**
 * Subscription Renewal Reminders Cron Job
 * 
 * This endpoint should be called by Vercel Cron or Supabase Cron
 * Runs daily to check for upcoming subscription renewals
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/subscription-reminders",
 *     "schedule": "0 9 * * *" // 9 AM daily
 *   }]
 * }
 * 
 * Security: Should be protected by a secret token or Vercel Cron headers
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (set in Vercel environment variables)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check Vercel Cron header
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    if (!vercelCronHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = await createSupabaseServer();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get users with subscriptions expiring soon
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, tier, segment, current_period_end, email')
      .not('current_period_end', 'is', null)
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', sevenDaysFromNow.toISOString())
      .in('tier', ['BASIC', 'PRO', 'ENTERPRISE']);

    if (profilesError) {
      logger.error('Error fetching profiles for renewal reminders', { error: profilesError });
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No subscriptions expiring soon', sent: 0 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        if (!profile.current_period_end) continue;

        const periodEnd = new Date(profile.current_period_end);
        const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        // Only send reminders at 7 days, 3 days, and 1 day before renewal
        if (daysUntilRenewal !== 7 && daysUntilRenewal !== 3 && daysUntilRenewal !== 1) {
          continue;
        }

        const tierName = profile.tier || 'subscription';
        const segmentName = profile.segment || 'account';

        await notifySubscriptionRenewal({
          ownerId: profile.id,
          title: `Subscription Renewal Reminder - ${daysUntilRenewal} Day${daysUntilRenewal !== 1 ? 's' : ''} Remaining`,
          body: `Your ${segmentName} ${tierName} subscription will renew in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}. Your payment method on file will be charged automatically.`,
          daysUntilRenewal,
          supabaseClient: supabase,
        });

        sentCount++;
        logger.log('Subscription renewal reminder sent', {
          userId: profile.id,
          daysUntilRenewal,
          tier: tierName,
        });
      } catch (error) {
        logger.error('Error sending renewal reminder', {
          error,
          userId: profile.id,
        });
        errors.push(`User ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Error in subscription-reminders cron', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

