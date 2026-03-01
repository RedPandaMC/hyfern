'use client';

import { useEffect, useState } from 'react';

interface TokenStatus {
  tokensExist: boolean;
  tokenDate: string | null;
  daysUntilExpiry: number | null;
  needsRefresh: boolean;
  critical: boolean;
}

export function TokenExpirationBanner() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/server/tokens')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
      })
      .catch(() => {});
  }, []);

  if (!status || !status.tokensExist || dismissed) {
    return null;
  }

  if (!status.needsRefresh) {
    return null;
  }

  const isCritical = status.critical;
  const bgColor = isCritical ? 'rgba(220, 38, 38, 0.2)' : 'rgba(234, 179, 8, 0.2)';
  const borderColor = isCritical ? '#dc2626' : '#eab308';
  const textColor = isCritical ? '#fca5a5' : '#fde047';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        color: textColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {isCritical 
              ? 'Token Expired or Expiring Soon!' 
              : 'Token Expiring Soon'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isCritical
              ? 'Your Hytale server authentication tokens have expired or will expire within 24 hours. Players will not be able to connect. Please refresh immediately.'
              : `Your Hytale server authentication tokens will expire in ${status.daysUntilExpiry} days. Please refresh before they expire to avoid server downtime.`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => {
            alert('Please run ./refresh-hytale-tokens.sh on the server to refresh tokens');
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: `1px solid ${borderColor}`,
            backgroundColor: isCritical ? '#dc2626' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Refresh Tokens
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}