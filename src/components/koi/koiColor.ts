/* Koi colour palette and small maths helpers shared by the renderer and the lilies layer.
   Adapted, with permission, from the koi pond in Dao-Ho/portfolio. */

/* Colours are packed 0xRRGGBB integers, so the per-cell maths allocates nothing. */
export const packRgb = (color: number[]) => (color[0] << 16) | (color[1] << 8) | color[2];
export const pack = (colors: number[][]) => colors.map(packRgb);

export const PEARL = packRgb([236, 228, 218]);
export const POND = {
  bg: packRgb([12, 16, 26]),
  fin: packRgb([214, 206, 198]),
  eye: packRgb([16, 16, 22]),
  water: packRgb([150, 185, 222]),
  pellet: packRgb([236, 170, 92]),
  alpha: 0.88,
  depthFloor: 0.45,
  tile: [0.68, 0.98],
  ink: 0.42,
};

// Patch colours shade from a deep shadow tone, through the main hue, to a pale highlight.
export const RAMP_RED = pack([[112, 22, 24], [168, 34, 28], [214, 58, 30], [240, 96, 34], [250, 138, 52], [255, 178, 96]]);

// skin: the base colour, ramp: how patches shade from shadow to light, spot: small dark spots.
// The classic Dao-Ho varieties.
export const VARIETIES = [
  { name: 'kohaku', skin: packRgb([236, 228, 218]), ramp: RAMP_RED,  spot: null,                   pattern: 'saddles' },
  { name: 'sanke',  skin: packRgb([236, 228, 218]), ramp: RAMP_RED,  spot: packRgb([92, 90, 108]), pattern: 'spotted' },
  { name: 'tancho', skin: packRgb([236, 228, 218]), ramp: RAMP_RED,  spot: null,                   pattern: 'crown' },
];

export const clamp = (value: number, low: number, high: number) => (value !== value || value < low ? low : value > high ? high : value);

export const wrapAngle = (angle: number) => ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Deterministic integer hash to [0, 1), so textures stay pinned to the body.
export function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = smoothstep(0, 1, x - xi), v = smoothstep(0, 1, y - yi);
  const a = hash3(xi, yi, seed), b = hash3(xi + 1, yi, seed);
  const c = hash3(xi, yi + 1, seed), d = hash3(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function mix(a: number, b: number, k: number) {
  const ar = a >>> 16, ag = (a >>> 8) & 255, ab = a & 255;
  const br = b >>> 16, bg = (b >>> 8) & 255, bb = b & 255;
  return (((ar + (br - ar) * k) | 0) << 16) | (((ag + (bg - ag) * k) | 0) << 8) | ((ab + (bb - ab) * k) | 0);
}

export function shade(color: number, k: number) {
  const r = Math.min(255, (color >>> 16) * k) | 0;
  const g = Math.min(255, ((color >>> 8) & 255) * k) | 0;
  const b = Math.min(255, (color & 255) * k) | 0;
  return (r << 16) | (g << 8) | b;
}

export function ramp(stops: number[], t: number) {
  const x = clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

// A line glyph that follows a direction in screen space, for fin rays and ripple rings.
export function lineGlyph(dx: number, dy: number) {
  const length = Math.hypot(dx, dy) || 1;
  if (Math.abs(dy) < 0.38 * length) return '-';
  if (Math.abs(dx) < 0.38 * length) return '|';
  return dx * dy > 0 ? '\\' : '/';
}
