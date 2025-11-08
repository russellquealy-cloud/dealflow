import { NextRequest, NextResponse } from 'next/server';
import { analyzeProperty, type AIAnalysisInput } from '@/lib/ai-analyzer';
import { canUserPerformAction, getUserSubscriptionTier } from '@/lib/subscription';
import { getAuthUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { listingId, input }: { listingId: string; input: AIAnalysisInput } = await request.json();

    if (!listingId || !input) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user from session
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can perform AI analysis
    const canAnalyze = await canUserPerformAction(user.id, 'ai_analyses', 1, supabase);
    if (!canAnalyze) {
      const tier = await getUserSubscriptionTier(user.id, supabase);
      return NextResponse.json({ 
        error: 'AI analysis not available on your plan',
        tier,
        upgrade_required: true 
      }, { status: 403 });
    }

    // Check if analysis already exists for this listing
    const { data: existingAnalysis } = await supabase
      .from('ai_analysis_logs')
      .select('output_data')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .eq('analysis_type', 'arv')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingAnalysis) {
      return NextResponse.json({
        analysis: existingAnalysis.output_data,
        cached: true,
      });
    }

    // Perform AI analysis
    const analysis = await analyzeProperty(user.id, listingId, input);

    return NextResponse.json({
      analysis,
      cached: false,
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Get user from session
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cached analysis
    const { data: analysis, error } = await supabase
      .from('ai_analysis_logs')
      .select('output_data, created_at')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .eq('analysis_type', 'arv')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get analysis: ${error.message}`);
    }

    if (!analysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    return NextResponse.json({
      analysis: analysis.output_data,
      created_at: analysis.created_at,
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to get analysis' },
      { status: 500 }
    );
  }
}