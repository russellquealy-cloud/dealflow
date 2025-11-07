import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";

async function createSupabaseFromCookies() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting might fail in some contexts, ignore silently
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (error) {
            // Cookie removal might fail in some contexts, ignore silently
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
}

async function handler(req: NextRequest) {
  try {
    const supabase = await createSupabaseFromCookies();
    
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    // Clear all auth-related cookies manually as backup
    const cookieStore = await cookies();
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    ];
    
    cookieNames.forEach(name => {
      try {
        cookieStore.delete(name);
      } catch {
        // Ignore errors
      }
    });
    
    const response = NextResponse.redirect(new URL("/login", req.url), { status: 302 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Also clear cookies in response headers
    cookieNames.forEach(name => {
      response.cookies.delete(name);
      response.cookies.set(name, '', { maxAge: 0, path: '/' });
    });
    
    return response;
  } catch (error) {
    console.error('Sign out handler error:', error);
    // Even if there's an error, redirect to welcome
    return NextResponse.redirect(new URL("/login", req.url), { status: 302 });
  }
}

export { handler as GET, handler as POST };
