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

  useEffect(() => {
    if (authLoading || !session || autoRedirected) {
      return;
    }

    setAutoRedirected(true);
    console.log('🔐 Already signed in, redirecting to:', next);
    router.replace(next);
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
          } catch (_error) {
            // Ignore localStorage errors
          }
          
          // Small delay to ensure session is fully set, then redirect
          setTimeout(async () => {
            await refreshSession();
            router.replace(next);
          }, 300);
        } else {
          setMessage('Login failed - no session created');
          setLoading(false);
        }
      } else {
        // Magic link login with mobile-optimized redirect
        const origin = window.location.origin;
        const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { 
            emailRedirectTo: redirectTo,
            shouldCreateUser: true // Allow new user creation via magic link
          },
        });

        if (error) {
          // Provide user-friendly error messages
          if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
            setMessage('⚠️ Too many requests. Please wait a few minutes and try again.');
          } else if (error.message?.includes('email') || error.message?.includes('invalid')) {
            setMessage('⚠️ Invalid email address. Please check and try again.');
          } else if (error.message?.includes('500') || error.message?.includes('server')) {
            setMessage('⚠️ Email service temporarily unavailable. Please try again in a few minutes or contact support.');
          } else {
            setMessage(`⚠️ ${error.message || 'Unable to send magic link. Please try again later.'}`);
          }
          logger.error('Magic link error:', error);
        } else {
          setMessage('📧 Check your email for the sign-in link. It may take a few minutes to arrive.');
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      logger.error('Login error:', error);
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

      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          setMessage('⚠️ Too many requests. Please wait a few minutes and try again.');
        } else if (error.message?.includes('email') || error.message?.includes('invalid')) {
          setMessage('⚠️ Invalid email address. Please check and try again.');
        } else if (error.message?.includes('500') || error.message?.includes('server')) {
          setMessage('⚠️ Email service temporarily unavailable. Please try again in a few minutes or contact support.');
        } else {
          setMessage(`⚠️ ${error.message || 'Unable to send reset email. Please try again later.'}`);
        }
        logger.error('Password reset error:', error);
        return;
      }

      setMessage('🔑 Check your email for a password reset link.');
    } catch (error) {
      logger.error('Password reset error:', error);
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
