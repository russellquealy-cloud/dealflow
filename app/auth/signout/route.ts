import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

function createSupabase() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

async function handler(req: Request) {
  const supabase = createSupabase();
  await supabase.auth.signOut();
  const url = new URL("/", req.url);
  return NextResponse.redirect(url, { status: 302 });
}

export { handler as GET, handler as POST };
