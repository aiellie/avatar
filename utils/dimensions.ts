export type RatioPreset = {
  id: string
  label: string
  hint: string
  width: number
  height: number
  aliases?: string[]
}

export const DEFAULT_SIZE = 120
export const MIN_DIMENSION = 1
export const MAX_DIMENSION = 2048

/**
 * Named shapes accepted by `?ratio=`. Anything not listed here still works as a
 * raw `W:H` (or `W/H`, `WxH`, or a bare decimal), so the presets are a
 * convenience rather than a whitelist.
 */
export const RATIO_PRESETS: RatioPreset[] = [
  {
    id: 'square',
    label: 'Square',
    hint: 'Avatar · 1:1',
    width: 1,
    height: 1,
    aliases: ['avatar'],
  },
  {
    id: 'video',
    label: 'Landscape',
    hint: 'Video · 16:9',
    width: 16,
    height: 9,
    aliases: ['landscape'],
  },
  {
    id: 'portrait',
    label: 'Portrait',
    hint: 'Story · 9:16',
    width: 9,
    height: 16,
    aliases: ['story'],
  },
  { id: 'photo', label: 'Photo', hint: '4:3', width: 4, height: 3 },
  { id: 'tall', label: 'Tall', hint: '3:4', width: 3, height: 4 },
  { id: 'ultrawide', label: 'Ultrawide', hint: '21:9', width: 21, height: 9 },
  {
    id: 'cover',
    label: 'Cover',
    // 40:21 is 1200×630 reduced — the Open Graph card size, so `size=1200`
    // lands on it exactly.
    hint: 'Open Graph · 1200×630',
    width: 40,
    height: 21,
    aliases: ['og', 'social'],
  },
  { id: 'banner', label: 'Banner', hint: '3:1', width: 3, height: 1 },
]

const PRESETS_BY_KEY = new Map<string, RatioPreset>()
for (const preset of RATIO_PRESETS) {
  PRESETS_BY_KEY.set(preset.id, preset)
  for (const alias of preset.aliases ?? []) PRESETS_BY_KEY.set(alias, preset)
}

export function findRatioPreset(key: string): RatioPreset | undefined {
  return PRESETS_BY_KEY.get(key.trim().toLowerCase())
}

function clampDimension(n: number): number {
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, n))
}

function toDimension(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return clampDimension(Math.round(n))
}

/**
 * Accepts a preset name (`video`), `W:H`, `W/H`, `WxH`, or a bare decimal.
 * Returns width ÷ height, or null when the input is missing or unparseable.
 */
export function parseRatio(input: string | null | undefined): number | null {
  if (!input) return null
  const key = input.trim().toLowerCase()
  if (!key) return null

  const preset = PRESETS_BY_KEY.get(key)
  if (preset) return preset.width / preset.height

  const [rawWidth, rawHeight = '1'] = key.split(/[:/x]/)
  const width = Number(rawWidth)
  const height = Number(rawHeight)
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null
  return width / height
}

export type DimensionInput = {
  size?: string | number | null
  ratio?: string | null
  width?: string | number | null
  height?: string | number | null
}

/**
 * Resolves the requested shape to concrete pixels.
 *
 * Explicit `width`/`height` win. Given only one of them, `ratio` supplies the
 * other. Given neither, `size` sets the *longest* edge so a name keeps the same
 * visual weight whether it is rendered square, wide, or tall.
 */
export function resolveDimensions(input: DimensionInput): {
  width: number
  height: number
} {
  const ratio = parseRatio(input.ratio)
  const width = toDimension(input.width)
  const height = toDimension(input.height)

  if (width !== null && height !== null) return { width, height }
  if (width !== null) {
    return {
      width,
      height: ratio ? clampDimension(Math.round(width / ratio)) : width,
    }
  }
  if (height !== null) {
    return {
      width: ratio ? clampDimension(Math.round(height * ratio)) : height,
      height,
    }
  }

  const size = toDimension(input.size) ?? DEFAULT_SIZE
  if (!ratio || ratio === 1) return { width: size, height: size }

  return ratio > 1
    ? { width: size, height: clampDimension(Math.round(size / ratio)) }
    : { width: clampDimension(Math.round(size * ratio)), height: size }
}

/** The radius at which the shape becomes a circle (square) or a pill. */
export function maxRounded(width: number, height: number): number {
  return Math.floor(Math.min(width, height) / 2)
}

/** Accepts a pixel radius or `full`/`max`, clamped so corners never overlap. */
export function parseRounded(
  input: string | number | null | undefined,
  width: number,
  height: number
): number {
  const max = maxRounded(width, height)
  if (input === null || input === undefined || input === '') return 0

  const key = String(input).trim().toLowerCase()
  if (key === 'full' || key === 'max') return max

  const n = Number(key)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.round(n), max)
}
