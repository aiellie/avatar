/**
 * The "glass" style: one vivid background hue with two soft, blurred,
 * screen-blended shapes layered over it. A port of DiceBear's Glass — same
 * palette, same glyph set, same seeded selection — as plain data the avatar
 * route paints, so the SVG and the PNG come off one tree.
 *
 * The shapes are the letters of the word "gradient", which is the set DiceBear
 * Glass ships.
 */

/**
 * The 35 background hues DiceBear Glass ships as its default `backgroundColor`
 * palette: evenly spaced around the wheel at a fixed vivid saturation and
 * lightness. Stored without the leading `#` to match the upstream schema.
 */
export const GLASS_COLORS = [
  'eb4747',
  'eb6247',
  'eb7e47',
  'eb9947',
  'ebb447',
  'ebd047',
  'ebeb47',
  'd0eb47',
  'b4eb47',
  '99eb47',
  '7eeb47',
  '62eb47',
  '47eb47',
  '47eb62',
  '47eb7e',
  '47eb99',
  '47ebb4',
  '47ebd0',
  '47ebeb',
  '47d0eb',
  '47b4eb',
  '4799eb',
  '477eeb',
  '4762eb',
  '4747eb',
  '6247eb',
  '7e47eb',
  '9947eb',
  'b447eb',
  'd047eb',
  'eb47eb',
  'eb47d0',
  'eb4799',
  'eb477e',
  'eb4762',
] as const

/** The eight glyphs the two glass shapes are drawn from — spelling "gradient". */
const SHAPES = ['g', 'r', 'a', 'd', 'i', 'e', 'n', 't'] as const
type Shape = (typeof SHAPES)[number]

/** Front-layer shape paths, drawn in a 150×150 box. */
const SHAPE1: Record<Shape, string> = {
  g: 'M101.6 51.1a20 20 0 0 0-14.7-14.5q-3.9-1-8.5-1.1-10 0-17 4.8A30 30 0 0 0 50.9 54q-3.6 9-3.6 21.6 0 12.8 3.5 21.8 3.4 9 10.3 14a29 29 0 0 0 17.2 4.8q9 0 15-2.6 6-2.7 9-7.5t3-11.4l6.8.7H78.7v-28h64.5v20q0 20-8.4 34.1a56 56 0 0 1-23.2 21.6Q97 150.6 78 150.6q-21.3 0-37.3-9t-25-25.8-9-39.7a87 87 0 0 1 5.4-32 67 67 0 0 1 38-38Q63 1 77.6 1q12.9 0 24 3.7 11.1 3.6 19.7 10.4a50 50 0 0 1 20.2 36z',
  r: 'M17.6 148.6V3h62.8q16.2 0 28.3 6 12 5.8 18.9 16.9a50 50 0 0 1 6.7 26.5q0 15.7-7 26.4A43 43 0 0 1 108 95q-12.5 5.5-29 5.5H41.3V69.9H71q7 0 11.8-1.7a15 15 0 0 0 7.6-5.6 17 17 0 0 0 2.7-10q0-6.3-2.7-10.2a15 15 0 0 0-7.6-5.8q-4.9-2-11.8-2H57v114zm85.2-66.8 36.4 66.8h-43L60.9 81.8z',
  a: 'M42.6 148.6H0L48 3h54l48 145.5h-42.7L75.5 43.2h-1.1zm-8-57.4h80.1v29.5h-80z',
  d: 'M67 148.6H11V3h55.4q22.5 0 38.8 8.7a60 60 0 0 1 25.3 25q9 16.4 9 39 0 22.8-9 39.1a61 61 0 0 1-25 25 81 81 0 0 1-38.5 8.7M50.5 115h15a44 44 0 0 0 18.5-3.4q7.6-3.6 11.6-12t4-23.8q0-15-4-23.7a24 24 0 0 0-12-12 47 47 0 0 0-19.2-3.5H50.5z',
  i: 'M94.8 3.1v145.5H55.3V3z',
  e: 'M22.2 148.6V3H127v32H61.7v25h59.9v31.8h-60v25h65.1v31.9z',
  n: 'M138 3.1v145.5h-33L52.5 72h-1v76.5H12.2V3h33.5l51.7 76.1h1.2v-76z',
  t: 'M11.7 35V3h126.5v32H94.4v113.7h-39V34.9z',
}

/** Back-layer shape paths (subtly offset variants of the front glyphs). */
const SHAPE2: Record<Shape, string> = {
  g: 'M101.6 51.2a20 20 0 0 0-14.7-14.5q-3.9-1-8.5-1-10 0-17 4.7A30 30 0 0 0 50.9 54q-3.6 9-3.6 21.6 0 12.8 3.5 21.8 3.4 9 10.3 14a29 29 0 0 0 17.2 4.8q9 0 15-2.6 6-2.7 9-7.5t3-11.4l6.8.7H78.7v-28h64.5v20q0 20-8.4 34.1a56 56 0 0 1-23.2 21.6Q97 150.7 78 150.7q-21.3 0-37.3-9t-25-25.8q-9-16.5-9-39.7a87 87 0 0 1 5.4-32 67 67 0 0 1 38-38q12.9-5 27.6-5 12.9 0 24 3.7 11.1 3.6 19.7 10.4a50 50 0 0 1 20.2 36z',
  r: 'M17.6 148.7V3.2h62.8q16.2 0 28.3 6 12 5.8 18.9 16.9a50 50 0 0 1 6.7 26.6q0 15.6-7 26.3A43 43 0 0 1 108 95.2q-12.5 5.5-29 5.5H41.3V70H71q7 0 11.8-1.7a15 15 0 0 0 7.6-5.6 17 17 0 0 0 2.7-10q0-6.3-2.7-10.2a15 15 0 0 0-7.6-5.8q-4.9-2-11.8-2H57v114zm85.2-66.8 36.4 66.8h-43L60.9 81.9z',
  a: 'M42.6 148.7H0L48 3.2h54l48 145.5h-42.7L75.5 43.3h-1.1zm-8-57.4h80.1v29.5h-80z',
  d: 'M67 148.7H11V3.2h55.4q22.5 0 38.8 8.8a60 60 0 0 1 25.3 25q9 16.2 9 39 0 22.6-9 39a61 61 0 0 1-25 25 81 81 0 0 1-38.5 8.7m-16.5-33.5h15a44 44 0 0 0 18.5-3.5q7.6-3.5 11.6-12t4-23.8q0-15-4-23.7a24 24 0 0 0-12-12 47 47 0 0 0-19.2-3.5H50.5z',
  i: 'M94.8 3.2v145.5H55.3V3.2z',
  e: 'M22.2 148.7V3.2H127V35H61.7v25h59.9v32h-60v25h65.1v31.8z',
  n: 'M138 3.2v145.5h-33L52.5 72.3h-1v76.4H12.2V3.2h33.5l51.7 76.2h1.2V3.2z',
  t: 'M11.7 35V3.2h126.5V35H94.4v113.7h-39V35z',
}

/**
 * A small seeded PRNG (xmur3 seed → mulberry32 stream) with the `pick` /
 * `integer` helpers DiceBear-style component selection needs. Deterministic:
 * the same seed always yields the same sequence.
 *
 * The gradient style hashes with `crypto.subtle` instead, so the two styles do
 * not land a given name on the same hue — they are separate looks, not two
 * renderings of one palette.
 */
export function makePrng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = (h ^ (h >>> 16)) >>> 0 || 1
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)]
    },
    integer(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1))
    },
  }
}

/** One blurred glyph, placed inside DiceBear's 150×150 shape box. */
export type GlassShape = {
  path: string
  offsetX: number
  offsetY: number
  rotation: number
}

export type GlassArtwork = {
  /** The background hue, as `#rrggbb`. */
  background: string
  /** Drawn first, from the back-layer glyph set. */
  back: GlassShape
  /** Drawn over it, from the front-layer set. */
  front: GlassShape
}

/** The side of the box the shape paths are drawn in. */
export const GLASS_SHAPE_BOX = 150

/** The side of the box the shapes are *placed* in, before any scaling. */
export const GLASS_VIEWPORT = 100

/** How far the glyphs are blurred, in `GLASS_VIEWPORT` units. */
export const GLASS_BLUR = 16

export function generateGlass(
  seed: string,
  palette: readonly string[] = GLASS_COLORS
): GlassArtwork {
  const prng = makePrng(seed)

  // Order matters: every draw advances one shared stream, so moving or adding
  // a call re-rolls every avatar downstream of it.
  const color = prng.pick(palette)
  const background = color.startsWith('#') ? color : `#${color}`

  const back = {
    path: SHAPE2[prng.pick(SHAPES)],
    offsetX: prng.integer(-80, 80),
    offsetY: prng.integer(-80, 80),
    rotation: prng.integer(-160, 160),
  }
  const front = {
    path: SHAPE1[prng.pick(SHAPES)],
    offsetX: prng.integer(-80, 80),
    offsetY: prng.integer(-80, 80),
    rotation: prng.integer(-180, 180),
  }

  return { background, back, front }
}
