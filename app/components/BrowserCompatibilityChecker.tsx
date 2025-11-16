'use client';

import { useEffect, useState } from 'react';

interface BrowserInfo {
  name: string;
  version: string;
  compatible: boolean;
  issues: string[];
}

export default function BrowserCompatibilityChecker() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectBrowser = (): BrowserInfo => {
      const userAgent = navigator.userAgent;
      const issues: string[] = [];
      let name = 'Unknown';
      let version = 'Unknown';
      let compatible = true;

      // Detect browser
      if (userAgent.indexOf('Firefox') > -1) {
        name = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        const versionNum = match ? parseInt(match[1], 10) : 0;
        if (versionNum < 90) {
          compatible = false;
          issues.push('Firefox version is too old. Please update to Firefox 90 or later.');
        }
      } else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
        name = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        const versionNum = match ? parseInt(match[1], 10) : 0;
        if (versionNum < 90) {
          compatible = false;
          issues.push('Chrome version is too old. Please update to Chrome 90 or later.');
        }
      } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
        name = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        const versionNum = match ? parseInt(match[1], 10) : 0;
        if (versionNum < 14) {
          compatible = false;
          issues.push('Safari version is too old. Please update to Safari 14 or later.');
        }
        // Check for iOS Safari
        if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
          issues.push('iOS Safari may have limited autocomplete support. Consider using Chrome on iOS.');
        }
      } else if (userAgent.indexOf('Edg') > -1) {
        name = 'Edge';
        const match = userAgent.match(/Edg\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        const versionNum = match ? parseInt(match[1], 10) : 0;
        if (versionNum < 90) {
          compatible = false;
          issues.push('Edge version is too old. Please update to Edge 90 or later.');
        }
      } else {
        name = 'Unknown';
        version = 'Unknown';
        compatible = false;
        issues.push('Unsupported browser detected. Please use Chrome, Firefox, Safari, or Edge.');
      }

      // Check for required features
      if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
        issues.push('Google Maps API not loaded. Some features may not work.');
      }

      if (!('localStorage' in window)) {
        compatible = false;
        issues.push('LocalStorage is not available. Some features may not work.');
      }

      if (!('fetch' in window)) {
        compatible = false;
        issues.push('Fetch API is not available. Please update your browser.');
      }

      return { name, version, compatible, issues };
    };

    const info = detectBrowser();
    setBrowserInfo(info);

    // Only show warning if there are issues
    if (!info.compatible || info.issues.length > 0) {
      setShowWarning(true);
    }
  }, []);

  if (!browserInfo || !showWarning) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '400px',
      background: browserInfo.compatible ? '#fef3c7' : '#fee2e2',
      border: `1px solid ${browserInfo.compatible ? '#fcd34d' : '#fca5a5'}`,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 9999
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
            {browserInfo.compatible ? '⚠️ Browser Notice' : '❌ Browser Compatibility Issue'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {browserInfo.name} {browserInfo.version}
          </div>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: 1,
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>
      {browserInfo.issues.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#374151' }}>
          {browserInfo.issues.map((issue, index) => (
            <li key={index} style={{ marginBottom: '4px' }}>
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

