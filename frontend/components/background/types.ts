/**
 * Type definitions for the ASCII Constellation Parallax Background system
 */

export type PrideFlagType =
  | 'rainbow'
  | 'trans'
  | 'bisexual'
  | 'lesbian'
  | 'gay'
  | 'pansexual'
  | 'nonbinary'
  | 'asexual'
  | 'aromantic'
  | 'genderfluid'
  | 'agender';

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface Star {
  char: string;
  x: number;
  y: number;
}

export interface Constellation {
  layer: 1 | 2 | 3;
  stars: Star[];
  connections: [number, number][]; // Pairs of star indices to connect
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface PerformanceConfig {
  parallaxRange: number;
  rotationDuration: number;
  targetFPS: number;
  enableGlow: boolean;
  enableRotation: boolean;
  enableParallax: boolean;
}

export interface ColorStop {
  stop: number;
  color: string;
}

export interface FlagPalette {
  [key: string]: ColorStop[];
}
