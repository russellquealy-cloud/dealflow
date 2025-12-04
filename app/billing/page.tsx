// app/billing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  segment: 'investor' | 'wholesaler';
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  verified: boolean;
  stripe_customer_id?: string;
  active_price_id?: string;
  current_period_end?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMode, setCancelMode] = useState<'immediate' | 'period-end' | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Prevent redirect loops - only redirect if not already going to login
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/login')) {
            console.log('[Billing] No session, redirecting to login', { currentPath });
            router.push('/login?next=/billing');
          }
          return;
        }
        setAuthToken(session.access_token ?? null);

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleManageBilling = async () => {
    if (!profile?.stripe_customer_id) {
      alert('No billing account found. Please upgrade to a paid plan first.');
      return;
    }

    setIsManagingBilling(true);
    try {
      if (!authToken) {
        alert('Please sign in again to manage billing.');
        return;
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to access billing portal.');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Error accessing billing portal. Please try again.');
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleUpgrade = async (segment: 'investor' | 'wholesaler', tier: 'basic' | 'pro') => {
    try {
      if (!authToken) {
        alert('Please sign in again to upgrade.');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ segment, tier }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start checkout.');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error processing payment. Please try again.');
    }
  };

  const handleCancelSubscription = async (immediately: boolean) => {
    if (!confirm(
      immediately
        ? 'Are you sure you want to cancel your subscription immediately? You will lose access right away and will not receive a refund.'
        : 'Cancel your subscription at the end of the current billing period? You will retain access until then, and no refund will be issued.'
    )) {
      return;
    }

    setIsCanceling(true);
    try {
      if (!authToken) {
        alert('Please sign in again to cancel your subscription.');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ immediately }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel subscription.');
      }

      const data = await response.json();
      alert(data.message || 'Subscription canceled successfully.');
      
      // Reload profile to reflect changes
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
      
      setCancelMode(null);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert(error instanceof Error ? error.message : 'Error canceling subscription. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Profile not found.</p>
          <Link 
            href="/login"
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const getPlanDisplayName = () => {
    if (profile.tier === 'free') return 'Free Plan';
    return `${profile.segment.charAt(0).toUpperCase() + profile.segment.slice(1)} ${profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}`;
  };

  const getPlanPrice = () => {
    if (profile.tier === 'free') return '$0/month';
    
    // Determine if it's yearly or monthly based on active_price_id
    // Check if the price ID contains "yearly" (Stripe price IDs often include this in metadata or ID)
    const activePriceId = (profile.active_price_id || '').toLowerCase();
    const isYearly = activePriceId.includes('yearly') || activePriceId.includes('_yearly') || activePriceId.includes('annual');
    
    // Correct prices: Basic = $35/month ($35/month = $420/year), Pro = $60/month ($60/month = $720/year)
    // Unified pricing for both investor and wholesaler (same price regardless of segment)
    if (profile.tier === 'basic') {
      return isYearly ? '$420/year' : '$35/month';
    } else if (profile.tier === 'pro') {
      return isYearly ? '$720/year' : '$60/month';
    } else if (profile.tier === 'enterprise') {
      // Enterprise pricing (custom/contact for pricing)
      return 'Contact for pricing';
    }
    
    // Fallback for any other tier (shouldn't happen, but TypeScript needs this)
    return '$35/month';
  };

  const getNextBillingDate = () => {
    if (!profile.current_period_end) return null;
    return new Date(profile.current_period_end).toLocaleDateString();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              Billing & Subscription
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280' 
            }}>
              Manage your subscription and billing information
            </p>
          </div>

          {/* Current Plan */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              marginBottom: '16px'
            }}>
              Current Plan
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Plan
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                  {getPlanDisplayName()}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Price
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                  {getPlanPrice()}
                </div>
              </div>
              
              {getNextBillingDate() && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    Next Billing Date
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    {getNextBillingDate()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              marginBottom: '16px'
            }}>
              Manage Subscription
            </h2>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {profile.tier !== 'free' && (
                <>
                  <button
                    onClick={handleManageBilling}
                    disabled={isManagingBilling}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isManagingBilling ? 'not-allowed' : 'pointer',
                      opacity: isManagingBilling ? 0.7 : 1
                    }}
                  >
                    {isManagingBilling ? 'Loading...' : 'Manage Billing'}
                  </button>
                  
                  {cancelMode === null ? (
                    <button
                      onClick={() => setCancelMode('period-end')}
                      disabled={isCanceling}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isCanceling ? 'not-allowed' : 'pointer',
                        opacity: isCanceling ? 0.7 : 1
                      }}
                    >
                      Cancel Subscription
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => handleCancelSubscription(false)}
                        disabled={isCanceling}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isCanceling ? 'not-allowed' : 'pointer',
                          opacity: isCanceling ? 0.7 : 1
                        }}
                      >
                        {isCanceling ? 'Processing...' : 'At Period End'}
                      </button>
                      <button
                        onClick={() => handleCancelSubscription(true)}
                        disabled={isCanceling}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isCanceling ? 'not-allowed' : 'pointer',
                          opacity: isCanceling ? 0.7 : 1
                        }}
                      >
                        {isCanceling ? 'Processing...' : 'Immediately'}
                      </button>
                      <button
                        onClick={() => setCancelMode(null)}
                        disabled={isCanceling}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isCanceling ? 'not-allowed' : 'pointer',
                          opacity: isCanceling ? 0.7 : 1
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
              
              <Link 
                href="/pricing"
                style={{
                  background: '#059669',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'inline-block'
                }}
              >
                Change Plan
              </Link>
            </div>
          </div>

          {/* Upgrade Options */}
          {profile.tier === 'free' && (
            <div style={{
              background: '#eff6ff',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '16px'
              }}>
                Upgrade Your Plan
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                Unlock more features and capabilities with a paid plan.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleUpgrade(profile.segment, 'basic')}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to {profile.segment === 'investor' ? 'Investor' : 'Wholesaler'} Basic
                </button>
                
                <button
                  onClick={() => handleUpgrade(profile.segment, 'pro')}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to {profile.segment === 'investor' ? 'Investor' : 'Wholesaler'} Pro
                </button>
              </div>
            </div>
          )}

          {/* Enterprise */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              marginBottom: '12px'
            }}>
              Need Enterprise Features?
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Team seats, white-label branding, custom integrations, and dedicated support
            </p>
            <Link 
              href="/contact-sales"
              style={{
                background: '#7c3aed',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                display: 'inline-block'
              }}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
