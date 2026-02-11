/**
 * ConstellationBackground - Main component for ASCII constellation parallax background
 *
 * Features:
 * - Multi-layer parallax with mouse tracking
 * - Slow sky rotation (360° in 10 minutes)
 * - Procedurally generated constellations with realistic branching patterns
 * - Pride mode easter egg with random flag assignment per constellation
 * - Adaptive performance based on device capabilities
 * - Battery-optimized with Page Visibility API
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StarLayer } from './StarLayer';
import { PrideModeIndicator } from './PrideModeIndicator';
import { usePerformanceTier } from './hooks/usePerformanceTier';
import { useMouseParallax } from './hooks/useMouseParallax';
import { usePageVisibility } from './hooks/usePageVisibility';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { generateConstellations, randomizeConstellationFlags } from './utils';
import { PERFORMANCE_CONFIGS, DEPTH_MULTIPLIERS } from './constants';
import type { Constellation, PrideFlagType } from './types';

interface ConstellationBackgroundProps {
  children: React.ReactNode;
}

export function ConstellationBackground({ children }: ConstellationBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [prideMode, setPrideMode] = useState(false);
  const [constellationFlags, setConstellationFlags] = useState<Record<number, PrideFlagType>>({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Performance tier detection
  const performanceTier = usePerformanceTier();
  const config = PERFORMANCE_CONFIGS[performanceTier];

  // Page visibility for battery optimization
  usePageVisibility();

  // Initialize constellations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    setConstellations(generateConstellations(width, height));
    setContainerSize({ width, height });

    // Initialize canvas size
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      setContainerSize({ width: newWidth, height: newHeight });

      if (canvasRef.current) {
        canvasRef.current.width = newWidth;
        canvasRef.current.height = newHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canvas rendering
  const { drawConstellationLines } = useCanvasRenderer({
    canvasRef,
    constellations,
    prideMode,
    constellationFlags,
  });

  // Mouse parallax
  useMouseParallax(containerRef, {
    enabled: config.enableParallax,
    onUpdate: drawConstellationLines,
  });

  // Initial canvas draw
  useEffect(() => {
    drawConstellationLines(0, 0);
  }, [drawConstellationLines, prideMode, constellationFlags]);

  // Pride mode toggle handler
  const togglePrideMode = useCallback(() => {
    setPrideMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        // Turning ON: randomize flags
        setConstellationFlags(randomizeConstellationFlags(constellations));
      }
      return newMode;
    });
  }, [constellations]);

  // Easter egg activation - Shift + Double Click
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.shiftKey) {
        togglePrideMode();
      }
    },
    [togglePrideMode]
  );

  // Easter egg - Press 'P' three times quickly
  const pKeyCountRef = useRef(0);
  const pKeyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        pKeyCountRef.current += 1;

        if (pKeyCountRef.current === 3) {
          togglePrideMode();
          pKeyCountRef.current = 0;
        }

        // Reset counter after 500ms
        if (pKeyTimerRef.current) clearTimeout(pKeyTimerRef.current);
        pKeyTimerRef.current = setTimeout(() => {
          pKeyCountRef.current = 0;
        }, 500);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (pKeyTimerRef.current) clearTimeout(pKeyTimerRef.current);
    };
  }, [togglePrideMode]);

  return (
    <div
      ref={containerRef}
      className="constellation-container fixed inset-0 overflow-hidden"
      style={{
        background: 'hsl(var(--background))',
        zIndex: 0,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Canvas for lines and glows */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Sky rotation container - all star layers go inside this */}
      <div
        className="sky-rotation-container absolute inset-0"
        style={{
          transformOrigin: 'center center',
          animation: config.enableRotation
            ? `skyRotation ${config.rotationDuration}s linear infinite`
            : 'none',
        }}
      >
        {/* Render constellations with their assigned flags */}
        {constellations.map((constellation, index) => {
          const depth =
            constellation.layer === 1
              ? DEPTH_MULTIPLIERS.LAYER_1
              : constellation.layer === 2
                ? DEPTH_MULTIPLIERS.LAYER_2
                : DEPTH_MULTIPLIERS.LAYER_3;

          return (
            <StarLayer
              key={index}
              constellationId={index}
              stars={constellation.stars}
              depth={depth}
              prideMode={prideMode}
              assignedFlag={constellationFlags[index] || null}
              containerHeight={containerSize.height}
            />
          );
        })}
      </div>

      {/* Dashboard content - NOT rotated */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>

      {/* Pride mode indicator */}
      <PrideModeIndicator prideMode={prideMode} />
    </div>
  );
}
