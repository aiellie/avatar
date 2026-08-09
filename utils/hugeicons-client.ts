/**
 * Browser-side access to the sharded HugeIcons manifest.
 *
 * All 6k icons come to ~4MB of geometry, so nothing is loaded until something
 * actually asks to draw an icon. The index (names only, ~20KB over the wire)
 * arrives first; individual shards follow as rows scroll into view. Everything
 * is cached for the life of the page and de-duplicated while in flight.
 */

import * as React from 'react'

import {
  ICON_INDEX_URL,
  type IconData,
  type IconIndex,
  type IconShard,
  iconShardUrl,
  shardOf,
} from './hugeicons'

type Store = {
  index: IconIndex | null
  /** Name -> position in `index.names`, which is what picks the shard. */
  positions: Map<string, number>
  shards: Map<number, IconShard>
  error: string | null
  /** Bumped whenever any of the above changes, to wake subscribers. */
  revision: number
}

const store: Store = {
  index: null,
  positions: new Map(),
  shards: new Map(),
  error: null,
  revision: 0,
}

const subscribers = new Set<() => void>()
const inFlight = new Map<number, Promise<void>>()
let indexPromise: Promise<void> | null = null

function emit() {
  store.revision++
  for (const notify of subscribers) notify()
}

function fail(message: string) {
  store.error = message
  emit()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/** Loads the name index once. Safe to call on every render. */
export function ensureIconIndex(): void {
  if (indexPromise || store.index) return
  indexPromise = fetchJson<IconIndex>(ICON_INDEX_URL)
    .then((index) => {
      store.index = index
      store.positions = new Map(index.names.map((name, i) => [name, i]))
      store.error = null
      emit()
    })
    .catch((error: unknown) => {
      // Cleared so the next open tries again — callers only reach this on an
      // explicit open, so a failure cannot turn into a retry storm.
      indexPromise = null
      fail(`Could not load the icon list (${(error as Error).message}).`)
    })
}

/** Loads the shards holding the given icon names, skipping any already present. */
export function ensureIconShards(names: Iterable<string>): void {
  const { index } = store
  if (!index) return

  for (const name of names) {
    const position = store.positions.get(name)
    if (position === undefined) continue
    const shard = shardOf(position, index.shardSize)
    if (store.shards.has(shard) || inFlight.has(shard)) continue

    const request = fetchJson<IconShard>(iconShardUrl(shard, index.version))
      .then((payload) => {
        store.shards.set(shard, payload)
        emit()
      })
      .catch((error: unknown) => {
        fail(`Could not load icon shapes (${(error as Error).message}).`)
      })
      .finally(() => {
        inFlight.delete(shard)
      })

    inFlight.set(shard, request)
  }
}

/** The icon's geometry, or undefined while its shard is still on the way. */
export function peekIconData(name: string): IconData | undefined {
  const { index } = store
  if (!index) return undefined
  const position = store.positions.get(name)
  if (position === undefined) return undefined
  return store.shards.get(shardOf(position, index.shardSize))?.[name]
}

export function iconExists(name: string): boolean {
  return store.positions.has(name)
}

function subscribe(notify: () => void) {
  subscribers.add(notify)
  return () => {
    subscribers.delete(notify)
  }
}

const serverRevision = () => 0

/**
 * Re-renders the caller whenever the index or a shard lands. The returned
 * revision is only a change token — read the data with `peekIconData`.
 */
export function useIconManifest(): {
  index: IconIndex | null
  error: string | null
  revision: number
} {
  const revision = React.useSyncExternalStore(
    subscribe,
    () => store.revision,
    serverRevision
  )
  return { index: store.index, error: store.error, revision }
}
