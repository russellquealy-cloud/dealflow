'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ type: string; company_name?: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=/account');
        return;
      }
      
      setUser(session.user);
      
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading account...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link 
          href="/listings" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Listings
        </Link>
      </div>

      <h1 style={{ margin: '0 0 24px 0', fontSize: 32, fontWeight: 800 }}>Account Settings</h1>

      {/* User Info */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Profile Information</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Email</label>
            <div style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f9fafb' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Level */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Subscription</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            padding: '4px 12px', 
            borderRadius: 20, 
            background: '#10b981', 
            color: '#fff', 
            fontSize: 14, 
            fontWeight: 600 
          }}>
            Free Plan
          </div>
          <span style={{ color: '#6b7280', fontSize: 14 }}>
            Upgrade to Pro for advanced features
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Free Features</h3>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#6b7280', fontSize: 14 }}>
              <li>Up to 5 listings</li>
              <li>Basic search</li>
              <li>Basic analytics</li>
            </ul>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Pro Features</h3>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#6b7280', fontSize: 14 }}>
              <li>Unlimited listings</li>
              <li>Advanced search</li>
              <li>Detailed analytics</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <Link 
          href="/pricing"
          style={{ 
            display: 'inline-block',
            marginTop: 16,
            padding: '8px 16px', 
            border: '1px solid #10b981', 
            borderRadius: 8, 
            background: '#10b981', 
            color: '#fff', 
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Upgrade to Pro
        </Link>
      </div>

      {/* Profile Type */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Profile Type</h2>
        {profile ? (
          <div>
            <div style={{ 
              padding: '8px 16px', 
              borderRadius: 8, 
              background: profile.type === 'wholesaler' ? '#fef3c7' : '#dbeafe',
              color: profile.type === 'wholesaler' ? '#92400e' : '#1e40af',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: 16
            }}>
              {profile.type === 'wholesaler' ? '🏠 Wholesaler' : '💰 Investor'}
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              {profile.type === 'wholesaler' 
                ? 'You can post deals and find investors for your properties.'
                : 'You can browse deals and find investment opportunities.'
              }
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>No profile type set. Choose your role:</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link 
                href="/portal/wholesaler"
                style={{ 
                  padding: '12px 24px', 
                  border: '1px solid #f59e0b', 
                  borderRadius: 8, 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                🏠 Wholesaler
              </Link>
              <Link 
                href="/portal/investor"
                style={{ 
                  padding: '12px 24px', 
                  border: '1px solid #3b82f6', 
                  borderRadius: 8, 
                  background: '#dbeafe', 
                  color: '#1e40af', 
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                💰 Investor
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      {profile && (
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24,
          background: '#fff'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Analytics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>0</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Total Listings</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>0</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Views</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>0</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Contacts</div>
            </div>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Account Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #6b7280', 
            borderRadius: 8, 
            background: '#fff', 
            color: '#374151', 
            cursor: 'pointer',
            fontWeight: 600
          }}>
            Change Password
          </button>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #6b7280', 
            borderRadius: 8, 
            background: '#fff', 
            color: '#374151', 
            cursor: 'pointer',
            fontWeight: 600
          }}>
            Update Profile
          </button>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #dc2626', 
              borderRadius: 8, 
              background: '#dc2626', 
              color: '#fff', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
