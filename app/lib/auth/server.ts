import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error("Failed to set cookie", error);
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch (error) {
            console.error("Failed to remove cookie", error);
          }
        },
      },
    }
  );
}

function extractBearerToken(source?: Headers | null) {
  const headerValue = source?.get("authorization") ?? source?.get("Authorization");
  if (!headerValue) return undefined;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : undefined;
}

export async function getAuthUser(request?: NextRequest | Request) {
  const supabase = await getSupabaseServer();

  let accessToken: string | undefined;
  if (request) {
    accessToken = extractBearerToken(request.headers);
  }
  if (!accessToken) {
    try {
      const headerStore = await headers();
      accessToken = extractBearerToken(headerStore);
    } catch {
      // headers() may throw if not in a request context; ignore
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return { user: null, supabase };
  }

  return { user, supabase };
}

