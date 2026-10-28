/* Koi lilies: floating lily pads, some carrying a lotus flower, drawn as shaded ASCII tiles
   over the koi layer. Pads are laid out once per grid size; each frame only recolours a few
   cells (glints, wake lift, petals breathing), so the layer stays cheap. */
import { clamp, hash3, valueNoise, mix, shade, ramp, pack, lineGlyph, wrapAngle, POND } from './koiColor'
import type { GridView, Pad } from './koiTypes'

interface LilyEnv {
  ctx: CanvasRenderingContext2D
  style: (color: number) => string
  view: GridView
}

interface LilyCell {
  index: number
  x: number
  y: number
  tile: number
  petal: boolean
  seed: number
  glyph: string
  ink: number
}

const LILY_ALPHA = 0.82;
const MIN_VISIBLE_DIM = 0.02;
const NOTCH_HALF_ANGLE = 0.2;
const NOTCH_MIN_CELLS = 0.6;
const NOTCH_KEEP_RADIUS = 0.12;
const VEIN_SPOKES = 9;
const VEIN_WIDTH = 0.07;
const VEIN_MIN_DISTANCE_CELLS = 1.2;
const RIM_START = 0.84;
const RIM_LIFT = 0.2;
const GLINT_CHANCE = 0.012;
const GLINT_RATE = 0.7;
const GLINT_MIX = 0.25;
const WAKE_LIFT_ENERGY = 0.3;
const WAKE_LIFT_MIX = 0.18;
const FLOWER_CORE_CELLS = 0.8;
const FLOWER_PETAL_CELLS = 2.4;
const PETAL_PULSE_RATE = 0.9;
const PETAL_PULSE_LEVELS = 3;
const PETAL_PULSE_MIX = 0.2;
// Light comes from the top-left: how strongly facing it brightens a cell, and how much the dome darkens toward the rim.
const LIGHT_DIRECTION = 0.7;
const PAD_SHADING = { base: 0.5, facing: 0.35, dome: 0.25 };
const PAD_TONE = { base: 0.3, lum: 0.4, grain: 0.3, grainScale: 0.35 };
const PETAL_SHADING = { base: 0.55, facing: 0.4, dome: 0.2 };
const INK_DARKNESS = { leaf: 0.7, vein: 0.45, petal: 0.55, core: 0.5 };
const SEED_OFFSETS = { noise: 9, petalKey: 4, petalSpread: 7 };
const WHITE = 0xffffff;
const GOLD = (255 << 16) | (206 << 8) | 90;
const PAD_GLYPHS = ['"', "'", '~', ',', '.'];
const PETAL_GLYPHS = ['%', '@', '8'];

const RAMP_LEAF = pack([[10, 48, 34], [18, 82, 52], [30, 120, 66], [56, 158, 84], [104, 196, 110], [170, 226, 150]]);
const RAMP_TEAL_LEAF = pack([[8, 44, 50], [14, 76, 78], [26, 112, 104], [50, 152, 134], [96, 192, 164], [160, 228, 196]]);
const RAMP_PEARL = pack([[150, 146, 150], [196, 190, 196], [226, 222, 226], [246, 242, 240], [255, 252, 246], [255, 255, 255]]);
const RAMP_ICE = pack([[40, 76, 120], [70, 118, 170], [110, 160, 208], [158, 198, 236], [204, 228, 250], [240, 248, 255]]);
// Flower type 0 is "no flower"; the others index into this list.
const FLOWER_RAMPS = [null, RAMP_PEARL, RAMP_ICE];

// env: { ctx, style(packedColor) -> css, view } where view exposes the live cell grid.
export function createLilies(env: LilyEnv) {
  const { ctx, style, view } = env;
  // Scratch description of the cell being generated, so the builders take one argument.
  const spot = { col: 0, row: 0, x: 0, y: 0, dx: 0, dy: 0, distance: 0, angle: 0 };
  let pads: Pad[] = [];
  let cells: LilyCell[] = [];
  let covered = new Uint8Array(0);
  let builtFor = '';

  function setPads(specs: Pad[]) {
    pads = specs;
    builtFor = '';
  }

  // True where a pad or flower tile covers the cell, so surface effects can draw over it.
  function covers(index: number) {
    return covered[index] === 1;
  }

  // The cell list is rebuilt lazily whenever the grid it was built for no longer matches.
  function ensureBuilt() {
    const key = view.cols + 'x' + view.rows + ':' + view.cellWidth + 'x' + view.cellHeight;
    if (key === builtFor) return;
    builtFor = key;
    cells = [];
    covered = new Uint8Array(view.cols * view.rows);
    if (!view.cols) return;
    for (const pad of pads) {
      addPadCells(pad);
      if (pad.flower) addFlowerCells(pad);
    }
  }

  function inGrid(col: number, row: number) {
    return col >= 0 && row >= 0 && col < view.cols && row < view.rows;
  }

  function locate(col: number, row: number, pad: Pad) {
    spot.col = col;
    spot.row = row;
    spot.x = col * view.cellWidth + view.cellWidth / 2;
    spot.y = row * view.cellHeight + view.cellHeight / 2;
    spot.dx = spot.x - pad.x;
    spot.dy = spot.y - pad.y;
    spot.distance = Math.hypot(spot.dx, spot.dy);
    spot.angle = Math.atan2(spot.dy, spot.dx);
  }

  const topLeftLight = (distance: number) => (distance > 0 ? (-spot.dx * LIGHT_DIRECTION - spot.dy * LIGHT_DIRECTION) / distance : 0);

  function addPadCells(pad: Pad) {
    const { cellWidth, cellHeight } = view;
    const col0 = Math.floor((pad.x - pad.radius) / cellWidth), col1 = Math.floor((pad.x + pad.radius) / cellWidth);
    const row0 = Math.floor((pad.y - pad.radius) / cellHeight), row1 = Math.floor((pad.y + pad.radius) / cellHeight);
    // Keep the notch at least a fraction of a cell wide, or it vanishes on small pads.
    const notchHalf = Math.max(NOTCH_HALF_ANGLE, (NOTCH_MIN_CELLS * cellWidth) / pad.radius);
    const flowerReach = pad.flower ? cellWidth * FLOWER_PETAL_CELLS : 0;
    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) {
        if (!inGrid(col, row)) continue;
        locate(col, row, pad);
        if (spot.distance > pad.radius || spot.distance <= flowerReach) continue;
        const wrapped = wrapAngle(spot.angle - pad.notch);
        if (Math.abs(wrapped) < notchHalf && spot.distance > pad.radius * NOTCH_KEEP_RADIUS) continue;
        pushPadCell(pad, wrapped);
      }
    }
  }

  // A leaf cell is shaded like a slightly domed pad lit from the top-left, with a lighter rim,
  // soft noise for texture and radial veins etched in as line glyphs.
  function pushPadCell(pad: Pad, wrappedAngle: number) {
    const index = spot.row * view.cols + spot.col;
    const edge = spot.distance / pad.radius;
    const lum = clamp(PAD_SHADING.base + PAD_SHADING.facing * topLeftLight(spot.distance) * edge - PAD_SHADING.dome * edge * edge, 0, 1);
    const grain = (valueNoise(spot.col * PAD_TONE.grainScale + pad.seed, spot.row * PAD_TONE.grainScale, pad.seed + SEED_OFFSETS.noise) - 0.5) * PAD_TONE.grain;
    let tone = clamp(PAD_TONE.base + PAD_TONE.lum * lum + grain, 0, 1);
    if (edge > RIM_START) tone = clamp(tone + RIM_LIFT, 0, 1);
    const tile = ramp(pad.teal ? RAMP_TEAL_LEAF : RAMP_LEAF, tone);
    const unit = (wrappedAngle / (2 * Math.PI)) * VEIN_SPOKES;
    const spoke = ((unit % 1) + 1) % 1;
    const vein = spot.distance > view.cellWidth * VEIN_MIN_DISTANCE_CELLS && Math.abs(spoke - 0.5) < VEIN_WIDTH;
    const key = Math.floor(hash3(spot.col, spot.row, pad.seed) * 1000);
    covered[index] = 1;
    cells.push({
      index, x: spot.x, y: spot.y, tile, petal: false, seed: 0,
      glyph: vein ? lineGlyph(spot.dx, spot.dy) : PAD_GLYPHS[key % PAD_GLYPHS.length],
      ink: shade(tile, vein ? INK_DARKNESS.vein : INK_DARKNESS.leaf),
    });
  }

  // A lotus sits at the pad's centre: a gold core ringed by petals shaded across the flower's ramp.
  function addFlowerCells(pad: Pad) {
    const { cellWidth, cellHeight } = view;
    const reach = cellWidth * FLOWER_PETAL_CELLS;
    const col0 = Math.floor((pad.x - reach) / cellWidth), col1 = Math.floor((pad.x + reach) / cellWidth);
    const row0 = Math.floor((pad.y - reach) / cellHeight), row1 = Math.floor((pad.y + reach) / cellHeight);
    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) {
        if (!inGrid(col, row)) continue;
        locate(col, row, pad);
        if (spot.distance <= reach) pushFlowerCell(pad);
      }
    }
  }

  function pushFlowerCell(pad: Pad) {
    const index = spot.row * view.cols + spot.col;
    covered[index] = 1;
    if (spot.distance < view.cellWidth * FLOWER_CORE_CELLS) {
      cells.push({ index, x: spot.x, y: spot.y, tile: GOLD, petal: false, seed: 0, glyph: '*', ink: shade(GOLD, INK_DARKNESS.core) });
      return;
    }
    const reach = view.cellWidth * FLOWER_PETAL_CELLS;
    const lum = clamp(PETAL_SHADING.base + PETAL_SHADING.facing * topLeftLight(spot.distance) - PETAL_SHADING.dome * (spot.distance / reach), 0, 1);
    const tile = ramp(FLOWER_RAMPS[pad.flower] ?? RAMP_PEARL, lum);
    const key = Math.floor(hash3(spot.col, spot.row, pad.seed + SEED_OFFSETS.petalKey) * 1000);
    cells.push({
      index, x: spot.x, y: spot.y, tile, petal: true, seed: pad.seed + (key % SEED_OFFSETS.petalSpread),
      glyph: PETAL_GLYPHS[key % PETAL_GLYPHS.length], ink: shade(tile, INK_DARKNESS.petal),
    });
  }

  // Petals breathe slowly, a wake from a passing koi lifts the pad, and the odd leaf cell glints.
  function tint(cell: LilyCell, time: number, energy: Float32Array) {
    if (cell.petal) {
      const breath = Math.round((0.5 + 0.5 * Math.sin(time * PETAL_PULSE_RATE + cell.seed)) * PETAL_PULSE_LEVELS) / PETAL_PULSE_LEVELS;
      return mix(cell.tile, WHITE, breath * PETAL_PULSE_MIX);
    }
    if (energy[cell.index] > WAKE_LIFT_ENERGY) return mix(cell.tile, POND.water, WAKE_LIFT_MIX);
    if (hash3(cell.index, Math.floor(time * GLINT_RATE), 3) < GLINT_CHANCE) return mix(cell.tile, POND.water, GLINT_MIX);
    return cell.tile;
  }

  function draw(time: number) {
    ensureBuilt();
    const { cellWidth, cellHeight, cellDim, energy } = view;
    for (const cell of cells) {
      const dim = cellDim[cell.index];
      if (dim < MIN_VISIBLE_DIM) continue;
      ctx.globalAlpha = LILY_ALPHA * dim;
      ctx.fillStyle = style(tint(cell, time, energy));
      ctx.fillRect(cell.x - cellWidth / 2 + 1, cell.y - cellHeight / 2 + 1, cellWidth - 1, cellHeight - 1);
      ctx.fillStyle = style(cell.ink);
      ctx.fillText(cell.glyph, cell.x, cell.y + 1);
    }
  }

  return { setPads, covers, draw };
}
