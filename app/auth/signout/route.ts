// /app/auth/signout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function handler(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL("/listings", url.origin));
  const reqCookies = cookies();
  const secure = process.env.NODE_ENV === "production";

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return reqCookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set(name, value, {
          path: "/",
          sameSite: "lax",
          secure,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set(name, "", {
          path: "/",
          sameSite: "lax",
          secure,
          ...options,
          expires: new Date(0),
        });
      },
    },
  });

  await supabase.auth.signOut();
  return res;
}

export const GET = handler;
export const POST = handler;
