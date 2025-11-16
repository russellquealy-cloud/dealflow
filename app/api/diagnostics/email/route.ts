import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { logger } from '@/lib/logger';
import { isAdmin } from '@/lib/admin';

/**
 * Email delivery diagnostics endpoint
 * POST /api/diagnostics/email
 * Body: { email?: string }
 * 
 * Tests Supabase auth email delivery (magic link and password reset)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      logger.warn('Email diagnostics: Non-admin user attempted access', {
        userId: user.id,
        email: user.email,
      });
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Get test email from body or use current user's email
    const body = await request.json().catch(() => ({}));
    const testEmail = body.email || user.email;

    if (!testEmail || typeof testEmail !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const loginRedirect = `${siteUrl}/login`;
    const resetRedirect = `${siteUrl}/reset-password`;

    logger.log('📧 Email diagnostics: Testing email delivery', {
      testEmail,
      siteUrl,
      loginRedirect,
      resetRedirect,
    });

    const results: {
      magicLink: { success: boolean; error?: string };
      passwordReset: { success: boolean; error?: string };
    } = {
      magicLink: { success: false },
      passwordReset: { success: false },
    };

    // Test 1: Magic Link
    try {
      logger.log('📧 Testing magic link email delivery...');
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: loginRedirect,
          shouldCreateUser: false, // Don't create user if doesn't exist
        },
      });

      if (magicLinkError) {
        logger.error('❌ Magic link email test failed:', {
          error: magicLinkError.message,
          code: magicLinkError.status,
          testEmail,
          redirectTo: loginRedirect,
        });
        results.magicLink = {
          success: false,
          error: magicLinkError.message || 'Unknown error',
        };
      } else {
        logger.log('✅ Magic link email test succeeded');
        results.magicLink = { success: true };
      }
    } catch (error) {
      logger.error('❌ Magic link email test exception:', error);
      results.magicLink = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: Password Reset
    try {
      logger.log('📧 Testing password reset email delivery...');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: resetRedirect,
      });

      if (resetError) {
        logger.error('❌ Password reset email test failed:', {
          error: resetError.message,
          code: resetError.status,
          testEmail,
          redirectTo: resetRedirect,
        });
        results.passwordReset = {
          success: false,
          error: resetError.message || 'Unknown error',
        };
      } else {
        logger.log('✅ Password reset email test succeeded');
        results.passwordReset = { success: true };
      }
    } catch (error) {
      logger.error('❌ Password reset email test exception:', error);
      results.passwordReset = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Return comprehensive results
    return NextResponse.json({
      success: results.magicLink.success && results.passwordReset.success,
      testEmail,
      siteUrl,
      redirects: {
        login: loginRedirect,
        resetPassword: resetRedirect,
      },
      results,
      timestamp: new Date().toISOString(),
      recommendations: [
        results.magicLink.success && results.passwordReset.success
          ? '✅ All email tests passed! Check your inbox for test emails.'
          : '⚠️ Some email tests failed. Check Supabase dashboard SMTP configuration.',
        `Verify these URLs are whitelisted in Supabase Auth → URL Configuration:`,
        `  - ${loginRedirect}`,
        `  - ${resetRedirect}`,
        `Check Supabase Auth → Email Templates for correct template variables:`,
        `  - {{ .Email }}`,
        `  - {{ .TokenHash }}`,
        `  - {{ .ConfirmationURL }} (for magic link)`,
        `  - {{ .RedirectTo }} (for password reset)`,
      ],
    });
  } catch (error) {
    logger.error('❌ Email diagnostics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run email diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

