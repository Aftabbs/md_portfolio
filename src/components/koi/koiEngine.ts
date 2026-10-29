/* Koi aquarium behaviour: koi swimming behind a page section.
   This file owns behaviour (movement, food, input, the animation loop); koiRenderer.ts owns looks.
   Elements marked [data-koi-avoid] keep the koi faded beneath them so text stays readable.
   Animation state is mutated in place on purpose: it runs every frame and allocating fresh
   objects per frame would only add garbage-collection stutter. */
import { wrapAngle } from './koiColor'
import type { Box, Bubble, Koi, KoiWorld, Pad, Pellet } from './koiTypes'
import {
  BITE_LIFE_SECONDS,
  createKoiRenderer,
  NODES,
  PELLET_FALL_SECONDS,
  PELLET_LIFE_SECONDS,
  RIPPLE_LIFE_SECONDS,
  VARIETY_COUNT,
} from './koiRenderer'

interface EngineState extends KoiWorld {
  width: number
  height: number
  dpr: number
  small: boolean
  boxes: Box[]
  lilies: Pad[]
  fed: number
  frames: number
  visible: boolean
  rafId: number
  lastFrameAt: number
  accumulator: number
}

/**
 * Starts the aquarium inside `aquarium`, drawing on `canvas`.
 * Returns a function that stops it and removes every listener and observer.
 */
export function startKoiAquarium(aquarium: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ResizeObserver !== 'function' || typeof IntersectionObserver !== 'function') {
    console.warn('[koi] 2D canvas, ResizeObserver or IntersectionObserver unavailable, animation skipped');
    return () => undefined;
  }

  const renderer = createKoiRenderer(canvas, ctx);
  // The hint and counter live in the page's footer, found by data attribute so this file stays markup-agnostic.
  const fedEl = aquarium.querySelector<HTMLElement>('[data-koi-fed]');
  const hintEl = aquarium.querySelector<HTMLElement>('[data-koi-hint]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let destroyed = false;

  /* ── Tuning ── */
  const STEP_SECONDS = 1 / 60;
  const MAX_STEPS_PER_FRAME = 4;
  const MAX_FRAME_SECONDS = 0.1;
  const STILL_FRAME_SECONDS = 0.016;
  const SPINE_SEGMENTS = NODES;
  const MEASURE_EVERY_FRAMES = 30;
  const MAX_DEVICE_PIXEL_RATIO = 2;
  const SMALL_SCREEN_PX = 700;
  const LARGE_SCREEN_PX = 1100;
  const SMALL_SCREEN_KOI_SCALE = 0.7;
  const KOI_COUNT = { small: 4, medium: 5, large: 6 };
  const KOI_LENGTH_PX = { min: 190, spread: 70 };
  const KOI_SPAWN_MARGIN_PX = 40;
  const KOI_EDGE_MARGIN_PX = 8;

  /* Steering around page content and walls */
  const AVOID_MARGIN_PX = 50;
  const AVOID_PUSH = 0.7;
  const INSIDE_BOX_PUSH = 1.2;
  const MAX_AVOID_PUSH = 1.6;
  const SIDE_EXIT_COST = 2.5;
  const DOWN_EXIT_BIAS = 0.7;
  const URGENT_AVOID_SCALE = 0.2;
  const WALL_MARGIN_PX = 150;
  const WALL_PUSH = 2;
  // Must match the 140px fade-in mask on #koi-canvas in index.html.
  const MASK_FADE_PX = 140;

  /* Steering */
  const CALM_TURN_RATE = 1.6;
  // The tightest turn, as a fraction of body length: a real koi bends in a gentle C, never a ring.
  const MIN_TURN_RADIUS_RATIO = { calm: 0.5, food: 0.35 };
  // Hard limit on how far one spine joint may bend (19 joints, so about 90 degrees in total): a koi never folds into a ring.
  const MAX_JOINT_BEND = 0.085;
  const FOOD_CLOSE_PX = 160;
  const FOOD_CLOSE_PACE = 1.3;
  const URGENT_TURN_RATE = 3.6;
  const WANDER_LIMIT = 0.9;
  const WANDER_JITTER = 2.4;
  const FORWARD_PULL = 0.6;
  const SEPARATION_PUSH = 0.8;
  const SEPARATION_BODY_RATIO = 0.6;
  const FOOD_SEARCH_RADIUS_PX = 420;
  const FOOD_PULL = 2.2;
  const FOOD_PACE = 2.4;
  const EAT_RADIUS_PX = 30;
  // A koi that struggles to reach a pellet gulps it from a little further each second.
  const EAT_GROWTH_PX_PER_SECOND = 12;
  const EAT_RADIUS_MAX_PX = 90;
  const POINTER_STARTLE_SPEED = 650;
  const POINTER_STARTLE_RADIUS_PX = 200;
  const POINTER_CURIOUS_RADIUS_PX = { near: 80, far: 260 };
  const POINTER_PULL = 0.7;
  const FLEE_PUSH = 2.6;
  const FLEE_PACE = 3.2;
  const STARTLE_DECAY = 0.8;
  const STARTLE_THRESHOLD = 0.3;

  /* Swimming style: koi swim in bursts of tail beats, then coast */
  const BURST_RATE = 0.9;
  const COAST_BEAT = 0.35;
  const BEAT_SMOOTHING = 2.5;
  const COAST_PACE = 0.65;
  const BURST_PACE_GAIN = 0.45;
  const TAIL_RATE = { rest: 2.5, burst: 6 };
  const FIN_RATE = 2.2;
  const TURN_SMOOTHING = 6;

  /* Food and ripples */
  const MAX_PELLETS = 14;
  const PELLETS_PER_CLICK = { min: 4, spread: 3 };
  const PELLET_SCATTER_PX = { x: 50, y: 40 };
  const PELLET_DROP_STAGGER_SECONDS = 0.12;
  const CLICK_RIPPLE_STRENGTH = 1;
  const SWIM_RIPPLE_STRENGTH = 0.35;
  const SWIM_RIPPLE_MIN_BEAT = 0.55;
  const SWIM_RIPPLE_INTERVAL_SECONDS = { min: 0.5, spread: 0.45 };
  const EAT_RIPPLE_STRENGTH = 0.55;

  /* Lilies */
  const LILY_COUNT = { small: 1, medium: 2, large: 2 };
  const LILY_RADIUS_PX = { min: 30, spread: 22 };
  const LILY_SMALL_SCALE = 0.75;
  const LILY_CLEARANCE_PX = 10;
  const LILY_GAP_PX = 14;
  const LILY_FLOWER_CHANCE = 0.8;
  const LILY_FLOWER_TYPES = 2;
  const LILY_PLACE_ATTEMPTS = 400;
  const LILY_SEED = 777;

  const EXIT_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const state: EngineState = {
    width: 0, height: 0, dpr: 0, small: false,
    koi: [], pellets: [], ripples: [], bites: [], shimmer: [], bubbles: [], boxes: [], lilies: [],
    pointer: { x: 0, y: 0, active: false, speed: 0, at: 0 },
    time: 0, fed: 0, frames: 0,
    visible: false, rafId: 0, lastFrameAt: 0, accumulator: 0,
  };
  const steer = { x: 0, y: 0, pace: 0, urgent: false, foodClose: false };
  const avoidElements = Array.from(aquarium.querySelectorAll<HTMLElement>('[data-koi-avoid]'));

  /* ── Small helpers ── */
  function seededRandom(seed: number) {
    let value = seed | 0;
    return function () {
      value = (value + 0x6D2B79F5) | 0;
      let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
  const sizeScale = () => (state.small ? SMALL_SCREEN_KOI_SCALE : 1);

  function onMediaChange(query: MediaQueryList, handler: () => void) {
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }

  /* ── Koi creation ── */
  function makeKoi(id: number): Koi {
    const random = seededRandom(id * 7919 + 13);
    const koi = {
      id, variety: id % VARIETY_COUNT,
      baseLength: KOI_LENGTH_PX.min + random() * KOI_LENGTH_PX.spread, bodyLength: 0,
      x: KOI_SPAWN_MARGIN_PX + random() * Math.max(1, state.width - KOI_SPAWN_MARGIN_PX * 2),
      y: KOI_SPAWN_MARGIN_PX + random() * Math.max(1, state.height - KOI_SPAWN_MARGIN_PX * 2),
      heading: random() * Math.PI * 2, speed: 0, wander: 0, startle: 0, turn: 0,
      phase: random() * 6, finPhase: random() * 6, burstClock: random() * 6, beat: 0.6,
      depth: 0.5 + random() * 0.5, cruise: 34 + random() * 16, spine: [], nextRipple: random(), chaseSeconds: 0,
    };
    applyScale(koi);
    return koi;
  }

  function applyScale(koi: Koi) {
    koi.bodyLength = koi.baseLength * sizeScale();
    resetSpine(koi);
  }

  function resetSpine(koi: Koi) {
    const segmentLength = koi.bodyLength / (SPINE_SEGMENTS - 1);
    koi.spine = Array.from({ length: SPINE_SEGMENTS }, (_, index) => ({
      x: koi.x - Math.cos(koi.heading) * segmentLength * index,
      y: koi.y - Math.sin(koi.heading) * segmentLength * index,
    }));
    koi.speed = koi.cruise;
  }

  function targetKoiCount() {
    if (state.width < SMALL_SCREEN_PX) return KOI_COUNT.small;
    return state.width < LARGE_SCREEN_PX ? KOI_COUNT.medium : KOI_COUNT.large;
  }

  // Reusing the lowest free id keeps every variety on screen after a breakpoint round-trip.
  function lowestFreeKoiId() {
    const used = new Set(state.koi.map((koi) => koi.id));
    let id = 0;
    while (used.has(id)) id += 1;
    return id;
  }

  // Koi are kept sorted by depth once, so deeper fish are always drawn first.
  function syncKoiCount() {
    const target = targetKoiCount();
    while (state.koi.length < target) state.koi.push(makeKoi(lowestFreeKoiId()));
    if (state.koi.length > target) state.koi.length = target;
    state.koi.sort((a, b) => a.depth - b.depth);
  }

  /* ── Layout: sizing and content boxes ── */
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    if (rect.width === state.width && rect.height === state.height && dpr === state.dpr) return;

    const wasSmall = state.small;
    state.dpr = dpr;
    state.width = rect.width;
    state.height = rect.height;
    state.small = rect.width < SMALL_SCREEN_PX;
    renderer.resize(rect.width, rect.height, dpr);
    if (wasSmall !== state.small) state.koi.forEach(applyScale);
    syncKoiCount();
    state.koi.forEach(keepInside);
    populateAmbient();
    measureBoxes();
    placeLilies();
    if (reducedMotion.matches) safeRender(STILL_FRAME_SECONDS);
  }

  function keepInside(koi: Koi) {
    const outside = koi.x < 0 || koi.x > state.width || koi.y < 0 || koi.y > state.height;
    if (!outside) return;
    koi.x = clamp(koi.x, KOI_SPAWN_MARGIN_PX, Math.max(KOI_SPAWN_MARGIN_PX, state.width - KOI_SPAWN_MARGIN_PX));
    koi.y = clamp(koi.y, KOI_SPAWN_MARGIN_PX, Math.max(KOI_SPAWN_MARGIN_PX, state.height - KOI_SPAWN_MARGIN_PX));
    resetSpine(koi);
  }

  function measureBoxes() {
    const origin = canvas.getBoundingClientRect();
    state.boxes = avoidElements.map((element) => {
      const rect = element.dataset.koiAvoid === 'text' ? textRect(element) : element.getBoundingClientRect();
      return {
        left: rect.left - origin.left, right: rect.right - origin.left,
        top: rect.top - origin.top, bottom: rect.bottom - origin.top,
        width: rect.width, height: rect.height,
      };
    }).filter((box) => box.width > 0 && box.height > 0);
    renderer.setDimBoxes(state.boxes);
  }

  function textRect(element: Element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  }

  /* ── Lilies: laid out in open water, clear of the page content ── */
  function lilyCount() {
    if (state.width < SMALL_SCREEN_PX) return LILY_COUNT.small;
    return state.width < LARGE_SCREEN_PX ? LILY_COUNT.medium : LILY_COUNT.large;
  }

  function lilyFits(x: number, y: number, radius: number, placed: Pad[]) {
    for (const box of state.boxes) {
      const gapX = Math.max(box.left - x, 0, x - box.right);
      const gapY = Math.max(box.top - y, 0, y - box.bottom);
      if (Math.hypot(gapX, gapY) < radius + LILY_CLEARANCE_PX) return false;
    }
    return placed.every((other) => Math.hypot(other.x - x, other.y - y) > radius + other.radius + LILY_GAP_PX);
  }

  function padInsideCanvas(pad: Pad) {
    return pad.x - pad.radius >= 0 && pad.x + pad.radius <= state.width
      && pad.y - pad.radius >= MASK_FADE_PX && pad.y + pad.radius <= state.height;
  }

  function keepIfFits(placed: Pad[], pad: Pad, target: number) {
    if (placed.length < target && lilyFits(pad.x, pad.y, pad.radius, placed)) placed.push(pad);
    return placed;
  }

  // Pads that still fit stay exactly where they are, so a resize or the web-font reflow never
  // reshuffles the pond. Only missing pads are placed anew, from a seed so layouts repeat.
  function placeLilies() {
    if (!state.width) return;
    const scale = state.small ? LILY_SMALL_SCALE : 1;
    const target = lilyCount();
    const placed: Pad[] = [];
    for (const pad of state.lilies) {
      if (pad.scale === scale && padInsideCanvas(pad)) keepIfFits(placed, pad, target);
    }
    const random = seededRandom(LILY_SEED + placed.length);
    for (let attempt = 0; placed.length < target && attempt < LILY_PLACE_ATTEMPTS; attempt++) {
      const radius = (LILY_RADIUS_PX.min + random() * LILY_RADIUS_PX.spread) * scale;
      if (state.height - MASK_FADE_PX - radius * 2 < 1) break;
      const x = radius + random() * Math.max(1, state.width - radius * 2);
      const y = MASK_FADE_PX + radius + random() * (state.height - MASK_FADE_PX - radius * 2);
      if (!lilyFits(x, y, radius, placed)) continue;
      const index = placed.length;
      placed.push({
        x, y, radius, scale, seed: index * 37 + 5, notch: random() * Math.PI * 2, teal: index % 2 === 1,
        flower: random() < LILY_FLOWER_CHANCE ? 1 + (index % LILY_FLOWER_TYPES) : 0,
      });
    }
    state.lilies = placed;
    renderer.setLilies(placed);
  }

  /* ── Ambient water: shimmer and bubbles ── */
  function populateAmbient() {
    const shimmerCount = clamp(Math.round((state.width * state.height) / 9000), 30, 140);
    state.shimmer = Array.from({ length: shimmerCount }, () => ({
      x: Math.random() * state.width, y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 6, phase: Math.random() * 6,
      glyph: ['~', '.', '-'][Math.floor(Math.random() * 3)],
    }));
    const bubbleCount = state.small ? 5 : 9;
    state.bubbles = Array.from({ length: bubbleCount }, () => resetBubble({} as Bubble, Math.random() * state.height));
  }

  function resetBubble(bubble: Bubble, y: number) {
    bubble.x = Math.random() * state.width;
    bubble.y = y;
    bubble.speed = 14 + Math.random() * 16;
    bubble.sway = Math.random() * 6;
    bubble.glyph = Math.random() < 0.5 ? 'o' : '.';
    return bubble;
  }

  function updateAmbient(dt: number) {
    for (const mote of state.shimmer) {
      mote.x += mote.vx * dt;
      if (mote.x < 0) mote.x += state.width;
      if (mote.x > state.width) mote.x -= state.width;
    }
    for (const bubble of state.bubbles) {
      bubble.y -= bubble.speed * dt;
      if (bubble.y < -10) resetBubble(bubble, state.height + 10);
    }
  }

  /* ── Koi simulation ── */
  function updateKoi(koi: Koi, dt: number) {
    koi.wander = clamp(koi.wander + (Math.random() - 0.5) * dt * WANDER_JITTER, -WANDER_LIMIT, WANDER_LIMIT);
    koi.startle = Math.max(0, koi.startle - dt * STARTLE_DECAY);
    steer.x = Math.cos(koi.heading + koi.wander) * FORWARD_PULL;
    steer.y = Math.sin(koi.heading + koi.wander) * FORWARD_PULL;
    steer.pace = koi.cruise;
    steer.urgent = false;
    steer.foodClose = false;

    if (!seekFood(koi)) {
      koi.chaseSeconds = 0;
      reactToPointer(koi);
    }
    // Chasing or fleeing koi mostly ignore walls and content, so a pellet near an edge still gets eaten.
    const avoidScale = steer.urgent ? URGENT_AVOID_SCALE : 1;
    avoidWalls(koi, avoidScale);
    avoidContent(koi, avoidScale);
    keepApart(koi);
    advance(koi, dt);
  }

  function seekFood(koi: Koi) {
    let target: Pellet | null = null;
    let targetDistance = FOOD_SEARCH_RADIUS_PX;
    for (const pellet of state.pellets) {
      if (pellet.eaten || state.time < pellet.born) continue;
      const distance = Math.hypot(pellet.x - koi.x, pellet.y - koi.y);
      if (distance < targetDistance) { target = pellet; targetDistance = distance; }
    }
    if (!target) return false;
    const distance = targetDistance || 1;
    steer.x += ((target.x - koi.x) / distance) * FOOD_PULL;
    steer.y += ((target.y - koi.y) / distance) * FOOD_PULL;
    steer.foodClose = distance < FOOD_CLOSE_PX;
    steer.pace = koi.cruise * (steer.foodClose ? FOOD_CLOSE_PACE : FOOD_PACE);
    steer.urgent = true;
    koi.chaseSeconds += STEP_SECONDS;
    const eatRadius = Math.min(EAT_RADIUS_MAX_PX, EAT_RADIUS_PX + EAT_GROWTH_PX_PER_SECOND * koi.chaseSeconds);
    if (distance < eatRadius) eatPellet(target);
    return true;
  }

  function reactToPointer(koi: Koi) {
    const pointer = state.pointer;
    if (!pointer.active) return;
    const dx = pointer.x - koi.x, dy = pointer.y - koi.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (pointer.speed > POINTER_STARTLE_SPEED && distance < POINTER_STARTLE_RADIUS_PX) koi.startle = 1;
    if (koi.startle > STARTLE_THRESHOLD) {
      steer.x -= (dx / distance) * FLEE_PUSH;
      steer.y -= (dy / distance) * FLEE_PUSH;
      steer.pace = koi.cruise * FLEE_PACE;
      steer.urgent = true;
    } else if (distance < POINTER_CURIOUS_RADIUS_PX.far && distance > POINTER_CURIOUS_RADIUS_PX.near) {
      steer.x += (dx / distance) * POINTER_PULL;
      steer.y += (dy / distance) * POINTER_PULL;
    }
  }

  function avoidWalls(koi: Koi, scale: number) {
    const left = Math.max(0, WALL_MARGIN_PX - koi.x);
    const right = Math.max(0, koi.x - (state.width - WALL_MARGIN_PX));
    const top = Math.max(0, WALL_MARGIN_PX - koi.y);
    const bottom = Math.max(0, koi.y - (state.height - WALL_MARGIN_PX));
    steer.x += ((left - right) / WALL_MARGIN_PX) * WALL_PUSH * scale;
    steer.y += ((top - bottom) / WALL_MARGIN_PX) * WALL_PUSH * scale;
  }

  // Pushes away from the nearest point of each box. A koi already inside a box heads for the
  // cheapest exit: sideways exits cost more than vertical ones and downward is favoured,
  // because the open water sits below the cards.
  function avoidContent(koi: Koi, scale: number) {
    let pushX = 0, pushY = 0;
    for (const box of state.boxes) {
      const dx = koi.x - clamp(koi.x, box.left, box.right);
      const dy = koi.y - clamp(koi.y, box.top, box.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        if (distance >= AVOID_MARGIN_PX) continue;
        const gain = (AVOID_PUSH * (1 - distance / AVOID_MARGIN_PX)) / distance;
        pushX += dx * gain;
        pushY += dy * gain;
        continue;
      }
      const exit = EXIT_DIRECTIONS[cheapestExit(koi, box)];
      pushX += exit[0] * INSIDE_BOX_PUSH;
      pushY += exit[1] * INSIDE_BOX_PUSH;
    }
    const magnitude = Math.hypot(pushX, pushY);
    const limit = magnitude > MAX_AVOID_PUSH ? MAX_AVOID_PUSH / magnitude : 1;
    steer.x += pushX * limit * scale;
    steer.y += pushY * limit * scale;
  }

  function cheapestExit(koi: Koi, box: Box) {
    const costs = [
      (koi.x - box.left) * SIDE_EXIT_COST,
      (box.right - koi.x) * SIDE_EXIT_COST,
      koi.y - box.top,
      (box.bottom - koi.y) * DOWN_EXIT_BIAS,
    ];
    return costs.indexOf(Math.min(...costs));
  }

  function keepApart(koi: Koi) {
    const space = koi.bodyLength * SEPARATION_BODY_RATIO;
    for (const other of state.koi) {
      if (other === koi) continue;
      const dx = koi.x - other.x, dy = koi.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < space) {
        const push = (1 - distance / space) * SEPARATION_PUSH;
        steer.x += (dx / distance) * push;
        steer.y += (dy / distance) * push;
      }
    }
  }

  // Turn rate is capped by speed so the turning circle never gets tighter than a fraction of body length.
  function turnRate(koi: Koi) {
    const wanted = steer.urgent ? URGENT_TURN_RATE : CALM_TURN_RATE;
    const ratio = steer.foodClose ? MIN_TURN_RADIUS_RATIO.food : MIN_TURN_RADIUS_RATIO.calm;
    return Math.min(wanted, koi.speed / (koi.bodyLength * ratio));
  }

  function advance(koi: Koi, dt: number) {
    const wanted = Math.atan2(steer.y, steer.x);
    const maxTurn = turnRate(koi) * dt;
    const turnStep = clamp(wrapAngle(wanted - koi.heading), -maxTurn, maxTurn);
    koi.heading += turnStep;
    koi.turn += (turnStep / dt - koi.turn) * Math.min(1, dt * TURN_SMOOTHING);

    // Burst-and-coast: the tail beats hard for a while, then the koi glides with a still tail.
    koi.burstClock += dt * BURST_RATE;
    const beatTarget = steer.urgent ? 1 : COAST_BEAT + (1 - COAST_BEAT) * Math.max(0, Math.sin(koi.burstClock));
    koi.beat += (beatTarget - koi.beat) * Math.min(1, dt * BEAT_SMOOTHING);
    const pace = steer.urgent ? steer.pace : steer.pace * (COAST_PACE + BURST_PACE_GAIN * koi.beat);
    koi.speed += (pace - koi.speed) * Math.min(1, dt * 1.8);
    koi.phase += dt * (TAIL_RATE.rest + (TAIL_RATE.burst - TAIL_RATE.rest) * koi.beat);
    koi.finPhase += dt * FIN_RATE;
    shedSwimRipple(koi, dt);

    koi.x = clamp(koi.x + Math.cos(koi.heading) * koi.speed * dt, KOI_EDGE_MARGIN_PX, Math.max(KOI_EDGE_MARGIN_PX, state.width - KOI_EDGE_MARGIN_PX));
    koi.y = clamp(koi.y + Math.sin(koi.heading) * koi.speed * dt, KOI_EDGE_MARGIN_PX, Math.max(KOI_EDGE_MARGIN_PX, state.height - KOI_EDGE_MARGIN_PX));
    followSpine(koi);
  }

  // A swimming koi disturbs the surface: it sheds a small ring from its tail every so often.
  function shedSwimRipple(koi: Koi, dt: number) {
    koi.nextRipple -= dt;
    if (koi.nextRipple > 0 || koi.beat < SWIM_RIPPLE_MIN_BEAT) return;
    const tail = koi.spine[SPINE_SEGMENTS - 1];
    addRipple(tail.x, tail.y, SWIM_RIPPLE_STRENGTH);
    koi.nextRipple = SWIM_RIPPLE_INTERVAL_SECONDS.min + Math.random() * SWIM_RIPPLE_INTERVAL_SECONDS.spread;
  }

  function followSpine(koi: Koi) {
    const segmentLength = koi.bodyLength / (SPINE_SEGMENTS - 1);
    koi.spine[0].x = koi.x;
    koi.spine[0].y = koi.y;
    for (let i = 1; i < SPINE_SEGMENTS; i++) {
      const leader = koi.spine[i - 1], follower = koi.spine[i];
      let angle = Math.atan2(follower.y - leader.y, follower.x - leader.x);
      if (i >= 2) {
        // Keep each segment within MAX_JOINT_BEND of the one before it.
        const before = koi.spine[i - 2];
        const lead = Math.atan2(leader.y - before.y, leader.x - before.x);
        angle = lead + clamp(wrapAngle(angle - lead), -MAX_JOINT_BEND, MAX_JOINT_BEND);
      }
      follower.x = leader.x + Math.cos(angle) * segmentLength;
      follower.y = leader.y + Math.sin(angle) * segmentLength;
    }
  }

  /* ── Food, ripples and bites ── */
  function spawnFood(x: number, y: number) {
    addRipple(x, y, CLICK_RIPPLE_STRENGTH);
    const room = MAX_PELLETS - state.pellets.length;
    const count = Math.min(PELLETS_PER_CLICK.min + Math.floor(Math.random() * PELLETS_PER_CLICK.spread), room);
    for (let i = 0; i < count; i++) {
      state.pellets.push({
        x: x + (Math.random() - 0.5) * PELLET_SCATTER_PX.x,
        y: y + (Math.random() - 0.5) * PELLET_SCATTER_PX.y,
        // Each pellet lands a beat after the last, after a short fall.
        born: state.time + PELLET_FALL_SECONDS + i * PELLET_DROP_STAGGER_SECONDS,
        eaten: false,
      });
    }
  }

  function eatPellet(pellet: Pellet) {
    pellet.eaten = true;
    addRipple(pellet.x, pellet.y, EAT_RIPPLE_STRENGTH);
    state.bites.push({ x: pellet.x, y: pellet.y, born: state.time });
    state.fed += 1;
    if (fedEl) fedEl.textContent = String(state.fed);
  }

  function addRipple(x: number, y: number, strength: number) {
    state.ripples.push({ x, y, born: state.time, strength });
  }

  function updateWorld(dt: number) {
    state.time += dt;
    state.pointer.speed *= 1 - Math.min(1, dt * 6);
    state.koi.forEach((koi) => updateKoi(koi, dt));
    state.pellets = state.pellets.filter((pellet) => !pellet.eaten && state.time - pellet.born < PELLET_LIFE_SECONDS);
    state.ripples = state.ripples.filter((ripple) => state.time - ripple.born < RIPPLE_LIFE_SECONDS);
    state.bites = state.bites.filter((bite) => state.time - bite.born < BITE_LIFE_SECONDS);
    updateAmbient(dt);
  }

  /* ── Loop and lifecycle ── */
  function frame(now: number) {
    state.rafId = 0;
    if (!state.visible || document.hidden) return;
    const frameSeconds = clamp((now - state.lastFrameAt) / 1000, 0, MAX_FRAME_SECONDS);
    state.accumulator += frameSeconds;
    state.lastFrameAt = now;
    let steps = 0;
    while (state.accumulator >= STEP_SECONDS && steps < MAX_STEPS_PER_FRAME) {
      updateWorld(STEP_SECONDS);
      state.accumulator -= STEP_SECONDS;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) state.accumulator = 0;
    state.frames += 1;
    if (state.frames % MEASURE_EVERY_FRAMES === 0) measureBoxes();
    // Queue the next frame first, so one failed render cannot stop the animation for good.
    state.rafId = requestAnimationFrame(frame);
    safeRender(frameSeconds);
  }

  let renderErrorLogged = false;
  function safeRender(seconds: number) {
    try {
      renderer.render(state, seconds);
    } catch (error) {
      if (renderErrorLogged) return;
      renderErrorLogged = true;
      console.error('[koi] render failed, continuing', error);
    }
  }

  function schedule() {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    if (hintEl) hintEl.hidden = reducedMotion.matches;
    if (!state.visible || document.hidden) return;
    if (reducedMotion.matches) {
      measureBoxes();
      safeRender(STILL_FRAME_SECONDS);
      return;
    }
    state.lastFrameAt = performance.now();
    state.rafId = requestAnimationFrame(frame);
  }

  /* ── Input ── */
  function toCanvasPoint(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerMove(event: PointerEvent) {
    const pointer = state.pointer;
    const point = toCanvasPoint(event);
    const now = performance.now();
    if (pointer.active && now > pointer.at) {
      pointer.speed = (Math.hypot(point.x - pointer.x, point.y - pointer.y) / (now - pointer.at)) * 1000;
    }
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.at = now;
    pointer.active = true;
  }

  function onClick(event: MouseEvent) {
    if (reducedMotion.matches || (event.target as Element).closest('a, button, [data-koi-ignore]')) return;
    if (!window.getSelection()?.isCollapsed) return;
    const point = toCanvasPoint(event);
    // The top of the canvas is masked out by CSS, so food dropped there would be invisible.
    if (point.y < MASK_FADE_PX) return;
    spawnFood(point.x, point.y);
  }

  const onPointerLeave = () => { state.pointer.active = false; };
  // Scrolling moves the page under a still cursor without a pointermove, which would leave a stale target.
  const onScroll = () => { state.pointer.active = false; };
  aquarium.addEventListener('pointermove', onPointerMove, { passive: true });
  aquarium.addEventListener('pointerleave', onPointerLeave);
  aquarium.addEventListener('click', onClick);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  const stopWatchingMotion = onMediaChange(reducedMotion, schedule);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(aquarium);
  const intersectionObserver = new IntersectionObserver((entries) => {
    // Entries are queued oldest first; the last one is the current state.
    state.visible = entries[entries.length - 1].isIntersecting;
    schedule();
  });
  intersectionObserver.observe(aquarium);

  // Web fonts reflow the text the koi fade under, so re-measure once they have loaded.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (destroyed) return;
      measureBoxes();
      placeLilies();
      if (reducedMotion.matches) safeRender(STILL_FRAME_SECONDS);
    });
  }

  resize();

  return () => {
    destroyed = true;
    cancelAnimationFrame(state.rafId);
    aquarium.removeEventListener('pointermove', onPointerMove);
    aquarium.removeEventListener('pointerleave', onPointerLeave);
    aquarium.removeEventListener('click', onClick);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', schedule);
    stopWatchingMotion();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
  };
}
