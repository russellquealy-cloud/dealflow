import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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


