import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers as nextHeaders } from 'next/headers';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  console.log('[api/messages/debug-auth] ENTER');

  // Mirror cookie/header debug from admin route
  const cookieStore = await cookies();
  const headerStore = await nextHeaders();

  console.log('[api/messages/debug-auth] cookie keys:', cookieStore.getAll().map(c => c.name));
  console.log('[api/messages/debug-auth] auth header present:', !!headerStore.get('authorization'));

  const supabase = await createSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('[api/messages/debug-auth] getUser result', {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    error: error ? { message: error.message, name: error.name } : null,
  });

  // Fallback to getSession if getUser fails (same as canonical route)
  let finalUser = user;
  let finalError = error;

  if (error || !user) {
    console.log('[api/messages/debug-auth] getUser failed, trying getSession', {
      error: error?.message,
      errorCode: error?.status,
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session && !sessionError) {
      finalUser = session.user;
      finalError = null;
      console.log('[api/messages/debug-auth] got session from getSession', {
        userId: finalUser.id,
        email: finalUser.email,
      });
    } else {
      console.log('[api/messages/debug-auth] getSession also failed', {
        sessionError: sessionError?.message,
        hasSession: !!session,
      });
    }
  }

  return NextResponse.json(
    {
      userId: finalUser?.id ?? null,
      email: finalUser?.email ?? null,
      error: finalError ? { message: finalError.message, name: finalError.name } : null,
    },
    { status: 200 }
  );
}

