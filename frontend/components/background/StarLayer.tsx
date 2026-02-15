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
  isDark: boolean;
}

/**
 * Find the longest path (pair of stars with maximum distance) in a constellation.
 */
function findLongestPath(stars: StarType[]): { start: StarType; end: StarType } | null {
  if (stars.length < 2) return null;

  let maxDist = 0;
  let startStar = stars[0];
  let endStar = stars[1];

  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) {
        maxDist = dist;
        startStar = stars[i];
        endStar = stars[j];
      }
    }
  }

  return { start: startStar, end: endStar };
}

/**
 * Project a point onto the longest path line and get relative position [0..1]
 */
function projectOntoLongestPath(
  point: StarType,
  pathStart: StarType,
  pathEnd: StarType
): number {
  const dx = pathEnd.x - pathStart.x;
  const dy = pathEnd.y - pathStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return 0;

  const t = ((point.x - pathStart.x) * dx + (point.y - pathStart.y) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

export const StarLayer = React.memo(function StarLayer({
  constellationId,
  stars,
  depth,
  prideMode,
  assignedFlag,
  isDark,
}: StarLayerProps) {
  // Compute constellation bounds and longest path for pride color mapping
  const bounds = useMemo(() => getConstellationBounds(stars), [stars]);
  const longestPath = useMemo(() => findLongestPath(stars), [stars]);

  return (
    <div
      className="star-layer absolute inset-0 pointer-events-none will-change-transform font-mono"
      data-depth={depth}
      style={{
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      {stars.map((star, idx) => {
        // Use longest path projection for pride mode, horizontal bounds otherwise
        const relativePos = longestPath && prideMode
          ? projectOntoLongestPath(star, longestPath.start, longestPath.end)
          : toRelativeX(star.x, bounds);

        return (
          <Star
            key={`${constellationId}-${idx}`}
            star={star}
            depth={depth}
            prideMode={prideMode}
            assignedFlag={assignedFlag}
            relativeX={relativePos}
            isDark={isDark}
          />
        );
      })}
    </div>
  );
});
