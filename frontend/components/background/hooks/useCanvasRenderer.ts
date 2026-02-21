/**
 * Hook for canvas rendering of constellation lines with pride mode support
 */

'use client';

import { useCallback, useRef } from 'react';
import type { Constellation, PrideFlagType, Star } from '../types';
import { getPrideColor, getConstellationBounds, toRelativeX } from '../utils';
import { DEPTH_MULTIPLIERS } from '../constants';

/**
 * Find the longest path (pair of stars with maximum distance) in a constellation.
 * This is used for pride mode to maximize the gradient space for flag visibility.
 */
function findLongestPath(stars: Star[]): { start: Star; end: Star; distance: number } | null {
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

  return { start: startStar, end: endStar, distance: maxDist };
}

/**
 * Project a point onto the longest path line and get relative position [0..1]
 */
function projectOntoLongestPath(
  point: Star,
  pathStart: Star,
  pathEnd: Star
): number {
  const dx = pathEnd.x - pathStart.x;
  const dy = pathEnd.y - pathStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return 0;

  // Project point onto line
  const t = ((point.x - pathStart.x) * dx + (point.y - pathStart.y) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

interface UseCanvasRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  constellations: Constellation[];
  prideMode: boolean;
  constellationFlags: Record<number, PrideFlagType>;
  isDark: boolean;
}

export function useCanvasRenderer({
  canvasRef,
  constellations,
  prideMode,
  constellationFlags,
  isDark,
}: UseCanvasRendererOptions) {
  const lastDrawTime = useRef(0);
  const drawThrottle = 16; // ~60fps

  const drawConstellationLines = useCallback(
    (deltaX: number, deltaY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      if (now - lastDrawTime.current < drawThrottle) return;
      lastDrawTime.current = now;

      const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      if (!ctx) return;

      // Use CSS dimensions (not canvas pixel dimensions which include DPR)
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Clear canvas (use CSS dimensions — transform handles DPR scaling)
      ctx.clearRect(0, 0, width, height);

      constellations.forEach((constellation, constellationIndex) => {
        if (constellation.connections.length === 0) return;

        const layer = constellation.layer;
        const depth =
          layer === 1
            ? DEPTH_MULTIPLIERS.LAYER_1
            : layer === 2
              ? DEPTH_MULTIPLIERS.LAYER_2
              : DEPTH_MULTIPLIERS.LAYER_3;

        const assignedFlag = prideMode ? constellationFlags[constellationIndex] : null;

        // Pre-compute constellation bounds for pride color mapping
        const bounds = assignedFlag ? getConstellationBounds(constellation.stars) : null;

        // Find longest path for pride mode gradient direction
        const longestPath = assignedFlag ? findLongestPath(constellation.stars) : null;

        // Calculate parallax offset for this layer
        const maxMove = 40;
        const offsetX = deltaX * depth * maxMove;
        const offsetY = deltaY * depth * maxMove;

        // Draw connections
        constellation.connections.forEach(([startIdx, endIdx]) => {
          const start = constellation.stars[startIdx];
          const end = constellation.stars[endIdx];

          // Apply parallax offset
          const rawX1 = start.x + offsetX;
          const rawY1 = start.y + offsetY;
          const rawX2 = end.x + offsetX;
          const rawY2 = end.y + offsetY;

          // Shorten endpoints by 8px so lines don't overlap star glyphs
          const dx = rawX2 - rawX1;
          const dy = rawY2 - rawY1;
          const lineLen = Math.sqrt(dx * dx + dy * dy);
          const shrink = lineLen > 20 ? 8 / lineLen : 0;
          const x1 = rawX1 + dx * shrink;
          const y1 = rawY1 + dy * shrink;
          const x2 = rawX2 - dx * shrink;
          const y2 = rawY2 - dy * shrink;

          // Pride mode: Create gradient using longest path direction
          if (prideMode && assignedFlag && longestPath) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

            // Project start/end onto longest path for maximum flag visibility
            const relStart = projectOntoLongestPath(start, longestPath.start, longestPath.end);
            const relEnd = projectOntoLongestPath(end, longestPath.start, longestPath.end);

            const steps = Math.max(3, Math.ceil(Math.abs(relEnd - relStart) * 10));

            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const relPos = relStart + (relEnd - relStart) * t;
              const color = getPrideColor(relPos, assignedFlag);

              if (i > 0) {
                const prevRelPos = relStart + (relEnd - relStart) * ((i - 1) / steps);
                const prevColor = getPrideColor(prevRelPos, assignedFlag);
                gradient.addColorStop(t - 0.001, prevColor || (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)'));
              }
              gradient.addColorStop(t, color || (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)'));
            }

            ctx.strokeStyle = gradient;
          } else {
            // Non-pride mode: black on light mode, white on dark mode
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${depth * 0.5})`
              : `rgba(0, 0, 0, 0.85)`;
          }

          ctx.lineWidth = depth * 2.5;
          ctx.lineCap = 'round';

          // Glow effect - draw multiple times with decreasing opacity
          for (let i = 3; i > 0; i--) {
            ctx.shadowBlur = i * 8;

            if (prideMode && assignedFlag && longestPath) {
              const midRelPos = projectOntoLongestPath(
                { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, char: '' },
                longestPath.start,
                longestPath.end
              );
              ctx.shadowColor = getPrideColor(midRelPos, assignedFlag) || (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)');
            } else {
              // Non-pride mode: white shadow on dark, black shadow on light
              ctx.shadowColor = isDark
                ? `rgba(255, 255, 255, ${depth * 0.4})`
                : `rgba(0, 0, 0, 0.4)`;
            }

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }

          ctx.shadowBlur = 0; // Reset
        });
      });
    },
    [canvasRef, constellations, prideMode, constellationFlags, isDark, drawThrottle]
  );

  return { drawConstellationLines };
}
