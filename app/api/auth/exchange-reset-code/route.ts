/**
 * Exchange PKCE Code for Session (Password Reset)
 * 
 * This API route handles exchanging a PKCE code for a session on the server side,
 * where we have access to the code verifier stored in cookies.
 * 
 * POST /api/auth/exchange-reset-code
 * Body: { code: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }
    
    console.log('Exchange reset code: Exchanging PKCE code for session...', {
      codeLength: code.length,
    });
    
    // Use server-side client which has access to PKCE code verifier in cookies
    const supabase = await createClient();
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Exchange reset code: Code exchange failed', {
        error: exchangeError.message,
        code: exchangeError.status,
        errorCode: exchangeError.code,
      });
      
      return NextResponse.json(
        { 
          error: exchangeError.message || 'Failed to exchange code',
          code: exchangeError.code,
        },
        { status: 400 }
      );
    }
    
    if (!data.session) {
      console.error('Exchange reset code: Code exchange succeeded but no session returned');
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      );
    }
    
    console.log('Exchange reset code: Code exchange successful', {
      userId: data.session.user.id,
      email: data.session.user.email,
    });
    
    // Return success - session is now in cookies
    return NextResponse.json({
      success: true,
      message: 'Code exchanged successfully',
    });
  } catch (err) {
    console.error('Exchange reset code: Unexpected error', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

