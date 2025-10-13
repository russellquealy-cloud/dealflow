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
    <html lang="en" className="h-full">
      <body className="h-full">
        {/* App shell: header fixed at top, content fills the rest */}
        <div className="min-h-screen flex flex-col">
          <Header />
          {/* IMPORTANT: this div owns page scrolling/clipping, not the header */}
          <main className="flex-1 overflow-hidden min-h-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
