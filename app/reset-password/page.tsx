'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { logger } from '@/lib/logger';

type Status = 'verifying' | 'ready' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState<string>('Verifying reset link...');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      logger.warn('Password reset: No code found in URL');
      setStatus('error');
      setMessage('Reset link is invalid. Please request a new one.');
      return;
    }

    logger.log('Password reset: Exchanging code for session (PKCE flow)...', {
      codeLength: code.length,
    });

    const run = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          logger.error('Password reset exchange error', {
            error: error.message,
            code: error.status,
            errorCode: error.code,
          });
          console.error('Password reset exchange error', error);
          setStatus('error');
          setMessage('Reset link is invalid or has expired. Please request a new one.');
          return;
        }

        if (!data.session) {
          logger.error('Password reset: Code exchanged but no session returned');
          setStatus('error');
          setMessage('Session creation failed. Please request a new password reset.');
          return;
        }

        logger.log('Password reset: Code exchanged successfully', {
          userId: data.session.user.id,
          email: data.session.user.email,
        });
        setStatus('ready');
        setMessage('');
      } catch (err) {
        logger.error('Password reset: Unexpected error during code exchange', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        console.error('Password reset: Unexpected error', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    void run();
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setStatus('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setMessage('');
    setStatus('ready');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        logger.error('Password update error', {
          error: error.message,
          code: error.status,
        });
        console.error('Password update error', error);
        setStatus('error');
        setMessage(error.message || 'Unable to update password. Please try again.');
        return;
      }

      logger.log('Password updated successfully');
      setMessage('Password updated successfully. Redirecting to login...');
      setStatus('ready');

      setTimeout(() => {
        router.replace('/login?message=Password updated successfully');
      }, 2000);
    } catch (err) {
      logger.error('Password reset: Unexpected error during update', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      console.error('Password reset: Unexpected error', err);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem' 
      }}>
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.125rem', color: '#374151', margin: 0 }}>{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && !password) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem' 
      }}>
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <p style={{ fontSize: '1.125rem', color: '#dc2626', margin: '0 0 1rem 0' }}>{message}</p>
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
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1.5rem' 
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          background: '#fff',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
          Reset Password
        </h1>
        {message && (
          <p style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: status === 'error' ? '#fef2f2' : '#ecfdf5',
            color: status === 'error' ? '#991b1b' : '#065f46',
            fontSize: '0.875rem',
          }}>
            {message}
          </p>
        )}
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            disabled={submitting}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            disabled={submitting}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: submitting ? '#9ca3af' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
