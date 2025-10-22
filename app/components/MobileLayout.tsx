'use client';

import { useEffect, useState } from 'react';
import { mobileSessionManager } from '@/lib/mobile-session';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize mobile session management
    const initializeMobile = async () => {
      setIsMobile(mobileSessionManager.isMobileDevice());
      await mobileSessionManager.initialize();
      setIsLoading(false);
    };

    initializeMobile();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isMobile ? '#f8fafc' : '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Mobile-specific viewport meta tag handling */}
      {isMobile && (
        <style jsx global>{`
          html {
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
          }
          
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            touch-action: manipulation;
          }
          
          input, textarea, select {
            font-size: 16px !important;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
          
          button {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Prevent zoom on input focus on iOS */
          @media screen and (max-width: 767px) {
            input[type="text"],
            input[type="email"],
            input[type="password"],
            input[type="number"],
            textarea,
            select {
              font-size: 16px !important;
            }
          }
        `}</style>
      )}
      
      {children}
    </div>
  );
}

