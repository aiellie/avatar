/**
 * Shared vocabulary for the HugeIcons manifest that
 * `scripts/generate-hugeicons.mjs` writes into public/hugeicons.
 *
 * Everything here has to run unchanged in the edge runtime and in the browser,
 * so it stays free of React and of Node built-ins.
 */

/** A single SVG element: its tag and whatever attributes the default set does not cover. */
export type IconElement = [tag: string, attrs: Record<string, string | number>]

/** One icon, drawn on a 24×24 canvas. */
export type IconData = IconElement[]

export type IconIndex = {
  /** Upstream package version — doubles as the shard cache key. */
  version: string
  /** Encoding version, owned by scripts/generate-hugeicons.mjs. */
  format: number
  /** Icons per shard; a name's position in `names` implies its shard. */
  shardSize: number
  /** Every icon name, sorted. */
  names: string[]
}

export type IconShard = Record<string, IconData>

const MANIFEST_BASE = '/hugeicons'

/** The canvas every icon is drawn on. */
export const ICON_VIEWBOX = 24
/** Stroke width the manifest omits, in canvas units. */
export const ICON_STROKE_WIDTH = 1.5
/** How much of the avatar's shorter edge the glyph covers. */
export const ICON_SCALE = 0.5

export const ICON_INDEX_URL = `${MANIFEST_BASE}/index.json`

export function iconShardUrl(shard: number, version: string): string {
  // Shards are served `immutable`, so the version has to bust them by hand.
  return `${MANIFEST_BASE}/s/${shard}.json?v=${encodeURIComponent(version)}`
}

export function shardOf(position: number, shardSize: number): number {
  return Math.floor(position / shardSize)
}

/**
 * Folds the spellings a URL might carry — `Home01Icon`, `Home 01`, `home_01` —
 * onto the manifest's `home-01`. Idempotent, and a mirror of `toSlug` in
 * scripts/generate-hugeicons.mjs.
 */
export function normalizeIconName(input: string): string {
  return input
    .trim()
    .replace(/Icon$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Restores the attributes the manifest left out.
 *
 * `currentColor` is resolved here rather than inherited from a parent, because
 * Satori — which rasterises the PNG output — treats each element in isolation.
 */
export function iconElementProps(
  [, attrs]: IconElement,
  color: string
): Record<string, string | number> {
  const props: Record<string, string | number> = {
    fill: 'none',
    stroke: color,
    strokeWidth: ICON_STROKE_WIDTH,
  }
  for (const [key, value] of Object.entries(attrs)) {
    props[key] = value === 'currentColor' ? color : value
  }
  return props
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Centres the 24×24 canvas inside a `width`×`height` box.
 *
 * A `<g transform>` is deliberate: it is the one scaling construct Satori and
 * plain SVG renderers agree on (a nested `<svg viewBox>` is misplaced in PNG).
 * Scaling the group also scales the stroke, so the glyph keeps its proportions.
 */
export function iconTransform(
  width: number,
  height: number,
  scale: number = ICON_SCALE
): string {
  const size = Math.min(width, height) * scale
  return `translate(${round((width - size) / 2)} ${round(
    (height - size) / 2
  )}) scale(${round(size / ICON_VIEWBOX)})`
}
