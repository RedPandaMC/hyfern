/**
 * Pride Mode Indicator - Shows when pride mode is active
 */

'use client';

import React from 'react';

interface PrideModeIndicatorProps {
  prideMode: boolean;
}

export const PrideModeIndicator = React.memo(function PrideModeIndicator({
  prideMode,
}: PrideModeIndicatorProps) {
  if (!prideMode) return null;

  return (
    <div
      className="fixed bottom-3 right-3 z-[1000] opacity-70 transition-opacity duration-300 hover:opacity-100 cursor-default select-none"
      title="Pride Mode Active - All Flags"
      aria-label="Pride mode is currently active"
    >
      <span className="text-2xl">🏳️‍🌈</span>
    </div>
  );
});
