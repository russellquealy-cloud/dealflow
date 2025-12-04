// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileLayout from "@/components/MobileLayout";
import { AuthProvider } from "@/providers/AuthProvider";
import BrowserCompatibilityChecker from "@/components/BrowserCompatibilityChecker";

const BASE_URL = "https://www.offaxisdeals.com";
const DEFAULT_TITLE = "Off Axis Deals | Real Estate Investment Marketplace";
const DEFAULT_DESCRIPTION =
  "Find real estate investment deals fast. Off-market properties for investors and wholesalers nationwide.";
const KEYWORDS = [
  "real estate deals",
  "off-market properties",
  "wholesaling",
  "investment properties",
  "real estate investors",
  "Off Axis Deals",
  "real estate investment",
  "off-market deals",
  "property wholesaling",
  "real estate platform",
  "investment opportunities",
  "property analysis",
  "real estate AI"
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Off Axis Deals",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: [
    "https://www.facebook.com/offaxisdeals",
    "https://www.instagram.com/offaxisdeals",
    "https://www.linkedin.com/company/offaxisdeals"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "customerservice@offaxisdeals.com",
    contactType: "customer support"
  }
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: "Off Axis Deals" }],
  keywords: KEYWORDS,
  robots: {
    index: true,
    follow: true
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Off Axis Deals"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png"
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: "Off Axis Deals",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Off Axis Deals - real estate investment marketplace"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.png"]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6"
};

// Force dynamic rendering to prevent SSR issues with client components during error page prerendering
export const dynamic = 'force-dynamic';

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
        <meta name="apple-mobile-web-app-title" content="Off Axis Deals" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-dns-prefetch-control" content="off" />
      </head>
      <body style={{ height: '100%', margin: 0, padding: 0 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <MobileLayout>
            {/* App shell: header fixed at top, content fills the rest */}
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Header />
              {/* IMPORTANT: this div owns page scrolling/clipping, not the header */}
              <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>{children}</main>
              <Footer />
              <BrowserCompatibilityChecker />
            </div>
          </MobileLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
