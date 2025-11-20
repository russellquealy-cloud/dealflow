import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

/**
 * Email Diagnostics Endpoint
 * 
 * Allows admins to send test emails to verify email delivery configuration.
 * 
 * POST /api/diagnostics/email
 * Body: { email?: string } (optional - defaults to admin's email)
 * 
 * Returns: { success: boolean, message: string, details?: {...} }
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // CRITICAL FIX: Try getSession first (reads from cookies), then getUser as fallback
    // getSession is more reliable for cookie-based auth
    let user = null;
    let userError = null;
    
    // First try getSession (reads from cookies)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      user = sessionData.session.user;
      console.log('Email diagnostics: Got user from session', {
        userId: user.id,
        email: user.email,
      });
    } else if (sessionError) {
      console.warn('Email diagnostics: Session error, trying getUser', {
        error: sessionError.message,
      });
      // Fallback to getUser
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      } else {
        userError = getUserError;
      }
    } else {
      // No session, try getUser
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      } else {
        userError = getUserError;
      }
    }
    
    if (userError || !user) {
      console.error('Email diagnostics: Unauthorized', {
        sessionError: sessionError?.message,
        getUserError: userError?.message,
        hasSession: !!sessionData?.session,
      });
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Please ensure you are logged in' 
      }, { status: 401 });
    }
    
    // Check if user is admin
    const adminCheck = await isAdmin(user.id, supabase);
    if (!adminCheck) {
      console.error('Email diagnostics: Forbidden (not admin)', {
        userId: user.id,
        email: user.email,
      });
      return NextResponse.json({ 
        success: false, 
        message: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }
    
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.email || user.email;
    
    if (!targetEmail) {
      console.error('❌ Email diagnostics: No email provided');
      return NextResponse.json({ 
        success: false, 
        message: 'Email address required' 
      }, { status: 400 });
    }
    
    logger.log('📧 Email diagnostics: Sending test emails', {
      adminId: user.id,
      adminEmail: user.email,
      targetEmail,
    });
    
    // Get site URL from environment (no localhost fallback in production)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error('❌ Email diagnostics: NEXT_PUBLIC_SITE_URL not configured');
      return NextResponse.json({ 
        success: false, 
        message: 'Site URL not configured. Please set NEXT_PUBLIC_SITE_URL environment variable.' 
      }, { status: 500 });
    }
    
    // Test 1: Magic link email
    const magicLinkRedirect = `${siteUrl}/auth/callback`;
    logger.log('📧 Email diagnostics: Sending test magic link', {
      email: targetEmail,
      redirectTo: magicLinkRedirect,
    });
    
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: magicLinkRedirect,
        shouldCreateUser: false, // Don't create user for test emails
      },
    });
    
    if (magicLinkError) {
      console.error('❌ Email diagnostics: Magic link failed', {
        error: magicLinkError.message,
        code: magicLinkError.status,
        email: targetEmail,
      });
    }
    
    // Test 2: Password reset email
    const resetRedirect = `${siteUrl}/reset-password`;
    logger.log('📧 Email diagnostics: Sending test password reset', {
      email: targetEmail,
      redirectTo: resetRedirect,
    });
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: resetRedirect,
    });
    
    if (resetError) {
      console.error('❌ Email diagnostics: Password reset failed', {
        error: resetError.message,
        code: resetError.status,
        email: targetEmail,
      });
    }
    
    const results = {
      magicLink: {
        success: !magicLinkError,
        error: magicLinkError?.message || null,
      },
      passwordReset: {
        success: !resetError,
        error: resetError?.message || null,
      },
    };
    
    const allSuccess = results.magicLink.success && results.passwordReset.success;
    
    if (allSuccess) {
      logger.log('✅ Email diagnostics: All test emails sent successfully', {
        targetEmail,
      });
    } else {
      logger.error('❌ Email diagnostics: Some test emails failed', {
        targetEmail,
        results,
      });
    }
    
    return NextResponse.json({
      success: allSuccess,
      message: allSuccess 
        ? `Test emails sent successfully to ${targetEmail}. Please check your inbox.`
        : `Some test emails failed. Check the details below.`,
      details: {
        targetEmail,
        siteUrl,
        results,
      },
    });
  } catch (error) {
    console.error('❌ Email diagnostics: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
