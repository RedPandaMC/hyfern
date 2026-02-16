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
 * - Mobile easter egg: Touch and hold for 3 seconds
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
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
  
  // Mobile touch hold state
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const HOLD_DURATION = 3000; // 3 seconds

  // Theme detection
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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

    // Initialize canvas size with DPR scaling for crisp lines
    if (canvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = width * dpr;
      canvasRef.current.height = height * dpr;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      const ctx = canvasRef.current.getContext('2d', { alpha: true, desynchronized: true });
      if (ctx) ctx.scale(dpr, dpr);
    }

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = newWidth * dpr;
        canvasRef.current.height = newHeight * dpr;
        canvasRef.current.style.width = `${newWidth}px`;
        canvasRef.current.style.height = `${newHeight}px`;
        const ctx = canvasRef.current.getContext('2d', { alpha: true, desynchronized: true });
        if (ctx) ctx.scale(dpr, dpr);
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
    isDark,
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

  // Mobile touch hold easter egg
  const startHold = useCallback(() => {
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();
    
    // Update progress every 50ms
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);
      
      if (elapsed >= HOLD_DURATION) {
        // Hold completed - toggle pride mode
        togglePrideMode();
        endHold();
      }
    }, 50);
  }, [togglePrideMode]);

  const endHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  // Cleanup hold timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="constellation-container fixed inset-0 overflow-hidden"
      style={{
        background: 'hsl(var(--background))',
        zIndex: 0,
      }}
      onDoubleClick={handleDoubleClick}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
    >
      {/* Sky rotation container - all star layers AND canvas go inside this */}
      <div
        className="sky-rotation-container absolute inset-0"
        style={{
          transformOrigin: '50% 100%', // Bottom center rotation point
          animation: config.enableRotation
            ? `skyRotation ${config.rotationDuration}s linear infinite`
            : 'none',
        }}
      >
        {/* Canvas for lines and glows - now inside rotation container */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        />
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
              isDark={isDark}
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
      
      {/* Mobile hold progress indicator */}
      {isHolding && (
        <div 
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          style={{ zIndex: 100 }}
        >
          <div className="relative">
            {/* Outer ring */}
            <div 
              className="w-16 h-16 rounded-full border-4 border-white/30"
              style={{
                boxShadow: '0 0 20px rgba(255,255,255,0.3)'
              }}
            />
            {/* Progress arc */}
            <svg 
              className="absolute inset-0 w-16 h-16 -rotate-90"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={isDark ? '#ffffff' : '#000000'}
                strokeWidth="4"
                strokeDasharray={`${holdProgress * 176} 176`}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 0.05s linear',
                  filter: isDark ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                }}
              />
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
