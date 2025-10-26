'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ 
    role?: string; 
    membership_tier?: string; 
    company_name?: string;
    full_name?: string;
    verified?: boolean;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }
        
        if (!session) {
          router.push('/login?next=/account');
          return;
        }
        
        setUser(session.user);
        
        // Load user profile with error handling
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          // Create a basic profile if none exists
          if (profileError.code === 'PGRST116') {
            console.log('No profile found, creating basic profile...');
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                role: 'investor',
                membership_tier: 'investor_free',
                verified: false
              })
              .select()
              .single();
            setProfile(newProfile);
          }
        } else {
          setProfile(profileData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Account loading error:', err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleRoleSwitch = async () => {
    if (!user?.id || !profile) return;
    
    const newRole = profile.role === 'wholesaler' ? 'investor' : 'wholesaler';
    const newTier = newRole === 'wholesaler' ? 'wholesaler_free' : 'investor_free';
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        membership_tier: newTier
      })
      .eq('id', user.id);
      
    if (!error) {
      setProfile(prev => prev ? { ...prev, role: newRole, membership_tier: newTier } : null);
      alert(`Successfully switched to ${newRole} account!`);
    } else {
      console.error('Error switching role:', error);
      alert('Failed to switch account type. Please try again.');
    }
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
            background: profile?.membership_tier?.includes('free') ? '#6b7280' : '#10b981', 
            color: '#fff', 
            fontSize: 14, 
            fontWeight: 600 
          }}>
            {profile?.membership_tier?.replace('_', ' ').toUpperCase() || 'FREE PLAN'}
          </div>
          {profile?.membership_tier?.includes('free') && (
            <span style={{ color: '#6b7280', fontSize: 14 }}>
              Upgrade to {profile?.role === 'wholesaler' ? 'Wholesaler' : 'Investor'} Pro for advanced features
            </span>
          )}
        </div>

        {/* Current Plan Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>
              {profile?.membership_tier?.includes('free') ? 'Free Features' : 'Pro Features'}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#6b7280', fontSize: 14 }}>
              {profile?.role === 'wholesaler' ? (
                profile?.membership_tier === 'wholesaler_free' ? (
                  <>
                    <li>1 listing per month</li>
                    <li>Basic listing form</li>
                  </>
                ) : (
                  <>
                    <li>Up to 30 listings/month</li>
                    <li>AI repair estimator</li>
                    <li>Investor demand heatmaps</li>
                    <li>Featured placement</li>
                    <li>Verified badge</li>
                  </>
                )
              ) : (
                profile?.membership_tier === 'investor_free' ? (
                  <>
                    <li>View up to 10 listings/month</li>
                    <li>Basic filters</li>
                  </>
                ) : (
                  <>
                    <li>Unlimited viewing and contact</li>
                    <li>AI Analyzer unlimited</li>
                    <li>Exportable deal reports</li>
                    <li>Priority support</li>
                  </>
                )
              )}
            </ul>
          </div>
          
          {profile?.membership_tier?.includes('free') && (
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Pro Features</h3>
              <ul style={{ margin: 0, paddingLeft: 16, color: '#6b7280', fontSize: 14 }}>
                {profile?.role === 'wholesaler' ? (
                  <>
                    <li>Up to 30 listings/month</li>
                    <li>AI repair estimator</li>
                    <li>Investor demand heatmaps</li>
                    <li>Featured placement</li>
                    <li>Verified badge</li>
                    <li>Investor chat</li>
                  </>
                ) : (
                  <>
                    <li>Unlimited viewing and contact</li>
                    <li>AI Analyzer unlimited</li>
                    <li>Exportable deal reports</li>
                    <li>Property watchlists</li>
                    <li>Custom alerts</li>
                    <li>Priority support</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {profile?.membership_tier?.includes('free') && (
          <Link 
            href="/pricing"
            style={{ 
              display: 'inline-block',
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: 8,
              background: '#10b981',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            Upgrade to {profile?.role === 'wholesaler' ? 'Wholesaler' : 'Investor'} Pro
          </Link>
        )}
      </div>

      {/* Profile Type & Role Switching */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Profile Type</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            background: profile?.role === 'wholesaler' ? '#f59e0b' : '#3b82f6', 
            color: '#fff', 
            fontSize: 16, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {profile?.role === 'wholesaler' ? '🏡' : '💼'} 
            {profile?.role === 'wholesaler' ? 'Wholesaler' : 'Investor'}
          </div>
        </div>
        
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          {profile?.role === 'wholesaler' 
            ? 'You can post deals and find investors for your properties.'
            : 'You can browse deals and connect with wholesalers.'
          }
        </p>

        {/* Role Switch Button - ADMIN ONLY */}
        {profile?.role === 'admin' ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ 
              padding: '12px 16px', 
              background: '#dc2626', 
              color: '#fff', 
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 600
            }}>
              🔒 ADMIN ONLY: Test Different Account Types
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ 
                      role: 'investor',
                      membership_tier: 'investor_free'
                    })
                    .eq('id', user.id);
                    
                  if (!error) {
                    setProfile(prev => prev ? { ...prev, role: 'investor', membership_tier: 'investor_free' } : null);
                    alert('Switched to Investor Free for testing');
                  }
                }}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #3b82f6', 
                  borderRadius: 6,
                  background: profile?.role === 'investor' ? '#3b82f6' : '#fff',
                  color: profile?.role === 'investor' ? '#fff' : '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                💼 Test Investor
              </button>
              
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ 
                      role: 'wholesaler',
                      membership_tier: 'wholesaler_free'
                    })
                    .eq('id', user.id);
                    
                  if (!error) {
                    setProfile(prev => prev ? { ...prev, role: 'wholesaler', membership_tier: 'wholesaler_free' } : null);
                    alert('Switched to Wholesaler Free for testing');
                  }
                }}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #f59e0b', 
                  borderRadius: 6,
                  background: profile?.role === 'wholesaler' ? '#f59e0b' : '#fff',
                  color: profile?.role === 'wholesaler' ? '#fff' : '#f59e0b',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                🏡 Test Wholesaler
              </button>
              
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ 
                      role: 'admin',
                      membership_tier: 'enterprise'
                    })
                    .eq('id', user.id);
                    
                  if (!error) {
                    setProfile(prev => prev ? { ...prev, role: 'admin', membership_tier: 'enterprise' } : null);
                    alert('Restored Admin/Enterprise access');
                  }
                }}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #dc2626', 
                  borderRadius: 6,
                  background: profile?.role === 'admin' ? '#dc2626' : '#fff',
                  color: profile?.role === 'admin' ? '#fff' : '#dc2626',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                🔒 Restore Admin
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRoleSwitch}
            style={{ 
              padding: '10px 20px', 
              border: '1px solid #6b7280', 
              borderRadius: 8,
              background: '#fff',
              color: '#6b7280',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Switch to {profile?.role === 'wholesaler' ? 'Investor' : 'Wholesaler'} Account
          </button>
        )}
      </div>

      {/* Analytics */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0ea5e9' }}>0</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Total Listings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>0</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Views</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>0</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Contacts</div>
          </div>
        </div>
      </div>
    </main>
  );
}
