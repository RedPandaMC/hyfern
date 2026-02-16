/**
 * Utility functions for constellation generation and rendering
 */

import type { Constellation, Star, PrideFlagType } from './types';
import { STAR_CHARS, FLAG_PALETTES, STAR_DISTANCE_CONSTRAINTS, CONSTELLATION_GENERATION } from './constants';

/**
 * Check if two line segments intersect
 * Line 1: from a1 to a2
 * Line 2: from b1 to b2
 */
function linesIntersect(
  a1: Star, a2: Star,
  b1: Star, b2: Star
): boolean {
  // Check if lines share an endpoint (that's allowed, they connect)
  if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) return false;

  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;

  return false;
}

/**
 * Calculate the direction of the turn from line p1->p2 to p2->p3
 */
function direction(p1: Star, p2: Star, p3: Star): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

/**
 * Check if point p3 is on segment p1->p2
 */
function onSegment(p1: Star, p2: Star, p3: Star): boolean {
  return Math.min(p1.x, p2.x) <= p3.x && p3.x <= Math.max(p1.x, p2.x) &&
         Math.min(p1.y, p2.y) <= p3.y && p3.y <= Math.max(p1.y, p2.y);
}

/**
 * Check if a new connection would cross any existing connections
 */
function wouldCrossExisting(
  from: number,
  to: number,
  stars: Star[],
  connections: [number, number][]
): boolean {
  const newA = stars[from];
  const newB = stars[to];

  for (const [existingFrom, existingTo] of connections) {
    const existingA = stars[existingFrom];
    const existingB = stars[existingTo];

    if (linesIntersect(newA, newB, existingA, existingB)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate realistic open constellations with branching patterns and closed loops
 * Respects min/max distance constraints between stars
 * Prevents line crossings between branches and loops
 */
export function generateConstellations(width: number, height: number): Constellation[] {
  const constellations: Constellation[] = [];
  const centers: { x: number; y: number }[] = [];
  const { MIN_CONSTELLATION_DISTANCE, MIN_DISTANCE, MAX_CONNECTION_DISTANCE } = STAR_DISTANCE_CONSTRAINTS;
  const { MIN_CONSTELLATIONS, MAX_CONSTELLATIONS, MIN_STARS_PER_CONSTELLATION, MAX_STARS_PER_CONSTELLATION, SCATTER_STARS } = CONSTELLATION_GENERATION;

  // Generate across a 3x3 area centered on the viewport so rotations
  // (especially 180° around bottom-center) never show an empty sky.
  const genWidth = width * 3;
  const genHeight = height * 3;
  const offsetX = -width;   // shift left by 1 viewport
  const offsetY = -height;  // shift up by 1 viewport

  // Generate 35-50 constellations for higher density
  const constellationCount = MIN_CONSTELLATIONS + Math.floor(Math.random() * (MAX_CONSTELLATIONS - MIN_CONSTELLATIONS + 1));

  for (let i = 0; i < constellationCount; i++) {
    // Determine layer (30% layer 1, 40% layer 2, 30% layer 3)
    const rand = Math.random();
    const layer = (rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3) as 1 | 2 | 3;

    // Each constellation has 4-8 stars (increased from 4-7)
    const starCount = MIN_STARS_PER_CONSTELLATION + Math.floor(Math.random() * (MAX_STARS_PER_CONSTELLATION - MIN_STARS_PER_CONSTELLATION + 1));

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

    // Generate connections with branches and loops
    const connections = generateConnectionsWithBranchesAndLoops(stars);

    constellations.push({ layer, stars, connections });
  }

  // Add scattered individual stars (no connections) across the extended area
  // Increased counts for more stars
  const scatterCounts: [1 | 2 | 3, number][] = [
    [1, SCATTER_STARS.LAYER_1],
    [2, SCATTER_STARS.LAYER_2],
    [3, SCATTER_STARS.LAYER_3]
  ];

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
 * Generate constellation connections with branches and closed loops
 * Uses nearest-neighbor spanning tree as base, then adds branches (10% per star)
 * and loops while preventing line crossings
 */
function generateConnectionsWithBranchesAndLoops(stars: Star[]): [number, number][] {
  if (stars.length < 2) return [];

  const { MAX_CONNECTION_DISTANCE, BRANCH_PROBABILITY, MAX_LOOPS_PER_CONSTELLATION } = CONSTELLATION_GENERATION;
  const maxDistSq = MAX_CONNECTION_DISTANCE * MAX_CONNECTION_DISTANCE;
  const connections: [number, number][] = [];

  // Step 1: Generate spanning tree (base structure)
  const connected = new Set([0]);
  const unconnected = new Set(
    Array.from({ length: stars.length }, (_, i) => i).slice(1)
  );

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
        if (dist < maxDistSq && dist < bestDist) {
          bestDist = dist;
          bestFrom = from;
          bestTo = to;
          found = true;
        }
      }
    }

    if (!found) break;

    connections.push([bestFrom, bestTo]);
    connected.add(bestTo);
    unconnected.delete(bestTo);
  }

  // Step 2: Add branches (10% probability per star)
  for (let i = 0; i < stars.length; i++) {
    if (Math.random() < BRANCH_PROBABILITY) {
      // Try to connect this star to another nearby star that's not already connected
      const candidates: { to: number; dist: number }[] = [];

      for (let j = 0; j < stars.length; j++) {
        if (i === j) continue;

        // Check if already directly connected
        const alreadyConnected = connections.some(
          ([from, to]) => (from === i && to === j) || (from === j && to === i)
        );
        if (alreadyConnected) continue;

        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const dist = dx * dx + dy * dy;

        if (dist < maxDistSq) {
          candidates.push({ to: j, dist });
        }
      }

      // Sort by distance and try to add the closest valid branch
      candidates.sort((a, b) => a.dist - b.dist);

      for (const candidate of candidates) {
        if (!wouldCrossExisting(i, candidate.to, stars, connections)) {
          connections.push([i, candidate.to]);
          break; // Only add one branch per star
        }
      }
    }
  }

  // Step 3: Add closed loops (limited number per constellation)
  let loopsAdded = 0;
  for (let i = 0; i < stars.length && loopsAdded < MAX_LOOPS_PER_CONSTELLATION; i++) {
    for (let j = i + 1; j < stars.length && loopsAdded < MAX_LOOPS_PER_CONSTELLATION; j++) {
      // Check if already connected
      const alreadyConnected = connections.some(
        ([from, to]) => (from === i && to === j) || (from === j && to === i)
      );
      if (alreadyConnected) continue;

      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      const dist = dx * dx + dy * dy;

      // Only consider reasonably close stars for loops
      if (dist < maxDistSq * 0.5 && !wouldCrossExisting(i, j, stars, connections)) {
        connections.push([i, j]);
        loopsAdded++;
      }
    }
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
