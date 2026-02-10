/**
 * Hook to detect device performance tier and adjust rendering accordingly
 */

'use client';

import { useState, useEffect } from 'react';
import type { PerformanceTier } from '../types';

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('high');

  useEffect(() => {
    const detectTier = async () => {
      // Check for reduced motion preference
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setTier('low');
        return;
      }

      // Check for mobile device
      const isMobile =
        typeof navigator !== 'undefined' &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Check battery level
      let isLowBattery = false;
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          isLowBattery = !battery.charging && battery.level < 0.2;
        } catch {
          // Battery API not available or blocked
        }
      }

      if (isLowBattery) {
        setTier('low');
      } else if (isMobile) {
        setTier('medium');
      } else {
        setTier('high');
      }
    };

    detectTier();
  }, []);

  return tier;
}
