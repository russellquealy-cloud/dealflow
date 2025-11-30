import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export async function adminMiddleware() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (check both role and segment fields)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', session.user.id)
    .single<{ role: string | null; segment: string | null }>();

  const isAdmin = profile?.role === 'admin' || profile?.segment === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.next();
}
