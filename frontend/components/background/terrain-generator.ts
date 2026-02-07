/**
 * Procedural terrain generator using Simplex-like noise.
 * Generates Dwarf Fortress-style terrain columns for scrolling background.
 * Features: rivers, connected roads, multi-tile buildings, campfires, bridges.
 */

export interface Tile {
  char: string;
  fg: string;
  bg?: string;
  anim?: 'water' | 'campfire';
  hash?: number;
}

export type BiomeType =
  | 'water' | 'shore' | 'grass' | 'meadow'
  | 'forest' | 'dense_forest' | 'mountain' | 'peak'
  | 'river' | 'river_shore' | 'road' | 'bridge'
  | 'campfire' | 'building_wall' | 'building_roof';

// --- Simplex noise (2D) ---

const GRAD3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

let perm: number[] = [];
let permMod12: number[] = [];

function initNoise(seed: number) {
  const p: number[] = [];
  for (let i = 0; i < 256; i++) p[i] = i;

  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }

  perm = new Array(512);
  permMod12 = new Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
}

function dot2(g: number[], x: number, y: number) {
  return g[0] * x + g[1] * y;
}

function noise2D(xin: number, yin: number): number {
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  let i1: number, j1: number;
  if (x0 > y0) { i1 = 1; j1 = 0; }
  else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = permMod12[ii + perm[jj]];
  const gi1 = permMod12[ii + i1 + perm[jj + j1]];
  const gi2 = permMod12[ii + 1 + perm[jj + 1]];

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD3[gi0], x0, y0); }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD3[gi1], x1, y1); }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD3[gi2], x2, y2); }

  return 70 * (n0 + n1 + n2);
}

// --- Fractal Brownian Motion ---

function fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

// --- Noise cache for repeated lookups ---

const CACHE_MAX = 5000;
const CACHE_EVICT = 1000;

class NoiseCache {
  private cache = new Map<number, number>();

  get(key: number): number | undefined {
    return this.cache.get(key);
  }

  set(key: number, value: number) {
    if (this.cache.size >= CACHE_MAX) {
      // Evict oldest entries
      const iter = this.cache.keys();
      for (let i = 0; i < CACHE_EVICT; i++) {
        const k = iter.next().value;
        if (k !== undefined) this.cache.delete(k);
      }
    }
    this.cache.set(key, value);
  }
}

function packKey(x: number, y: number): number {
  // Pack two 16-bit integers into one 32-bit number
  return ((x & 0xFFFF) << 16) | (y & 0xFFFF);
}

// --- Character palettes per biome ---

const WATER_CHARS = ['~', '≈', '~', '≈', '~', '○'];
const SHORE_CHARS = ['.', ',', '.', '·', '.', ','];
const GRASS_CHARS = ['.', ',', "'", '·', '.', ',', "'", '`'];
const MEADOW_CHARS = ['.', ',', "'", '*', '.', ',', '*', '.'];
const FOREST_CHARS = ['♠', '♣', '↑', '▲', '♠', '♣', '↑'];
const DENSE_FOREST_CHARS = ['♠', '♣', '▲', '#', '♠', '░', '♣'];
const MOUNTAIN_CHARS = ['▲', '△', '∆', '▲', '△'];
const PEAK_CHARS = ['▲', '∆', '^', '▲'];
const RIVER_CHARS = ['~', '≈', '~', '≈', '○'];
const ROAD_CHARS = ['·', '·', '─', '─', '·'];
const BRIDGE_CHARS = ['═', '≡', '═', '≡'];
const CAMPFIRE_CHARS = ['☼', '♦'];
const BUILDING_WALL_CHARS = ['█', '▓', '█', '▓'];
const BUILDING_ROOF_CHARS = ['░', '▒', '░'];

// --- Village system ---

const VILLAGE_SPACING = 80;
const VILLAGE_CHANCE = 0.6;
const BUILDING_WIDTH = 3;
const BUILDING_HEIGHT = 3;
const MAX_BUILDINGS_PER_VILLAGE = 3;

function deterministicHash(n: number): number {
  // Simple integer hash
  let h = n;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return h >>> 0;
}

// --- Terrain Generator class ---

export class TerrainGenerator {
  private seed: number;
  private noiseScale: number;
  private moistureScale: number;
  private elevationCache: NoiseCache;
  private moistureCache: NoiseCache;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
    this.noiseScale = 0.04;
    this.moistureScale = 0.03;
    this.elevationCache = new NoiseCache();
    this.moistureCache = new NoiseCache();
    initNoise(this.seed);
  }

  private cachedElevation(x: number, y: number): number {
    const key = packKey(x, y);
    let val = this.elevationCache.get(key);
    if (val !== undefined) return val;
    val = fbm(x * this.noiseScale, y * this.noiseScale, 4, 2.0, 0.5);
    this.elevationCache.set(key, val);
    return val;
  }

  private cachedMoisture(x: number, y: number): number {
    const key = packKey(x, y);
    let val = this.moistureCache.get(key);
    if (val !== undefined) return val;
    val = fbm(x * this.moistureScale + 500, y * this.moistureScale + 500, 3, 2.0, 0.5);
    this.moistureCache.set(key, val);
    return val;
  }

  // --- River detection via ridge noise ---

  private getRiverValue(x: number, y: number): number {
    const n = fbm(x * 0.015 + 1000, y * 0.015 + 1000, 2, 2.0, 0.5);
    return 1 - Math.abs(n);
  }

  private isRiver(x: number, y: number, elevation: number): boolean {
    if (elevation < -0.15 || elevation > 0.45) return false;
    return this.getRiverValue(x, y) > 0.92;
  }

  private isRiverShore(x: number, y: number, elevation: number): boolean {
    if (elevation < -0.15 || elevation > 0.45) return false;
    const rv = this.getRiverValue(x, y);
    return rv > 0.88 && rv <= 0.92;
  }

  // --- Village & road system ---

  private getVillageSegment(worldX: number): number {
    return Math.floor(worldX / VILLAGE_SPACING);
  }

  private hasVillage(segmentIndex: number): boolean {
    const h = deterministicHash(segmentIndex * 7919 + this.seed);
    return (h % 1000) / 1000 < VILLAGE_CHANCE;
  }

  private getVillageCenter(segmentIndex: number, rows: number): { x: number; y: number } {
    const h = deterministicHash(segmentIndex * 6271 + this.seed);
    const centerX = segmentIndex * VILLAGE_SPACING + VILLAGE_SPACING / 2;
    // Keep villages in middle 60% of screen height
    const minY = Math.floor(rows * 0.2);
    const maxY = Math.floor(rows * 0.8);
    const centerY = minY + (h % (maxY - minY));
    return { x: centerX, y: centerY };
  }

  private getBuildingPositions(segmentIndex: number, rows: number): { x: number; y: number }[] {
    if (!this.hasVillage(segmentIndex)) return [];

    const center = this.getVillageCenter(segmentIndex, rows);
    const h = deterministicHash(segmentIndex * 4201 + this.seed);
    const count = 1 + (h % MAX_BUILDINGS_PER_VILLAGE);
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      const bh = deterministicHash(segmentIndex * 3571 + i * 997 + this.seed);
      // Offset from village center: -6 to +6 x, -4 to +4 y
      const ox = ((bh % 13) - 6);
      const oy = (((bh >> 8) % 9) - 4);
      const bx = center.x + ox;
      const by = Math.max(1, Math.min(rows - BUILDING_HEIGHT - 1, center.y + oy));
      positions.push({ x: bx, y: by });
    }

    return positions;
  }

  private isBuilding(worldX: number, worldY: number, rows: number): { type: 'roof' | 'wall' | 'door'; hash: number } | null {
    const segment = this.getVillageSegment(worldX);
    // Check current and adjacent segments
    for (let ds = -1; ds <= 1; ds++) {
      const seg = segment + ds;
      const buildings = this.getBuildingPositions(seg, rows);
      for (const bp of buildings) {
        const dx = worldX - bp.x;
        const dy = worldY - bp.y;
        if (dx >= 0 && dx < BUILDING_WIDTH && dy >= 0 && dy < BUILDING_HEIGHT) {
          const hash = deterministicHash(bp.x * 31 + bp.y * 37 + this.seed);
          if (dy === 0) return { type: 'roof', hash };
          if (dy === BUILDING_HEIGHT - 1 && dx === Math.floor(BUILDING_WIDTH / 2)) return { type: 'door', hash };
          return { type: 'wall', hash };
        }
      }
    }
    return null;
  }

  private isCampfire(worldX: number, worldY: number, rows: number): number | null {
    const segment = this.getVillageSegment(worldX);
    for (let ds = -1; ds <= 1; ds++) {
      const seg = segment + ds;
      const buildings = this.getBuildingPositions(seg, rows);
      for (const bp of buildings) {
        // Campfire 1 cell to the right of building center-bottom
        const cfx = bp.x + BUILDING_WIDTH;
        const cfy = bp.y + BUILDING_HEIGHT - 1;
        if (worldX === cfx && worldY === cfy) {
          return deterministicHash(bp.x * 53 + bp.y * 59 + this.seed);
        }
      }
    }
    return null;
  }

  private getRoadY(worldX: number, rows: number): number | null {
    const segment = this.getVillageSegment(worldX);

    // Need villages on both sides to draw a road between them
    const prevSeg = segment - 1;
    const nextSeg = segment;
    const hasPrev = this.hasVillage(prevSeg);
    const hasNext = this.hasVillage(nextSeg);

    // Also check if current segment has village connecting forward
    const hasCurr = this.hasVillage(segment);
    const hasNextNext = this.hasVillage(segment + 1);

    let roadY: number | null = null;

    // Road from previous village to current
    if (hasPrev && hasCurr) {
      const prevCenter = this.getVillageCenter(prevSeg, rows);
      const currCenter = this.getVillageCenter(segment, rows);
      const t = (worldX - prevSeg * VILLAGE_SPACING - VILLAGE_SPACING / 2) /
                (currCenter.x - prevCenter.x || 1);
      const clampedT = Math.max(0, Math.min(1, t));
      const baseY = prevCenter.y + (currCenter.y - prevCenter.y) * clampedT;
      // Add some noise perturbation for natural-looking roads
      const perturbation = noise2D(worldX * 0.05, 0) * 3;
      roadY = Math.round(baseY + perturbation);
    }

    // Road from current village to next
    if (hasCurr && hasNextNext && roadY === null) {
      const currCenter = this.getVillageCenter(segment, rows);
      const nextCenter = this.getVillageCenter(segment + 1, rows);
      const t = (worldX - currCenter.x) / (nextCenter.x - currCenter.x || 1);
      const clampedT = Math.max(0, Math.min(1, t));
      const baseY = currCenter.y + (nextCenter.y - currCenter.y) * clampedT;
      const perturbation = noise2D(worldX * 0.05, 0) * 3;
      roadY = Math.round(baseY + perturbation);
    }

    // Fallback: also check isolated village segments connecting to adjacent
    if (roadY === null && (hasPrev || hasNext || hasCurr)) {
      // Try connecting to nearest village
      for (let ds = -2; ds <= 2; ds++) {
        const checkSeg = segment + ds;
        if (this.hasVillage(checkSeg) && this.hasVillage(checkSeg + 1)) {
          const c1 = this.getVillageCenter(checkSeg, rows);
          const c2 = this.getVillageCenter(checkSeg + 1, rows);
          if (worldX >= c1.x && worldX <= c2.x) {
            const t = (worldX - c1.x) / (c2.x - c1.x || 1);
            const baseY = c1.y + (c2.y - c1.y) * t;
            const perturbation = noise2D(worldX * 0.05, 0) * 3;
            roadY = Math.round(baseY + perturbation);
            break;
          }
        }
      }
    }

    return roadY;
  }

  private isRoad(worldX: number, worldY: number, rows: number, elevation: number): boolean {
    // Roads only on walkable terrain
    if (elevation < -0.15 || elevation > 0.65) return false;

    const roadY = this.getRoadY(worldX, rows);
    if (roadY === null) return false;

    // Road is 1 cell wide (with occasional 2-cell segments near villages)
    const dist = Math.abs(worldY - roadY);
    if (dist === 0) return true;

    // Widen road near village centers
    const segment = this.getVillageSegment(worldX);
    if (this.hasVillage(segment)) {
      const center = this.getVillageCenter(segment, rows);
      const distToCenter = Math.abs(worldX - center.x);
      if (distToCenter < 10 && dist <= 1) return true;
    }

    return false;
  }

  /**
   * Generate a single column of tiles at the given world-x coordinate.
   * Layered priority: buildings → campfires → bridges → roads → rivers → biome
   */
  generateColumn(worldX: number, rows: number): Tile[] {
    const column: Tile[] = [];

    for (let y = 0; y < rows; y++) {
      const elevation = this.cachedElevation(worldX, y);
      const moisture = this.cachedMoisture(worldX, y);
      const detail = noise2D(worldX * 0.1, y * 0.1);
      const hash = ((worldX * 374761393 + y * 668265263) ^ (worldX * 1274126177)) >>> 0;

      // --- Layer 1: Buildings ---
      const building = this.isBuilding(worldX, y, rows);
      if (building) {
        if (building.type === 'roof') {
          column.push({
            char: BUILDING_ROOF_CHARS[building.hash % BUILDING_ROOF_CHARS.length],
            fg: 'building_roof',
            hash: building.hash,
          });
          continue;
        }
        if (building.type === 'door') {
          column.push({ char: '▯', fg: 'building_wall', hash: building.hash });
          continue;
        }
        column.push({
          char: BUILDING_WALL_CHARS[building.hash % BUILDING_WALL_CHARS.length],
          fg: 'building_wall',
          hash: building.hash,
        });
        continue;
      }

      // --- Layer 2: Campfires ---
      const campfireHash = this.isCampfire(worldX, y, rows);
      if (campfireHash !== null) {
        column.push({
          char: CAMPFIRE_CHARS[campfireHash % CAMPFIRE_CHARS.length],
          fg: 'warm_glow',
          anim: 'campfire',
          hash: campfireHash,
        });
        continue;
      }

      // --- Layer 3: Bridges (road + river intersection) ---
      const river = this.isRiver(worldX, y, elevation);
      const road = this.isRoad(worldX, y, rows, elevation);

      if (river && road) {
        column.push({
          char: BRIDGE_CHARS[hash % BRIDGE_CHARS.length],
          fg: 'bridge',
          hash,
        });
        continue;
      }

      // --- Layer 4: Roads ---
      if (road) {
        column.push({
          char: ROAD_CHARS[hash % ROAD_CHARS.length],
          fg: 'road',
          hash,
        });
        continue;
      }

      // --- Layer 5: Rivers ---
      if (river) {
        column.push({
          char: RIVER_CHARS[hash % RIVER_CHARS.length],
          fg: detail > 0 ? 'river_blue' : 'river_dark',
          anim: 'water',
          hash,
        });
        continue;
      }

      // --- Layer 6: River shores ---
      if (this.isRiverShore(worldX, y, elevation)) {
        column.push({
          char: SHORE_CHARS[hash % SHORE_CHARS.length],
          fg: 'river_shore',
          hash,
        });
        continue;
      }

      // --- Layer 7: Original biome logic ---
      const biome = this.getBiome(elevation, moisture);
      const tile = this.getTile(biome, detail, hash);

      // Tag ocean water for animation
      if (biome === 'water') {
        tile.anim = 'water';
        tile.hash = hash;
      }

      column.push(tile);
    }

    return column;
  }

  private getBiome(elevation: number, moisture: number): BiomeType {
    if (elevation < -0.3) return 'water';
    if (elevation < -0.15) return 'shore';
    if (elevation < 0.0) {
      return moisture > 0.1 ? 'meadow' : 'grass';
    }
    if (elevation < 0.25) {
      return moisture > 0.0 ? 'forest' : 'grass';
    }
    if (elevation < 0.45) {
      return moisture > -0.2 ? 'dense_forest' : 'forest';
    }
    if (elevation < 0.65) return 'mountain';
    return 'peak';
  }

  private getTile(biome: BiomeType, detail: number, hash: number): Tile {
    const rand = (hash % 1000) / 1000;

    // Flowers in meadows
    if (biome === 'meadow' && rand < 0.08) {
      const flowerColors = ['flower_red', 'flower_yellow', 'flower_purple', 'flower_white'];
      return { char: '*', fg: flowerColors[hash % flowerColors.length] };
    }

    let chars: string[];
    let fgKey: string;

    switch (biome) {
      case 'water':
        chars = WATER_CHARS;
        fgKey = detail > 0 ? 'water_light' : 'water_dark';
        break;
      case 'shore':
        chars = SHORE_CHARS;
        fgKey = 'shore';
        break;
      case 'grass':
        chars = GRASS_CHARS;
        fgKey = detail > 0.3 ? 'grass_light' : 'grass_dark';
        break;
      case 'meadow':
        chars = MEADOW_CHARS;
        fgKey = detail > 0 ? 'meadow_light' : 'meadow_dark';
        break;
      case 'forest':
        chars = FOREST_CHARS;
        fgKey = detail > 0.2 ? 'forest_light' : 'forest_dark';
        break;
      case 'dense_forest':
        chars = DENSE_FOREST_CHARS;
        fgKey = detail > 0 ? 'dense_forest_light' : 'dense_forest_dark';
        break;
      case 'mountain':
        chars = MOUNTAIN_CHARS;
        fgKey = detail > 0 ? 'mountain_light' : 'mountain_dark';
        break;
      case 'peak':
        chars = PEAK_CHARS;
        fgKey = 'peak';
        break;
      default:
        chars = GRASS_CHARS;
        fgKey = 'grass_dark';
    }

    return {
      char: chars[hash % chars.length],
      fg: fgKey,
    };
  }
}
