/**
 * Edge-side access to the sharded HugeIcons manifest.
 *
 * The icon set is far too large to bundle into an edge function, so the route
 * reads it back off its own origin as static JSON: one index, then the single
 * shard the requested icon lives in. Both are held in module scope, which on a
 * warm isolate makes repeat requests free.
 */

import {
  ICON_INDEX_URL,
  type IconData,
  type IconIndex,
  type IconShard,
  iconShardUrl,
  normalizeIconName,
  shardOf,
} from './hugeicons'

/** Enough to cover the icons a single deployment realistically serves hot. */
const MAX_CACHED_SHARDS = 8

type Manifest = { index: IconIndex; positions: Map<string, number> }

let manifest: Manifest | null = null
let manifestRequest: Promise<Manifest | null> | null = null
const shardCache = new Map<number, IconShard>()
const shardRequests = new Map<number, Promise<IconShard | null>>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`${response.status} for ${url}`)
  return (await response.json()) as T
}

function loadManifest(origin: string): Promise<Manifest | null> {
  if (manifest) return Promise.resolve(manifest)
  if (!manifestRequest) {
    manifestRequest = fetchJson<IconIndex>(`${origin}${ICON_INDEX_URL}`)
      .then((index) => {
        manifest = {
          index,
          positions: new Map(index.names.map((name, i) => [name, i])),
        }
        return manifest
      })
      .catch(() => null)
      // A failed load must not poison the isolate for every later request.
      .finally(() => {
        manifestRequest = null
      })
  }
  return manifestRequest
}

function loadShard(origin: string, shard: number, version: string) {
  const cached = shardCache.get(shard)
  if (cached) return Promise.resolve(cached)

  let request = shardRequests.get(shard)
  if (!request) {
    request = fetchJson<IconShard>(`${origin}${iconShardUrl(shard, version)}`)
      .then((payload) => {
        if (shardCache.size >= MAX_CACHED_SHARDS) {
          // Insertion-ordered, so this drops the least recently fetched.
          const oldest = shardCache.keys().next()
          if (!oldest.done) shardCache.delete(oldest.value)
        }
        shardCache.set(shard, payload)
        return payload
      })
      .catch(() => null)
      .finally(() => {
        shardRequests.delete(shard)
      })
    shardRequests.set(shard, request)
  }
  return request
}

export type IconLookup = {
  data: IconData | null
  /**
   * True when the icon could not be resolved because the manifest was
   * unreachable, rather than because it does not exist. The caller has to know
   * the difference: an unknown name always renders the same image and can be
   * cached forever, whereas a failed fetch is a temporary answer that must not
   * be frozen in a CDN.
   */
  degraded: boolean
}

/**
 * Resolves `?icon=` to drawable geometry.
 *
 * Never throws — an avatar without its icon beats a 500.
 */
export async function loadIcon(
  origin: string,
  rawName: string | null
): Promise<IconLookup> {
  if (!rawName) return { data: null, degraded: false }
  const name = normalizeIconName(rawName)
  if (!name) return { data: null, degraded: false }

  const loaded = await loadManifest(origin)
  if (!loaded) return { data: null, degraded: true }

  const position = loaded.positions.get(name)
  if (position === undefined) return { data: null, degraded: false }

  const shard = await loadShard(
    origin,
    shardOf(position, loaded.index.shardSize),
    loaded.index.version
  )
  // The name is in the index, so a miss here means the shard did not arrive
  // (or arrived incomplete) rather than that the icon does not exist.
  const data = shard?.[name] ?? null
  return { data, degraded: data === null }
}
