// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'DealFlow',
  description: 'An app where wholesalers can post off-market properties for potential investors to view and invest in',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111',
        }}
      >
        {children}
      </body>
    </html>
  );
}
