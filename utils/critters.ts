/**
 * The "critters" style: a little seeded creature, drawn head-and-shoulders
 * against a pastel backdrop. Every name hatches its own critter from a handful
 * of parts — a body, something on top of its head, eyes, a mouth, and the odd
 * blush or belly patch.
 *
 * Like glass, it comes out as plain data — a list of primitive layers — that
 * the avatar route paints, so the SVG and the PNG come off one tree.
 */
import color from 'tinycolor2'
import { makePrng } from './glass'

/** The side of the box the critter is drawn in, before any scaling. */
export const CRITTER_VIEWPORT = 100

/** Soft backdrops, light enough that any body colour reads against them. */
export const CRITTER_BACKGROUNDS = [
  '#fde2e4',
  '#fff1c1',
  '#dff5e1',
  '#d8f1ff',
  '#e4e1ff',
  '#ffe5d0',
  '#f1e4ff',
  '#d5f5f0',
] as const

/** Body colours: saturated, friendly, and never too dark for the face. */
export const CRITTER_BODIES = [
  '#ff8a5b',
  '#ffc145',
  '#7bd389',
  '#4cc9f0',
  '#5e7bff',
  '#9b7bff',
  '#ff6fb5',
  '#ff5e6c',
  '#2ec4b6',
  '#a3d65c',
  '#c084fc',
  '#f4a259',
] as const

/** Eyes, mouths and antennae. */
const INK = '#2b2140'
const WHITE = '#ffffff'
const BLUSH = '#ff7a90'
const HORN = '#f3d38b'
const LEAF = '#4fbf63'

/** One drawable primitive, in viewport units. */
export type CritterLayer =
  | {
      kind: 'path'
      d: string
      fill?: string
      stroke?: string
      strokeWidth?: number
      opacity?: number
    }
  | {
      kind: 'circle'
      cx: number
      cy: number
      r: number
      fill: string
      opacity?: number
    }
  | {
      kind: 'ellipse'
      cx: number
      cy: number
      rx: number
      ry: number
      fill: string
      opacity?: number
      rotate?: number
    }

export type CritterArtwork = {
  /** The backdrop, as `#rrggbb`. */
  background: string
  /** Back to front. Some run past the bottom edge and are clipped there. */
  layers: CritterLayer[]
}

/**
 * Body silhouettes. Each runs off the bottom of the viewport so the critter
 * reads as a bust, and carries where its head tops out, where its face sits,
 * and how far apart its ears go.
 */
const BODIES = [
  {
    // A tombstone-ish blob.
    d: 'M18 112V52C18 30 32 22 50 22S82 30 82 52V112Z',
    top: 22,
    face: 54,
    spread: 20,
    eyeGap: 10,
  },
  {
    // Round as a bun.
    d: 'M16 112V66A34 34 0 0 1 84 66V112Z',
    top: 32,
    face: 62,
    spread: 20,
    eyeGap: 10,
  },
  {
    // Tall and narrow, like a bean.
    d: 'M27 112V44C27 26 37 16 50 16S73 26 73 44V112Z',
    top: 16,
    face: 46,
    spread: 13,
    eyeGap: 8,
  },
  {
    // Short and wide, like a toad.
    d: 'M8 112V72C8 47 27 37 50 37S92 47 92 72V112Z',
    top: 37,
    face: 64,
    spread: 26,
    eyeGap: 12,
  },
] as const

type Body = (typeof BODIES)[number]

const TOPS = ['none', 'cat', 'bunny', 'bear', 'antennae', 'horns', 'sprout'] as const
const EYES = ['dot', 'googly', 'happy', 'sleepy', 'cyclops', 'three'] as const
const MOUTHS = ['smile', 'grin', 'fang', 'cat', 'o', 'flat'] as const

/** Mirror a left-hand x coordinate across the centre line. */
const mirror = (x: number) => CRITTER_VIEWPORT - x

/** Whatever sits on the critter's head — drawn behind the body. */
function topLayers(
  kind: (typeof TOPS)[number],
  body: Body,
  fill: string,
  shade: string,
  accent: string
): CritterLayer[] {
  const { top, spread } = body
  const layers: CritterLayer[] = []

  for (const side of [-1, 1]) {
    const x = (n: number) => (side < 0 ? n : mirror(n))
    const l = 50 - spread
    switch (kind) {
      case 'cat':
        layers.push(
          { kind: 'path', d: `M${x(l - 9)} ${top + 16}L${x(l - 4)} ${top - 12}L${x(l + 12)} ${top + 6}Z`, fill },
          { kind: 'path', d: `M${x(l - 4)} ${top + 10}L${x(l - 2)} ${top - 4}L${x(l + 6)} ${top + 6}Z`, fill: shade }
        )
        break
      case 'bunny':
        layers.push(
          { kind: 'ellipse', cx: x(l + 4), cy: top - 10, rx: 6.5, ry: 18, fill, rotate: side * -10 },
          { kind: 'ellipse', cx: x(l + 4), cy: top - 9, rx: 3, ry: 12, fill: shade, rotate: side * -10 }
        )
        break
      case 'bear':
        layers.push(
          { kind: 'circle', cx: x(l), cy: top + 4, r: 9, fill },
          { kind: 'circle', cx: x(l), cy: top + 4, r: 5, fill: shade }
        )
        break
      case 'antennae':
        layers.push(
          {
            kind: 'path',
            d: `M${x(46)} ${top + 4}Q${x(44)} ${top - 6} ${x(38)} ${top - 13}`,
            stroke: INK,
            strokeWidth: 2,
          },
          { kind: 'circle', cx: x(38), cy: top - 13, r: 4, fill: accent }
        )
        break
      case 'horns':
        layers.push({
          kind: 'path',
          d: `M${x(l + 2)} ${top + 8}Q${x(l - 2)} ${top - 6} ${x(l + 4)} ${top - 14}Q${x(l + 6)} ${top - 2} ${x(l + 12)} ${top + 8}Z`,
          fill: HORN,
        })
        break
    }
  }

  if (kind === 'sprout') {
    layers.push(
      { kind: 'path', d: `M50 ${top + 4}V${top - 9}`, stroke: LEAF, strokeWidth: 2.2 },
      { kind: 'ellipse', cx: 44, cy: top - 11, rx: 6.5, ry: 3.5, fill: LEAF, rotate: 25 },
      { kind: 'ellipse', cx: 56, cy: top - 11, rx: 6.5, ry: 3.5, fill: LEAF, rotate: -25 }
    )
  }

  return layers
}

/** One googly eye: a white with a pupil looking off somewhere. */
function googly(cx: number, cy: number, r: number, look: [number, number]): CritterLayer[] {
  const reach = r * 0.35
  const px = cx + look[0] * reach
  const py = cy + look[1] * reach
  return [
    { kind: 'circle', cx, cy, r, fill: WHITE },
    { kind: 'circle', cx: px, cy: py, r: r * 0.5, fill: INK },
    { kind: 'circle', cx: px + r * 0.18, cy: py - r * 0.18, r: r * 0.16, fill: WHITE },
  ]
}

function dot(cx: number, cy: number, r = 4): CritterLayer[] {
  return [
    { kind: 'circle', cx, cy, r, fill: INK },
    { kind: 'circle', cx: cx + r * 0.35, cy: cy - r * 0.35, r: r * 0.32, fill: WHITE },
  ]
}

function eyeLayers(
  kind: (typeof EYES)[number],
  body: Body,
  look: [number, number]
): CritterLayer[] {
  const y = body.face - 6
  const gap = body.eyeGap
  const [l, r] = [50 - gap, 50 + gap]
  const lid = (d: string): CritterLayer => ({ kind: 'path', d, stroke: INK, strokeWidth: 2.4 })

  switch (kind) {
    case 'dot':
      return [...dot(l, y), ...dot(r, y)]
    case 'googly':
      return [...googly(l, y, 6.5, look), ...googly(r, y, 6.5, look)]
    case 'happy':
      return [l, r].map((x) => lid(`M${x - 4.5} ${y + 2}Q${x} ${y - 5} ${x + 4.5} ${y + 2}`))
    case 'sleepy':
      return [l, r].map((x) => lid(`M${x - 4.5} ${y - 1}Q${x} ${y + 4} ${x + 4.5} ${y - 1}`))
    case 'cyclops':
      return googly(50, y - 1, 10, look)
    case 'three':
      return [...dot(l - 1, y + 1, 3.4), ...dot(50, y - 4, 3.4), ...dot(r + 1, y + 1, 3.4)]
  }
}

function mouthLayers(kind: (typeof MOUTHS)[number], body: Body): CritterLayer[] {
  const y = body.face + 8
  const line = (d: string): CritterLayer => ({ kind: 'path', d, stroke: INK, strokeWidth: 2.4 })

  switch (kind) {
    case 'smile':
      return [line(`M43 ${y}Q50 ${y + 7} 57 ${y}`)]
    case 'grin':
      return [
        { kind: 'path', d: `M41 ${y - 1}Q50 ${y + 14} 59 ${y - 1}Z`, fill: INK },
        { kind: 'ellipse', cx: 50, cy: y + 4.5, rx: 4.5, ry: 2.5, fill: BLUSH },
      ]
    case 'fang':
      return [
        line(`M42 ${y}Q50 ${y + 7} 58 ${y}`),
        { kind: 'path', d: `M45 ${y + 2.6}L47 ${y + 7}L49 ${y + 3.4}Z`, fill: WHITE },
      ]
    case 'cat':
      return [line(`M43 ${y}Q46.5 ${y + 4.5} 50 ${y}Q53.5 ${y + 4.5} 57 ${y}`)]
    case 'o':
      return [{ kind: 'ellipse', cx: 50, cy: y + 2, rx: 3, ry: 3.6, fill: INK }]
    case 'flat':
      return [line(`M45 ${y + 1}H55`)]
  }
}

export function generateCritter(seed: string): CritterArtwork {
  const prng = makePrng(`critter:${seed}`)

  // Order matters: every draw advances one shared stream, so moving or adding
  // a call re-rolls every critter downstream of it.
  const background = prng.pick(CRITTER_BACKGROUNDS)
  const fill = prng.pick(CRITTER_BODIES)
  const body = prng.pick(BODIES)
  const top = prng.pick(TOPS)
  const eyes = prng.pick(EYES)
  const mouth = prng.pick(MOUTHS)
  const look: [number, number] = [prng.integer(-2, 2) / 2, prng.integer(-2, 2) / 2]
  const blush = prng.integer(0, 9) < 6
  const belly = prng.integer(0, 1) === 1
  const accent = prng.pick(CRITTER_BODIES)

  const shade = color(fill).darken(12).toHexString()
  const tint = color(fill).lighten(14).toHexString()

  const layers: CritterLayer[] = [
    ...topLayers(top, body, fill, shade, accent),
    { kind: 'path', d: body.d, fill },
  ]
  if (belly) {
    layers.push({ kind: 'ellipse', cx: 50, cy: body.face + 42, rx: body.spread + 6, ry: 22, fill: tint })
  }
  if (blush) {
    for (const x of [50 - body.eyeGap - 7, 50 + body.eyeGap + 7]) {
      layers.push({ kind: 'ellipse', cx: x, cy: body.face + 4, rx: 4.5, ry: 2.8, fill: BLUSH, opacity: 0.5 })
    }
  }
  layers.push(...eyeLayers(eyes, body, look), ...mouthLayers(mouth, body))

  return { background, layers }
}
