/**
 * Canvas-based text renderer for the ANSI terrain background.
 * Ring buffer scrolling, offscreen double-buffering, color-batched draw calls,
 * and animation system for water shimmer + campfire flicker.
 */

import { Tile, TerrainGenerator } from './terrain-generator';
import { ColorPalette, getPalette } from './palettes';

export interface RendererConfig {
  cellSize: number;
  scrollSpeed: number;
  fontFamily: string;
  targetFPS: number;
}

const DEFAULT_CONFIG: RendererConfig = {
  cellSize: 14,
  scrollSpeed: 0.4,
  fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
  targetFPS: 30,
};

// Animation character cycles
const WATER_SHIMMER = ['~', '≈', '○', '≈'];
const CAMPFIRE_FLICKER = ['☼', '♦', '☼', '*'];
const CAMPFIRE_COLORS = ['warm_glow', 'fire_orange', 'warm_glow', 'fire_orange'];

// Animation timing (in render frames)
const WATER_INTERVAL = 10;    // ~3Hz at 30fps
const CAMPFIRE_INTERVAL = 7;  // ~4Hz at 30fps

export class TerrainRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private config: RendererConfig;
  private generator: TerrainGenerator;
  private palette: ColorPalette;

  // Ring buffer state
  private cols: number = 0;
  private rows: number = 0;
  private ringBuffer: Tile[][] = [];
  private ringCapacity: number = 0;
  private ringHead: number = 0;     // Index of the leftmost visible column
  private worldX: number = 0;

  // Scroll state
  private scrollOffset: number = 0;

  // Animation
  private animationId: number = 0;
  private lastFrameTime: number = 0;
  private frameInterval: number;
  private frameCounter: number = 0;

  // Time tracking
  private lastTimeCheck: number = 0;

  // Color batching
  private drawBatch: Map<string, [string, number, number][]> = new Map();

  // DPR
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RendererConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameInterval = 1000 / this.config.targetFPS;
    this.generator = new TerrainGenerator();
    this.palette = getPalette(new Date().getHours());

    // Create offscreen canvas for double-buffering
    this.offscreen = document.createElement('canvas');
    const offCtx = this.offscreen.getContext('2d');
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offCtx = offCtx;

    this.resize();
  }

  /**
   * Resize canvas, offscreen canvas, and regenerate the ring buffer.
   */
  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Main canvas
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;

    // Offscreen canvas matches physical pixels
    this.offscreen.width = width * this.dpr;
    this.offscreen.height = height * this.dpr;

    this.cols = Math.ceil(width / this.config.cellSize) + 2;
    this.rows = Math.ceil(height / this.config.cellSize) + 1;

    // Initialize ring buffer
    this.ringCapacity = this.cols + 4; // Extra slots for smooth scrolling
    this.ringBuffer = new Array(this.ringCapacity);
    this.ringHead = 0;

    for (let c = 0; c < this.ringCapacity; c++) {
      this.ringBuffer[c] = this.generator.generateColumn(this.worldX + c, this.rows);
    }
    this.worldX += this.ringCapacity;
    this.scrollOffset = 0;

    // Cache font settings on both contexts
    this.setupContext(this.ctx);
    this.setupContext(this.offCtx);
  }

  private setupContext(ctx: CanvasRenderingContext2D) {
    ctx.scale(this.dpr, this.dpr);
    const fontSize = this.config.cellSize * 0.85;
    ctx.font = `${fontSize}px ${this.config.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
  }

  /**
   * Get a column from the ring buffer by logical index (0 = leftmost visible).
   */
  private getColumn(logicalIndex: number): Tile[] {
    return this.ringBuffer[(this.ringHead + logicalIndex) % this.ringCapacity];
  }

  start() {
    this.lastFrameTime = performance.now();
    this.lastTimeCheck = Date.now();
    this.tick(this.lastFrameTime);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private tick = (now: number) => {
    this.animationId = requestAnimationFrame(this.tick);

    const delta = now - this.lastFrameTime;
    if (delta < this.frameInterval) return;
    this.lastFrameTime = now - (delta % this.frameInterval);

    // Check time every 60 seconds for palette updates
    const nowMs = Date.now();
    if (nowMs - this.lastTimeCheck > 60000) {
      this.lastTimeCheck = nowMs;
      const newHour = new Date().getHours() + new Date().getMinutes() / 60;
      this.palette = getPalette(newHour);
    }

    this.frameCounter++;
    this.update();
    this.draw();
  };

  private update() {
    this.scrollOffset += this.config.scrollSpeed;

    // When scrolled a full cell, advance the ring buffer
    while (this.scrollOffset >= this.config.cellSize) {
      this.scrollOffset -= this.config.cellSize;

      // Overwrite the slot the head is leaving behind with new terrain
      const newSlot = this.ringHead;
      this.ringBuffer[newSlot] = this.generator.generateColumn(this.worldX, this.rows);
      this.worldX++;

      // Advance head (the old leftmost column scrolls off)
      this.ringHead = (this.ringHead + 1) % this.ringCapacity;
    }
  }

  private draw() {
    const { cellSize } = this.config;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.offCtx;

    // Reset the scale since we're drawing fresh
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Clear with background color
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, width, height);

    // Re-apply font (setTransform resets state)
    const fontSize = cellSize * 0.85;
    ctx.font = `${fontSize}px ${this.config.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Collect all draws into color-batched map
    this.drawBatch.clear();

    for (let c = 0; c < this.cols; c++) {
      const column = this.getColumn(c);
      const x = c * cellSize - this.scrollOffset + cellSize / 2;

      if (x + cellSize < 0 || x - cellSize > width) continue;

      for (let r = 0; r < column.length; r++) {
        const tile = column[r];
        const y = r * cellSize + cellSize / 2;
        if (y - cellSize > height) break;

        let char = tile.char;
        let fgKey = tile.fg;

        // Animation overrides
        if (tile.anim === 'water') {
          const phase = (tile.hash ?? 0) % WATER_SHIMMER.length;
          const idx = (phase + Math.floor(this.frameCounter / WATER_INTERVAL)) % WATER_SHIMMER.length;
          char = WATER_SHIMMER[idx];
        } else if (tile.anim === 'campfire') {
          const phase = (tile.hash ?? 0) % CAMPFIRE_FLICKER.length;
          const idx = (phase + Math.floor(this.frameCounter / CAMPFIRE_INTERVAL)) % CAMPFIRE_FLICKER.length;
          char = CAMPFIRE_FLICKER[idx];
          fgKey = CAMPFIRE_COLORS[idx];
        }

        const color = this.resolveColor(fgKey);

        let batch = this.drawBatch.get(color);
        if (!batch) {
          batch = [];
          this.drawBatch.set(color, batch);
        }
        batch.push([char, x, y]);
      }
    }

    // Execute batched draws: one fillStyle change per unique color
    for (const [color, draws] of this.drawBatch) {
      ctx.fillStyle = color;
      for (const [char, x, y] of draws) {
        ctx.fillText(char, x, y);
      }
    }

    // Blit offscreen to main canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.offscreen, 0, 0);
  }

  private resolveColor(key: string): string {
    return (this.palette as unknown as Record<string, string>)[key] || '#888888';
  }
}
