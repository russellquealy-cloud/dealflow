// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Header from './components/Header'; // make sure file name & path match exactly (case-sensitive)

export const metadata: Metadata = {
  title: 'DealFlow',
  description:
    'An app where wholesalers can post off-market properties for potential investors to view and invest in',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0f172a',
          color: '#fff',
        }}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
