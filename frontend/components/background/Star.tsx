/**
 * Individual Star Component - Memoized for performance
 */

'use client';

import React from 'react';
import type { Star as StarType, PrideFlagType } from './types';
import { getPrideColor } from './utils';

interface StarProps {
  star: StarType;
  depth: number;
  prideMode: boolean;
  assignedFlag: PrideFlagType | null;
  /** Constellation-relative X percentage [0..1] for pride color mapping */
  relativeX: number;
}

export const Star = React.memo(
  function Star({ star, depth, prideMode, assignedFlag, relativeX }: StarProps) {
    const prideColor =
      prideMode && assignedFlag ? getPrideColor(relativeX, assignedFlag) : null;

    const baseColor = `rgba(220, 235, 255, ${0.3 + depth * 0.7})`;
    const glowColor = 'rgba(200, 220, 255, 0.6)';

    return (
      <span
        className="absolute pointer-events-none transition-all duration-500"
        style={{
          left: star.x,
          top: star.y,
          transform: 'translate(-50%, -50%)',
          textShadow: prideColor
            ? `0 0 ${depth * 20}px ${prideColor}, 0 0 ${depth * 10}px ${prideColor}`
            : `0 0 ${depth * 20}px ${glowColor}, 0 0 ${depth * 10}px ${glowColor}`,
          color: prideColor || baseColor,
          opacity: 0.7 + depth * 0.3,
          fontSize: depth > 0.3 ? '20px' : depth > 0.15 ? '16px' : '12px',
        }}
      >
        {star.char}
      </span>
    );
  },
  (prev, next) => {
    return (
      prev.prideMode === next.prideMode &&
      prev.assignedFlag === next.assignedFlag &&
      prev.depth === next.depth
    );
  }
);
