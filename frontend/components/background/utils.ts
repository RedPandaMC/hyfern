/**
 * Utility functions for constellation generation and rendering
 */

import type { Constellation, Star, PrideFlagType } from './types';
import { STAR_CHARS, FLAG_PALETTES, STAR_DISTANCE_CONSTRAINTS } from './constants';

/**
 * Generate realistic open constellations with branching patterns
 * Respects min/max distance constraints between stars
 */
export function generateConstellations(width: number, height: number): Constellation[] {
  const constellations: Constellation[] = [];
  const centers: { x: number; y: number }[] = [];
  const { MIN_CONSTELLATION_DISTANCE, MIN_DISTANCE, MAX_CONNECTION_DISTANCE } = STAR_DISTANCE_CONSTRAINTS;

  // Generate across a 3x3 area centered on the viewport so rotations
  // (especially 180° around bottom-center) never show an empty sky.
  const genWidth = width * 3;
  const genHeight = height * 3;
  const offsetX = -width;   // shift left by 1 viewport
  const offsetY = -height;  // shift up by 1 viewport

  // Generate 20-28 constellations to fill the larger area
  const constellationCount = 20 + Math.floor(Math.random() * 9);

  for (let i = 0; i < constellationCount; i++) {
    // Determine layer (30% layer 1, 40% layer 2, 30% layer 3)
    const rand = Math.random();
    const layer = (rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3) as 1 | 2 | 3;

    // Each constellation has 4-7 stars
    const starCount = 4 + Math.floor(Math.random() * 4);

    // Pick a center point within the extended 3x area
    let centerX: number, centerY: number;
    let attempts = 0;
    do {
      centerX = offsetX + Math.random() * genWidth;
      centerY = offsetY + Math.random() * genHeight;
      attempts++;
    } while (
      attempts < 50 &&
      centers.some((c) => Math.hypot(c.x - centerX, c.y - centerY) < MIN_CONSTELLATION_DISTANCE)
    );
    centers.push({ x: centerX, y: centerY });

    // Generate stars clustered around center with min distance constraint
    const stars: Star[] = [];
    const starChars =
      layer === 1
        ? STAR_CHARS.LAYER_1
        : layer === 2
          ? STAR_CHARS.LAYER_2
          : STAR_CHARS.LAYER_3;

    for (let j = 0; j < starCount; j++) {
      let starX: number, starY: number;
      let starAttempts = 0;
      const maxRadius = MAX_CONNECTION_DISTANCE * 0.8; // Keep stars within connection range

      do {
        // Generate position with minimum distance from other stars
        const angle = Math.random() * Math.PI * 2;
        const radius = MIN_DISTANCE + Math.random() * (maxRadius - MIN_DISTANCE);
        starX = centerX + Math.cos(angle) * radius;
        starY = centerY + Math.sin(angle) * radius;
        starAttempts++;
      } while (
        starAttempts < 30 &&
        stars.some((s) => Math.hypot(s.x - starX, s.y - starY) < MIN_DISTANCE)
      );

      stars.push({
        char: starChars[Math.floor(Math.random() * starChars.length)],
        x: starX,
        y: starY,
      });
    }

    // Generate connections using nearest-neighbor spanning tree (no crossing lines)
    const connections = generateNearestNeighborConnections(stars);

    constellations.push({ layer, stars, connections });
  }

  // Add scattered individual stars (no connections) across the extended area
  // Scaled up for 3x3 coverage area
  const scatterCounts: [1 | 2 | 3, number][] = [[1, 100], [2, 70], [3, 30]];

  for (const [layer, count] of scatterCounts) {
    const starChars =
      layer === 1
        ? STAR_CHARS.LAYER_1
        : layer === 2
          ? STAR_CHARS.LAYER_2
          : STAR_CHARS.LAYER_2.slice(0, 2);

    for (let i = 0; i < count; i++) {
      constellations.push({
        layer,
        stars: [
          {
            char: starChars[Math.floor(Math.random() * starChars.length)],
            x: offsetX + Math.random() * genWidth,
            y: offsetY + Math.random() * genHeight,
          },
        ],
        connections: [],
      });
    }
  }

  return constellations;
}

/**
 * Generate constellation connections using nearest-neighbor spanning tree.
 * Connects each unconnected star to its closest connected neighbor,
 * producing short edges that never cross each other.
 * Respects MAX_CONNECTION_DISTANCE constraint.
 */
function generateNearestNeighborConnections(stars: Star[]): [number, number][] {
  if (stars.length < 2) return [];

  const { MAX_CONNECTION_DISTANCE } = STAR_DISTANCE_CONSTRAINTS;
  const maxDistSq = MAX_CONNECTION_DISTANCE * MAX_CONNECTION_DISTANCE;
  const connections: [number, number][] = [];
  const connected = new Set([0]);
  const unconnected = new Set(
    Array.from({ length: stars.length }, (_, i) => i).slice(1)
  );

  // Prim-style: always add the globally shortest edge to the tree
  while (unconnected.size > 0) {
    let bestDist = Infinity;
    let bestFrom = 0;
    let bestTo = 1;
    let found = false;

    for (const from of connected) {
      for (const to of unconnected) {
        const dx = stars[from].x - stars[to].x;
        const dy = stars[from].y - stars[to].y;
        const dist = dx * dx + dy * dy;
        // Only consider connections within max distance
        if (dist < maxDistSq && dist < bestDist) {
          bestDist = dist;
          bestFrom = from;
          bestTo = to;
          found = true;
        }
      }
    }

    // If no valid connection found within max distance, break
    if (!found) break;

    connections.push([bestFrom, bestTo]);
    connected.add(bestTo);
    unconnected.delete(bestTo);
  }

  return connections;
}

/**
 * Get pride color for a star based on its relative position within the constellation.
 * Uses STEPPED gradients (hard color transitions) for authentic flag appearance.
 * The percentage is relative to the constellation's bounding box, not the screen.
 */
export function getPrideColor(
  relativePercentage: number,
  flagType: PrideFlagType | null,
): string | null {
  if (!flagType) return null;

  const percentage = Math.max(0, Math.min(1, relativePercentage));
  const colors = FLAG_PALETTES[flagType] || FLAG_PALETTES.rainbow;

  // Find which color band we're in (no interpolation - stepped gradient)
  for (let i = 0; i < colors.length - 1; i++) {
    if (percentage >= colors[i].stop && percentage < colors[i + 1].stop) {
      return colors[i].color;
    }
  }

  return colors[colors.length - 1].color;
}

/**
 * Compute the X bounding box of a constellation's stars.
 * Returns [minX, maxX] with a minimum spread so colours are distributed.
 */
export function getConstellationBounds(stars: Star[]): [number, number] {
  if (stars.length === 0) return [0, 1];
  let minX = Infinity, maxX = -Infinity;
  for (const s of stars) {
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
  }
  // Ensure minimum spread so colours are distributed even for tight clusters
  if (maxX - minX < 1) {
    minX -= 0.5;
    maxX += 0.5;
  }
  return [minX, maxX];
}

/**
 * Convert an absolute X position to a constellation-relative percentage [0..1].
 */
export function toRelativeX(x: number, bounds: [number, number]): number {
  return (x - bounds[0]) / (bounds[1] - bounds[0]);
}

/**
 * Randomize pride flag assignments for all constellations
 */
export function randomizeConstellationFlags(
  constellations: Constellation[]
): Record<number, PrideFlagType> {
  const flagMap: Record<number, PrideFlagType> = {};
  const flags: PrideFlagType[] = [
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

  constellations.forEach((_, index) => {
    const randomFlag = flags[Math.floor(Math.random() * flags.length)];
    flagMap[index] = randomFlag;
  });

  return flagMap;
}
