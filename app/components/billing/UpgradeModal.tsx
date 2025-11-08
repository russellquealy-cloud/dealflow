// components/billing/UpgradeModal.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PaywallReason, getPaywallMessage } from '@/lib/paywall';
import { useAuth } from '@/providers/AuthProvider';

interface UpgradeModalProps {
  reason: PaywallReason;
  isOpen: boolean;
  onClose: () => void;
  currentSegment?: 'investor' | 'wholesaler';
}

export default function UpgradeModal({ 
  reason, 
  isOpen, 
  onClose, 
  currentSegment = 'investor' 
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  if (!isOpen) return null;

  const handleUpgrade = async (segment: 'investor' | 'wholesaler', tier: 'basic' | 'pro') => {
    setIsLoading(true);
    try {
      if (!session?.access_token) {
        alert('Please sign in to upgrade your plan.');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ segment, tier }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to start checkout. Please try again.');
        return;
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanPricing = (segment: 'investor' | 'wholesaler', tier: 'basic' | 'pro') => {
    if (segment === 'investor') {
      return tier === 'basic' ? '$29/month' : '$59/month';
    } else {
      return tier === 'basic' ? '$25/month' : '$59/month';
    }
  };

  const getPlanFeatures = (segment: 'investor' | 'wholesaler', tier: 'basic' | 'pro') => {
    if (segment === 'investor') {
      if (tier === 'basic') {
        return [
          'Unlimited listing views',
          'Contact property owners',
          '10 AI analyses per month',
          'Save favorites & watchlists',
          'Property alerts',
          'Map drawing tools',
          'Satellite view'
        ];
      } else {
        return [
          'Everything in Basic',
          'Unlimited AI analyses',
          'Export reports (CSV/PDF)',
          'Custom alerts',
          'Priority support',
          'Advanced analytics'
        ];
      }
    } else {
      if (tier === 'basic') {
        return [
          'Post 10 listings per month',
          'Basic analytics',
          'Property insights',
          'Contact tracking'
        ];
      } else {
        return [
          'Post 30 listings per month',
          'AI repair estimator',
          'Investor demand heatmaps',
          'Featured placement',
          'Verified badge',
          'Investor chat',
          'Advanced analytics'
        ];
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: '8px' 
          }}>
            Upgrade Required
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280', 
            lineHeight: '1.5' 
          }}>
            {getPaywallMessage({ reason })}
          </p>
        </div>

        {/* Upgrade Options */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Choose Your Plan
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          }}>
            {/* Basic Plan */}
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              background: '#f9fafb'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  {currentSegment === 'investor' ? 'Investor' : 'Wholesaler'} Basic
                </h4>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#059669' 
                }}>
                  {getPlanPricing(currentSegment, 'basic')}
                </div>
              </div>
              
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {getPlanFeatures(currentSegment, 'basic').map((feature, index) => (
                  <li key={index} style={{ 
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#059669', marginRight: '8px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(currentSegment, 'basic')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Processing...' : 'Upgrade to Basic'}
              </button>
            </div>

            {/* Pro Plan */}
            <div style={{
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: '20px',
              background: '#eff6ff',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#3b82f6',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                RECOMMENDED
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  {currentSegment === 'investor' ? 'Investor' : 'Wholesaler'} Pro
                </h4>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#3b82f6' 
                }}>
                  {getPlanPricing(currentSegment, 'pro')}
                </div>
              </div>
              
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {getPlanFeatures(currentSegment, 'pro').map((feature, index) => (
                  <li key={index} style={{ 
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#3b82f6', marginRight: '8px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(currentSegment, 'pro')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>

        {/* Enterprise Option */}
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '8px'
          }}>
            Need Enterprise Features?
          </h4>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '12px' 
          }}>
            Team seats, white-label branding, custom integrations, and dedicated support
          </p>
          <Link 
            href="/contact-sales"
            style={{
              background: '#7c3aed',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            Contact Sales
          </Link>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
