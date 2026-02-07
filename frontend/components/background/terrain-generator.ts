/**
 * Procedural terrain generator using Simplex-like noise.
 * Generates Dwarf Fortress-style terrain columns for scrolling background.
 */

export interface Tile {
  char: string;
  fg: string;
  bg?: string;
}

export type BiomeType = 'water' | 'shore' | 'grass' | 'meadow' | 'forest' | 'dense_forest' | 'mountain' | 'peak' | 'path' | 'structure';

// --- Simplex noise (2D) ---
// Minimal implementation, no dependencies

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

  // Fisher-Yates shuffle with seed
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

  // Result in range [-1, 1]
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

// --- Character palettes per biome ---

const WATER_CHARS = ['~', '≈', '~', '≈', '~', '○'];
const SHORE_CHARS = ['.', ',', '.', '·', '.', ','];
const GRASS_CHARS = ['.', ',', "'", '·', '.', ',', "'", '`'];
const MEADOW_CHARS = ['.', ',', "'", '*', '.', ',', '*', '.'];
const FOREST_CHARS = ['♠', '♣', '↑', '▲', '♠', '♣', '↑'];
const DENSE_FOREST_CHARS = ['♠', '♣', '▲', '#', '♠', '░', '♣'];
const MOUNTAIN_CHARS = ['▲', '△', '∆', '▲', '△'];
const PEAK_CHARS = ['▲', '∆', '^', '▲'];
const STRUCTURE_CHARS = ['░', '▓', '█', '#', 'Ω', 'Π'];
const PATH_CHARS = ['·', '·', '─', '│', '·'];

// --- Terrain Generator class ---

export class TerrainGenerator {
  private seed: number;
  private noiseScale: number;
  private moistureScale: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
    this.noiseScale = 0.04;
    this.moistureScale = 0.03;
    initNoise(this.seed);
  }

  /**
   * Generate a single column of tiles at the given world-x coordinate.
   * @param worldX - The x coordinate in world space
   * @param rows - Number of rows (height) to generate
   * @returns Array of Tile objects, one per row
   */
  generateColumn(worldX: number, rows: number): Tile[] {
    const column: Tile[] = [];

    for (let y = 0; y < rows; y++) {
      // Multi-octave noise for elevation
      const elevation = fbm(worldX * this.noiseScale, y * this.noiseScale, 4, 2.0, 0.5);
      // Separate noise for moisture
      const moisture = fbm(worldX * this.moistureScale + 500, y * this.moistureScale + 500, 3, 2.0, 0.5);
      // Detail noise for variety
      const detail = noise2D(worldX * 0.1, y * 0.1);

      const biome = this.getBiome(elevation, moisture);
      const tile = this.getTile(biome, detail, worldX, y);
      column.push(tile);
    }

    return column;
  }

  private getBiome(elevation: number, moisture: number): BiomeType {
    // Elevation ranges: -1 to 1 (normalized from noise)
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

  private getTile(biome: BiomeType, detail: number, x: number, y: number): Tile {
    // Deterministic pseudo-random from position
    const hash = ((x * 374761393 + y * 668265263) ^ (x * 1274126177)) >>> 0;
    const rand = (hash % 1000) / 1000;

    // Occasionally generate paths through forests
    const pathNoise = noise2D(x * 0.02, y * 0.02);
    if (Math.abs(pathNoise) < 0.02 && biome !== 'water' && biome !== 'peak') {
      const chars = PATH_CHARS;
      return {
        char: chars[hash % chars.length],
        fg: 'path',
      };
    }

    // Occasionally generate structures in dense forests
    if (biome === 'dense_forest' && rand < 0.03) {
      const chars = STRUCTURE_CHARS;
      return {
        char: chars[hash % chars.length],
        fg: 'structure',
      };
    }

    // Flowers in meadows
    if (biome === 'meadow' && rand < 0.08) {
      const flowerColors = ['flower_red', 'flower_yellow', 'flower_purple', 'flower_white'];
      return {
        char: '*',
        fg: flowerColors[hash % flowerColors.length],
      };
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
