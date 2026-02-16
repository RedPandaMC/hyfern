/**
 * Constants for the ASCII Constellation Parallax Background
 */

import type { FlagPalette, PrideFlagType } from './types';

export const PRIDE_FLAGS: PrideFlagType[] = [
  'rainbow',
  'trans',
  'bisexual',
  'lesbian',
  'gay',
  'pansexual',
  'nonbinary',
  'asexual',
  'aromantic',
  'genderfluid',
  'agender',
];

export const STAR_CHARS = {
  LAYER_1: ['·', '.'],
  LAYER_2: ['*', '+', '·'],
  LAYER_3: ['✦', '✧', '*', '◦'],
} as const;

export const DEPTH_MULTIPLIERS = {
  LAYER_1: 0.1,
  LAYER_2: 0.25,
  LAYER_3: 0.5,
} as const;

// Star distance constraints for procedural generation
export const STAR_DISTANCE_CONSTRAINTS = {
  // Minimum distance between any two stars (prevents overcrowding)
  MIN_DISTANCE: 25,
  // Maximum distance between connected stars (keeps constellations compact)
  MAX_CONNECTION_DISTANCE: 80,
  // Minimum distance between constellation centers (prevents overlap)
  MIN_CONSTELLATION_DISTANCE: 180,
} as const;

// Branch and loop generation settings
export const CONSTELLATION_GENERATION = {
  // Constellation count range (35-50 for higher density)
  MIN_CONSTELLATIONS: 35,
  MAX_CONSTELLATIONS: 50,
  // Stars per constellation (4-8 stars)
  MIN_STARS_PER_CONSTELLATION: 4,
  MAX_STARS_PER_CONSTELLATION: 8,
  // Probability of adding a branch per star (10%)
  BRANCH_PROBABILITY: 0.1,
  // Maximum number of loops per constellation
  MAX_LOOPS_PER_CONSTELLATION: 2,
  // Scattered star counts per layer (increased for more stars)
  SCATTER_STARS: {
    LAYER_1: 150,
    LAYER_2: 100,
    LAYER_3: 50,
  },
} as const;

export const FLAG_PALETTES: FlagPalette = {
  rainbow: [
    { stop: 0.0, color: 'rgba(228, 3, 3, 0.9)' }, // Red
    { stop: 0.167, color: 'rgba(255, 140, 0, 0.9)' }, // Orange
    { stop: 0.333, color: 'rgba(255, 237, 0, 0.9)' }, // Yellow
    { stop: 0.5, color: 'rgba(0, 128, 38, 0.9)' }, // Green
    { stop: 0.667, color: 'rgba(36, 64, 142, 0.9)' }, // Blue
    { stop: 0.833, color: 'rgba(115, 41, 130, 0.9)' }, // Purple
    { stop: 1.0, color: 'rgba(115, 41, 130, 0.9)' }, // Purple
  ],

  trans: [
    { stop: 0.0, color: 'rgba(91, 206, 250, 0.9)' }, // Light Blue
    { stop: 0.2, color: 'rgba(245, 169, 184, 0.9)' }, // Pink
    { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.6, color: 'rgba(245, 169, 184, 0.9)' }, // Pink
    { stop: 0.8, color: 'rgba(91, 206, 250, 0.9)' }, // Light Blue
    { stop: 1.0, color: 'rgba(91, 206, 250, 0.9)' }, // Light Blue
  ],

  bisexual: [
    { stop: 0.0, color: 'rgba(214, 2, 112, 0.9)' }, // Pink
    { stop: 0.4, color: 'rgba(214, 2, 112, 0.9)' }, // Pink (40%)
    { stop: 0.4, color: 'rgba(155, 79, 150, 0.9)' }, // Purple (hard transition)
    { stop: 0.6, color: 'rgba(155, 79, 150, 0.9)' }, // Purple (20%)
    { stop: 0.6, color: 'rgba(0, 56, 168, 0.9)' }, // Blue (hard transition)
    { stop: 1.0, color: 'rgba(0, 56, 168, 0.9)' }, // Blue (40%)
  ],

  lesbian: [
    { stop: 0.0, color: 'rgba(213, 45, 0, 0.9)' }, // Dark Orange
    { stop: 0.2, color: 'rgba(255, 154, 86, 0.9)' }, // Orange
    { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.6, color: 'rgba(212, 97, 166, 0.9)' }, // Pink
    { stop: 0.8, color: 'rgba(163, 2, 98, 0.9)' }, // Magenta
    { stop: 1.0, color: 'rgba(163, 2, 98, 0.9)' }, // Magenta
  ],

  gay: [
    { stop: 0.0, color: 'rgba(7, 141, 112, 0.9)' }, // Dark Teal
    { stop: 0.143, color: 'rgba(38, 206, 170, 0.9)' }, // Teal
    { stop: 0.286, color: 'rgba(152, 232, 193, 0.9)' }, // Light Green
    { stop: 0.429, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.571, color: 'rgba(123, 173, 227, 0.9)' }, // Light Blue
    { stop: 0.714, color: 'rgba(80, 73, 203, 0.9)' }, // Blue
    { stop: 0.857, color: 'rgba(61, 26, 120, 0.9)' }, // Purple
    { stop: 1.0, color: 'rgba(61, 26, 120, 0.9)' }, // Purple
  ],

  pansexual: [
    { stop: 0.0, color: 'rgba(255, 33, 140, 0.9)' }, // Pink
    { stop: 0.333, color: 'rgba(255, 33, 140, 0.9)' }, // Pink (33%)
    { stop: 0.333, color: 'rgba(255, 216, 0, 0.9)' }, // Yellow (hard transition)
    { stop: 0.667, color: 'rgba(255, 216, 0, 0.9)' }, // Yellow (33%)
    { stop: 0.667, color: 'rgba(33, 177, 255, 0.9)' }, // Cyan (hard transition)
    { stop: 1.0, color: 'rgba(33, 177, 255, 0.9)' }, // Cyan (33%)
  ],

  nonbinary: [
    { stop: 0.0, color: 'rgba(252, 244, 52, 0.9)' }, // Yellow
    { stop: 0.25, color: 'rgba(252, 244, 52, 0.9)' }, // Yellow (25%)
    { stop: 0.25, color: 'rgba(255, 255, 255, 0.9)' }, // White (hard transition)
    { stop: 0.5, color: 'rgba(255, 255, 255, 0.9)' }, // White (25%)
    { stop: 0.5, color: 'rgba(156, 89, 209, 0.9)' }, // Purple (hard transition)
    { stop: 0.75, color: 'rgba(156, 89, 209, 0.9)' }, // Purple (25%)
    { stop: 0.75, color: 'rgba(44, 44, 44, 0.9)' }, // Black (hard transition)
    { stop: 1.0, color: 'rgba(44, 44, 44, 0.9)' }, // Black (25%)
  ],

  asexual: [
    { stop: 0.0, color: 'rgba(0, 0, 0, 0.9)' }, // Black
    { stop: 0.25, color: 'rgba(0, 0, 0, 0.9)' }, // Black (25%)
    { stop: 0.25, color: 'rgba(163, 163, 163, 0.9)' }, // Gray (hard transition)
    { stop: 0.5, color: 'rgba(163, 163, 163, 0.9)' }, // Gray (25%)
    { stop: 0.5, color: 'rgba(255, 255, 255, 0.9)' }, // White (hard transition)
    { stop: 0.75, color: 'rgba(255, 255, 255, 0.9)' }, // White (25%)
    { stop: 0.75, color: 'rgba(128, 0, 128, 0.9)' }, // Purple (hard transition)
    { stop: 1.0, color: 'rgba(128, 0, 128, 0.9)' }, // Purple (25%)
  ],

  aromantic: [
    { stop: 0.0, color: 'rgba(61, 165, 66, 0.9)' }, // Dark Green
    { stop: 0.2, color: 'rgba(167, 211, 121, 0.9)' }, // Light Green
    { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.6, color: 'rgba(169, 169, 169, 0.9)' }, // Gray
    { stop: 0.8, color: 'rgba(0, 0, 0, 0.9)' }, // Black
    { stop: 1.0, color: 'rgba(0, 0, 0, 0.9)' }, // Black
  ],

  genderfluid: [
    { stop: 0.0, color: 'rgba(255, 117, 162, 0.9)' }, // Pink
    { stop: 0.2, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.4, color: 'rgba(190, 24, 214, 0.9)' }, // Purple
    { stop: 0.6, color: 'rgba(0, 0, 0, 0.9)' }, // Black
    { stop: 0.8, color: 'rgba(51, 62, 189, 0.9)' }, // Blue
    { stop: 1.0, color: 'rgba(51, 62, 189, 0.9)' }, // Blue
  ],

  agender: [
    { stop: 0.0, color: 'rgba(0, 0, 0, 0.9)' }, // Black
    { stop: 0.143, color: 'rgba(185, 185, 185, 0.9)' }, // Gray
    { stop: 0.286, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.429, color: 'rgba(183, 244, 132, 0.9)' }, // Green
    { stop: 0.571, color: 'rgba(255, 255, 255, 0.9)' }, // White
    { stop: 0.714, color: 'rgba(185, 185, 185, 0.9)' }, // Gray
    { stop: 0.857, color: 'rgba(0, 0, 0, 0.9)' }, // Black
    { stop: 1.0, color: 'rgba(0, 0, 0, 0.9)' }, // Black
  ],
};

export const PERFORMANCE_CONFIGS = {
  high: {
    parallaxRange: 40,
    rotationDuration: 600,
    targetFPS: 60,
    enableGlow: true,
    enableRotation: true,
    enableParallax: true,
  },
  medium: {
    parallaxRange: 20,
    rotationDuration: 900,
    targetFPS: 30,
    enableGlow: true,
    enableRotation: true,
    enableParallax: true,
  },
  low: {
    parallaxRange: 0,
    rotationDuration: 0,
    targetFPS: 0,
    enableGlow: false,
    enableRotation: false,
    enableParallax: false,
  },
} as const;
