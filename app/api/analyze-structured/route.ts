import { NextRequest, NextResponse } from 'next/server';
import { analyzeStructured, type UserRole, type InvestorQuestionInput, type WholesalerQuestionInput } from '@/lib/ai-analyzer-structured';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { getAuthUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'investor' && role !== 'investor') {
      return NextResponse.json({ error: 'This analysis is only available for investors' }, { status: 403 });
    }

    if (profile?.role === 'wholesaler' && role !== 'wholesaler') {
      return NextResponse.json({ error: 'This analysis is only available for wholesalers' }, { status: 403 });
    }

    // Perform structured analysis
    const result = await analyzeStructured(user.id, role, input, supabase);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Structured analysis error:', error);
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Rate limit')) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      if (error.message.includes('limit reached') || error.message.includes('Upgrade')) {
        // Get user ID properly
        const { user, supabase } = await getAuthUser(request);
        const tier = user ? await getUserSubscriptionTier(user.id, supabase) : 'FREE';
        return NextResponse.json({ 
          error: error.message,
          upgrade_required: true,
          tier,
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
