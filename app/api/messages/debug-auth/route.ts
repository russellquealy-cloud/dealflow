import { NextRequest, NextResponse } from 'next/server';
import { createApiSupabaseFromAuthHeader } from '@/lib/auth/apiSupabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const supabase = createApiSupabaseFromAuthHeader(authHeader);

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        {
          userId: null,
          email: null,
          authHeaderPresent: Boolean(authHeader),
          error: error
            ? { name: error.name, message: error.message }
            : { name: 'NoUser', message: 'No user from supabase.auth.getUser()' },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        userId: data.user.id,
        email: data.user.email,
        authHeaderPresent: Boolean(authHeader),
        error: null,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    return NextResponse.json(
      {
        userId: null,
        email: null,
        authHeaderPresent: Boolean(authHeader),
        error: {
          name: 'UnexpectedError',
          message: e instanceof Error ? e.message : String(e),
        },
      },
      { status: 200 },
    );
  }
}
