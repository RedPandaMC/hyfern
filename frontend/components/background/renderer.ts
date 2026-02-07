/**
 * Canvas-based text renderer for the ANSI terrain background.
 * Draws a grid of monospace characters, handles scrolling and double-buffering.
 */

import { Tile, TerrainGenerator } from './terrain-generator';
import { ColorPalette, getPalette } from './palettes';

export interface RendererConfig {
  cellSize: number;       // Size of each character cell in pixels
  scrollSpeed: number;    // Pixels per frame to scroll
  fontFamily: string;     // Monospace font to use
  targetFPS: number;      // Target frame rate
}

const DEFAULT_CONFIG: RendererConfig = {
  cellSize: 14,
  scrollSpeed: 0.4,
  fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
  targetFPS: 30,
};

export class TerrainRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RendererConfig;
  private generator: TerrainGenerator;
  private palette: ColorPalette;

  // Grid state
  private cols: number = 0;
  private rows: number = 0;
  private buffer: Tile[][] = []; // buffer[col][row]
  private worldX: number = 0;   // Current world X position (rightmost generated column)

  // Scroll state
  private scrollOffset: number = 0; // Sub-pixel scroll offset

  // Animation
  private animationId: number = 0;
  private lastFrameTime: number = 0;
  private frameInterval: number;

  // Time tracking
  private currentHour: number = new Date().getHours();
  private lastTimeCheck: number = 0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RendererConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameInterval = 1000 / this.config.targetFPS;
    this.generator = new TerrainGenerator();
    this.palette = getPalette(this.currentHour);

    this.resize();
  }

  /**
   * Resize the canvas and regenerate the grid buffer.
   */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    this.cols = Math.ceil(width / this.config.cellSize) + 2; // +2 for scroll buffer
    this.rows = Math.ceil(height / this.config.cellSize) + 1;

    // Regenerate the buffer
    this.buffer = [];
    for (let c = 0; c < this.cols; c++) {
      this.buffer.push(this.generator.generateColumn(this.worldX + c, this.rows));
    }
    this.worldX += this.cols;
    this.scrollOffset = 0;
  }

  /**
   * Start the animation loop.
   */
  start() {
    this.lastFrameTime = performance.now();
    this.lastTimeCheck = Date.now();
    this.tick(this.lastFrameTime);
  }

  /**
   * Stop the animation loop.
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private tick = (now: number) => {
    this.animationId = requestAnimationFrame(this.tick);

    // Throttle to target FPS
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

    this.update();
    this.draw();
  };

  private update() {
    this.scrollOffset += this.config.scrollSpeed;

    // When we've scrolled a full cell width, shift the buffer
    while (this.scrollOffset >= this.config.cellSize) {
      this.scrollOffset -= this.config.cellSize;
      // Remove the leftmost column
      this.buffer.shift();
      // Generate a new column on the right
      this.buffer.push(this.generator.generateColumn(this.worldX, this.rows));
      this.worldX++;
    }
  }

  private draw() {
    const { cellSize, fontFamily } = this.config;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Clear with background color
    this.ctx.fillStyle = this.palette.bg;
    this.ctx.fillRect(0, 0, width, height);

    // Set font
    this.ctx.font = `${cellSize * 0.85}px ${fontFamily}`;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';

    // Draw each cell
    for (let c = 0; c < this.buffer.length; c++) {
      const column = this.buffer[c];
      const x = c * cellSize - this.scrollOffset + cellSize / 2;

      // Skip columns that are fully off-screen
      if (x + cellSize < 0 || x - cellSize > width) continue;

      for (let r = 0; r < column.length; r++) {
        const tile = column[r];
        const y = r * cellSize + cellSize / 2;

        if (y - cellSize > height) break;

        // Resolve color from palette
        const color = this.resolveColor(tile.fg);
        this.ctx.fillStyle = color;
        this.ctx.fillText(tile.char, x, y);
      }
    }
  }

  private resolveColor(key: string): string {
    return (this.palette as unknown as Record<string, string>)[key] || '#888888';
  }
}
