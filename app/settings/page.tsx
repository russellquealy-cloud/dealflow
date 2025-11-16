'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=/settings');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 100px)' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      padding: '32px 24px' 
    }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: 32, 
          fontWeight: 700 
        }}>
          Settings
        </h1>
        <p style={{ 
          margin: 0, 
          color: '#6b7280', 
          fontSize: 16 
        }}>
          Manage your account preferences and notifications
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: 16,
      }}>
        <Link
          href="/settings/notifications"
          style={{
            display: 'block',
            padding: '20px 24px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            textDecoration: 'none',
            color: '#111827',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <h2 style={{ 
                margin: '0 0 4px 0', 
                fontSize: 18, 
                fontWeight: 600 
              }}>
                🔔 Notification Preferences
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: 14 
              }}>
                Control which notifications you receive via email and in-app
              </p>
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: 20 
            }}>
              →
            </div>
          </div>
        </Link>

        <Link
          href="/account"
          style={{
            display: 'block',
            padding: '20px 24px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            textDecoration: 'none',
            color: '#111827',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <h2 style={{ 
                margin: '0 0 4px 0', 
                fontSize: 18, 
                fontWeight: 600 
              }}>
                👤 Account Settings
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: 14 
              }}>
                Manage your profile, subscription, and account details
              </p>
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: 20 
            }}>
              →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

