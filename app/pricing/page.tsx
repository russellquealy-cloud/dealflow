'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      router.push('/login?next=/pricing');
      return;
    }
    // TODO: Implement Stripe checkout or payment flow
    alert('Payment integration coming soon! This will connect to Stripe/PayPal.');
  };

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, marginBottom: 12 }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
          Start with our Free plan and upgrade when you&apos;re ready to unlock powerful features.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 24,
        marginBottom: 64
      }}>
        {/* Free Plan */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 16, 
          padding: 32,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Free</h2>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>$0</span>
              <span style={{ fontSize: 18, color: '#6b7280' }}>/month</span>
            </div>
            <p style={{ color: '#6b7280', marginTop: 12 }}>
              Perfect for getting started and testing the platform.
            </p>
          </div>

          <div style={{ marginBottom: 32, flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>What&apos;s included:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Post up to 5 listings
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Map search with filters
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Basic deal analyzer (Lite)
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> View contact information
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Basic profile page
              </li>
              <li style={{ padding: '8px 0', color: '#9ca3af', display: 'flex', gap: 8 }}>
                <span>❌</span> Saved searches & alerts
              </li>
              <li style={{ padding: '8px 0', color: '#9ca3af', display: 'flex', gap: 8 }}>
                <span>❌</span> AI-powered analytics
              </li>
            </ul>
          </div>

          <Link 
            href={isLoggedIn ? '/account' : '/login'}
            style={{ 
              display: 'block',
              textAlign: 'center',
              padding: '12px 24px', 
              border: '1px solid #d1d5db', 
              borderRadius: 10, 
              background: '#fff', 
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            {isLoggedIn ? 'Current Plan' : 'Get Started'}
          </Link>
        </div>

        {/* Pro Plan */}
        <div style={{ 
          border: '2px solid #3b82f6', 
          borderRadius: 16, 
          padding: 32,
          background: '#fff',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3b82f6',
            color: '#fff',
            padding: '4px 16px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700
          }}>
            MOST POPULAR
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>Pro</h2>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>$29</span>
              <span style={{ fontSize: 18, color: '#6b7280' }}>/month</span>
            </div>
            <p style={{ color: '#6b7280', marginTop: 12 }}>
              For serious investors and wholesalers who want the edge.
            </p>
          </div>

          <div style={{ marginBottom: 32, flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>Everything in Free, plus:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> <strong>Unlimited listings</strong>
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> <strong>AI-powered deal analyzer (Pro)</strong>
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Full profit & comps reports (PDF download)
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Buy Box setup - auto-match deals
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Saved searches & email alerts
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Private messaging with lead tracking
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Deal history & reviews
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Regional leaderboards
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Featured listing placement
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Verification badge
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Priority support
              </li>
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            style={{ 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: 10, 
              background: '#3b82f6', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            Upgrade to Pro
          </button>
        </div>

        {/* Enterprise Plan */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 16, 
          padding: 32,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Enterprise</h2>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>Custom</span>
            </div>
            <p style={{ color: '#6b7280', marginTop: 12 }}>
              For teams and large-scale operations.
            </p>
          </div>

          <div style={{ marginBottom: 32, flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>Everything in Pro, plus:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Team collaboration tools
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> White-label options
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> API access
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Custom integrations
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Dedicated account manager
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Custom reporting
              </li>
              <li style={{ padding: '8px 0', color: '#374151', display: 'flex', gap: 8 }}>
                <span>✅</span> Priority feature requests
              </li>
            </ul>
          </div>

          <Link 
            href="/contact"
            style={{ 
              display: 'block',
              textAlign: 'center',
              padding: '12px 24px', 
              border: '1px solid #d1d5db', 
              borderRadius: 10, 
              background: '#fff', 
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Contact Sales
          </Link>
        </div>
      </div>

      {/* Feature Comparison */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 16, 
        padding: 32,
        background: '#f9fafb',
        marginBottom: 48
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>
          Why Upgrade to Pro?
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 24 
        }}>
          <div style={{ padding: 20, background: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>AI-Powered Analytics</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Get instant ARV estimates, repair cost analysis, and profit calculations powered by advanced AI.
            </p>
          </div>

          <div style={{ padding: 20, background: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Buy Box Matching</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Set your investment criteria and get automatically notified when matching deals hit the market.
            </p>
          </div>

          <div style={{ padding: 20, background: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>First Access</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Pro users see new listings first and can feature their own deals at the top of search results.
            </p>
          </div>

          <div style={{ padding: 20, background: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Verification Badge</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Stand out with a verified badge that builds trust and credibility with potential partners.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Can I cancel anytime?</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Yes! Cancel your Pro subscription anytime. You&apos;ll still have access until the end of your billing period.
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>What payment methods do you accept?</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              We accept all major credit cards through Stripe, as well as PayPal for your convenience.
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>Can I try Pro before committing?</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Yes! We offer a 7-day free trial of Pro features. No credit card required to start.
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>What happens to my listings if I downgrade?</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Your listings remain active, but you&apos;ll be limited to 5 active listings. You can choose which ones to keep active.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

