/**
 * Day/night color palettes for the ANSI terrain background.
 * Each palette maps semantic color keys to hex values.
 * Pre-computed RGB arrays for fast interpolation during dawn/dusk transitions.
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
  river_blue: string;
  river_dark: string;
  river_shore: string;
  warm_glow: string;
  fire_orange: string;
  building_wall: string;
  building_roof: string;
  road: string;
  bridge: string;
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
  river_blue: '#3a8aee',
  river_dark: '#2060b0',
  river_shore: '#6aaa6a',
  warm_glow: '#ff9933',
  fire_orange: '#ff5500',
  building_wall: '#7a6a50',
  building_roof: '#5a4a3a',
  road: '#b0a080',
  bridge: '#9a8a60',
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
  river_blue: '#0e2a5e',
  river_dark: '#081a3e',
  river_shore: '#0e3a1e',
  warm_glow: '#cc6600',
  fire_orange: '#aa3300',
  building_wall: '#3a3028',
  building_roof: '#2a2018',
  road: '#4a4838',
  bridge: '#3a3828',
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
  river_blue: '#2a5aaa',
  river_dark: '#183a7a',
  river_shore: '#3a6a3a',
  warm_glow: '#ee8822',
  fire_orange: '#cc4400',
  building_wall: '#5a4a3a',
  building_roof: '#4a3a2a',
  road: '#7a6a5a',
  bridge: '#6a5a4a',
};

// --- Pre-computed RGB arrays for fast interpolation ---

type RGBTuple = [number, number, number];
type RGBPalette = Record<string, RGBTuple>;

function hexToRGB(hex: string): RGBTuple {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function paletteToRGB(palette: ColorPalette): RGBPalette {
  const result: RGBPalette = {};
  for (const key of Object.keys(palette)) {
    result[key] = hexToRGB((palette as unknown as Record<string, string>)[key]);
  }
  return result;
}

const DAY_RGB = paletteToRGB(DAY_PALETTE);
const NIGHT_RGB = paletteToRGB(NIGHT_PALETTE);
const DAWN_RGB = paletteToRGB(DAWN_PALETTE);

function lerpPaletteRGB(a: RGBPalette, b: RGBPalette, t: number): ColorPalette {
  const result: Record<string, string> = {};
  for (const key of Object.keys(a)) {
    const [r1, g1, b1] = a[key];
    const [r2, g2, b2] = b[key];
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    result[key] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
  }
  return result as unknown as ColorPalette;
}

/**
 * Get the interpolated color palette based on the current hour.
 * Smooth transitions at dawn (5-7) and dusk (17-19).
 */
export function getPalette(hour: number): ColorPalette {
  // Dawn: 5-7 (night → day)
  if (hour >= 5 && hour < 7) {
    const t = (hour - 5) / 2;
    return t < 0.5
      ? lerpPaletteRGB(NIGHT_RGB, DAWN_RGB, t * 2)
      : lerpPaletteRGB(DAWN_RGB, DAY_RGB, (t - 0.5) * 2);
  }
  // Day: 7-17
  if (hour >= 7 && hour < 17) {
    return DAY_PALETTE;
  }
  // Dusk: 17-19 (day → night)
  if (hour >= 17 && hour < 19) {
    const t = (hour - 17) / 2;
    return t < 0.5
      ? lerpPaletteRGB(DAY_RGB, DAWN_RGB, t * 2)
      : lerpPaletteRGB(DAWN_RGB, NIGHT_RGB, (t - 0.5) * 2);
  }
  // Night: 19-5
  return NIGHT_PALETTE;
}
