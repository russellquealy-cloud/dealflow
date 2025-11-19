import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/listings";

  try {
    const supabase = await createClient();
    
    if (code) {
      // PKCE flow: Exchange code for session
      console.log('🔐 Auth callback: Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Auth callback error:', error);
        // Redirect to login with error message
        return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(error.message)}`);
      }
      
      console.log('✅ Auth callback successful (PKCE flow):', data?.user?.email);
      
      // Force session refresh to ensure cookies are set
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('✅ Session confirmed after code exchange');
      }
    } else {
      // Implicit flow: Check if session already exists (Supabase client should have processed hash)
      console.log('🔐 Auth callback: No code found, checking for existing session (implicit flow)...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Auth callback session error:', sessionError);
        return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(sessionError.message)}`);
      }
      
      if (sessionData?.session) {
        console.log('✅ Auth callback successful (implicit flow):', sessionData.session.user.email);
      } else {
        console.warn('⚠️ Auth callback: No session found, redirecting to login');
        return NextResponse.redirect(`${url.origin}/login?error=No session found. Please try logging in again.`);
      }
    }

    console.log('🔐 Auth callback successful, redirecting to:', next);
    
    // Create a response with mobile-friendly redirect
    const response = NextResponse.redirect(`${url.origin}${next}`);
    
    // Add mobile-specific headers for better session persistence
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (err) {
    console.error('❌ Auth callback exception:', err);
    return NextResponse.redirect(`${url.origin}/login?error=Authentication failed`);
  }
}
