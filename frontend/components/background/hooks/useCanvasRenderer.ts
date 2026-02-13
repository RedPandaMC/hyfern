/**
 * Hook for canvas rendering of constellation lines with pride mode support
 */

'use client';

import { useCallback, useRef } from 'react';
import type { Constellation, PrideFlagType } from '../types';
import { getPrideColor, getConstellationBounds, toRelativeX } from '../utils';
import { DEPTH_MULTIPLIERS } from '../constants';

interface UseCanvasRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  constellations: Constellation[];
  prideMode: boolean;
  constellationFlags: Record<number, PrideFlagType>;
}

export function useCanvasRenderer({
  canvasRef,
  constellations,
  prideMode,
  constellationFlags,
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

          // Pride mode: Create gradient using constellation-relative positions
          if (prideMode && assignedFlag && bounds) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

            // Map start/end to constellation-relative percentages
            const relStart = toRelativeX(start.x, bounds);
            const relEnd = toRelativeX(end.x, bounds);

            const steps = Math.max(3, Math.ceil(Math.abs(relEnd - relStart) * 10));

            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const relX = relStart + (relEnd - relStart) * t;
              const color = getPrideColor(relX, assignedFlag);

              if (i > 0) {
                const prevRelX = relStart + (relEnd - relStart) * ((i - 1) / steps);
                const prevColor = getPrideColor(prevRelX, assignedFlag);
                gradient.addColorStop(t - 0.001, prevColor || 'rgba(180, 200, 255, 0.4)');
              }
              gradient.addColorStop(t, color || 'rgba(180, 200, 255, 0.4)');
            }

            ctx.strokeStyle = gradient;
          } else {
            ctx.strokeStyle = `rgba(180, 200, 255, ${depth * 0.4})`;
          }

          ctx.lineWidth = depth * 1.5;
          ctx.lineCap = 'round';

          // Glow effect - draw multiple times with decreasing opacity
          for (let i = 3; i > 0; i--) {
            ctx.shadowBlur = i * 8;

            if (prideMode && assignedFlag && bounds) {
              const midRelX = toRelativeX((start.x + end.x) / 2, bounds);
              ctx.shadowColor = getPrideColor(midRelX, assignedFlag) || 'rgba(200, 220, 255, 0.3)';
            } else {
              ctx.shadowColor = `rgba(200, 220, 255, ${depth * 0.3})`;
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
    [canvasRef, constellations, prideMode, constellationFlags, drawThrottle]
  );

  return { drawConstellationLines };
}
