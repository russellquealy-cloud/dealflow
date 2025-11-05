import { NextRequest, NextResponse } from 'next/server';
import { calculateDeal, type DealInput } from '@/app/lib/deal-calculator';
import { createClient } from '@/lib/supabase/server';
import { canUserPerformAction, getUserSubscriptionTier } from '@/lib/subscription';

/**
 * Simple deal analysis endpoint
 * Accepts: { price, arv, repairs, sqft, lot_sqft }
 * Returns: { spread, roi, mao, notes, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is the simple format (user input calculator)
    if (body.price !== undefined && body.arv !== undefined && body.repairs !== undefined) {
      // Simple format - calculate from user inputs
      const input: DealInput = {
        price: Number(body.price) || 0,
        arv: Number(body.arv) || 0,
        repairs: Number(body.repairs) || 0,
        sqft: Number(body.sqft) || 0,
        lot_sqft: body.lot_sqft ? Number(body.lot_sqft) : undefined,
      };

      // Validate required fields
      if (!input.price || !input.arv || !input.sqft) {
        return NextResponse.json(
          { error: 'Price, ARV, and SqFt are required' },
          { status: 400 }
        );
      }

      // Optional: Check subscription if you want to gate this feature
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user can perform analysis (optional - can remove if open to all)
        const canAnalyze = await canUserPerformAction(user.id, 'ai_analyses', 1);
        if (!canAnalyze) {
          const tier = await getUserSubscriptionTier(user.id);
          return NextResponse.json(
            {
              error: 'Analysis not available on your plan',
              tier,
              upgrade_required: true,
            },
            { status: 403 }
          );
        }

        // Save analysis to database for history (optional)
        try {
          const analysis = calculateDeal(input);
          const { error: saveError } = await supabase.from('ai_analysis_logs').insert({
            user_id: user.id,
            listing_id: null, // No specific listing
            analysis_type: 'deal_calculator',
            input_data: input,
            output_data: analysis,
            cost: 0, // Free calculation
          });

          if (saveError) {
            console.warn('Failed to save analysis:', saveError);
          }
        } catch (saveErr) {
          console.warn('Error saving analysis:', saveErr);
        }
      }

      // Calculate and return results
      const analysis = calculateDeal(input);
      return NextResponse.json({
        spread: analysis.spread,
        roi: analysis.roi,
        mao: analysis.mao,
        totalInvestment: analysis.totalInvestment,
        profitMargin: analysis.profitMargin,
        profitMarginPercent: analysis.profitMarginPercent,
        pricePerSqft: analysis.pricePerSqft,
        arvPerSqft: analysis.arvPerSqft,
        notes: analysis.notes,
      });
    }

    // Legacy format not supported - return error with helpful message
    return NextResponse.json(
      { error: 'Use simple format: {price, arv, repairs, sqft, lot_sqft}' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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