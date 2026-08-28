/**
 * The "orb" style: the look the orb playground in `aiellie/images` mints for a
 * seed, as plain data the avatar route paints — so the SVG and the PNG come
 * off one tree, the way `glass` does.
 *
 * The *recipe* is a port of that project's `configFromSeed`: the same FNV-1a
 * hash, the same mulberry32 stream, the same roll order, the same value ranges
 * and the same palette formula. Seed both with `ellie` and they agree on the
 * colours, the shape and the grain.
 *
 * The *drawing* is an interpretation. The playground runs a Warp fragment
 * shader per pixel, which is neither an SVG nor cheap enough for an edge
 * route, so the numbers it rolls are spent on a colour ramp and a handful of
 * organic regions poured over it instead: `rotation` sets the ramp's axis,
 * `shape` and `shapeScale` and `scale` decide how many regions there are,
 * `distortion` and `swirl` how far they wander, `offsetX`/`offsetY` where they
 * sit, and `softness` how hard their edges are. Same seed, same colours and
 * the same mood — not the same pixels.
 */

export type OrbShape = 'checks' | 'stripes' | 'edge'

export type OrbColors = {
  color1: string
  color2: string
  color3: string
}

export type OrbValues = {
  proportion: number
  softness: number
  distortion: number
  swirl: number
  swirlIterations: number
  shapeScale: number
  speed: number
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

export type OrbConfig = {
  colors: OrbColors
  shape: OrbShape
  values: OrbValues
  grain: number
}

/** The palettes the playground ships under a name: seed with one to get it. */
export const ORB_PRESETS: Record<string, OrbColors> = {
  aiellie: { color1: '#a5b4fc', color2: '#e0e7ff', color3: '#4f46e5' },
  openai: { color1: '#10a37f', color2: '#d1f5e9', color3: '#0b7a5f' },
  google: { color1: '#4285f4', color2: '#fce8e6', color3: '#ea4335' },
  anthropic: { color1: '#d97757', color2: '#f5efe6', color3: '#8c4a2f' },
  x: { color1: '#71767b', color2: '#e7e9ea', color3: '#0f1419' },
  deepseek: { color1: '#4d6bfe', color2: '#e3e9ff', color3: '#1c2f9e' },
}

/** Shapes in the order a seed rolls them. */
const SHAPES = [
  'checks',
  'stripes',
  'edge',
] as const satisfies readonly OrbShape[]

const DEFAULT_SHAPE: OrbShape = 'edge'
const DEFAULT_GRAIN = 0

/** What a preset name renders with — the playground's own starting look. */
const DEFAULT_VALUES: OrbValues = {
  proportion: 0.35,
  softness: 1,
  distortion: 0.32,
  swirl: 1,
  swirlIterations: 0,
  shapeScale: 0,
  speed: 12.2,
  scale: 0.31,
  rotation: 176,
  offsetX: 0.65,
  offsetY: 0.09,
}

type ValueDef = {
  key: keyof OrbValues
  min: number
  max: number
  step: number
  decimals: number
  /**
   * Narrower bounds a *rolled* value stays inside. The playground's sliders
   * reach further, but the extremes (scale 4, speed 30) wash the orb out, so
   * seeded looks stay in the range that still reads as one.
   */
  seedRange?: [number, number]
}

/** The roll order. Moving or adding an entry re-mints every seeded orb. */
const VALUE_DEFS: readonly ValueDef[] = [
  { key: 'proportion', min: 0, max: 1, step: 0.01, decimals: 2, seedRange: [0.2, 0.8] },
  { key: 'softness', min: 0, max: 1, step: 0.01, decimals: 2, seedRange: [0.3, 1] },
  { key: 'distortion', min: 0, max: 1, step: 0.01, decimals: 2, seedRange: [0.05, 0.6] },
  { key: 'swirl', min: 0, max: 1, step: 0.01, decimals: 2, seedRange: [0.2, 1] },
  { key: 'swirlIterations', min: 0, max: 20, step: 1, decimals: 0, seedRange: [0, 6] },
  { key: 'shapeScale', min: 0, max: 1, step: 0.01, decimals: 2, seedRange: [0, 0.6] },
  { key: 'speed', min: 0, max: 30, step: 0.1, decimals: 1, seedRange: [4, 18] },
  { key: 'scale', min: 0.01, max: 4, step: 0.01, decimals: 2, seedRange: [0.15, 1.2] },
  { key: 'rotation', min: 0, max: 360, step: 1, decimals: 0 },
  { key: 'offsetX', min: -1, max: 1, step: 0.01, decimals: 2, seedRange: [-0.8, 0.8] },
  { key: 'offsetY', min: -1, max: 1, step: 0.01, decimals: 2, seedRange: [-0.8, 0.8] },
]

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Where `value` sits between `low` and `high`, as 0–1. */
const norm = (value: number, low: number, high: number) =>
  clamp((value - low) / (high - low), 0, 1)

/** FNV-1a — small, fast, and stable across runs, so a name always maps to the
 * same look. The gradient style hashes with `crypto.subtle` and glass with
 * xmur3; each style keeps its own, so a name lands on unrelated colours in
 * all three. */
function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** mulberry32 — a tiny deterministic PRNG seeded by `hashSeed`. */
function createRng(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One value per control, stepped and rounded exactly as the playground's
 * sliders would report it. */
function randomValues(rng: () => number): OrbValues {
  const values = {} as OrbValues
  for (const def of VALUE_DEFS) {
    const [low, high] = def.seedRange ?? [def.min, def.max]
    const raw = low + rng() * (high - low)
    const stepped =
      Math.round((raw - def.min) / def.step) * def.step + def.min
    values[def.key] = Number(
      clamp(stepped, def.min, def.max).toFixed(def.decimals)
    )
  }
  return values
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

/** A palette shaped like the built-in presets: a light accent, a near-white
 * wash, and a saturated deep tone from a neighbouring hue. */
function colorsFromRng(rng: () => number): OrbColors {
  const hue = Math.floor(rng() * 360)
  const spread = 20 + Math.floor(rng() * 60)
  return {
    color1: hslToHex(hue, 90, 76),
    color2: hslToHex((hue + spread) % 360, 100, 93),
    color3: hslToHex((hue + 360 - spread) % 360, 72, 45),
  }
}

/** A name is the whole recipe: preset names resolve to their preset, and
 * anything else is hashed into a look that never changes for that name. */
export function configFromSeed(text: string): OrbConfig {
  const name = text.trim().toLowerCase()

  const preset = ORB_PRESETS[name]
  if (preset) {
    return {
      colors: preset,
      shape: DEFAULT_SHAPE,
      values: DEFAULT_VALUES,
      grain: DEFAULT_GRAIN,
    }
  }

  const rng = createRng(hashSeed(name))
  // Order matters: one shared stream feeds every draw below.
  const values = randomValues(rng)
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)]
  const colors = colorsFromRng(rng)
  // Rolled last, so earlier rolls keep matching looks minted before grain
  // existed. Nothing here paints it — see the note on `generateOrb` — but it is
  // part of the recipe, and a recipe with a roll missing is a different one.
  const grain = Math.round(rng() * 50) / 100

  return { colors, shape, values, grain }
}

/* ------------------------------------------------------------- the drawing */

/** The side of the box every coordinate below is expressed in. */
export const ORB_VIEWPORT = 100

/** One organic region of colour, laid over the ramp. */
export type OrbLayer = {
  /** A closed loop, in viewport units. */
  path: string
  color: string
}

export type OrbArtwork = {
  /** The field the layers are laid over: one ramp across the whole box. */
  ramp: {
    from: string
    mid: string
    to: string
    /** Where the middle colour sits, 0–1. */
    midpoint: number
    /** Degrees, clockwise from "left to right". */
    angle: number
  }
  /**
   * Painted biggest first, so they nest. They are softened *together*, by one
   * blur over the stack rather than one per layer — three filter surfaces at
   * 2048px cost seconds, and one composite reads better anyway.
   */
  layers: OrbLayer[]
  /** `stdDeviation` for that blur, in viewport units. */
  blur: number
  /** The sheen that makes the whole thing read as a sphere. */
  highlight: { x: number; y: number; r: number; opacity: number }
  /** How dark the rim goes, 0–1. */
  shade: number
}

const TAU = Math.PI * 2

/** Trimmed to a tenth of a viewport unit — past that it is only bytes. */
const round = (value: number) => Math.round(value * 10) / 10

/**
 * A closed organic loop: a circle whose radius wanders on three harmonics,
 * drawn through twelve points as a Catmull-Rom spline. Sampling the wander
 * rather than placing control points by hand is what keeps the shapes looking
 * poured instead of drawn.
 */
function blobPath(
  cx: number,
  cy: number,
  radius: number,
  wobble: number,
  /** Drawn out this much along `angle`, and squeezed the same across it. */
  stretch: number,
  angle: number,
  rng: () => number
): string {
  const cosA = Math.cos((angle * Math.PI) / 180)
  const sinA = Math.sin((angle * Math.PI) / 180)
  const harmonics = [
    { k: 2, amp: 0.34 + 0.3 * rng(), phase: rng() * TAU },
    { k: 3, amp: 0.22 + 0.24 * rng(), phase: rng() * TAU },
    { k: 5, amp: 0.1 + 0.14 * rng(), phase: rng() * TAU },
  ]

  const count = 12
  const points: [number, number][] = []
  for (let i = 0; i < count; i++) {
    const step = (i / count) * TAU
    let r = 1
    for (const h of harmonics) {
      r += wobble * h.amp * Math.sin(h.k * step + h.phase)
    }
    r = Math.max(r, 0.25)
    // Stretch along the ramp's axis, then put the axis back where it was.
    const along = Math.cos(step) * radius * r * stretch
    const across = (Math.sin(step) * radius * r) / stretch
    points.push([
      cx + along * cosA - across * sinA,
      cy + along * sinA + across * cosA,
    ])
  }

  // Catmull-Rom through every point, as cubics: the tangent at each knot is a
  // sixth of the span between its neighbours.
  const at = (i: number) => points[(i + count) % count]
  let d = `M${round(points[0][0])} ${round(points[0][1])}`
  for (let i = 0; i < count; i++) {
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i)
    const [x2, y2] = at(i + 1)
    const [x3, y3] = at(i + 2)
    d +=
      `C${round(x1 + (x2 - x0) / 6)} ${round(y1 + (y2 - y0) / 6)}` +
      ` ${round(x2 - (x3 - x1) / 6)} ${round(y2 - (y3 - y1) / 6)}` +
      ` ${round(x2)} ${round(y2)}`
  }
  return `${d}Z`
}

/**
 * How many times the shader's colour ramp repeats across the orb, worked out
 * from the same terms its pattern branch uses: the field spans `1.4 / scale`
 * shader units, `stripes` cycles at `2 · shapeScale` and `checks` at
 * `(0.5 + 3.5 · shapeScale) / 2π`, and `edge` is a single ramp end to end.
 * Most names land under two — which is why so few orbs look busy.
 */
function cyclesOf(shape: OrbShape, v: OrbValues): number {
  const field = 1.4 / v.scale
  const cycles =
    shape === 'edge'
      ? 1
      : shape === 'stripes'
        ? field * 2 * v.shapeScale
        : (field * (0.5 + 3.5 * v.shapeScale)) / TAU
  return clamp(cycles, 0.6, 5)
}

/**
 * How far the shader pushes the field around, as a fraction of the orb: the
 * noise displacement, plus one term per swirl fold. Names that roll a lot of
 * both come out marbled; the rest stay in broad regions.
 */
function driftOf(v: OrbValues): number {
  let drift = 2.86 * v.distortion * v.scale
  for (let i = 1; i < v.swirlIterations; i++) {
    drift += ((v.swirl / i) * v.scale) / 1.4
  }
  return clamp(drift, 0.05, 0.8)
}

function artworkFor(config: OrbConfig): OrbArtwork {
  const { colors, shape, values: v } = config
  const palette = [colors.color1, colors.color2, colors.color3]
  const radians = (v.rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  // A higher `proportion` pushes the shader's field towards the far colour, so
  // the middle stop slides back to meet it.
  const midpoint = clamp(0.5 - 0.4 * (v.proportion - 0.5), 0.2, 0.8)

  const cycles = cyclesOf(shape, v)
  const drift = driftOf(v)

  // Its own stream, so the shapes can be rolled without disturbing the ported
  // one above. Seeded off the config rather than the name, so the preset
  // palettes — which share every value — also share one set of shapes, the way
  // they share one pattern in the playground.
  const rng = createRng(
    hashSeed(`${shape}:${VALUE_DEFS.map((def) => v[def.key]).join(',')}`)
  )

  // `softness` is how wide the shader blends one colour into the next: a low
  // roll gives crisp marbling, a high one a single soft wash.
  const blur = 1.5 + 8 * v.softness
  // Busy fields come out as ribbons; calm ones stay round.
  const stretch = 1.15 + 0.5 * norm(cycles, 0.6, 5)

  // One region per half cycle, so a busy field comes out banded and a calm one
  // is a couple of broad areas. Nothing smaller than the blur is worth
  // drawing — it would come out as a smudge of its own colour.
  const count = clamp(Math.round(cycles * 1.6) + 1, 2, 6)
  const layers: OrbLayer[] = []
  let cx = 50 + clamp(v.offsetX, -1, 1) * 18
  let cy = 50 - clamp(v.offsetY, -1, 1) * 18
  let radius = 48
  for (let i = 0; i < count && radius > blur * 1.6; i++) {
    // Ping-pong down the palette: deep, wash, accent, wash, deep — the order
    // the shader's ramp runs in as its field rises and falls.
    const step = i % 4
    layers.push({
      path: blobPath(
        cx,
        cy,
        radius,
        0.26 + 0.55 * drift,
        stretch,
        v.rotation,
        rng
      ),
      color: palette[step === 3 ? 1 : 2 - step],
    })
    // Each region sits inside the last but wanders off its centre, so they read
    // as poured rather than as rings on a target.
    const wander = radius * (0.35 + 0.5 * drift)
    cx += (rng() * 2 - 1) * wander
    cy += (rng() * 2 - 1) * wander
    radius *= 0.78
  }

  return {
    ramp: {
      from: colors.color1,
      mid: colors.color2,
      to: colors.color3,
      midpoint,
      angle: v.rotation,
    },
    layers,
    blur,
    // The sheen sits at the light end of the ramp, where colour 1 is.
    highlight: {
      x: 50 - cos * 20,
      y: 50 - sin * 20,
      r: 30 + 16 * v.softness,
      opacity: 0.16 + 0.14 * v.softness,
    },
    shade: 0.16 + 0.2 * (1 - v.softness),
  }
}

/**
 * The whole drawing for a name.
 *
 * Two of the rolled values have nothing to do here: `speed` is how fast the
 * playground's orb moves, and a still has no answer for that, and the grain
 * the recipe rolls last is left unpainted — an `feTurbulence` over a 2048px
 * avatar measured slower than everything else in the render put together.
 */
export function generateOrb(seed: string): OrbArtwork {
  return artworkFor(configFromSeed(seed))
}
