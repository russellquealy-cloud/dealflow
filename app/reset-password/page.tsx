'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { logger } from '@/lib/logger';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [updated, setUpdated] = React.useState(false);
  const [tokenValid, setTokenValid] = React.useState<boolean | null>(null);
  const [exchangingCode, setExchangingCode] = React.useState(false);

  // CRITICAL FIX: For PKCE flow, we MUST exchange the code for a session BEFORE updateUser
  // updateUser requires an active session, which we get by exchanging the PKCE code
  React.useEffect(() => {
    const checkToken = async () => {
      // Wait for Supabase client to process the URL hash
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      
      logger.log('Checking for reset token:', {
        hash: hash ? hash.substring(0, 50) + '...' : 'none',
        search: urlParams?.toString() || 'none',
      });
      
      // First, check if Supabase has already processed the token and created a session
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session && !sessionError) {
          logger.log('Valid session found (Supabase processed token), token is valid');
          console.log('Password reset: Session found, token is valid');
          setTokenValid(true);
          return;
        }
      } catch (err) {
        logger.error('Error checking session:', err);
        console.error('Password reset: Error checking session', err);
      }
      
      // Check hash for access_token (implicit flow - most common for password reset)
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        logger.log('Password reset token detected in URL hash');
        console.log('Password reset: Token detected in URL hash');
        
        // The Supabase client should automatically process this with detectSessionInUrl: true
        // Give it a moment, then check session again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            logger.log('Session created after processing hash, token is valid');
            console.log('Password reset: Session created after processing hash');
            setTokenValid(true);
            return;
          }
        } catch (err) {
          logger.error('Error checking session after hash processing:', err);
          console.error('Password reset: Error checking session after hash', err);
        }
        
        // Even without session yet, if we have the token in hash, it should be valid
        logger.log('Token in hash detected, allowing password reset (session will be created on update)');
        console.log('Password reset: Token in hash detected, allowing form submission');
        setTokenValid(true);
        return;
      }
      
      // CRITICAL FIX: For PKCE flow (code in URL), exchange code for session FIRST
      // This is required because updateUser needs an active session
      const code = searchParams?.get('code') || urlParams?.get('code');
      if (code) {
        logger.log('Password reset code detected in URL (PKCE flow)');
        console.log('Password reset: Code detected in URL (PKCE flow)');
        console.log('Password reset: Exchanging code for session...');
        
        setExchangingCode(true);
        try {
          // CRITICAL: Exchange code for session BEFORE allowing password update
          // The server-side client has access to the PKCE verifier in cookies
          // But we need to do this client-side, so we'll use an API route
          const response = await fetch('/api/auth/exchange-reset-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            logger.error('Failed to exchange reset code:', errorData);
            console.error('Password reset: Failed to exchange code', errorData);
            setTokenValid(false);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setExchangingCode(false);
            return;
          }
          
          // Code exchanged successfully, session should now exist
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            logger.log('Code exchanged for session successfully');
            console.log('Password reset: Code exchanged for session successfully');
            setTokenValid(true);
            setExchangingCode(false);
            return;
          } else {
            logger.warn('Code exchanged but no session found');
            console.warn('Password reset: Code exchanged but no session found');
            // Still allow attempt - updateUser might work
            setTokenValid(true);
            setExchangingCode(false);
            return;
          }
        } catch (err) {
          logger.error('Error exchanging reset code:', err);
          console.error('Password reset: Error exchanging reset code', err);
          setTokenValid(false);
          setError('Failed to validate reset link. Please request a new password reset.');
          setExchangingCode(false);
          return;
        }
      }
      
      // If we get here and still no token, but we haven't explicitly failed, 
      // allow the user to try (updateUser will validate)
      if (tokenValid === null) {
        logger.warn('No reset token found in URL, but allowing attempt (updateUser will validate)');
        console.warn('Password reset: No token found, but allowing form submission');
        setTokenValid(true);
      }
    };
    
    checkToken();
  }, [searchParams, tokenValid]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!password || !confirm) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    // If token validation is still in progress, wait
    if (exchangingCode) {
      setError('Please wait while we validate your reset link...');
      return;
    }

    // If token is explicitly invalid, show error
    if (tokenValid === false) {
      setError('Invalid or expired reset token. Please request a new password reset link.');
      return;
    }
    
    setLoading(true);
    try {
      logger.log('Updating password...');
      console.log('Password reset: Attempting to update password');
      
      // Check if we have a session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        logger.error('No session found for password update');
        console.error('Password reset: No session found');
        setError('Session expired. Please request a new password reset link.');
        setLoading(false);
        return;
      }
      
      // Now update password (requires active session)
      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) {
        logger.error('Reset password update error:', {
          error: updateError.message,
          code: updateError.status,
          fullError: updateError,
        });
        console.error('Password reset: Update failed', {
          error: updateError.message,
          code: updateError.status,
        });
        
        // Provide user-friendly error messages
        if (updateError.message?.includes('expired') || updateError.message?.includes('invalid')) {
          setError('This reset link has expired or is invalid. Please request a new password reset.');
        } else if (updateError.message?.includes('weak') || updateError.message?.includes('password')) {
          setError('Password is too weak. Please choose a stronger password (minimum 8 characters, include numbers and letters).');
        } else if (updateError.message?.includes('session')) {
          setError('Session expired. Please request a new password reset link and try again.');
        } else if (updateError.message?.includes('token')) {
          setError('Invalid or expired reset token. Please request a new password reset link.');
        } else {
          setError(`Unable to update password: ${updateError.message || 'Unknown error'}. Please try again or request a new reset link.`);
        }
        return;
      }
      
      if (!data.user) {
        logger.error('Password reset: Update succeeded but no user returned');
        console.error('Password reset: Update succeeded but no user data');
        setError('Password update completed but session error occurred. Please try logging in.');
        return;
      }
      
      logger.log('Password updated successfully');
      console.log('Password reset: Password updated successfully', {
        userId: data.user.id,
        email: data.user.email,
      });
      
      setUpdated(true);
      setMessage('Your password has been updated successfully. Redirecting to login...');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?message=Password updated successfully. Please sign in with your new password.');
      }, 2000);
    } catch (err) {
      logger.error('Reset password exception:', err);
      console.error('Password reset: Exception', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <main style={{
        background: '#fff',
        padding: '28px 22px',
        borderRadius: 16,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#111827', textAlign: 'center' }}>
          Reset Your Password
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
          Enter a new password for your Off Axis Deals account.
        </p>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
          Password reset links are valid for 1 hour after being sent.
        </p>
        {exchangingCode && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            fontSize: 14
          }}>
            Validating reset link... Please wait.
          </div>
        )}
        {tokenValid === false && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 14
          }}>
            Invalid or expired reset link. Please <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>request a new password reset</a>.
          </div>
        )}
        {tokenValid === true && !error && !updated && !exchangingCode && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
            fontSize: 14
          }}>
            Reset link validated. Please enter your new password below.
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: 20, display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={exchangingCode || loading}
              style={{
                height: 46,
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '0 14px',
                fontSize: 16
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              disabled={exchangingCode || loading}
              style={{
                height: 46,
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '0 14px',
                fontSize: 16
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || tokenValid === false || exchangingCode}
            style={{
              marginTop: 4,
              height: 46,
              borderRadius: 12,
              border: 'none',
              background: (loading || tokenValid === false || exchangingCode) ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: (loading || tokenValid === false || exchangingCode) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating…' : exchangingCode ? 'Validating…' : 'Update Password'}
          </button>
        </form>

        {(error || message) && (
          <div style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: error ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${error ? '#fecaca' : '#d1fae5'}`,
            color: error ? '#991b1b' : '#065f46',
            fontSize: 14
          }}>
            {error || message}
          </div>
        )}

        {updated && (
          <a
            href="/login"
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#10b981',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              textAlign: 'center',
              width: '100%'
            }}
          >
            Go to Login
          </a>
        )}
      </main>
    </div>
  );
}
