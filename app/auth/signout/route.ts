import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

async function handler(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();

  // send them home (uses current request origin so it works on localhost & Vercel)
  const url = new URL("/", req.url);
  return NextResponse.redirect(url, { status: 302 });
}

export { handler as POST, handler as GET };
