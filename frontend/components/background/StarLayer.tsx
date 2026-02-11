/**
 * StarLayer Component - Renders a depth layer of stars with parallax
 */

'use client';

import React from 'react';
import { Star } from './Star';
import type { Star as StarType, PrideFlagType } from './types';

interface StarLayerProps {
  constellationId: number;
  stars: StarType[];
  depth: number;
  prideMode: boolean;
  assignedFlag: PrideFlagType | null;
  containerWidth: number;
}

export const StarLayer = React.memo(function StarLayer({
  constellationId,
  stars,
  depth,
  prideMode,
  assignedFlag,
  containerWidth,
}: StarLayerProps) {
  return (
    <div
      className="star-layer absolute inset-0 pointer-events-none will-change-transform font-mono"
      data-depth={depth}
      style={{
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      {stars.map((star, idx) => (
        <Star
          key={`${constellationId}-${idx}`}
          star={star}
          depth={depth}
          prideMode={prideMode}
          assignedFlag={assignedFlag}
          containerWidth={containerWidth}
        />
      ))}
    </div>
  );
});
