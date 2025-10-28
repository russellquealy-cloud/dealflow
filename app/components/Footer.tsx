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
        </div>
        <div style={rightStyle}>
          <span style={{ color: '#6c757d' }}>
            © 2024 Off Axis Deals. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
