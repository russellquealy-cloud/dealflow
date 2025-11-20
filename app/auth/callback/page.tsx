'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { logger } from '@/lib/logger';

type Status = 'verifying' | 'error' | 'success';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState<string>('Signing you in...');

  useEffect(() => {
    if (!searchParams) {
      setStatus('error');
      setMessage('Invalid callback URL. Please request a new magic link.');
      setTimeout(() => {
        router.replace('/login?error=Invalid callback URL');
      }, 3000);
      return;
    }

    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/listings';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors from Supabase
    if (error) {
      logger.error('Auth callback error from Supabase:', {
        error,
        errorDescription,
      });
      setStatus('error');
      setMessage(errorDescription || error || 'Authentication failed. Please try again.');
      setTimeout(() => {
        router.replace(`/login?error=${encodeURIComponent(errorDescription || error || 'Authentication failed')}`);
      }, 3000);
      return;
    }

    if (!code) {
      logger.warn('Auth callback: No code found in URL');
      setStatus('error');
      setMessage('Missing auth code. Please request a new magic link.');
      setTimeout(() => {
        router.replace('/login?error=Missing auth code');
      }, 3000);
      return;
    }

    logger.log('Auth callback: Exchanging code for session (PKCE flow)...', {
      codeLength: code.length,
      next,
    });

    const run = async () => {
      try {
        // CRITICAL: Exchange code in browser where PKCE verifier is stored
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          logger.error('Auth callback: Code exchange failed', {
            error: exchangeError.message,
            code: exchangeError.status,
            errorCode: exchangeError.code,
            fullError: exchangeError,
          });
          console.error('Auth callback error:', exchangeError);
          
          setStatus('error');
          
          // Provide helpful error messages
          if (exchangeError.message?.includes('code challenge') || 
              exchangeError.message?.includes('verifier') ||
              exchangeError.message?.includes('code_verifier')) {
            setMessage('This magic link must be opened in the same browser where you requested it. Please request a new magic link and open it in the same browser.');
          } else if (exchangeError.message?.includes('expired') || exchangeError.message?.includes('invalid')) {
            setMessage('This sign-in link has expired or is invalid. Please request a new magic link.');
          } else {
            setMessage('Sign-in link is invalid or has expired. Please request a new magic link.');
          }
          
          setTimeout(() => {
            router.replace(`/login?error=${encodeURIComponent(exchangeError.message || 'Authentication failed')}`);
          }, 5000);
          return;
        }

        if (!data.session) {
          logger.error('Auth callback: Code exchange succeeded but no session returned');
          setStatus('error');
          setMessage('Session creation failed. Please try again.');
          setTimeout(() => {
            router.replace('/login?error=Session creation failed');
          }, 3000);
          return;
        }

        logger.log('Auth callback: Code exchange successful', {
          userId: data.session.user.id,
          email: data.session.user.email,
        });
        console.log('Auth callback: Successfully signed in', {
          userId: data.session.user.id,
          email: data.session.user.email,
        });

        setStatus('success');
        setMessage('Successfully signed in! Redirecting...');

        // Small delay to show success message, then redirect
        setTimeout(() => {
          router.replace(next);
        }, 500);
      } catch (err) {
        logger.error('Auth callback: Unexpected exception', {
          error: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
        });
        console.error('Auth callback: Unexpected error', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => {
          router.replace('/login?error=Unexpected error');
        }, 3000);
      }
    };

    void run();
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.125rem', color: '#374151', margin: 0 }}>
              {message}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ fontSize: '1.125rem', color: '#059669', margin: 0 }}>
              {message}
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ fontSize: '1.125rem', color: '#dc2626', margin: 0, marginBottom: '1rem' }}>
              {message}
            </p>
            <button
              onClick={() => router.replace('/login')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

