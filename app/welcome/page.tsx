'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function WelcomePage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '60px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#1a1a1a', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to Off Axis Deals
          </h1>
          
          <div style={{
            width: '80px',
            height: '4px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            margin: '0 auto 32px',
            borderRadius: '2px'
          }} />
          
          <p style={{
            fontSize: '20px',
            lineHeight: '1.6',
            color: '#4a5568',
            marginBottom: '40px',
            maxWidth: '800px',
            margin: '0 auto 40px'
          }}>
            Off Axis Deals is a real estate platform built for wholesalers and investors. 
            It connects verified off-market property deals directly with active buyers — 
            no middlemen, no wasted time. You can list, search, and close off-market deals 
            faster, with built-in tools for contact, images, and property details — 
            all streamlined for mobile and desktop.
          </p>
        </div>

        {/* Key Highlights */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Why Choose Off Axis Deals?
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px' 
          }}>
            <div style={{
              padding: '32px',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              background: '#f8fafc',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
                Lightning Fast
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Find and close deals in minutes, not days. Our streamlined platform eliminates 
                the back-and-forth that slows down traditional real estate transactions.
              </p>
            </div>
            
            <div style={{
              padding: '32px',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              background: '#f8fafc',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
                Verified Deals
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Every property is verified by our team. No more wasting time on fake listings 
                or properties that don't exist. Trust and transparency built-in.
              </p>
            </div>
            
            <div style={{
              padding: '32px',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              background: '#f8fafc',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
                Mobile First
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Built for mobile and desktop. Access your deals anywhere, anytime. 
                Perfect for busy investors and wholesalers on the go.
              </p>
            </div>
          </div>
        </div>

        {/* For Wholesalers vs Investors */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Built for Your Success
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '32px' 
          }}>
            <div style={{
              padding: '32px',
              border: '2px solid #667eea',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0f4ff, #e6f3ff)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748', marginBottom: '16px' }}>
                For Investors
              </h3>
              <ul style={{ textAlign: 'left', fontSize: '16px', color: '#4a5568', lineHeight: '1.8' }}>
                <li>✓ Find verified off-market deals instantly</li>
                <li>✓ AI-powered property analysis tools</li>
                <li>✓ Direct communication with wholesalers</li>
                <li>✓ Advanced filtering and search capabilities</li>
                <li>✓ Investment metrics and ROI calculations</li>
                <li>✓ Watchlists and alerts for new properties</li>
              </ul>
            </div>
            
            <div style={{
              padding: '32px',
              border: '2px solid #764ba2',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748', marginBottom: '16px' }}>
                For Wholesalers
              </h3>
              <ul style={{ textAlign: 'left', fontSize: '16px', color: '#4a5568', lineHeight: '1.8' }}>
                <li>✓ List properties with verified badges</li>
                <li>✓ Access to active investor analytics</li>
                <li>✓ Direct communication with buyers</li>
                <li>✓ Featured placement options</li>
                <li>✓ CRM export and lead management</li>
                <li>✓ Team collaboration tools</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                How is this different from other real estate platforms?
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Off Axis Deals focuses exclusively on off-market properties with verified listings. 
                We eliminate the middleman and provide direct communication between wholesalers and investors.
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                Are the properties verified?
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Yes! Every property goes through our verification process. We check ownership, 
                property details, and ensure all information is accurate before listing.
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                Can I use this on my phone?
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                Absolutely! Off Axis Deals is built mobile-first. You can browse deals, 
                contact sellers, and manage your account from any device.
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                What are the pricing options?
              </h3>
              <p style={{ fontSize: '16px', color: '#718096', lineHeight: '1.6' }}>
                We offer free plans to get started, plus Basic ($25-29/month) and Pro ($59/month) 
                plans with advanced features. Enterprise plans are available for teams.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/listings" 
              style={{
                background: hoveredButton === 'browse' ? 'linear-gradient(135deg, #5a67d8, #6b46c1)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                display: 'inline-block',
                transform: hoveredButton === 'browse' ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredButton === 'browse' ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={() => setHoveredButton('browse')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Browse Deals
            </Link>
            
            <Link 
              href="/pricing" 
              style={{
                background: hoveredButton === 'pricing' ? '#667eea' : 'white',
                color: hoveredButton === 'pricing' ? 'white' : '#667eea',
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                border: '2px solid #667eea',
                transition: 'all 0.2s ease',
                display: 'inline-block',
                transform: hoveredButton === 'pricing' ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredButton === 'pricing' ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={() => setHoveredButton('pricing')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ 
          textAlign: 'center',
          padding: '32px', 
          background: '#f7fafc', 
          borderRadius: '16px',
          fontSize: '16px',
          color: '#718096'
        }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>
            Ready to streamline your real estate deals?
          </p>
          <p style={{ margin: '0' }}>
            <Link href="/signup" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              Get started today
            </Link>
            {' '}or{' '}
            <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
              sign in
            </Link>
            {' '}to your account.
          </p>
        </div>
      </div>
    </div>
  );
}