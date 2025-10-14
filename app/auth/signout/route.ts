import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

async function signout(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();

  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/login";
  return NextResponse.redirect(`${url.origin}${next}`);
}

export async function GET(req: Request) {
  return signout(req);
}

export async function POST(req: Request) {
  return signout(req);
}
