import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.exchangeCodeForSession(); // sets session cookie
  const url = new URL(req.url);
  return NextResponse.redirect(url.origin + (url.searchParams.get('next') || '/'));
}
