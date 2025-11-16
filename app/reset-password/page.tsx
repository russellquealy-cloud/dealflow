'use client';

import React from 'react';
import { supabase } from '@/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [updated, setUpdated] = React.useState(false);

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

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error('Reset password update error:', updateError);
        setError('Unable to update password. Please try again.');
        return;
      }
      setUpdated(true);
      setMessage('Your password has been updated.');
    } catch (err) {
      console.error('Reset password exception:', err);
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
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
          Enter a new password for your Off Axis Deals account.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 20, display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            disabled={loading}
            style={{
              marginTop: 4,
              height: 46,
              borderRadius: 12,
              border: 'none',
              background: loading ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating…' : 'Update Password'}
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



