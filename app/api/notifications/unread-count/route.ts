import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use the same auth pattern as working routes (e.g., /api/alerts, /api/billing/create-checkout-session)
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to load unread notification count', error);
      return NextResponse.json(
        { error: 'Failed to load unread notification count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error('Error loading unread notification count', error);
    return NextResponse.json(
      { error: 'Failed to load unread notification count' },
      { status: 500 }
    );
  }
}


