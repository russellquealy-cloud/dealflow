import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // Required: pass the auth code from the callback URL
    await supabase.auth.exchangeCodeForSession(code);
  }

  const next = url.searchParams.get("next") || "/";
  return NextResponse.redirect(`${url.origin}${next}`);
}
