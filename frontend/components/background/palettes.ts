/**
 * Day/night color palettes for the ANSI terrain background.
 * Each palette maps semantic color keys to hex values.
 */

export interface ColorPalette {
  bg: string;
  water_light: string;
  water_dark: string;
  shore: string;
  grass_light: string;
  grass_dark: string;
  meadow_light: string;
  meadow_dark: string;
  forest_light: string;
  forest_dark: string;
  dense_forest_light: string;
  dense_forest_dark: string;
  mountain_light: string;
  mountain_dark: string;
  peak: string;
  path: string;
  structure: string;
  flower_red: string;
  flower_yellow: string;
  flower_purple: string;
  flower_white: string;
}

const DAY_PALETTE: ColorPalette = {
  bg: '#0a0e1a',
  water_light: '#4a9eff',
  water_dark: '#2d6bc4',
  shore: '#c4a74e',
  grass_light: '#5cb85c',
  grass_dark: '#3d8b3d',
  meadow_light: '#7ec87e',
  meadow_dark: '#5aa05a',
  forest_light: '#2d8b2d',
  forest_dark: '#1a6b1a',
  dense_forest_light: '#1a5c1a',
  dense_forest_dark: '#0e4a0e',
  mountain_light: '#9e9e9e',
  mountain_dark: '#6e6e6e',
  peak: '#e0e0e0',
  path: '#d4c49a',
  structure: '#8e7a5a',
  flower_red: '#e05050',
  flower_yellow: '#e0d050',
  flower_purple: '#b070d0',
  flower_white: '#e8e8d8',
};

const NIGHT_PALETTE: ColorPalette = {
  bg: '#060810',
  water_light: '#1a3a6e',
  water_dark: '#0e2a4e',
  shore: '#4a3a2a',
  grass_light: '#1a4a2a',
  grass_dark: '#0e3a1a',
  meadow_light: '#1e4e2e',
  meadow_dark: '#123a1e',
  forest_light: '#0e3a1a',
  forest_dark: '#082a0e',
  dense_forest_light: '#0a2e10',
  dense_forest_dark: '#061e08',
  mountain_light: '#4a4a5e',
  mountain_dark: '#2e2e3e',
  peak: '#6a6a7e',
  path: '#4a4a3a',
  structure: '#3e3a2e',
  flower_red: '#6e2020',
  flower_yellow: '#6e6020',
  flower_purple: '#4a2a5e',
  flower_white: '#6a6a60',
};

const DAWN_PALETTE: ColorPalette = {
  bg: '#0a0c14',
  water_light: '#3a6eba',
  water_dark: '#1e4a8a',
  shore: '#8a7a3a',
  grass_light: '#3a7a3a',
  grass_dark: '#2a5a2a',
  meadow_light: '#4a8a4a',
  meadow_dark: '#3a6a3a',
  forest_light: '#1e6a1e',
  forest_dark: '#124a12',
  dense_forest_light: '#124e14',
  dense_forest_dark: '#0a3a0a',
  mountain_light: '#7a7a8a',
  mountain_dark: '#4e4e5e',
  peak: '#a0a0b0',
  path: '#8a7a6a',
  structure: '#6a5a4a',
  flower_red: '#a03838',
  flower_yellow: '#a09838',
  flower_purple: '#7a4a8a',
  flower_white: '#a0a090',
};

/**
 * Get the interpolated color palette based on the current hour.
 * Smooth transitions at dawn (5-7) and dusk (17-19).
 */
export function getPalette(hour: number): ColorPalette {
  // Dawn: 5-7 (night → day)
  if (hour >= 5 && hour < 7) {
    const t = (hour - 5) / 2;
    return t < 0.5
      ? lerpPalette(NIGHT_PALETTE, DAWN_PALETTE, t * 2)
      : lerpPalette(DAWN_PALETTE, DAY_PALETTE, (t - 0.5) * 2);
  }
  // Day: 7-17
  if (hour >= 7 && hour < 17) {
    return DAY_PALETTE;
  }
  // Dusk: 17-19 (day → night)
  if (hour >= 17 && hour < 19) {
    const t = (hour - 17) / 2;
    return t < 0.5
      ? lerpPalette(DAY_PALETTE, DAWN_PALETTE, t * 2)
      : lerpPalette(DAWN_PALETTE, NIGHT_PALETTE, (t - 0.5) * 2);
  }
  // Night: 19-5
  return NIGHT_PALETTE;
}

function lerpPalette(a: ColorPalette, b: ColorPalette, t: number): ColorPalette {
  const result: Record<string, string> = {};
  for (const key of Object.keys(a) as (keyof ColorPalette)[]) {
    result[key] = lerpColor(a[key], b[key], t);
  }
  return result as unknown as ColorPalette;
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
