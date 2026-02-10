/**
 * Hook for mouse parallax tracking with RAF throttling
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { MousePosition } from '../types';

interface UseMouseParallaxOptions {
  enabled: boolean;
  onUpdate?: (deltaX: number, deltaY: number) => void;
}

export function useMouseParallax(
  containerRef: React.RefObject<HTMLDivElement | null>,
  { enabled, onUpdate }: UseMouseParallaxOptions
) {
  const mousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const centerPos = useRef<MousePosition>({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const updateParallax = useCallback(() => {
    if (!enabled || !containerRef.current) return;

    const { x, y } = mousePos.current;
    const { x: cx, y: cy } = centerPos.current;

    // Calculate offset from center (-1 to 1 range)
    const deltaX = cx !== 0 ? (x - cx) / cx : 0;
    const deltaY = cy !== 0 ? (y - cy) / cy : 0;

    // Update each layer
    const layers = containerRef.current.querySelectorAll<HTMLDivElement>('.star-layer');
    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth || '0');
      const maxMove = 40;
      const offsetX = deltaX * depth * maxMove;
      const offsetY = deltaY * depth * maxMove;

      layer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    });

    onUpdate?.(deltaX, deltaY);
  }, [enabled, containerRef, onUpdate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const rect = container.getBoundingClientRect();
    centerPos.current = {
      x: rect.width / 2,
      y: rect.height / 2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // RAF throttling
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        updateParallax();
        rafId.current = null;
      });
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled, containerRef, updateParallax]);

  return { mousePos, centerPos };
}
