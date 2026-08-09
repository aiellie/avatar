// Turns the @hugeicons/core-free-icons dev dependency into static JSON under
// public/hugeicons.
//
// The package is ~83MB on disk and exports every icon three times over, which
// is far too much to bundle into an edge function or ship to a browser. Instead
// the geometry is written out once, sorted by name and cut into fixed-size
// shards, so the edge route can fetch the single shard it needs and the picker
// can page icons in as they scroll into view.
//
// Run via `pnpm generate:icons` — `dev` and `build` both do it for you.

import { createRequire } from 'node:module'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'hugeicons')
const SHARD_DIR = join(OUT_DIR, 's')
const INDEX_FILE = join(OUT_DIR, 'index.json')

/** Icons per shard. 192 lands each shard around 40KB over the wire. */
const SHARD_SIZE = 192

/**
 * Layout of the emitted JSON. Bump it whenever the encoding below changes: the
 * "already generated" check keys on this as well as the upstream version, which
 * does not move when this script does.
 */
const FORMAT = 2

/**
 * Attributes almost every element carries, dropped here and re-applied at
 * render time. `stroke` in particular has to be substituted rather than
 * inherited: Satori rasterises each SVG element on its own and does not
 * resolve `currentColor`.
 */
const IMPLIED = { stroke: 'currentColor', strokeWidth: '1.5' }

/**
 * `Home01Icon` -> `home-01`. Must stay in lockstep with `normalizeIconName` in
 * utils/hugeicons.ts, which is how a name from a URL finds its way back here.
 */
function toSlug(exportName) {
  return exportName
    .replace(/Icon$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
    .toLowerCase()
}

function encodeElement([tag, attrs]) {
  const out = {}
  let stroked = false
  for (const [key, value] of Object.entries(attrs)) {
    // `key` is React bookkeeping from the upstream data, not SVG.
    if (key === 'key') continue
    if (key === 'stroke') stroked = true
    if (IMPLIED[key] === value) continue
    out[key] = value
  }
  // A handful of icons draw filled shapes with no stroke at all. Because every
  // upstream stroke happens to be `currentColor`, dropping it as implied would
  // make those indistinguishable from a stroked element — and the renderer
  // would paint a 1.5-unit outline around a shape that is already a filled
  // outline. Say "no stroke" out loud instead.
  if (!stroked) out.stroke = 'none'
  return [tag, out]
}

async function currentVersion() {
  return require('@hugeicons/core-free-icons/package.json').version
}

/** What is already on disk, if it was written by this version of this script. */
async function generatedVersion() {
  try {
    const index = JSON.parse(await readFile(INDEX_FILE, 'utf8'))
    if (index.format !== FORMAT || index.shardSize !== SHARD_SIZE) return null
    return index.version
  } catch {
    return null
  }
}

async function main() {
  let version
  try {
    version = await currentVersion()
  } catch {
    console.error(
      '[hugeicons] @hugeicons/core-free-icons is not installed — run `pnpm install` (including dev dependencies).'
    )
    process.exit(1)
  }

  if ((await generatedVersion()) === version && !process.argv.includes('--force')) {
    console.log(`[hugeicons] public/hugeicons is already at ${version} — skipping.`)
    return
  }

  // Only the `*Icon` exports are canonical; the package also re-exports each
  // icon as `*FreeIcons` and sometimes under a bare name.
  const icons = await import('@hugeicons/core-free-icons')
  const bySlug = new Map()
  for (const [exportName, data] of Object.entries(icons)) {
    if (!exportName.endsWith('Icon') || !Array.isArray(data)) continue
    const slug = toSlug(exportName)
    const existing = bySlug.get(slug)
    if (existing && JSON.stringify(existing) !== JSON.stringify(data)) {
      // Two different icons claiming one name would make `?icon=` ambiguous.
      throw new Error(`[hugeicons] slug collision on "${slug}" (${exportName})`)
    }
    bySlug.set(slug, data)
  }

  const names = [...bySlug.keys()].sort()
  if (names.length === 0) throw new Error('[hugeicons] no icons found')

  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(SHARD_DIR, { recursive: true })

  const shardCount = Math.ceil(names.length / SHARD_SIZE)
  let bytes = 0
  for (let shard = 0; shard < shardCount; shard++) {
    const payload = {}
    for (const name of names.slice(shard * SHARD_SIZE, (shard + 1) * SHARD_SIZE)) {
      payload[name] = bySlug.get(name).map(encodeElement)
    }
    const json = JSON.stringify(payload)
    bytes += json.length
    await writeFile(join(SHARD_DIR, `${shard}.json`), json)
  }

  // Written last: it is the marker that the shards beside it are complete.
  await writeFile(
    INDEX_FILE,
    JSON.stringify({ version, format: FORMAT, shardSize: SHARD_SIZE, names })
  )

  const written = (await readdir(SHARD_DIR)).length
  console.log(
    `[hugeicons] ${names.length} icons -> ${written} shards + index (${(bytes / 1e6).toFixed(1)}MB raw) from v${version}`
  )
}

await main()
