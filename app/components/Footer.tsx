// app/components/Footer.tsx
"use client";

import Link from 'next/link';

const footerStyle: React.CSSProperties = {
  background: '#f8f9fa',
  borderTop: '1px solid #e9ecef',
  padding: '24px 16px',
  marginTop: 'auto',
  fontSize: '14px',
  color: '#6c757d'
};

const linkStyle: React.CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'none',
  marginRight: '16px',
  marginBottom: '8px',
  display: 'inline-block'
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const leftStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center'
};

const rightStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center'
};

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={leftStyle}>
          <Link href="/terms" style={linkStyle}>
            Terms of Service
          </Link>
          <Link href="/privacy" style={linkStyle}>
            Privacy Policy
          </Link>
          <Link href="/contact-sales" style={linkStyle}>
            Contact Sales
          </Link>
          <Link href="/feedback" style={linkStyle}>
            Feedback & Bug Reports
          </Link>
        </div>
        <div style={rightStyle}>
          {/* Mobile App Links */}
          <div style={{ display: 'flex', gap: '10px', marginRight: '20px', alignItems: 'center' }}>
            <a 
              href="https://apps.apple.com/app/off-axis-deals" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#6c757d', 
                textDecoration: 'none',
                padding: '6px 10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <span style={{ fontSize: '16px' }}>🍎</span>
              <span>App Store</span>
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=com.offaxisdeals.app" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#6c757d', 
                textDecoration: 'none',
                padding: '6px 10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span>Google Play</span>
            </a>
          </div>
          <span style={{ color: '#6c757d' }}>
            © 2024 Off Axis Deals. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
