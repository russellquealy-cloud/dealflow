import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // Return 0 instead of 401 for unauthenticated users
      return NextResponse.json({ count: 0 });
    }

    // Get count of unread messages for this user
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error counting unread messages:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}

