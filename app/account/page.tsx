'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';
import type { SubscriptionTier } from '@/lib/stripe';

// Helper function to get plan name and features (client-side safe)
function getPlanInfo(segment?: string, tier?: string): { name: string; tier: SubscriptionTier; features: string[] } {
  const segmentUpper = segment?.toUpperCase() || 'INVESTOR';
  const tierUpper = tier?.toUpperCase() || 'FREE';
  
  let subscriptionTier: SubscriptionTier = 'FREE';
  let planName = 'Free';
  const features: string[] = [];
  
  if (tierUpper === 'FREE') {
    subscriptionTier = 'FREE';
    planName = 'Free';
    features.push('Browse listings');
    features.push('View basic property details');
  } else if (segmentUpper === 'INVESTOR' && tierUpper === 'BASIC') {
    subscriptionTier = 'INVESTOR_BASIC';
    planName = 'Investor Basic';
    features.push('Unlimited listing views');
    features.push('Contact property owners');
    features.push('10 AI analyses per month');
    features.push('Save favorites & watchlists');
    features.push('Property alerts');
    features.push('Map drawing tools');
    features.push('Satellite view');
  } else if (segmentUpper === 'INVESTOR' && tierUpper === 'PRO') {
    subscriptionTier = 'INVESTOR_PRO';
    planName = 'Investor Pro';
    features.push('Everything in Basic');
    features.push('Unlimited AI analyses');
    features.push('Export reports (CSV/PDF)');
    features.push('Custom alerts');
    features.push('Advanced analytics');
    features.push('Priority support');
    features.push('API access');
  } else if (segmentUpper === 'WHOLESALER' && tierUpper === 'BASIC') {
    subscriptionTier = 'WHOLESALER_BASIC';
    planName = 'Wholesaler Basic';
    features.push('Post up to 10 listings/month');
    features.push('Basic analytics (views, saves)');
    features.push('Property insights');
    features.push('Contact tracking');
    features.push('Email support');
  } else if (segmentUpper === 'WHOLESALER' && tierUpper === 'PRO') {
    subscriptionTier = 'WHOLESALER_PRO';
    planName = 'Wholesaler Pro';
    features.push('Post up to 30 listings/month');
    features.push('AI repair estimator');
    features.push('Investor demand heatmaps');
    features.push('Featured placement');
    features.push('Verified badge');
    features.push('Investor chat');
    features.push('Advanced analytics');
    features.push('Priority support');
  }
  
  return { name: planName, tier: subscriptionTier, features };
}

// Helper to get next tier for upgrade
function getNextTier(segment?: string, tier?: string): { name: string; href: string } | null {
  const segmentUpper = segment?.toUpperCase() || 'INVESTOR';
  const tierUpper = tier?.toUpperCase() || 'FREE';
  
  if (tierUpper === 'FREE') {
    if (segmentUpper === 'INVESTOR') {
      return { name: 'Investor Basic', href: '/pricing?segment=investor&tier=basic' };
    } else {
      return { name: 'Wholesaler Basic', href: '/pricing?segment=wholesaler&tier=basic' };
    }
  } else if (tierUpper === 'BASIC') {
    if (segmentUpper === 'INVESTOR') {
      return { name: 'Investor Pro', href: '/pricing?segment=investor&tier=pro' };
    } else {
      return { name: 'Wholesaler Pro', href: '/pricing?segment=wholesaler&tier=pro' };
    }
  }
  
  return null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ 
    role?: string;
    segment?: string;
    tier?: string;
    membership_tier?: string; 
    company_name?: string;
    full_name?: string;
    verified?: boolean;
  } | null>(null);
  const [stats, setStats] = useState<{
    savedListings?: number;
    contactsMade?: number;
    aiAnalyses?: number;
    watchlists?: number;
    myListings?: number;
    totalViews?: number;
    contacts?: number;
    featuredListings?: number;
  }>({});

  useEffect(() => {
    const checkAuth = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Account load timeout - setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (!session) {
          clearTimeout(timeoutId);
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
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  role: 'investor',
                  segment: 'investor',
                  tier: 'free',
                  membership_tier: 'free',
                  verified: false
                })
                .select()
                .single();
              if (createError) {
                console.error('Error creating profile:', createError);
                setProfile({ role: 'investor', segment: 'investor', tier: 'free', membership_tier: 'free' });
              } else {
                console.log('Profile loaded:', newProfile);
                setProfile(newProfile);
              }
            } catch (createErr) {
              console.error('Exception creating profile:', createErr);
              setProfile({ role: 'investor', segment: 'investor', tier: 'free', membership_tier: 'free' });
            }
          } else {
            // Other error - set default profile
            console.error('Unexpected profile error:', profileError);
            setProfile({ role: 'investor', segment: 'investor', tier: 'free', membership_tier: 'free' });
          }
        } else {
          console.log('Profile loaded successfully:', profileData);
          console.log('Segment:', profileData?.segment, 'Tier:', profileData?.tier);
          setProfile(profileData);
          
          // Load stats based on user role
          const isInvestor = profileData.segment === 'investor' || (profileData.role === 'investor' && !profileData.segment);
          const isWholesaler = profileData.segment === 'wholesaler' || profileData.role === 'wholesaler';
          
          if (isInvestor) {
            // Investor stats
            const [watchlistsRes, messagesRes] = await Promise.all([
              supabase.from('watchlists').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id),
              supabase.from('messages').select('id', { count: 'exact', head: true }).eq('from_id', session.user.id)
            ]);
            
            setStats({
              savedListings: watchlistsRes.count || 0,
              watchlists: watchlistsRes.count || 0,
              contactsMade: messagesRes.count || 0,
              aiAnalyses: 0 // TODO: Add AI analyses tracking table
            });
          } else if (isWholesaler) {
            // Wholesaler stats
            const [listingsRes, featuredRes, messagesRes] = await Promise.all([
              supabase.from('listings').select('id', { count: 'exact' }).eq('owner_id', session.user.id),
              supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', session.user.id).eq('featured', true),
              supabase.from('messages').select('id', { count: 'exact', head: true }).eq('to_id', session.user.id)
            ]);
            
            // Total views would need a views column - for now, use listing count as placeholder
            const totalViews = 0; // TODO: Add views tracking to listings table
            
            setStats({
              myListings: listingsRes.count || 0,
              totalViews,
              contacts: messagesRes.count || 0,
              featuredListings: featuredRes.count || 0
            });
          }
        }
        
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Account loading error:', err);
        setLoading(false);
        clearTimeout(timeoutId);
      }
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
        {(() => {
          const planInfo = getPlanInfo(profile?.segment, profile?.tier);
          const nextTier = getNextTier(profile?.segment, profile?.tier);
          const isFree = (profile?.tier?.toUpperCase() || 'FREE') === 'FREE';
          const isBasic = (profile?.tier?.toUpperCase() || '') === 'BASIC';
          
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  background: isFree ? '#6b7280' : isBasic ? '#3b82f6' : '#10b981', 
                  color: '#fff', 
                  fontSize: 14, 
                  fontWeight: 600 
                }}>
                  {planInfo.name}
                </div>
                {nextTier && (
                  <span style={{ color: '#6b7280', fontSize: 14 }}>
                    Upgrade to {nextTier.name} for more features
                  </span>
                )}
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Current Plan Features</h3>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
                  {planInfo.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              {nextTier && (
                <Link 
                  href={nextTier.href}
                  style={{ 
                    display: 'inline-block',
                    marginTop: 16,
                    padding: '10px 20px', 
                    border: '1px solid #3b82f6', 
                    borderRadius: 8, 
                    background: '#3b82f6', 
                    color: '#fff', 
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Upgrade to {nextTier.name} →
                </Link>
              )}
            </>
          );
        })()}
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
              background: (profile.segment || profile.role) === 'wholesaler' ? '#fef3c7' : '#dbeafe',
              color: (profile.segment || profile.role) === 'wholesaler' ? '#92400e' : '#1e40af',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: 16
            }}>
              {(profile.segment || profile.role) === 'wholesaler' ? '🏠 Wholesaler' : '💰 Investor'}
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              {(profile.segment || profile.role) === 'wholesaler' 
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
      {profile && (() => {
        const isInvestor = profile.segment === 'investor' || (profile.role === 'investor' && !profile.segment);
        const isWholesaler = profile.segment === 'wholesaler' || profile.role === 'wholesaler';
        
        return (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: 12, 
            padding: 24, 
            marginBottom: 24,
            background: '#fff'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Analytics</h2>
            {isInvestor ? (
              // Investor Analytics
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f0f9ff' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>{stats.savedListings || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Saved Listings</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f0fdf4' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.contactsMade || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Contacts Made</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fffbeb' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.aiAnalyses || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>AI Analyses</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#faf5ff' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>{stats.watchlists || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Watchlists</div>
                </div>
              </div>
            ) : isWholesaler ? (
              // Wholesaler Analytics
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f0f9ff' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>{stats.myListings || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>My Listings</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f0fdf4' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.totalViews || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Total Views</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fffbeb' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.contacts || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Contacts</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fef2f2' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.featuredListings || 0}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Featured Listings</div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })()}

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
          <Link
            href="/profile"
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #6b7280', 
              borderRadius: 8, 
              background: '#fff', 
              color: '#374151', 
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Update Profile
          </Link>
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
