import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { logger } from '@/lib/logger';

/**
 * Monthly Cleanup Job for AI Usage
 * 
 * This endpoint should be called by Vercel Cron or Supabase Cron
 * Runs monthly to delete AI usage records older than 30 days
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-ai-usage",
 *     "schedule": "0 2 1 * *" // 2 AM on the 1st of every month
 *   }]
 * }
 * 
 * Security: Should be protected by a secret token or Vercel Cron headers
 */
export const runtime = 'nodejs';

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10); // YYYY-MM-DD format

    logger.log('🧹 Starting AI usage cleanup', { cutoffDate });

    // Delete AI usage records older than 30 days
    const { data: deletedData, error: deleteError } = await supabase
      .from('ai_usage')
      .delete()
      .lt('month_start', cutoffDate)
      .select('id');

    if (deleteError) {
      logger.error('Error deleting old AI usage records', { error: deleteError });
      return NextResponse.json(
        { error: 'Failed to delete old records', details: deleteError.message },
        { status: 500 }
      );
    }

    const deletedCount = deletedData?.length ?? 0;

    logger.log('✅ AI usage cleanup completed', { 
      deletedCount,
      cutoffDate 
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate,
      message: `Deleted ${deletedCount} AI usage record(s) older than 30 days`,
    });
  } catch (error) {
    logger.error('Error in cleanup-ai-usage cron', { error });
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

