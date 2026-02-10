/**
 * Hook to track page visibility for battery optimization
 */

'use client';

import { useEffect } from 'react';

export function usePageVisibility() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        document.body.classList.remove('page-visible');
      } else {
        document.body.classList.add('page-visible');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      handleVisibilityChange(); // Set initial state

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);
}
