import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSupabaseServer() {
  const cookieStore = (await cookies()) as Awaited<ReturnType<typeof cookies>>;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function getAuthUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase };
  }

  return { user, supabase };
}

