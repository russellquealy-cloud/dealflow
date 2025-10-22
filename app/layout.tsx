// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import MobileLayout from "@/components/MobileLayout";
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: "DealFlow",
  description: "Find deals fast",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DealFlow"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DealFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{ height: '100%', margin: 0, padding: 0 }}>
        <MobileLayout>
          {/* App shell: header fixed at top, content fills the rest */}
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            {/* IMPORTANT: this div owns page scrolling/clipping, not the header */}
            <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>{children}</main>
          </div>
        </MobileLayout>
      </body>
    </html>
  );
}
