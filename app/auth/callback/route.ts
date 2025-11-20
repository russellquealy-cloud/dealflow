/**
 * Authentication Callback Route
 * 
 * Handles Supabase auth callbacks from magic links and OAuth providers.
 * 
 * CRITICAL FIX: Supabase is using PKCE flow (code in URL), but the code verifier
 * must be handled server-side. The client cannot exchange the code because the
 * verifier isn't stored in the client's localStorage.
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to: https://offaxisdeals.com/auth/callback?code=...
 * 3. This route exchanges the code for a session (server-side, has access to verifier)
 * 4. Sets session cookies with proper domain/security settings
 * 5. Redirects user to intended destination (or /listings)
 * 
 * Required Supabase Auth URL allowlist entries:
 * - https://offaxisdeals.com/auth/callback
 * - https://www.offaxisdeals.com/auth/callback
 */

import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/listings";
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error('❌ Auth callback error from Supabase:', {
      error,
      errorDescription,
      url: req.url,
    });
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(errorDescription || error || 'Authentication failed')}`
    );
  }

  try {
    // CRITICAL: Use server-side client which has access to PKCE code verifier
    const supabase = await createClient();
    
    if (code) {
      // PKCE flow: Exchange code for session (server-side has access to verifier)
      console.log('🔐 Auth callback: Exchanging code for session (PKCE flow)...', {
        codeLength: code.length,
        next,
        hasCode: !!code,
      });
      
      // The server-side client can exchange the code because it has access to the verifier
      // stored in cookies from the initial magic link request
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('❌ Auth callback: Code exchange failed', {
          error: exchangeError.message,
          code: exchangeError.status,
          errorCode: exchangeError.code,
          fullError: exchangeError,
        });
        
        // If PKCE code challenge mismatch, the verifier might not be in cookies
        // In this case, redirect to login with helpful error
        if (exchangeError.message?.includes('code challenge') || exchangeError.message?.includes('verifier')) {
          console.error('❌ Auth callback: PKCE code verifier mismatch - verifier may not be in cookies');
          return NextResponse.redirect(
            `${url.origin}/login?error=${encodeURIComponent('Authentication session expired. Please request a new magic link.')}`
          );
        }
        
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent(exchangeError.message || 'Authentication failed')}`
        );
      }
      
      if (!data.session) {
        console.error('❌ Auth callback: Code exchange succeeded but no session returned');
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent('Session creation failed. Please try again.')}`
        );
      }
      
      console.log('✅ Auth callback: Code exchange successful', {
        userId: data.session.user.id,
        email: data.session.user.email,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      });
      
      // Force session refresh to ensure cookies are set
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Auth callback: Error getting session after exchange', {
          error: sessionError.message,
        });
        // Continue anyway - cookies should be set by exchangeCodeForSession
      } else if (sessionData?.session) {
        console.log('✅ Auth callback: Session confirmed after code exchange', {
          userId: sessionData.session.user.id,
        });
      } else {
        console.warn('⚠️ Auth callback: No session found after code exchange (cookies may not be set)');
      }
    } else {
      // Implicit flow: Check if session already exists (Supabase client should have processed hash)
      console.log('🔐 Auth callback: No code found, checking for existing session (implicit flow)...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Auth callback: Session error (implicit flow)', {
          error: sessionError.message,
        });
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent(sessionError.message || 'Session error')}`
        );
      }
      
      if (sessionData?.session) {
        console.log('✅ Auth callback: Session found (implicit flow)', {
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email,
        });
      } else {
        console.warn('⚠️ Auth callback: No session found (implicit flow), redirecting to login');
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent('No session found. Please try logging in again.')}`
        );
      }
    }

    console.log('🔐 Auth callback: Success, redirecting to:', next);
    
    // Create redirect response
    const redirectUrl = `${url.origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cache headers to prevent caching of auth state
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (err) {
    console.error('❌ Auth callback: Unexpected exception', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    );
  }
}
