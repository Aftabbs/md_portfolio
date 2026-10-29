export interface SpinePoint {
  x: number
  y: number
}

export interface Koi {
  id: number
  variety: number
  baseLength: number
  bodyLength: number
  x: number
  y: number
  heading: number
  speed: number
  wander: number
  startle: number
  turn: number
  phase: number
  finPhase: number
  burstClock: number
  beat: number
  depth: number
  cruise: number
  spine: SpinePoint[]
  nextRipple: number
  chaseSeconds: number
}

export interface Pellet {
  x: number
  y: number
  /** When the pellet lands; until then it is still falling and cannot be eaten. */
  born: number
  eaten: boolean
}

export interface Ripple {
  x: number
  y: number
  born: number
  strength: number
}

export interface Bite {
  x: number
  y: number
  born: number
}

export interface Mote {
  x: number
  y: number
  vx: number
  phase: number
  glyph: string
}

export interface Bubble {
  x: number
  y: number
  speed: number
  sway: number
  glyph: string
}

export interface Pointer {
  x: number
  y: number
  active: boolean
  speed: number
  at: number
}

/** Everything the renderer reads each frame. */
export interface KoiWorld {
  koi: Koi[]
  pellets: Pellet[]
  ripples: Ripple[]
  bites: Bite[]
  shimmer: Mote[]
  bubbles: Bubble[]
  pointer: Pointer
  time: number
}

/** A lily pad, optionally carrying a lotus (flower 0 means none). */
export interface Pad {
  x: number
  y: number
  radius: number
  scale: number
  seed: number
  notch: number
  teal: boolean
  flower: number
}

/** Live view of the renderer's cell grid, for plug-in layers. */
export interface GridView {
  readonly cols: number
  readonly rows: number
  readonly cellWidth: number
  readonly cellHeight: number
  readonly cellDim: Float32Array
  readonly energy: Float32Array
}

/** A rectangle in canvas coordinates that koi fade beneath. */
export interface Box {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}
