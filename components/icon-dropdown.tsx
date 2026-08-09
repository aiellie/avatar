'use client'

import * as React from 'react'
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { HugeIcon } from '@/components/hugeicon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ensureIconIndex,
  ensureIconShards,
  peekIconData,
  useIconManifest,
} from '@/utils/hugeicons-client'

/** Side of one square cell, in pixels. */
const CELL = 48
/** Rows kept mounted above and below the viewport. */
const OVERSCAN = 2
const VIEWPORT_HEIGHT = 288

/**
 * A picker over every free HugeIcon — a little over six thousand of them.
 *
 * Two things follow from that count. The grid is virtualised, so only the rows
 * on screen are mounted; and the geometry is paged in shard by shard as those
 * rows appear, which is why a cell can show a placeholder for a moment.
 */
export function IconDropdown({
  value,
  onValueChange,
  id,
  disabled,
  className,
}: {
  value: string | null
  onValueChange: (name: string | null) => void
  id?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [columns, setColumns] = React.useState(6)

  // Held in state, not a ref: Radix mounts the popover's contents in a later
  // commit than the one that flips `open`, so an effect keyed on `open` can
  // run while the node is still missing. Keying on the node itself cannot.
  const [scroller, setScroller] = React.useState<HTMLDivElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const optionPrefix = React.useId()
  const { index, error } = useIconManifest()

  // The trigger draws the current icon, so the manifest is needed as soon as
  // there is a selection — not only once the popover is opened.
  React.useEffect(() => {
    if (open || value) ensureIconIndex()
  }, [open, value])

  React.useEffect(() => {
    if (value) ensureIconShards([value])
  }, [value, index])

  // Keep the caret in the search box; the grid is driven from there. Base UI
  // leaves focus on the trigger for pointer opens, and mounts the popup's
  // children a tick after `open` flips — too late for `initialFocus` or an
  // effect on `open`. This ref only fires when the box itself mounts, which
  // is exactly once per open, so it can't steal focus back mid-session.
  const setSearchRef = React.useCallback((node: HTMLInputElement | null) => {
    searchRef.current = node
    node?.focus()
  }, [])

  const deferredQuery = React.useDeferredValue(query)
  const names = index?.names

  const results = React.useMemo(() => {
    if (!names) return []
    // Let people type "arrow left" for `arrow-left`.
    const q = deferredQuery.trim().toLowerCase().replace(/\s+/g, '-')
    if (!q) return names

    return names
      .filter((name) => name.includes(q))
      .sort((a, b) => {
        // Prefix matches first, then the tightest fit.
        const byPrefix = Number(b.startsWith(q)) - Number(a.startsWith(q))
        return byPrefix || a.length - b.length || a.localeCompare(b)
      })
  }, [names, deferredQuery])

  const rows = Math.ceil(results.length / columns)
  // A three-result search should not leave a tall empty box below it.
  const viewportHeight = Math.min(VIEWPORT_HEIGHT, Math.max(CELL, rows * CELL))
  const firstRow = Math.max(0, Math.floor(scrollTop / CELL) - OVERSCAN)
  const lastRow = Math.min(
    rows,
    Math.ceil((scrollTop + viewportHeight) / CELL) + OVERSCAN
  )

  // Memoised so the shard effect below fires on a real change of window, not
  // on every render.
  const visible = React.useMemo(
    () => results.slice(firstRow * columns, lastRow * columns),
    [results, firstRow, lastRow, columns]
  )

  // Only the icons actually on screen are worth fetching shapes for.
  React.useEffect(() => {
    if (open && visible.length) ensureIconShards(visible)
  }, [open, visible])

  function scrollToRow(row: number, centre = false) {
    if (!scroller) return
    const top = row * CELL
    let next = scroller.scrollTop
    if (centre) next = top - (viewportHeight - CELL) / 2
    else if (top < next) next = top
    else if (top + CELL > next + scroller.clientHeight) {
      next = top + CELL - scroller.clientHeight
    }
    next = Math.max(
      0,
      Math.min(next, Math.max(0, rows * CELL - viewportHeight))
    )
    scroller.scrollTop = next
    setScrollTop(next)
  }

  // Columns follow the popover's real width, so a platform scrollbar can never
  // push the last column out of view.
  React.useLayoutEffect(() => {
    if (!scroller) return
    const measure = () =>
      setColumns(Math.max(1, Math.floor(scroller.clientWidth / CELL)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [scroller])

  // Radix throws the popover's contents away on close, so every open gets a
  // brand-new scroller sitting at 0 while `scrollTop` and `active` survive on
  // this component. Left alone, the second open renders its cells thousands of
  // pixels below the visible band — an empty grid until you happen to scroll.
  // So each new node resyncs: onto the current selection if there is one,
  // otherwise back to the top.
  React.useLayoutEffect(() => {
    if (!scroller) return
    const position = value ? results.indexOf(value) : -1
    if (position < 0) {
      setActive(0)
      setScrollTop(0)
      scroller.scrollTop = 0
      return
    }
    const cols = Math.max(1, Math.floor(scroller.clientWidth / CELL))
    const top =
      Math.floor(position / cols) * CELL - (viewportHeight - CELL) / 2
    const next = Math.max(
      0,
      Math.min(top, Math.ceil(results.length / cols) * CELL - viewportHeight)
    )
    setActive(position)
    setScrollTop(next)
    scroller.scrollTop = next
    // Deliberately keyed on the node and the index: it should fire when the
    // popover mounts and again if the manifest lands just after, never on
    // every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scroller, index])

  // Reset the cursor whenever the result set changes out from under it.
  React.useEffect(() => {
    setActive(0)
    setScrollTop(0)
    if (scroller) scroller.scrollTop = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery])

  function moveTo(next: number) {
    const clamped = Math.max(0, Math.min(results.length - 1, next))
    if (clamped === active) return
    setActive(clamped)
    scrollToRow(Math.floor(clamped / columns))
  }

  function commit(name: string | null) {
    onValueChange(name)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        moveTo(active + 1)
        break
      case 'ArrowLeft':
        moveTo(active - 1)
        break
      case 'ArrowDown':
        moveTo(active + columns)
        break
      case 'ArrowUp':
        moveTo(active - columns)
        break
      case 'PageDown':
        moveTo(active + columns * Math.floor(viewportHeight / CELL))
        break
      case 'PageUp':
        moveTo(active - columns * Math.floor(viewportHeight / CELL))
        break
      case 'Home':
        moveTo(0)
        break
      case 'End':
        moveTo(results.length - 1)
        break
      case 'Enter':
        if (results[active]) commit(results[active])
        break
      default:
        return
    }
    // Every handled key would otherwise move the caret or scroll the page.
    event.preventDefault()
  }

  const selectedData = value ? peekIconData(value) : undefined
  const activeName = results[active]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('flex gap-2', className)}>
        <PopoverTrigger
          id={id}
          disabled={disabled}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex min-w-0 items-center gap-2">
            {value ? (
              <>
                {selectedData ? (
                  <HugeIcon data={selectedData} className="size-4 shrink-0" />
                ) : (
                  <span className="bg-muted size-4 shrink-0 rounded-sm" />
                )}
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No icon</span>
            )}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 opacity-50"
          />
        </PopoverTrigger>
        {value ? (
          <button
            type="button"
            onClick={() => onValueChange(null)}
            disabled={disabled}
            aria-label="Remove icon"
            className="border-input hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex size-9 shrink-0 items-center justify-center rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        ) : null}
      </div>

      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
          <input
            ref={setSearchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search 6,000+ icons…"
            aria-label="Search icons"
            role="combobox"
            aria-expanded
            aria-controls={`${optionPrefix}grid`}
            aria-activedescendant={
              activeName ? `${optionPrefix}${activeName}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            className="placeholder:text-muted-foreground h-10 w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </div>

        <div
          ref={setScroller}
          id={`${optionPrefix}grid`}
          role="listbox"
          aria-label="Icons"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ height: index && results.length ? viewportHeight : undefined }}
          className="overflow-y-auto overscroll-contain"
        >
          {/* An error only replaces the grid when there is no grid to show —
              one shard failing must not blank a working picker. */}
          {!index && error ? (
            <p className="text-muted-foreground p-3 text-xs">{error}</p>
          ) : !index ? (
            <p className="text-muted-foreground p-3 text-xs">Loading icons…</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-3 text-xs">
              No icon matches “{deferredQuery.trim()}”.
            </p>
          ) : (
            <div style={{ height: rows * CELL }} className="relative">
              {visible.map((name, i) => {
                const position = firstRow * columns + i
                const data = peekIconData(name)
                return (
                  <button
                    key={name}
                    id={`${optionPrefix}${name}`}
                    type="button"
                    role="option"
                    aria-selected={name === value}
                    title={name}
                    tabIndex={-1}
                    onClick={() => commit(name)}
                    onMouseMove={() => setActive(position)}
                    style={{
                      position: 'absolute',
                      top: Math.floor(position / columns) * CELL,
                      left: (position % columns) * CELL,
                      width: CELL,
                      height: CELL,
                    }}
                    className={cn(
                      'flex items-center justify-center rounded-md transition-colors',
                      position === active && 'bg-accent text-accent-foreground',
                      name === value && 'ring-ring/50 ring-2'
                    )}
                  >
                    {data ? (
                      <HugeIcon data={data} className="size-5" />
                    ) : (
                      // Shard still in flight — hold the cell's place.
                      <span className="bg-muted size-5 rounded-sm" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs">
          <span className="truncate tabular-nums">
            {index && error
              ? 'Some icons failed to load'
              : index
                ? `${results.length.toLocaleString()} icons${activeName ? ` · ${activeName}` : ''}`
                : '—'}
          </span>
          <button
            type="button"
            onClick={() => commit(null)}
            className="hover:text-foreground shrink-0 underline underline-offset-4 transition-colors"
          >
            No icon
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
