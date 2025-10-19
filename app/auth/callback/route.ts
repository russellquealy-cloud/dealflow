import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  try {
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      // Required: pass the auth code from the callback URL
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        // Redirect to login with error message
        return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(error.message)}`);
      }
    }

    console.log('Auth callback successful, redirecting to:', next);
    return NextResponse.redirect(`${url.origin}${next}`);
  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(`${url.origin}/login?error=Authentication failed`);
  }
}
