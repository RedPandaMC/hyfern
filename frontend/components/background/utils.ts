/**
 * Utility functions for constellation generation and rendering
 */

import type { Constellation, Star, PrideFlagType } from './types';
import { STAR_CHARS, FLAG_PALETTES } from './constants';

/**
 * Generate realistic open constellations with branching patterns
 */
export function generateConstellations(width: number, height: number): Constellation[] {
  const constellations: Constellation[] = [];

  // Generate 12-15 constellations across layers
  const constellationCount = 12 + Math.floor(Math.random() * 4);

  for (let i = 0; i < constellationCount; i++) {
    // Determine layer (30% layer 1, 40% layer 2, 30% layer 3)
    const rand = Math.random();
    const layer = (rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3) as 1 | 2 | 3;

    // Each constellation has 3-8 stars
    const starCount = 3 + Math.floor(Math.random() * 6);

    // Pick a random center point for this constellation
    const centerX = width * (0.1 + Math.random() * 0.8);
    const centerY = height * (0.1 + Math.random() * 0.8);

    // Generate stars clustered around center
    const stars: Star[] = [];
    const starChars =
      layer === 1
        ? STAR_CHARS.LAYER_1
        : layer === 2
          ? STAR_CHARS.LAYER_2
          : STAR_CHARS.LAYER_3;

    for (let j = 0; j < starCount; j++) {
      // Spread stars within a radius (50-150px depending on layer)
      const radius = (30 + Math.random() * 70) * layer;
      const angle = Math.random() * Math.PI * 2;

      stars.push({
        char: starChars[Math.floor(Math.random() * starChars.length)],
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    // Generate open, branching connections
    const connections = generateOpenConnections(starCount);

    constellations.push({ layer, stars, connections });
  }

  // Add scattered individual stars (no connections)
  for (let i = 0; i < 40; i++) {
    const layer = (Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3) as 1 | 2 | 3;
    const starChars =
      layer === 1
        ? STAR_CHARS.LAYER_1
        : layer === 2
          ? STAR_CHARS.LAYER_2
          : STAR_CHARS.LAYER_2.slice(0, 2);

    constellations.push({
      layer,
      stars: [
        {
          char: starChars[Math.floor(Math.random() * starChars.length)],
          x: Math.random() * width,
          y: Math.random() * height,
        },
      ],
      connections: [],
    });
  }

  return constellations;
}

/**
 * Generate open constellation connections with branching
 * - No closed loops
 * - Some stars can be branch points (2-3 connections)
 * - Most stars have 1-2 connections
 * - Creates realistic constellation patterns
 */
function generateOpenConnections(starCount: number): [number, number][] {
  if (starCount < 2) return [];

  const connections: [number, number][] = [];
  const connectionCounts = new Array(starCount).fill(0);

  // Start with a spanning tree to ensure connectivity
  const connected = new Set([0]);
  const unconnected = new Set(
    Array.from({ length: starCount }, (_, i) => i).slice(1)
  );

  while (unconnected.size > 0) {
    const connectedArray = Array.from(connected);
    const from = connectedArray[Math.floor(Math.random() * connectedArray.length)];

    const unconnectedArray = Array.from(unconnected);
    const to = unconnectedArray[Math.floor(Math.random() * unconnectedArray.length)];

    if (connectionCounts[from] < 3) {
      connections.push([from, to]);
      connectionCounts[from]++;
      connectionCounts[to]++;
      connected.add(to);
      unconnected.delete(to);
    } else {
      const alternatives = connectedArray.filter((s) => connectionCounts[s] < 3);
      if (alternatives.length > 0) {
        const altFrom = alternatives[Math.floor(Math.random() * alternatives.length)];
        connections.push([altFrom, to]);
        connectionCounts[altFrom]++;
        connectionCounts[to]++;
        connected.add(to);
        unconnected.delete(to);
      }
    }
  }

  // Optionally add 1-3 more connections to create branches
  const extraConnections = Math.floor(Math.random() * 3);
  let attempts = 0;
  let added = 0;

  while (added < extraConnections && attempts < 20) {
    attempts++;

    const from = Math.floor(Math.random() * starCount);
    const to = Math.floor(Math.random() * starCount);

    if (
      from !== to &&
      connectionCounts[from] < 3 &&
      connectionCounts[to] < 3 &&
      !connections.some(([a, b]) => (a === from && b === to) || (a === to && b === from)) &&
      !wouldCreateCycle(connections, from, to, starCount)
    ) {
      connections.push([from, to]);
      connectionCounts[from]++;
      connectionCounts[to]++;
      added++;
    }
  }

  return connections;
}

/**
 * Check if adding a connection would create a cycle using DFS
 */
function wouldCreateCycle(
  existingConnections: [number, number][],
  from: number,
  to: number,
  starCount: number
): boolean {
  // Build adjacency list
  const adj: number[][] = Array.from({ length: starCount }, () => []);
  existingConnections.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });

  // DFS from 'from' to see if we can reach 'to'
  const visited = new Set<number>();
  const stack = [from];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === to) return true;
    if (visited.has(current)) continue;

    visited.add(current);
    adj[current].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    });
  }

  return false;
}

/**
 * Get pride color for a star based on Y position and flag type
 * Uses STEPPED gradients (hard color transitions) for authentic flag appearance
 */
export function getPrideColor(
  yPosition: number,
  flagType: PrideFlagType | null,
  containerHeight: number = typeof window !== 'undefined' ? window.innerHeight : 1000
): string | null {
  if (!flagType) return null;

  const percentage = yPosition / containerHeight;
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
