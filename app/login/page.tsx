'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/providers/AuthProvider';

export const dynamic = 'force-dynamic';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get('next') ?? '/listings';
  const error = params?.get('error');
  const { session, loading: authLoading, refreshSession } = useAuth();
  const [autoRedirected, setAutoRedirected] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(error || null);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');
  const [resetting, setResetting] = useState(false);

  // Handle magic link callback - detect session from URL on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (session) return; // Already have session, skip callback handling
    
    const handleMagicLinkCallback = async () => {
      // Check if we have a hash fragment with access_token (PKCE flow)
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('code='))) {
        logger.log('🔐 Magic link callback detected in URL hash');
        
        // The Supabase client should automatically detect this with detectSessionInUrl: true
        // Wait a moment for Supabase to process the callback, then check session
        // Only call refreshSession once to avoid rate limiting
        try {
          // Give Supabase time to process the URL hash
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if session was automatically detected by Supabase
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            logger.log('✅ Magic link session detected automatically, redirecting to:', next);
            // Clear the hash to clean up the URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            router.replace(next);
            return;
          }
          
          // If not automatically detected, try one refresh (but only once)
          await refreshSession();
          // Wait for session state to update
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check session state after refresh
          if (session) {
            logger.log('✅ Magic link session detected after refresh, redirecting to:', next);
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            router.replace(next);
          }
        } catch (error) {
          logger.error('❌ Error handling magic link callback:', error);
          // Handle rate limit errors gracefully
          if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('429'))) {
            setMessage('⚠️ Too many requests. Please wait a moment and refresh the page.');
          }
        }
      }
    };
    
    handleMagicLinkCallback();
  }, [session, next, router, refreshSession]);

  useEffect(() => {
    if (authLoading || !session || autoRedirected) {
      return;
    }

    // Prevent redirect loops - if we're already on the target page or any admin page, don't redirect
    const currentPath = window.location.pathname;
    
    // If next is /admin or we're trying to go to admin, and we have a session, 
    // just let the admin page handle the auth check (don't redirect from login page)
    if (next === '/admin' || next.startsWith('/admin') || currentPath.startsWith('/admin')) {
      console.log('🔐 Session exists and target is admin page, letting admin page handle auth check', { 
        currentPath, 
        next 
      });
      // Don't redirect - let the admin page load and handle auth client-side
      return;
    }
    
    if (currentPath === next || currentPath.startsWith(next + '/')) {
      console.log('🔐 Already on target page, skipping redirect', { currentPath, next });
      return;
    }

    // Prevent infinite redirects - only redirect once
    setAutoRedirected(true);
    console.log('🔐 Already signed in, redirecting to:', next);
    
    // Use a small delay to prevent rapid redirects and allow page to stabilize
    const timeoutId = setTimeout(() => {
      // Double-check we're not already on the target before redirecting
      const checkPath = window.location.pathname;
      if (checkPath !== next && !checkPath.startsWith(next + '/') && !checkPath.startsWith('/admin')) {
        router.replace(next);
      } else {
        console.log('🔐 Skipping redirect - already on target path', { checkPath, next });
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [authLoading, session, next, router, autoRedirected]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (loginMethod === 'password') {
        // Password login with enhanced mobile session handling
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('❌ Login: Password authentication failed', {
            error: error.message,
            code: error.status,
            email,
          });
          logger.error('❌ Login: Password authentication failed', {
            error: error.message,
            code: error.status,
            email,
            fullError: error,
          });
          setMessage(error.message);
          setLoading(false);
        } else if (data.session) {
          // Session is already valid from signInWithPassword - no need to call getSession() again
          // This prevents rate limiting from excessive API calls
          logger.log('🔐 Login successful:', data.session.user.email);
          console.log('🔐 Login successful, redirecting to:', next);
          
          // Store session for mobile persistence (optional)
          try {
            localStorage.setItem('dealflow-session', JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at
            }));
          } catch {
            // Ignore localStorage errors
          }
          
          // Session is already available from signInWithPassword
          // Supabase client will handle cookie persistence automatically
          // Only wait a brief moment for cookies to be written, then redirect
          // Avoid calling refreshSession() here to prevent rate limiting
          setTimeout(() => {
            console.log('🔐 Redirecting after login');
            // Use window.location for full page reload to ensure cookies are sent with request
            window.location.href = next;
          }, 200);
        } else {
          console.error('❌ Login: No session created after password authentication');
          logger.error('❌ Login: No session created after password authentication', {
            email,
            hasData: !!data,
          });
          setMessage('Login failed - no session created. Please try again.');
          setLoading(false);
        }
      } else {
        // Magic link login with consistent redirect URL
        // ROOT CAUSE FIX: Use /auth/callback route which properly handles code exchange
        // Always build redirect from NEXT_PUBLIC_SITE_URL (no hard-coded domains)
        // Include next parameter to redirect user to intended destination after login
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=${encodeURIComponent(next)}`;

        logger.log('📧 Requesting magic link:', {
          email,
          redirectUrl,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        });

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { 
            emailRedirectTo: redirectUrl,
            shouldCreateUser: true // Allow new user creation via magic link
          },
        });

        if (error) {
          // Enhanced error logging
          logger.error('❌ Magic link email delivery failed:', {
            error: error.message,
            code: error.status,
            email,
            redirectUrl,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
            fullError: error,
          });

          // Provide user-friendly error messages
          if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
            setMessage('⚠️ Too many requests. Please wait a few minutes and try again.');
          } else if (error.message?.includes('email') || error.message?.includes('invalid')) {
            setMessage('⚠️ Invalid email address. Please check and try again.');
          } else if (error.message?.includes('500') || error.message?.includes('server')) {
            setMessage('⚠️ Email service temporarily unavailable. Please try again in a few minutes or contact support.');
          } else {
            setMessage('⚠️ Unable to send magic link. Please try again later.');
          }
        } else {
          logger.log('✅ Magic link email sent successfully:', {
            email,
            redirectUrl,
          });
          setMessage('📧 Check your email for the sign-in link. It may take a few minutes to arrive.');
        }
      }
    } catch (error) {
      console.error('❌ Login: Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        loginMethod,
        email,
      });
      logger.error('❌ Login: Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        loginMethod,
        email,
        fullError: error,
      });
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email to receive a reset link.');
      return;
    }

    try {
      setResetting(true);
      setMessage(null);

      // ROOT CAUSE FIX: Always use NEXT_PUBLIC_SITE_URL (no localhost fallback in production)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl) {
        console.error('❌ Password reset: NEXT_PUBLIC_SITE_URL not configured');
        logger.error('❌ Password reset: NEXT_PUBLIC_SITE_URL not configured');
        setMessage('⚠️ Configuration error. Please contact support.');
        setResetting(false);
        return;
      }
      const redirectTo = `${siteUrl}/reset-password`;

      logger.log('🔑 Requesting password reset:', {
        email: email.trim(),
        redirectTo,
        siteUrl,
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        // Enhanced error logging
        logger.error('❌ Password reset email delivery failed:', {
          error: error.message,
          code: error.status,
          email: email.trim(),
          redirectTo,
          siteUrl,
          fullError: error,
        });

        // Provide user-friendly error messages
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          setMessage('⚠️ Too many requests. Please wait a few minutes and try again.');
        } else if (error.message?.includes('email') || error.message?.includes('invalid')) {
          setMessage('⚠️ Invalid email address. Please check and try again.');
        } else if (error.message?.includes('500') || error.message?.includes('server')) {
          setMessage('⚠️ Email service temporarily unavailable. Please try again in a few minutes or contact support.');
        } else {
          setMessage('⚠️ Unable to send reset email. Please try again later.');
        }
        return;
      }

      logger.log('✅ Password reset email sent successfully:', {
        email: email.trim(),
        redirectTo,
      });
      setMessage('🔑 Check your email for a password reset link. The link will be valid for 1 hour, giving you plenty of time to check your email and reset your password.');
    } catch (error) {
      logger.error('❌ Password reset exception:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: email.trim(),
        fullError: error,
      });
      setMessage('Unable to send reset email. Please try again later.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <main style={{ 
        background: 'white',
        padding: '32px 24px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            margin: '0 0 8px', 
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            margin: '0',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Sign in to your Off Axis Deals account
          </p>
        </div>
        
        {/* Login Method Toggle */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          marginBottom: '24px',
          background: '#f3f4f6',
          padding: '4px',
          borderRadius: '12px'
        }}>
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: loginMethod === 'password' ? '#3b82f6' : 'transparent',
              color: loginMethod === 'password' ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('magic-link')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: loginMethod === 'magic-link' ? '#3b82f6' : 'transparent',
              color: loginMethod === 'magic-link' ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ 
              fontSize: '14px', 
              color: '#374151',
              fontWeight: '500',
              display: 'block',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%',
                height: '48px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '0 16px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          {loginMethod === 'password' && (
            <div>
              <label style={{ 
                fontSize: '14px', 
                color: '#374151',
                fontWeight: '500',
                display: 'block',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%',
                  height: '48px', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '0 16px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}
          
          <button
            disabled={loading}
            style={{ 
              width: '100%',
              height: '48px', 
              borderRadius: '12px', 
              border: 'none', 
              background: loading ? '#9ca3af' : '#3b82f6', 
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Signing in…' : (loginMethod === 'password' ? 'Sign In' : 'Send Magic Link')}
          </button>
          
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: message.includes('error') || message.includes('Error') ? '#fef2f2' : '#f0f9ff',
              border: `1px solid ${message.includes('error') || message.includes('Error') ? '#fecaca' : '#bae6fd'}`,
              color: message.includes('error') || message.includes('Error') ? '#dc2626' : '#0369a1',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}
          
          {loginMethod === 'password' && (
            <div style={{ 
              textAlign: 'center',
              paddingTop: '8px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetting}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: resetting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resetting ? 'Sending reset email…' : 'Forgot password?'}
                </button>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0'
                }}>
                  Don&apos;t have an account?{' '}
                  <a href="/signup" style={{ 
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}>
                    Sign up here
                  </a>
                </p>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Loading login form...</div>}>
      <LoginInner />
    </Suspense>
  );
}
