/* Koi renderer: draws the aquarium's koi, water and food on a canvas as shaded ASCII tiles.
   Every skin cell is a softly lit coloured tile with a low-contrast glyph etched on top.
   Adapted, with permission, from the koi pond in Dao-Ho/portfolio (outline, tile shading,
   colour ramps, wakes). */
import { POND, VARIETIES, PEARL, clamp, smoothstep, hash3, valueNoise, mix, shade, ramp, lineGlyph } from './koiColor'
import { createLilies } from './koiLilies'
import type { Box, GridView, Koi, KoiWorld, Pad, Ripple } from './koiTypes'

interface ShapeHit {
  flag: number
  across: number
}

/** A marking in body space: centred at (s, v) along and across the spine, as fractions of length. */
interface Patch {
  s: number
  v: number
  rs: number
  rv: number
}

interface Markings {
  patches: Patch[]
  spots: Patch[]
}

/** What the cell being painted looks like, filled in by rasterizeCell. */
interface CellInfo {
  flag: number
  across: number
  s: number
  v: number
  tx: number
  ty: number
  hits: number
  gx: number
  gy: number
  coverage: number
  solid: boolean
}

/** Per-koi values shared by every cell of that koi. */
interface RasterContext {
  koi: Koi
  variety: (typeof VARIETIES)[number]
  markings: Markings
  time: number
  length: number
  diag: number
  dim: number
}


export const NODES = 20;
export const PELLET_LIFE_SECONDS = 10;
const PELLET_SINK_SECONDS = 7;
export const PELLET_FALL_SECONDS = 0.35;
export const RIPPLE_LIFE_SECONDS = 1.6;
const RIPPLE_SPEED_PX = 52;
export const BITE_LIFE_SECONDS = 0.45;
const DIM_UNDER_CONTENT = 0.1;
const DIM_PAD_CELLS = 4;
const CELL_WIDTH_PX = { min: 8, max: 12, perCanvasWidth: 125 };
const GLYPH_HEIGHT_RATIO = 0.72;
const WAKE_MIN_ENERGY = 0.22;
const WAKE_MAX_ENERGY = 1.5;
const WAKE_REFERENCE_FPS = 60;
const WAKE_BASE = 0.03;
const WAKE_SPEED_GAIN = 0.0016;
const WAKE_BOW_MIN_BEAT = 0.5;
const WAKE_BOW_SHARE = 1.4;
const WAKE_TRAIL_START = 9;
const WAKE_DECAY = 0.85;
const WAKE_POINTER_MIN_SPEED = 60;
const BODY_END = 0.74;
const DORSAL_DARKEN = 0.82;
const FIN_TILE_MIX = 0.55;
const FIN_TILE_ALPHA = 0.45;
const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const TILE_GLYPHS = 't%SX8@#';
const SUBSAMPLES = [0.25, 0.25, 0.75, 0.25, 0.25, 0.75, 0.75, 0.75];

export const VARIETY_COUNT = VARIETIES.length

/* ── Koi outline (all distances are fractions of body length) ── */
const FLAG_BODY = 1, FLAG_FIN = 2, FLAG_EYE = 3, FLAG_DORSAL = 4, FLAG_BARBEL = 5;

function bodyHalfWidth(s: number) {
  if (s < 0.12) return 0.11 * Math.pow(Math.sin(((s / 0.12) * Math.PI) / 2), 0.55);
  if (s < 0.3) return 0.11 + 0.025 * smoothstep(0.12, 0.3, s);
  return 0.033 + 0.102 * (1 - smoothstep(0.3, 0.74, s));
}

// Butterfly tail: fans out from the stalk, with a V notch in the trailing edge.
function tailHalfWidth(s: number) {
  return 0.03 + 0.15 * Math.pow(smoothstep(0.7, 1, s), 0.8);
}

function inFin(s: number, a: number, rootS: number, angle: number, reach: number, width: number, out: ShapeHit) {
  const rootA = bodyHalfWidth(rootS) * 0.85;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const du = s - rootS, da = a - rootA;
  const along = du * cosA + da * sinA - reach;
  const perp = -du * sinA + da * cosA;
  if ((along / reach) ** 2 + (perp / width) ** 2 > 1) return false;
  out.flag = FLAG_FIN;
  return true;
}

// s: along the spine (0 snout, 1 tail tip), a: distance from it, past: beyond the tail tip,
// flare: how far the fins spread, ahead/lateral: position relative to the snout for the whiskers.
function classify(s: number, a: number, past: number, flare: number, out: ShapeHit, ahead: number, lateral: number) {
  out.flag = 0;
  out.across = 1;
  if (ahead > 0) {
    if (ahead < 0.05 && Math.abs(lateral - (0.045 + ahead * 0.7)) < 0.016) {
      out.flag = FLAG_BARBEL;
      return true;
    }
    return false;
  }
  const width = bodyHalfWidth(s);
  if (s <= BODY_END && a <= width) {
    const across = width > 0 ? a / width : 1;
    out.across = across;
    if (s > 0.055 && s < 0.1 && across > 0.5 && across < 0.85) out.flag = FLAG_EYE;
    else if (s > 0.28 && s < 0.6 && across < 0.14) out.flag = FLAG_DORSAL;
    else out.flag = FLAG_BODY;
    return true;
  }
  if (s > 0.68 && past <= 0) {
    const tailWidth = tailHalfWidth(s) * flare;
    if (a <= tailWidth && s <= 0.86 + 0.14 * (a / tailWidth)) {
      out.flag = FLAG_FIN;
      return true;
    }
  }
  return inFin(s, a, 0.19, 0.85 + 0.5 * (flare - 1), 0.066 * flare, 0.04, out)
    || inFin(s, a, 0.47, 0.75, 0.036, 0.018, out);
}

/* ── Markings: a fixed set of patches per koi, pinned to body coordinates ── */
function makeMarkings(koi: Koi): Markings {
  const variety = VARIETIES[koi.variety];
  const rand = (j: number) => hash3(koi.id, j, 41);
  if (variety.pattern === 'crown') return { patches: [{ s: 0.11, v: 0, rs: 0.05, rv: 0.055 }], spots: [] };

  const patches: Patch[] = [];
  if (rand(0) < 0.75) patches.push({ s: 0.1, v: (rand(1) - 0.5) * 0.03, rs: 0.055 + rand(2) * 0.03, rv: 0.11 });
  const saddles = 2 + Math.floor(rand(3) * 2);
  for (let j = 0; j < saddles; j++) {
    const span = 0.42 / saddles;
    patches.push({
      s: 0.25 + span * (j + 0.5) + (rand(10 + j) - 0.5) * span * 0.3,
      v: (rand(20 + j) - 0.5) * 0.05,
      rs: span * (0.32 + rand(30 + j) * 0.12),
      rv: 0.09 + rand(40 + j) * 0.05,
    });
  }
  const spots: Patch[] = [];
  if (variety.pattern === 'spotted') {
    const count = 4 + Math.floor(rand(50) * 3);
    for (let j = 0; j < count; j++) {
      spots.push({ s: 0.24 + rand(60 + j) * 0.44, v: (rand(70 + j) - 0.5) * 0.16, rs: 0.022, rv: 0.026 });
    }
  }
  return { patches, spots };
}

const inPatch = (patch: Patch, s: number, v: number, wobble: number) => ((s - patch.s) / patch.rs) ** 2 + ((v - patch.v) / patch.rv) ** 2 < 1 + wobble;

/* ── Renderer ── */
export function createKoiRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const styles = new Map<number, string>();
  const markingCache = new Map<number, Markings>();
  let dpr = 1, cellWidth = 8, cellHeight = 10, cols = 0, rows = 0;
  let cellGlyph = new Uint16Array(0);
  let cellColor = new Uint32Array(0);
  let cellAlpha = new Float32Array(0);
  let cellTile = new Uint32Array(0);
  let cellTileAlpha = new Float32Array(0);
  let cellDim = new Float32Array(0);
  let energy = new Float32Array(0);
  let energyTmp = new Float32Array(0);

  const spine = new Float32Array(NODES * 2);
  const arc = new Float32Array(NODES);
  let arcTotal = 1, flareLeft = 1, flareRight = 1;
  const hit = { flag: 0, across: 1 };
  // Scratch objects reused for every cell, so painting allocates nothing per frame.
  const cell: CellInfo = { flag: 0, across: 1, s: 0, v: 0, tx: 1, ty: 0, hits: 0, gx: 0, gy: 0, coverage: 0, solid: false };
  const paint = { tile: 0, glyph: ' ', rgb: 0, alpha: 0, tileAlpha: 0 };
  const context: RasterContext = {
    koi: undefined as unknown as Koi,
    variety: VARIETIES[0],
    markings: { patches: [], spots: [] },
    time: 0, length: 0, diag: 0, dim: 0,
  };
  let hitS = 0, hitV = 0, hitDist = 0, hitTx = 1, hitTy = 0, hitSeg = 0;

  // Live view of the grid for plug-in layers; energy and cellDim are reassigned, so expose getters.
  const view: GridView = {
    get cols() { return cols; },
    get rows() { return rows; },
    get cellWidth() { return cellWidth; },
    get cellHeight() { return cellHeight; },
    get cellDim() { return cellDim; },
    get energy() { return energy; },
  };
  let lilies: ReturnType<typeof createLilies> | null = null;

  function style(rgb: number) {
    let css = styles.get(rgb);
    if (!css) {
      css = 'rgb(' + (rgb >>> 16) + ',' + ((rgb >>> 8) & 255) + ',' + (rgb & 255) + ')';
      styles.set(rgb, css);
    }
    return css;
  }

  let liliesFailed = false;

  function disableLilies(error: unknown) {
    liliesFailed = true;
    lilies = null;
    console.error('[koi] lilies disabled after an error, koi and water continue', error);
  }

  function setLilies(specs: Pad[]) {
    if (liliesFailed) return;
    try {
      if (!lilies) lilies = createLilies({ ctx, style, view });
      lilies.setPads(specs);
    } catch (error) {
      disableLilies(error);
    }
  }

  function drawLilies(time: number) {
    if (!lilies) return;
    try {
      lilies.draw(time);
    } catch (error) {
      disableLilies(error);
    }
  }

  // A cell holds a koi unless a pad has since been drawn over it, in which case surface effects may draw there.
  function isKoiCell(index: number) {
    return cellGlyph[index] !== 0 && !(lilies && lilies.covers(index));
  }

  function cellIndex(x: number, y: number) {
    const col = Math.floor(x / cellWidth), row = Math.floor(y / cellHeight);
    if (col < 0 || row < 0 || col >= cols || row >= rows) return -1;
    return row * cols + col;
  }

  function glyphAt(index: number, glyph: string, rgb: number, alpha: number) {
    ctx.globalAlpha = alpha * cellDim[index];
    ctx.fillStyle = style(rgb);
    ctx.fillText(glyph, (index % cols) * cellWidth + cellWidth / 2, Math.floor(index / cols) * cellHeight + cellHeight / 2);
  }

  function markingsFor(koi: Koi) {
    let markings = markingCache.get(koi.id);
    if (!markings) {
      markings = makeMarkings(koi);
      markingCache.set(koi.id, markings);
    }
    return markings;
  }

  function resize(width: number, height: number, ratio: number) {
    dpr = ratio;
    cellWidth = clamp(Math.round(width / CELL_WIDTH_PX.perCanvasWidth), CELL_WIDTH_PX.min, CELL_WIDTH_PX.max);
    cellHeight = cellWidth + 2;
    cols = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / cellHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const count = cols * rows;
    cellGlyph = new Uint16Array(count);
    cellColor = new Uint32Array(count);
    cellAlpha = new Float32Array(count);
    cellTile = new Uint32Array(count);
    cellTileAlpha = new Float32Array(count);
    cellDim = new Float32Array(count).fill(1);
    energy = new Float32Array(count);
    energyTmp = new Float32Array(count);
  }

  // Fades koi under page content, easing back in over a few cells around each box.
  function setDimBoxes(boxes: Box[]) {
    if (!cellDim) return;
    cellDim.fill(1);
    const pad = cellWidth * DIM_PAD_CELLS;
    for (const box of boxes) {
      const col0 = Math.max(0, Math.floor((box.left - pad) / cellWidth));
      const col1 = Math.min(cols - 1, Math.floor((box.right + pad) / cellWidth));
      const row0 = Math.max(0, Math.floor((box.top - pad) / cellHeight));
      const row1 = Math.min(rows - 1, Math.floor((box.bottom + pad) / cellHeight));
      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const x = col * cellWidth + cellWidth / 2, y = row * cellHeight + cellHeight / 2;
          const distance = Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom));
          const index = row * cols + col;
          cellDim[index] = Math.min(cellDim[index], DIM_UNDER_CONTENT + (1 - DIM_UNDER_CONTENT) * smoothstep(0, pad, distance));
        }
      }
    }
  }

  function dimAt(x: number, y: number) {
    const index = cellIndex(x, y);
    return index < 0 ? 1 : cellDim[index];
  }

  /* ── Koi geometry ── */
  // Builds the render spine with the travelling body wave, then measures its arc length.
  function buildSpine(koi: Koi) {
    const length = koi.bodyLength;
    const swim = 0.2 + 1.1 * koi.beat;
    for (let n = 0; n < NODES; n++) {
      const s = n / (NODES - 1);
      const front = koi.spine[Math.max(0, n - 1)], back = koi.spine[Math.min(NODES - 1, n + 1)];
      let tx = front.x - back.x, ty = front.y - back.y;
      const tangentLength = Math.hypot(tx, ty) || 1;
      tx /= tangentLength;
      ty /= tangentLength;
      const amplitude = length * 0.04 * (0.05 + 0.95 * Math.pow(s, 2.2)) * swim;
      const offset = amplitude * Math.sin(koi.phase - s * 4.6);
      spine[n * 2] = koi.spine[n].x - ty * offset;
      spine[n * 2 + 1] = koi.spine[n].y + tx * offset;
    }
    arc[0] = 0;
    for (let n = 1; n < NODES; n++) {
      arc[n] = arc[n - 1] + Math.hypot(spine[n * 2] - spine[(n - 1) * 2], spine[n * 2 + 1] - spine[(n - 1) * 2 + 1]);
    }
    arcTotal = arc[NODES - 1] || 1;
    // Pectorals tuck in during a burst, scull in turn while coasting, and the inner one spreads on a turn.
    const spread = 1 - 0.25 * koi.beat;
    const scull = 0.18 * (1 - koi.beat) * Math.sin(koi.finPhase);
    const bank = clamp(koi.turn * 0.6, -0.35, 0.35);
    flareLeft = spread + scull - bank;
    flareRight = spread - scull + bank;
  }

  // Finds the nearest point on the render spine, then classifies it against the koi's outline.
  function sample(px: number, py: number, length: number, from: number, to: number) {
    let best = Infinity, bestS = 0, bestSign = 1, past = 0, ahead = 0, lateral = 0;
    for (let n = from; n <= to; n++) {
      const ax = spine[n * 2], ay = spine[n * 2 + 1];
      const sx = spine[(n + 1) * 2] - ax, sy = spine[(n + 1) * 2 + 1] - ay;
      const len2 = sx * sx + sy * sy || 1;
      const raw = ((px - ax) * sx + (py - ay) * sy) / len2;
      const u = clamp(raw, 0, 1);
      const d2 = (px - ax - sx * u) ** 2 + (py - ay - sy * u) ** 2;
      if (d2 >= best) continue;
      const len = Math.sqrt(len2);
      best = d2;
      bestS = (arc[n] + u * len) / arcTotal;
      bestSign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
      past = n === NODES - 2 ? Math.max(0, raw - 1) * len : 0;
      ahead = n === 0 ? Math.max(0, -raw) * len : 0;
      lateral = Math.abs(sx * (py - ay) - sy * (px - ax)) / len;
      hitTx = sx / len;
      hitTy = sy / len;
      hitSeg = n;
    }
    hitDist = Math.sqrt(best);
    hitS = bestS;
    hitV = hitDist * bestSign;
    const flare = bestSign > 0 ? flareLeft : flareRight;
    return classify(bestS, hitDist / length, past / length, flare, hit, ahead / length, lateral / length);
  }

  // 0 base skin, 1 patch, 2 spot. Belly edges and the tail stalk stay base colour, which frames the markings.
  function skinKind(koi: Koi, markings: Markings, s: number, v: number, across: number) {
    if (across > 0.9 || s > BODY_END) return 0;
    const vn = v / koi.bodyLength;
    const wobble = (valueNoise(s * 14 + koi.id, vn * 30, koi.id + 3) - 0.5) * 0.6;
    for (const spot of markings.spots) if (inPatch(spot, s, vn, wobble)) return 2;
    for (const patch of markings.patches) if (inPatch(patch, s, vn, wobble)) return 1;
    return 0;
  }

  /* ── Koi rasterisation ── */
  function rasterizeKoi(koi: Koi, time: number) {
    buildSpine(koi);
    const length = koi.bodyLength;
    const variety = VARIETIES[koi.variety];
    const markings = markingsFor(koi);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let n = 0; n < NODES; n++) {
      minX = Math.min(minX, spine[n * 2]); maxX = Math.max(maxX, spine[n * 2]);
      minY = Math.min(minY, spine[n * 2 + 1]); maxY = Math.max(maxY, spine[n * 2 + 1]);
    }
    const reach = length * 0.26;
    const col0 = Math.max(0, Math.floor((minX - reach) / cellWidth)), col1 = Math.min(cols - 1, Math.floor((maxX + reach) / cellWidth));
    const row0 = Math.max(0, Math.floor((minY - reach) / cellHeight)), row1 = Math.min(rows - 1, Math.floor((maxY + reach) / cellHeight));
    if (col0 > col1 || row0 > row1) return;

    context.koi = koi;
    context.variety = variety;
    context.markings = markings;
    context.time = time;
    context.length = length;
    context.diag = Math.hypot(cellWidth, cellHeight);
    context.dim = POND.alpha * (POND.depthFloor + (1 - POND.depthFloor) * koi.depth);

    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) {
        col += rasterizeCell(context, col, row);
      }
    }
  }

  // Rasterises one cell; returns how many extra columns can be skipped because nothing reaches them.
  function rasterizeCell(context: RasterContext, col: number, row: number) {
    const { length, diag } = context;
    const x = col * cellWidth, y = row * cellHeight;
    const centerHit = sample(x + cellWidth / 2, y + cellHeight / 2, length, 0, NODES - 2);
    const waist = hitS > 0.4 && hitS < 0.62;
    if (!centerHit && hitDist > length * (waist ? 0.15 : 0.25) + diag) {
      return Math.max(0, Math.floor((hitDist - length * 0.25 - diag) / cellWidth));
    }
    const from = Math.max(0, hitSeg - 2), to = Math.min(NODES - 2, hitSeg + 2);
    let flag = hit.flag, across = hit.across;
    let s = hitS, v = hitV, tx = hitTx, ty = hitTy;
    let hits = centerHit ? 1 : 0, gx = 0, gy = 0;
    const deepInside = centerHit && flag !== FLAG_FIN && flag !== FLAG_BARBEL && s > 0.04 && s < 0.72
      && bodyHalfWidth(s) * length - hitDist > diag * 0.35;
    if (deepInside) hits = 5;
    for (let q = 0; !deepInside && q < SUBSAMPLES.length; q += 2) {
      if (!sample(x + SUBSAMPLES[q] * cellWidth, y + SUBSAMPLES[q + 1] * cellHeight, length, from, to)) continue;
      gx += (SUBSAMPLES[q] - 0.5) * cellWidth;
      gy += (SUBSAMPLES[q + 1] - 0.5) * cellHeight;
      if (hits === 0) { flag = hit.flag; across = hit.across; s = hitS; v = hitV; tx = hitTx; ty = hitTy; }
      hits++;
    }
    if (hits === 0) return 0;
    cell.flag = flag; cell.across = across; cell.s = s; cell.v = v; cell.tx = tx; cell.ty = ty;
    cell.hits = hits; cell.gx = gx; cell.gy = gy; cell.coverage = hits / 5;
    cell.solid = centerHit && hits / 5 >= 0.6;
    paintCell(context, cell, row * cols + col);
    return 0;
  }

  function paintCell(context: RasterContext, cell: CellInfo, index: number) {
    const { koi, dim } = context;
    const side = cell.v >= 0 ? 1 : -1;
    const key = (hash3(Math.round(cell.s * 90), Math.round(cell.v / (cellWidth * 0.8)), koi.id) * 4294967295) >>> 0;
    let glyph = ' ', rgb = POND.fin, alpha = dim, tile = null, tileAlpha = 0;

    if (cell.flag === FLAG_BARBEL) {
      glyph = lineGlyph(-cell.tx - side * cell.ty * 0.7, -cell.ty + side * cell.tx * 0.7);
      rgb = shade(mix(POND.bg, POND.fin, 0.9), POND.ink + 0.3);
    } else if (cell.flag === FLAG_EYE && cell.solid) {
      tile = mix(POND.bg, POND.eye, 0.85);
      tileAlpha = dim;
      glyph = 'o';
      rgb = mix(POND.bg, PEARL, 0.9);
    } else if (cell.flag === FLAG_FIN) {
      // Fins are a pale veil of tiles flecked with dots, so they never compete with the body.
      tile = mix(POND.bg, POND.fin, FIN_TILE_MIX);
      tileAlpha = dim * FIN_TILE_ALPHA * cell.coverage;
      if (key % 2 === 0) { glyph = '.'; alpha *= 0.6 * cell.coverage; }
    } else {
      paintSkin(context, cell, key);
      tile = paint.tile; glyph = paint.glyph; rgb = paint.rgb; alpha = paint.alpha; tileAlpha = paint.tileAlpha;
    }
    if (glyph === ' ' && tileAlpha === 0) return;
    cellTile[index] = tile || 0;
    cellTileAlpha[index] = tileAlpha;
    cellGlyph[index] = glyph.charCodeAt(0);
    cellColor[index] = rgb;
    cellAlpha[index] = alpha;
  }

  function setPaint(tile: number, glyph: string, rgb: number, alpha: number, tileAlpha: number) {
    paint.tile = tile;
    paint.glyph = glyph;
    paint.rgb = rgb;
    paint.alpha = alpha;
    paint.tileAlpha = tileAlpha;
  }

  // Each skin cell is a tile washed in the skin colour, shaded like a rounded back lit from the
  // top-left, with a dense glyph etched on top. Patches run the variety's full colour ramp.
  function paintSkin(context: RasterContext, cell: CellInfo, key: number) {
    const { koi, variety, markings, time, length, dim } = context;
    const side = cell.v >= 0 ? 1 : -1;
    const kind = skinKind(koi, markings, cell.s, cell.v, cell.across);
    const facing = side * (0.6 * cell.ty - 0.8 * cell.tx) * cell.across;
    const lum = clamp(0.22 + 0.5 * Math.sqrt(1 - cell.across * cell.across) + 0.18 * facing, 0, 1);
    let tile: number;
    if (kind === 1) {
      // Each koi leans a little warmer or cooler, slow noise varies the hue within a patch like real
      // pigment, and a band of shine travels down the body like light sliding over wet scales.
      const lean = (hash3(koi.id, 5, 17) - 0.5) * 0.3;
      const grain = (valueNoise(cell.s * 9 + koi.id, (cell.v / length) * 18, koi.id + 21) - 0.5) * 0.25;
      const sheen = Math.max(0, Math.sin(cell.s * 11 - time * 1.8 + koi.id) - 0.7) / 0.3;
      tile = ramp(variety.ramp, 0.15 + 0.8 * lum + lean + grain + sheen * 0.35);
    } else {
      const base = kind === 2 ? (variety.spot ?? variety.skin) : variety.skin;
      tile = mix(POND.bg, base, POND.tile[0] + (POND.tile[1] - POND.tile[0]) * lum);
    }
    if (cell.flag === FLAG_DORSAL) tile = shade(tile, DORSAL_DARKEN);
    if (cell.hits < 5) {
      const edgeGlyph = Math.hypot(cell.gx, cell.gy) > cellWidth * 0.2 && key % 3 === 0;
      return setPaint(tile, edgeGlyph ? '.' : ' ', shade(tile, POND.ink), dim, dim * cell.coverage * 0.55);
    }
    if (cell.s < 0.035 && cell.across < 0.6 && koi.startle > 0.5) {
      return setPaint(tile, 'o', POND.eye, dim, dim);
    }
    const glyph = TILE_GLYPHS[clamp(Math.round((1 - lum) * 4) + ((key >>> 4) % 3), 0, TILE_GLYPHS.length - 1)];
    // Base skin is etched lightly so the patches carry the pattern.
    const alpha = kind === 0 ? dim * 0.6 : dim;
    const ink = shade(tile, POND.ink);
    const tick = Math.floor(time * 1.4 + (key % 997) / 97);
    if (hash3(key, tick, 7) < 0.03) tile = mix(tile, POND.bg, 0.45);
    return setPaint(tile, glyph, ink, alpha, dim);
  }

  /* ── Drawing ── */
  function drawCells() {
    for (let i = 0; i < cellGlyph.length; i++) {
      const code = cellGlyph[i];
      if (!code) continue;
      const x = (i % cols) * cellWidth, y = Math.floor(i / cols) * cellHeight;
      if (cellTileAlpha[i] > 0) {
        ctx.globalAlpha = cellTileAlpha[i] * cellDim[i];
        ctx.fillStyle = style(cellTile[i]);
        ctx.fillRect(x + 1, y + 1, cellWidth - 1, cellHeight - 1);
      }
      if (code === 32) continue;
      ctx.globalAlpha = cellAlpha[i] * cellDim[i];
      ctx.fillStyle = style(cellColor[i]);
      ctx.fillText(String.fromCharCode(code), x + cellWidth / 2, y + cellHeight / 2 + 1);
    }
  }

  function depositWake(world: KoiWorld, dt: number) {
    const rate = dt * WAKE_REFERENCE_FPS;
    for (const koi of world.koi) {
      const push = (WAKE_BASE + koi.speed * WAKE_SPEED_GAIN) * rate;
      // A bow wave off the snout while swimming hard, and a trail the whole length of the tail half.
      if (koi.beat > WAKE_BOW_MIN_BEAT) depositAt(koi.spine[0].x, koi.spine[0].y, push * WAKE_BOW_SHARE);
      for (let n = WAKE_TRAIL_START; n < NODES; n++) depositAt(koi.spine[n].x, koi.spine[n].y, push);
    }
    if (world.pointer.active && world.pointer.speed > WAKE_POINTER_MIN_SPEED) {
      depositAt(world.pointer.x, world.pointer.y, 0.12 * rate);
    }
  }

  function depositAt(x: number, y: number, amount: number) {
    const index = cellIndex(x, y);
    if (index >= 0) energy[index] = Math.min(WAKE_MAX_ENERGY, energy[index] + amount);
  }

  // Blur and decay so wakes spread like ripples and fade.
  function diffuse(dt: number) {
    const decay = Math.exp(-dt * WAKE_DECAY);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const left = col > 0 ? energy[i - 1] : energy[i];
        const right = col < cols - 1 ? energy[i + 1] : energy[i];
        const up = row > 0 ? energy[i - cols] : energy[i];
        const down = row < rows - 1 ? energy[i + cols] : energy[i];
        energyTmp[i] = (energy[i] * 4 + left + right + up + down) * 0.125 * decay;
      }
    }
    const swap = energy;
    energy = energyTmp;
    energyTmp = swap;
  }

  function drawWake() {
    for (let i = 0; i < energy.length; i++) {
      const e = energy[i];
      if (e < WAKE_MIN_ENERGY || cellGlyph[i]) continue;
      glyphAt(i, e > 0.85 ? '~' : e > 0.5 ? '-' : '.', POND.water, Math.min(1, (e - WAKE_MIN_ENERGY) * 1.4) * 0.5);
    }
  }

  function drawAmbient(world: KoiWorld) {
    ctx.fillStyle = style(POND.water);
    for (const mote of world.shimmer) {
      ctx.globalAlpha = (0.03 + 0.05 * (0.5 + 0.5 * Math.sin(world.time * 0.8 + mote.phase))) * dimAt(mote.x, mote.y);
      ctx.fillText(mote.glyph, mote.x, mote.y);
    }
    for (const bubble of world.bubbles) {
      const x = bubble.x + Math.sin(world.time + bubble.sway) * 6;
      ctx.globalAlpha = 0.16 * dimAt(x, bubble.y);
      ctx.fillText(bubble.glyph, x, bubble.y);
    }
  }

  // Expanding rings drawn as ASCII circles: the glyph follows the ring's tangent.
  function drawRipples(world: KoiWorld) {
    for (const ripple of world.ripples) {
      const age = world.time - ripple.born;
      const fade = Math.pow(1 - age / RIPPLE_LIFE_SECONDS, 1.5) * ripple.strength;
      for (let ring = 0; ring < 2; ring++) {
        const radius = Math.max(0, age - ring * 0.45) * RIPPLE_SPEED_PX * (0.7 + 0.5 * ripple.strength);
        if (radius < 2) continue;
        drawRing(ripple, radius, ring, fade * (ring === 0 ? 0.55 : 0.3));
      }
    }
  }

  function drawRing(ripple: Ripple, radius: number, ring: number, alpha: number) {
    const band = cellWidth * 0.6;
    const col0 = Math.max(0, Math.floor((ripple.x - radius - cellWidth) / cellWidth)), col1 = Math.min(cols - 1, Math.floor((ripple.x + radius + cellWidth) / cellWidth));
    const row0 = Math.max(0, Math.floor((ripple.y - radius - cellHeight) / cellHeight)), row1 = Math.min(rows - 1, Math.floor((ripple.y + radius + cellHeight) / cellHeight));
    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) {
        const i = row * cols + col;
        if (isKoiCell(i)) continue;
        const dx = col * cellWidth + cellWidth / 2 - ripple.x, dy = row * cellHeight + cellHeight / 2 - ripple.y;
        if (Math.abs(Math.hypot(dx, dy) - radius) > band) continue;
        glyphAt(i, ring === 1 ? '.' : lineGlyph(-dy, dx), POND.water, alpha);
      }
    }
  }

  // Pellets fall in (' then .), land as o, bob while floating, then dim to . as they sink.
  function drawPellets(world: KoiWorld) {
    for (const pellet of world.pellets) {
      if (pellet.eaten) continue;
      const wait = pellet.born - world.time;
      if (wait > 0) {
        if (wait > PELLET_FALL_SECONDS) continue;
        const fall = 1 - wait / PELLET_FALL_SECONDS;
        const i = cellIndex(pellet.x, pellet.y - (1 - fall) * cellHeight * 1.5);
        if (i >= 0 && !isKoiCell(i)) glyphAt(i, fall < 0.5 ? "'" : '.', POND.pellet, POND.alpha * (0.5 + 0.4 * fall));
        continue;
      }
      const i = cellIndex(pellet.x, pellet.y);
      if (i < 0 || isKoiCell(i)) continue;
      const age = -wait;
      const sink = smoothstep(PELLET_SINK_SECONDS, PELLET_LIFE_SECONDS, age);
      const bob = 0.8 + 0.2 * Math.sin(age * 3 + pellet.x);
      glyphAt(i, sink > 0.55 ? '.' : 'o', POND.pellet, POND.alpha * bob * (1 - 0.85 * sink));
    }
  }

  // A bite flashes * over the koi's mouth, settling to + then a dot as the splash takes over.
  function drawBites(world: KoiWorld) {
    for (const bite of world.bites) {
      const i = cellIndex(bite.x, bite.y);
      if (i < 0) continue;
      const t = (world.time - bite.born) / BITE_LIFE_SECONDS;
      glyphAt(i, t < 0.35 ? '*' : t < 0.7 ? '+' : '.', POND.pellet, Math.min(1, POND.alpha * 1.6) * (1 - t * t));
    }
  }

  function render(world: KoiWorld, dt: number) {
    if (cols === 0) return;
    cellGlyph.fill(0);
    cellTileAlpha.fill(0);
    for (const koi of world.koi) rasterizeKoi(koi, world.time);
    depositWake(world, dt);
    diffuse(dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '600 ' + Math.round(cellHeight * GLYPH_HEIGHT_RATIO) + 'px ' + FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawWake();
    drawAmbient(world);
    drawCells();
    drawLilies(world.time);
    drawRipples(world);
    drawPellets(world);
    drawBites(world);
    ctx.globalAlpha = 1;
  }

  return { resize, setDimBoxes, setLilies, render };
}
