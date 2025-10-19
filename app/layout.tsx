// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: "DealFlow",
  description: "Find deals fast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0, padding: 0 }}>
        {/* App shell: header fixed at top, content fills the rest */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          {/* IMPORTANT: this div owns page scrolling/clipping, not the header */}
          <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
