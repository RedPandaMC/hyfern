/**
 * StarLayer Component - Renders a depth layer of stars with parallax
 */

'use client';

import React, { useMemo } from 'react';
import { Star } from './Star';
import type { Star as StarType, PrideFlagType } from './types';
import { getConstellationBounds, toRelativeX } from './utils';

interface StarLayerProps {
  constellationId: number;
  stars: StarType[];
  depth: number;
  prideMode: boolean;
  assignedFlag: PrideFlagType | null;
}

export const StarLayer = React.memo(function StarLayer({
  constellationId,
  stars,
  depth,
  prideMode,
  assignedFlag,
}: StarLayerProps) {
  // Compute constellation X bounds once for pride color mapping
  const bounds = useMemo(() => getConstellationBounds(stars), [stars]);

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
          relativeX={toRelativeX(star.x, bounds)}
        />
      ))}
    </div>
  );
});
