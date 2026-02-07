'use client';

import { useRef, useEffect } from 'react';
import { TerrainRenderer } from './renderer';

interface AnsiBackgroundProps {
  opacity?: number;
  className?: string;
}

export function AnsiBackground({ opacity = 1, className = '' }: AnsiBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TerrainRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      // Still render one frame but don't animate
      const renderer = new TerrainRenderer(canvas, { scrollSpeed: 0 });
      rendererRef.current = renderer;
      // Draw a single static frame
      renderer.start();
      // Stop after first frame renders
      requestAnimationFrame(() => renderer.stop());
      return;
    }

    const renderer = new TerrainRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    // Handle resize (debounced)
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderer.resize();
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      renderer.stop();
      rendererRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ opacity, width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
