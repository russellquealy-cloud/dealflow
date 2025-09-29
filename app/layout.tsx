import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Header from './components/Header';
import DebugUser from './components/DebugUser'; // <-- add this

export const metadata: Metadata = {
  title: 'DealFlow',
  description:
    'An app where wholesalers can post off-market properties for potential investors to view and invest in',
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '20px 16px',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111',
        }}
      >
        <Header />
        <DebugUser /> {/* temporary — for RLS debugging */}
        <main style={mainStyle}>{children}</main>
      </body>
    </html>
  );
}
