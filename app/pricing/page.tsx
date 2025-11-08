// app/pricing/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

function PricingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const isLoggedIn = Boolean(session);
  const [userType, setUserType] = useState<'investor' | 'wholesaler'>('investor');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = async (segment: 'investor' | 'wholesaler', tier: 'basic' | 'pro') => {
    // Check auth synchronously before redirecting
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/pricing?segment=${segment}&tier=${tier}&period=${billingPeriod}`)}`);
      return;
    }

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ segment, tier, period: billingPeriod }),
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Please sign in to upgrade your plan.');
          router.push(`/login?next=${encodeURIComponent(`/pricing?segment=${segment}&tier=${tier}&period=${billingPeriod}`)}`);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Checkout error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to create checkout session'}`);
        return;
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert('Error: No checkout URL received. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error processing payment. Please try again.');
    }
  };

  // Handle query params for auto-upgrade
  useEffect(() => {
    const segment = searchParams?.get('segment');
    const tier = searchParams?.get('tier');
    const period = searchParams?.get('period');
    
    if (segment && (segment === 'investor' || segment === 'wholesaler')) {
      setUserType(segment);
    }
    
    if (period && (period === 'monthly' || period === 'yearly')) {
      setBillingPeriod(period);
    }
    
    // Auto-trigger upgrade if segment and tier are provided and user is logged in
    // Use a ref to prevent multiple triggers
    if (segment && tier && isLoggedIn && (tier === 'basic' || tier === 'pro')) {
      // Small delay to ensure state is set
      const timer = setTimeout(() => {
        handleUpgrade(segment as 'investor' | 'wholesaler', tier as 'basic' | 'pro');
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoggedIn]);

  const investorTiers = [
    {
      name: 'Investor Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for browsing deals',
      color: '#6b7280',
      features: [
        { text: 'View up to 20 listings/month', included: true, link: null },
        { text: 'Basic filters & search', included: true, link: null },
        { text: 'Map view', included: true, link: null },
        { text: 'No contact data access', included: false, link: null },
        { text: 'No AI analyzer', included: false, link: '/analyzer' },
        { text: 'No save/favorite', included: false, link: '/watchlists' },
        { text: 'No draw tools', included: false, link: null },
        { text: 'No satellite view', included: false, link: null },
      ],
      cta: 'Get Started',
      popular: false,
      type: 'investor' as const,
      tier: 'free' as const
    },
    {
      name: 'Investor Basic',
      price: billingPeriod === 'yearly' ? '$290' : '$29',
      period: billingPeriod === 'yearly' ? '/year' : '/month',
      description: 'Unlock contact info and AI tools',
      color: '#059669',
      features: [
        { text: 'Unlimited listing views', included: true, link: null },
        { text: 'Contact property owners', included: true, link: null },
        { text: '10 AI analyses per month', included: true, link: '/analyzer' },
        { text: 'Save favorites & watchlists', included: true, link: '/watchlists' },
        { text: 'Property alerts', included: true, link: '/alerts' },
        { text: 'Map drawing tools', included: true, link: null },
        { text: 'Satellite view', included: true, link: null },
        { text: 'Priority support', included: false, link: '/support' },
      ],
      cta: 'Upgrade to Basic',
      popular: false,
      type: 'investor' as const,
      tier: 'basic' as const
    },
    {
      name: 'Investor Pro',
      price: billingPeriod === 'yearly' ? '$590' : '$59',
      period: billingPeriod === 'yearly' ? '/year' : '/month',
      description: 'Advanced tools for serious investors',
      color: '#3b82f6',
      features: [
        { text: 'Everything in Basic', included: true, link: null },
        { text: 'Unlimited AI analyses', included: true, link: '/analyzer' },
        { text: 'Export reports (CSV/PDF)', included: true, link: '/reports' },
        { text: 'Custom alerts', included: true, link: '/alerts' },
        { text: 'Advanced analytics', included: true, link: '/docs/analytics' },
        { text: 'Priority support', included: true, link: '/support' },
        { text: 'API access', included: true, link: '/docs/api' },
        { text: 'Custom integrations', included: false, link: '/integrations' },
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      type: 'investor' as const,
      tier: 'pro' as const
    }
  ];

  const wholesalerTiers = [
    {
      name: 'Wholesaler Free',
      price: '$0',
      period: '/month',
      description: 'Start listing your deals',
      color: '#6b7280',
      features: [
        { text: 'Post up to 2 listings/month', included: true, link: null },
        { text: 'Basic property details', included: true, link: null },
        { text: 'Contact form', included: true, link: null },
        { text: 'No analytics', included: false, link: '/docs/analytics' },
        { text: 'No featured placement', included: false, link: null },
        { text: 'No verified badge', included: false, link: null },
        { text: 'No investor chat', included: false, link: '/docs/wholesaler-tools' },
        { text: 'No AI repair estimator', included: false, link: '/repair-estimator' },
      ],
      cta: 'Get Started',
      popular: false,
      type: 'wholesaler' as const,
      tier: 'free' as const
    },
    {
      name: 'Wholesaler Basic',
      price: billingPeriod === 'yearly' ? '$250' : '$25',
      period: billingPeriod === 'yearly' ? '/year' : '/month',
      description: 'Grow your wholesale business',
      color: '#059669',
      features: [
        { text: 'Post up to 10 listings/month', included: true, link: null },
        { text: 'Basic analytics (views, saves)', included: true, link: '/docs/analytics' },
        { text: 'Property insights', included: true, link: null },
        { text: 'Contact tracking', included: true, link: null },
        { text: 'Email support', included: true, link: '/support' },
        { text: 'No featured placement', included: false, link: null },
        { text: 'No verified badge', included: false, link: null },
        { text: 'No investor chat', included: false, link: '/docs/wholesaler-tools' },
      ],
      cta: 'Upgrade to Basic',
      popular: false,
      type: 'wholesaler' as const,
      tier: 'basic' as const
    },
    {
      name: 'Wholesaler Pro',
      price: billingPeriod === 'yearly' ? '$590' : '$59',
      period: billingPeriod === 'yearly' ? '/year' : '/month',
      description: 'Professional wholesale tools',
      color: '#3b82f6',
      features: [
        { text: 'Post up to 30 listings/month', included: true, link: null },
        { text: 'AI repair estimator', included: true, link: '/repair-estimator' },
        { text: 'Investor demand heatmaps', included: true, link: '/docs/analytics' },
        { text: 'Featured placement', included: true, link: null },
        { text: 'Verified badge', included: true, link: null },
        { text: 'Investor chat', included: true, link: '/docs/wholesaler-tools' },
        { text: 'Advanced analytics', included: true, link: '/docs/analytics' },
        { text: 'Priority support', included: true, link: '/support' },
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      type: 'wholesaler' as const,
      tier: 'pro' as const
    }
  ];

  const enterpriseFeatures = [
    { text: 'Unlimited listings', link: null },
    { text: 'Team seats (multi-user management)', link: '/orgs/create' },
    { text: 'CRM export', link: '/settings/integrations/crm' },
    { text: 'Off-market data feeds', link: '/data-feed' },
    { text: 'White-label branding', link: '/contact-sales' },
    { text: 'Dedicated support', link: '/support' },
    { text: 'Custom integrations', link: '/integrations' },
    { text: 'API access', link: '/docs/api' },
  ];

  const currentTiers = userType === 'investor' ? investorTiers : wholesalerTiers;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#1a1a1a', 
            marginBottom: '16px' 
          }}>
            Choose Your Plan
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#6b7280', 
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Unlock powerful tools to find, analyze, and close real estate deals faster
          </p>
          
          {/* User Type Toggle */}
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => setUserType('investor')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: userType === 'investor' ? 'white' : 'transparent',
                color: userType === 'investor' ? '#1a1a1a' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: userType === 'investor' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              For Investors
            </button>
            <button
              onClick={() => setUserType('wholesaler')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: userType === 'wholesaler' ? 'white' : 'transparent',
                color: userType === 'wholesaler' ? '#1a1a1a' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: userType === 'wholesaler' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              For Wholesalers
            </button>
          </div>

          {/* Billing Period Toggle */}
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '32px',
            marginLeft: '16px'
          }}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: billingPeriod === 'monthly' ? 'white' : 'transparent',
                color: billingPeriod === 'monthly' ? '#1a1a1a' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: billingPeriod === 'monthly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: billingPeriod === 'yearly' ? 'white' : 'transparent',
                color: billingPeriod === 'yearly' ? '#1a1a1a' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: billingPeriod === 'yearly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Yearly <span style={{ color: '#059669', fontSize: '12px' }}>(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '24px',
          marginBottom: '48px'
        }}>
          {currentTiers.map((tier) => (
            <div key={tier.name} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              border: tier.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              position: 'relative',
              boxShadow: tier.popular ? '0 8px 24px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  MOST POPULAR
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  {tier.name}
                </h3>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ 
                    fontSize: '48px', 
                    fontWeight: '800', 
                    color: tier.color 
                  }}>
                    {tier.price}
                  </span>
                  <span style={{ 
                    fontSize: '18px', 
                    color: '#6b7280' 
                  }}>
                    {tier.period}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#6b7280' 
                }}>
                  {tier.description}
                </p>
              </div>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 24px 0' 
              }}>
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} style={{ 
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <span style={{ 
                      color: feature.included ? '#059669' : '#d1d5db', 
                      marginRight: '12px',
                      fontSize: '16px'
                    }}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span style={{ 
                      color: feature.included ? '#374151' : '#9ca3af',
                      flex: 1
                    }}>
                      {feature.included && feature.link ? (
                        <Link 
                          href={feature.link}
                          style={{ 
                            color: '#3b82f6', 
                            textDecoration: 'none',
                            fontWeight: '500'
                          }}
                        >
                          {feature.text}
                        </Link>
                      ) : (
                        feature.text
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => tier.tier !== 'free' ? handleUpgrade(tier.type, tier.tier) : router.push('/signup')}
                style={{
                  width: '100%',
                  background: tier.tier === 'free' ? '#6b7280' : tier.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          border: '2px solid #7c3aed',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)'
        }}>
          <h3 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            marginBottom: '16px'
          }}>
            Enterprise/Team
          </h3>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#7c3aed',
            marginBottom: '16px'
          }}>
            $99+
          </div>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Custom solutions for teams, agencies, and large-scale operations
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} style={{ 
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                color: '#374151'
              }}>
                <span style={{ 
                  color: '#7c3aed', 
                  marginRight: '12px',
                  fontSize: '16px'
                }}>
                  ✓
                </span>
                {feature.link ? (
                  <Link 
                    href={feature.link}
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    {feature.text}
                  </Link>
                ) : (
                  feature.text
                )}
              </div>
            ))}
          </div>

          <Link 
            href="/contact-sales"
            style={{
              background: '#7c3aed',
              color: 'white',
              padding: '16px 32px',
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

        {/* FAQ Section */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '12px'
              }}>
                Can I change plans anytime?
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.
              </p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '12px'
              }}>
                What payment methods do you accept?
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe payment processor.
              </p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '12px'
              }}>
                Is there a free trial?
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '12px'
              }}>
                Need help choosing?
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Our team is here to help! <Link href="/contact-sales" style={{ color: '#3b82f6', textDecoration: 'none' }}>Contact sales</Link> for personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading pricing...</div>
        </div>
      </div>
    }>
      <PricingPageInner />
    </Suspense>
  );
}