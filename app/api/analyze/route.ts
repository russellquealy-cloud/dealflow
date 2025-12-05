import { NextRequest, NextResponse } from 'next/server';
import { analyzeProperty, type AIAnalysisInput } from '@/lib/ai-analyzer';
import { canUserPerformAction, getUserSubscriptionTier } from '@/lib/subscription';
import { getAuthUserServer } from '@/lib/auth/server';
import { checkAndIncrementAiUsage } from '@/lib/ai/usage';

export async function POST(request: NextRequest) {
  try {
    const { listingId, input }: { listingId: string; input: AIAnalysisInput } = await request.json();

    if (!listingId || !input) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user from session
    const { user, supabase } = await getAuthUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile for plan and test status
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, membership_tier, is_test, role')
      .eq('id', user.id)
      .single<{ tier: string | null; membership_tier: string | null; is_test: boolean | null; role: string | null }>();

    const isAdmin = profile?.role === 'admin';
    const profileTier = profile?.tier?.toLowerCase() ?? 'free';
    const membershipTier = profile?.membership_tier?.toLowerCase();
    const plan = membershipTier ?? profileTier ?? 'free';
    const isTestAccount = profile?.is_test === true;

    // Check AI usage quota
    const quota = await checkAndIncrementAiUsage(user.id, plan, isAdmin || isTestAccount);
    if (!quota.allowed) {
      const status = quota.reason === 'quota_exceeded' ? 429 : 500;
      const tier = await getUserSubscriptionTier(supabase, user.id);
      return NextResponse.json({ 
        error: quota.reason === 'quota_exceeded' 
          ? 'Monthly AI analysis quota exceeded. Please upgrade your plan or wait until next month.'
          : 'AI analysis temporarily unavailable',
        tier,
        upgrade_required: quota.reason === 'quota_exceeded'
      }, { status });
    }

    // Check if user can perform AI analysis (legacy check, kept for compatibility)
    const canAnalyze = await canUserPerformAction(user.id, 'ai_analyses', 1, supabase);
    if (!canAnalyze) {
      const tier = await getUserSubscriptionTier(supabase, user.id);
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
      .single<{ output_data: unknown }>();

    if (existingAnalysis) {
      return NextResponse.json({
        analysis: existingAnalysis.output_data,
        cached: true,
      });
    }

    // Fetch listing to get city/state for market snapshot lookup
    const { data: listing } = await supabase
      .from('listings')
      .select('city, state, address')
      .eq('id', listingId)
      .single<{ city: string | null; state: string | null; address: string | null }>();

    // Fetch market snapshot data for the metro
    let marketContext = undefined;
    if (listing?.city && listing?.state) {
      try {
        // Try to find market snapshot by region_name and state_name match
        // Region names in market_snapshots are typically like "Phoenix-Mesa-Scottsdale, AZ"
        // So we'll search for regions that contain the city name or match state
        type MarketSnapshotRow = {
          region_name: string | null;
          state_name: string | null;
          zhvi_mid_all: number | null;
          zhvi_mid_sfr: number | null;
          zori_rent_index: number | null;
          inventory_for_sale: number | null;
          new_listings: number | null;
          new_pending: number | null;
          sales_count: number | null;
          market_temp_index: number | null;
          pct_sold_above_list: number | null;
          pct_listings_price_cut: number | null;
          median_days_to_close: number | null;
          zhvf_growth_1m: number | null;
          zhvf_growth_3m: number | null;
          zhvf_growth_12m: number | null;
        };

        const { data: marketSnapshot, error: marketError } = await supabase
          .from('market_snapshots')
          .select(`
            region_name,
            state_name,
            zhvi_mid_all,
            zhvi_mid_sfr,
            zori_rent_index,
            inventory_for_sale,
            new_listings,
            new_pending,
            sales_count,
            market_temp_index,
            pct_sold_above_list,
            pct_listings_price_cut,
            median_days_to_close,
            zhvf_growth_1m,
            zhvf_growth_3m,
            zhvf_growth_12m
          `)
          .eq('region_type', 'msa')
          .eq('state_name', listing.state)
          .ilike('region_name', `%${listing.city}%`)
          .limit(1)
          .maybeSingle<MarketSnapshotRow>();

        if (marketSnapshot && !marketError) {
          marketContext = {
            zhviMidAll: marketSnapshot.zhvi_mid_all ? Number(marketSnapshot.zhvi_mid_all) : null,
            zhviMidSfr: marketSnapshot.zhvi_mid_sfr ? Number(marketSnapshot.zhvi_mid_sfr) : null,
            zoriRentIndex: marketSnapshot.zori_rent_index ? Number(marketSnapshot.zori_rent_index) : null,
            inventoryForSale: marketSnapshot.inventory_for_sale ? Number(marketSnapshot.inventory_for_sale) : null,
            newListings: marketSnapshot.new_listings ? Number(marketSnapshot.new_listings) : null,
            newPending: marketSnapshot.new_pending ? Number(marketSnapshot.new_pending) : null,
            salesCount: marketSnapshot.sales_count ? Number(marketSnapshot.sales_count) : null,
            marketTempIndex: marketSnapshot.market_temp_index ? Number(marketSnapshot.market_temp_index) : null,
            pctSoldAboveList: marketSnapshot.pct_sold_above_list ? Number(marketSnapshot.pct_sold_above_list) : null,
            pctListingsPriceCut: marketSnapshot.pct_listings_price_cut ? Number(marketSnapshot.pct_listings_price_cut) : null,
            medianDaysToClose: marketSnapshot.median_days_to_close ? Number(marketSnapshot.median_days_to_close) : null,
            zhvfGrowth1m: marketSnapshot.zhvf_growth_1m ? Number(marketSnapshot.zhvf_growth_1m) : null,
            zhvfGrowth3m: marketSnapshot.zhvf_growth_3m ? Number(marketSnapshot.zhvf_growth_3m) : null,
            zhvfGrowth12m: marketSnapshot.zhvf_growth_12m ? Number(marketSnapshot.zhvf_growth_12m) : null,
            regionName: marketSnapshot.region_name,
            stateName: marketSnapshot.state_name,
          };
          console.log(`[analyze] Found market snapshot for ${listing.city}, ${listing.state}`);
        } else {
          // Try fallback: just match by state if city match fails
          const { data: stateSnapshot } = await supabase
            .from('market_snapshots')
            .select(`
              region_name,
              state_name,
              zhvi_mid_all,
              zhvi_mid_sfr,
              zori_rent_index,
              inventory_for_sale,
              new_listings,
              new_pending,
              sales_count,
              market_temp_index,
              pct_sold_above_list,
              pct_listings_price_cut,
              median_days_to_close,
              zhvf_growth_1m,
              zhvf_growth_3m,
              zhvf_growth_12m
            `)
            .eq('region_type', 'msa')
            .eq('state_name', listing.state)
            .order('size_rank', { ascending: true })
            .limit(1)
            .maybeSingle<MarketSnapshotRow>();

          if (stateSnapshot) {
            marketContext = {
              zhviMidAll: stateSnapshot.zhvi_mid_all ? Number(stateSnapshot.zhvi_mid_all) : null,
              zhviMidSfr: stateSnapshot.zhvi_mid_sfr ? Number(stateSnapshot.zhvi_mid_sfr) : null,
              zoriRentIndex: stateSnapshot.zori_rent_index ? Number(stateSnapshot.zori_rent_index) : null,
              inventoryForSale: stateSnapshot.inventory_for_sale ? Number(stateSnapshot.inventory_for_sale) : null,
              newListings: stateSnapshot.new_listings ? Number(stateSnapshot.new_listings) : null,
              newPending: stateSnapshot.new_pending ? Number(stateSnapshot.new_pending) : null,
              salesCount: stateSnapshot.sales_count ? Number(stateSnapshot.sales_count) : null,
              marketTempIndex: stateSnapshot.market_temp_index ? Number(stateSnapshot.market_temp_index) : null,
              pctSoldAboveList: stateSnapshot.pct_sold_above_list ? Number(stateSnapshot.pct_sold_above_list) : null,
              pctListingsPriceCut: stateSnapshot.pct_listings_price_cut ? Number(stateSnapshot.pct_listings_price_cut) : null,
              medianDaysToClose: stateSnapshot.median_days_to_close ? Number(stateSnapshot.median_days_to_close) : null,
              zhvfGrowth1m: stateSnapshot.zhvf_growth_1m ? Number(stateSnapshot.zhvf_growth_1m) : null,
              zhvfGrowth3m: stateSnapshot.zhvf_growth_3m ? Number(stateSnapshot.zhvf_growth_3m) : null,
              zhvfGrowth12m: stateSnapshot.zhvf_growth_12m ? Number(stateSnapshot.zhvf_growth_12m) : null,
              regionName: stateSnapshot.region_name,
              stateName: stateSnapshot.state_name,
            };
            console.log(`[analyze] Found market snapshot by state for ${listing.state}`);
          } else {
            console.log(`[analyze] No market snapshot found for ${listing.city}, ${listing.state}`);
          }
        }
      } catch (marketErr) {
        console.error('[analyze] Error fetching market snapshot:', marketErr);
        // Continue without market context if there's an error
      }
    }

    // Perform AI analysis with market context
    const analysis = await analyzeProperty(user.id, listingId, {
      ...input,
      marketContext,
    });

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
    const { user, supabase } = await getAuthUserServer();
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
      .single<{ output_data: unknown; created_at: string }>();

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