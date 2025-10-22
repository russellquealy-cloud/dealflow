import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  try {
    if (code) {
      const supabase = await createClient();
      // Required: pass the auth code from the callback URL
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        // Redirect to login with error message
        return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(error.message)}`);
      }
      
      console.log('🔐 Mobile auth callback successful:', data);
      
      // Force session refresh for mobile compatibility
      await supabase.auth.getSession();
    }

    console.log('Auth callback successful, redirecting to:', next);
    
    // Create a response with mobile-friendly redirect
    const response = NextResponse.redirect(`${url.origin}${next}`);
    
    // Add mobile-specific headers for better session persistence
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(`${url.origin}/login?error=Authentication failed`);
  }
}
