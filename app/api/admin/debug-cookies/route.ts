import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/debug-cookies
 * 
 * Debug endpoint to see exactly what cookies route handlers receive.
 * This helps diagnose cookie/session sync issues between client and server.
 */
export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll().map((c) => ({
    name: c.name,
    // DO NOT return value, it may contain secrets
    hasValue: Boolean(c.value && c.value.length > 0),
    valueLength: c.value?.length ?? 0,
  }));

  console.log('[admin/debug-cookies]', {
    count: all.length,
    cookies: all.map(c => c.name),
    hasSupabaseCookies: all.some(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase') || 
      c.name.includes('auth-token')
    ),
  });

  return NextResponse.json(
    {
      count: all.length,
      cookies: all,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

