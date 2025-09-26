// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DealFlow',
  description: 'Clean, simple off-market deals feed',
  manifest: '/manifest.json',
  themeColor: '#198754',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
