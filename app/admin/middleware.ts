import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/auth/server';

export async function adminMiddleware() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (check both role and segment fields)
  // Type assertion needed due to strict Supabase type checking
  const userId = String(user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment')
    .eq('id', userId)
    .single<{ role: string | null; segment: string | null }>();

  const isAdmin = profile?.role === 'admin' || profile?.segment === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.next();
}
