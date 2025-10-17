import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

function createSupabaseFromCookies() {
  // Cast to any to support environments where cookies() is (incorrectly) typed as a Promise
  const store = cookies() as unknown as {
    get: (name: string) => { value: string } | undefined;
    set: (init: { name: string; value: string } & CookieOptions) => void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get?.(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set?.({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set?.({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

async function handler(req: Request) {
  const supabase = createSupabaseFromCookies();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 302 });
}

export { handler as GET, handler as POST };
