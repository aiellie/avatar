'use client'

import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type AvatarStyle, STYLE_PRESETS } from '@/utils/styles'

/** Rendered at 16px — asking for 40 keeps it sharp on a retina screen. */
const SWATCH_SIZE = 40

/** The style itself, drawn by the endpoint that will serve the real avatar. */
function Swatch({ name, style }: { name: string; style: AvatarStyle }) {
  return (
    <img
      src={`/${encodeURIComponent(name)}?size=${SWATCH_SIZE}&rounded=full&style=${style}`}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0 rounded-full"
    />
  )
}

/**
 * Picks the artwork style. Given a `previewName`, every option carries a live
 * swatch drawn by the avatar endpoint itself — so what the menu promises and
 * what the URL returns cannot drift apart.
 */
export function StyleDropdown({
  value,
  onValueChange,
  previewName,
  id,
  disabled,
  className,
}: {
  value: AvatarStyle
  onValueChange: (style: AvatarStyle) => void
  previewName?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  // Typing a name shouldn't fire a swatch request per keystroke.
  const name = React.useDeferredValue(previewName?.trim() ?? '')

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === null) return
        onValueChange(v as AvatarStyle)
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn('w-full', className)}>
        {/* The trigger renders the raw value by default (`gradient`), so it
            gets the same swatch-and-label treatment as the menu, minus the
            hint — there is no room for it next to the caret. */}
        <SelectValue>
          {(selected) => {
            const style =
              STYLE_PRESETS.find((s) => s.id === selected) ?? STYLE_PRESETS[0]
            return (
              <>
                {name ? <Swatch name={name} style={style.id} /> : null}
                {style.label}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STYLE_PRESETS.map((style) => (
          <SelectItem key={style.id} value={style.id}>
            <span className="flex w-full items-center gap-2">
              {name ? <Swatch name={name} style={style.id} /> : null}
              {style.label}
              <span className="text-muted-foreground text-xs">
                {style.hint}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
