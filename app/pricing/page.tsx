'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'all' | 'investor' | 'wholesaler'>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  const handleUpgrade = async (tier: string) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/pricing&tier=${tier}`);
      return;
    }
    // TODO: Implement Stripe checkout or payment flow
    alert(`Payment integration coming soon for ${tier}! This will connect to Stripe/PayPal.`);
  };

  const tiers = [
    {
      name: 'Free / Starter',
      price: '$0',
      period: '/month',
      description: 'Get started with wholesale real estate',
      color: '#6b7280',
      features: [
        { text: 'View map + all listings', included: true },
        { text: 'Basic filters', included: true },
        { text: 'No contact data access', included: false },
        { text: 'No posting allowed', included: false },
        { text: 'Perfect for browsing deals', included: true },
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Investor Basic',
      price: '$25',
      period: '/month',
      description: 'For active investors seeking deals',
      color: '#10b981',
      features: [
        { text: 'Unlimited viewing', included: true, bold: true },
        { text: 'Unlimited contact info', included: true, bold: true },
        { text: 'Full property details', included: true },
        { text: 'Comps preview', included: true },
        { text: 'Save/favorite searches', included: true },
        { text: 'Message wholesalers directly', included: true },
        { text: 'Cannot post deals (buyers only)', included: false },
      ],
      cta: 'Upgrade to Investor Basic',
      popular: false
    },
    {
      name: 'Investor Pro',
      price: '$49',
      period: '/month',
      description: 'For serious investors who want the edge',
      color: '#3b82f6',
      features: [
        { text: 'Everything in Investor Basic', included: true },
        { text: 'AI analyzer (ARV, repair, MAO)', included: true, bold: true },
        { text: 'Saved comps', included: true },
        { text: 'Downloadable reports (PDF)', included: true },
        { text: 'Priority support', included: true },
        { text: 'Cannot post deals (buyers only)', included: false },
      ],
      cta: 'Upgrade to Investor Pro',
      popular: true
    },
    {
      name: 'Wholesaler Basic',
      price: '$25',
      period: '/month',
      description: 'For wholesalers who want to post deals',
      color: '#f59e0b',
      features: [
        { text: '5 listings / month', included: true, bold: true },
        { text: 'Create up to 5 active deals', included: true },
        { text: 'Basic analytics (views, interest)', included: true },
        { text: 'No buyer contact data', included: false },
      ],
      cta: 'Upgrade to Wholesaler Basic',
      popular: false
    },
    {
      name: 'Wholesaler Pro',
      price: '$49',
      period: '/month',
      description: 'For active wholesalers posting many deals',
      color: '#8b5cf6',
      features: [
        { text: '20 listings / month', included: true, bold: true },
        { text: 'AI repair estimator', included: true, bold: true },
        { text: 'Investor demand analytics by ZIP', included: true },
        { text: 'Featured placement', included: true },
        { text: 'Verified badge', included: true },
        { text: 'Investor chat unlocked', included: true },
      ],
      cta: 'Upgrade to Wholesaler Pro',
      popular: true
    },
    {
      name: 'Enterprise / Team',
      price: '$99+',
      period: '',
      description: 'For teams and large operations',
      color: '#1f2937',
      features: [
        { text: 'Unlimited listings', included: true, bold: true },
        { text: 'Team seats', included: true, bold: true },
        { text: 'Multi-user management', included: true },
        { text: 'CRM export', included: true },
        { text: 'Off-market data feed', included: true },
        { text: 'Bulk investor lists', included: true },
        { text: 'Custom branding / white-label', included: true },
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // Filter tiers based on user type selection
  const displayedTiers = userType === 'all' 
    ? tiers 
    : tiers.filter(tier => 
        (userType === 'investor' && (tier.name.includes('Investor') || tier.name.includes('Free') || tier.name.includes('Enterprise'))) ||
        (userType === 'wholesaler' && (tier.name.includes('Wholesaler') || tier.name.includes('Free') || tier.name.includes('Enterprise')))
      );

  return (
    <main style={{ padding: '40px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, marginBottom: 12, color: '#fff' }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', maxWidth: 700, margin: '0 auto', marginBottom: 24 }}>
            Whether you&apos;re an investor looking for deals or a wholesaler selling properties, we have the perfect plan for you.
          </p>
          
          {/* User Type Toggle */}
          <div style={{
            display: 'inline-flex',
            gap: 4,
            background: 'rgba(255,255,255,0.2)',
            padding: 4,
            borderRadius: 12,
            backdropFilter: 'blur(10px)'
          }}>
            <button
              onClick={() => setUserType('all')}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: userType === 'all' ? '#fff' : 'transparent',
                color: userType === 'all' ? '#667eea' : '#fff',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              All Plans
            </button>
            <button
              onClick={() => setUserType('investor')}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: userType === 'investor' ? '#fff' : 'transparent',
                color: userType === 'investor' ? '#667eea' : '#fff',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              💼 Investors
            </button>
            <button
              onClick={() => setUserType('wholesaler')}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: userType === 'wholesaler' ? '#fff' : 'transparent',
                color: userType === 'wholesaler' ? '#667eea' : '#fff',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              🏡 Wholesalers
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 20,
          marginBottom: 64
        }}>
          {displayedTiers.map((tier, index) => (
            <div 
              key={index}
              style={{ 
                border: tier.popular ? '3px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)', 
                borderRadius: 16, 
                padding: 28,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: tier.popular ? '0 10px 30px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
                transform: tier.popular ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fbbf24',
                  color: '#1f2937',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  🔥 POPULAR
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 22, 
                  fontWeight: 800, 
                  color: tier.color 
                }}>
                  {tier.name}
                </h2>
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#1f2937' }}>{tier.price}</span>
                  <span style={{ fontSize: 16, color: '#6b7280' }}>{tier.period}</span>
                </div>
                <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14, minHeight: 40 }}>
                  {tier.description}
                </p>
              </div>

              <div style={{ marginBottom: 24, flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {tier.features.map((feature, fIndex) => (
                    <li 
                      key={fIndex}
                      style={{ 
                        padding: '10px 0', 
                        color: feature.included ? '#374151' : '#9ca3af', 
                        display: 'flex', 
                        gap: 10,
                        alignItems: 'flex-start',
                        fontSize: 14,
                        borderBottom: fIndex < tier.features.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{feature.included ? '✅' : '❌'}</span>
                      <span style={{ fontWeight: feature.bold ? 700 : 400 }}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {tier.name === 'Enterprise / Team' ? (
                <Link 
                  href="mailto:russell.quealy@gmail.com?subject=Enterprise%20Plan%20Inquiry"
                  style={{ 
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px 24px', 
                    border: `2px solid ${tier.color}`, 
                    borderRadius: 10, 
                    background: '#fff', 
                    color: tier.color,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 15
                  }}
                >
                  {tier.cta}
                </Link>
              ) : tier.name === 'Free / Starter' ? (
                <Link 
                  href={isLoggedIn ? '/account' : '/login'}
                  style={{ 
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px 24px', 
                    border: `2px solid ${tier.color}`, 
                    borderRadius: 10, 
                    background: '#fff', 
                    color: tier.color,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 15
                  }}
                >
                  {isLoggedIn ? 'Current Plan' : 'Get Started'}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier.name)}
                  style={{ 
                    padding: '14px 24px', 
                    border: 'none', 
                    borderRadius: 10, 
                    background: tier.color, 
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 15,
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 16, 
          padding: 40,
          marginBottom: 48,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 32px 0', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>
            Why Upgrade?
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 24 
          }}>
            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>AI-Powered Analytics</h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Get instant ARV estimates, repair cost analysis, and MAO calculations powered by advanced AI.
              </p>
            </div>

            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Investor Insights</h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                See which areas have the highest investor demand and price your deals competitively.
              </p>
            </div>

            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Featured Placement</h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Pro users can feature their deals at the top of search results for maximum visibility.
              </p>
            </div>

            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Verification Badge</h3>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Stand out with a verified badge that builds trust and credibility with potential partners.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Can I cancel anytime?</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
                Yes! Cancel your subscription anytime. You&apos;ll still have access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>What payment methods do you accept?</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
                We accept all major credit cards through Stripe, as well as PayPal for your convenience.
              </p>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Can I switch between tiers?</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
                Absolutely! Upgrade or downgrade at any time. Changes take effect at your next billing cycle.
              </p>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>What happens to my listings if I downgrade?</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
                Your listings remain active, but you&apos;ll be limited to your new tier&apos;s listing count. You can choose which ones to keep active.
              </p>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Do you offer team discounts?</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
                Yes! Contact us about Enterprise pricing for teams of 3 or more users. We offer custom pricing and features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
