import * as React from 'react'
import {
  Copy01Icon,
  LinkSquare02Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { IconDropdown } from '@/components/icon-dropdown'
import { StyleDropdown } from '@/components/style-dropdown'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_SIZE,
  MAX_DIMENSION,
  RATIO_PRESETS,
  maxRounded as maxRoundedFor,
  resolveDimensions,
} from '@/utils/dimensions'
import { type AvatarStyle, DEFAULT_STYLE } from '@/utils/styles'

const HOST = 'https://avatar.aiellie.dev'
const EXAMPLES = ['ellie', 'sophia', 'aiellie', '42', 'next.js']
const PREVIEW_MAX = 208
const CUSTOM_RATIO = 'custom'
const HEADER_AVATARS = ['ellie', 'sophia', 'party', 'edge']

export function Playground() {
  const [name, setName] = React.useState('ellie')
  const [format, setFormat] = React.useState<'png' | 'svg'>('svg')
  const [style, setStyle] = React.useState<AvatarStyle>(DEFAULT_STYLE)
  const [size, setSize] = React.useState(String(DEFAULT_SIZE))
  const [ratioId, setRatioId] = React.useState('square')
  const [customRatio, setCustomRatio] = React.useState({ w: '3', h: '2' })
  const [rounded, setRounded] = React.useState(0)
  const [icon, setIcon] = React.useState<string | null>(null)
  const [text, setText] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const copyResetRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const effectiveName = name.trim() || 'ellie'
  const isCustomRatio = ratioId === CUSTOM_RATIO
  const preset = RATIO_PRESETS.find((r) => r.id === ratioId)

  // `W:H` — the API also accepts the preset names, but spelling the numbers out
  // keeps a copied URL readable on its own.
  const ratioParam = isCustomRatio
    ? `${customRatio.w.trim() || '1'}:${customRatio.h.trim() || '1'}`
    : `${preset?.width ?? 1}:${preset?.height ?? 1}`
  const isSquare = !isCustomRatio && ratioId === 'square'

  // Resolve the shape exactly the way the API will, so the preview and the URL
  // can never disagree.
  const { width, height } = resolveDimensions({
    size: size.trim() === '' ? DEFAULT_SIZE : size,
    ratio: ratioParam,
  })
  const maxRounded = maxRoundedFor(width, height)
  const roundedClamped = Math.min(rounded, maxRounded)

  // The API treats everything after the first dot as the file extension
  // (name.split('.') -> [username, type]), so a dotted name decides its own
  // format and appending '.svg' would have no effect.
  const hasDot = effectiveName.includes('.')
  const effectiveFormat: 'png' | 'svg' = hasDot
    ? effectiveName.split('.')[1]?.includes('svg')
      ? 'svg'
      : 'png'
    : format

  // `size` sets the longest edge, so it always reads back off the resolved box.
  const sizeNum = Math.max(width, height)

  const params = new URLSearchParams()
  if (style !== DEFAULT_STYLE) params.set('style', style)
  if (!isSquare) params.set('ratio', ratioParam)
  if (sizeNum !== DEFAULT_SIZE) params.set('size', String(sizeNum))
  if (roundedClamped > 0) params.set('rounded', String(roundedClamped))
  // An icon wins when both are set.
  if (icon) params.set('icon', icon)
  else if (text.trim()) params.set('text', text.trim())
  // `:` is legal in a query string, and `ratio=16:9` reads better than the
  // percent-encoded form URLSearchParams produces.
  const query = params.toString().replace(/%3A/g, ':')
  const path = `/${encodeURIComponent(effectiveName)}${
    !hasDot && format === 'svg' ? '.svg' : ''
  }${query ? `?${query}` : ''}`
  const url = `${HOST}${path}`

  // Defer the preview so typing stays snappy while images load.
  const previewSrc = React.useDeferredValue(path)
  const previewScale = Math.min(1, PREVIEW_MAX / sizeNum)
  const displayWidth = Math.max(1, Math.round(width * previewScale))
  const displayHeight = Math.max(1, Math.round(height * previewScale))

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(copyResetRef.current)
      copyResetRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — the URL is still selectable.
    }
  }

  return (
    <Card className="w-full max-w-4xl rounded-none border-none!">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Avatars
          <div className="flex -space-x-2">
            {HEADER_AVATARS.map((n) => (
              <img
                key={n}
                src={`/${n}?size=28`}
                alt={`Avatar for ${n}`}
                width={28}
                height={28}
                className="ring-background rounded-full ring-2"
              />
            ))}
          </div></CardTitle>
        <CardDescription>
        Generate beautiful avatars for your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ellie"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {hasDot ? (
              <p className="text-muted-foreground text-xs">
                Anything after the first dot acts as a file extension — it
                decides the format ({effectiveFormat.toUpperCase()} here), and
                only the part before it picks the colours.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="style">Style</Label>
            <StyleDropdown
              id="style"
              value={style}
              onValueChange={setStyle}
              previewName={effectiveName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={hasDot ? effectiveFormat : format}
                onValueChange={(v) => setFormat(v as 'png' | 'svg')}
                disabled={hasDot}
              >
                <SelectTrigger id="format" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DIMENSION}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                onBlur={() => setSize(String(sizeNum))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ratio">Aspect ratio</Label>
            <div className="flex gap-2">
              <Select
                value={ratioId}
                onValueChange={(v) => {
                  if (v === null) return
                  if (v === CUSTOM_RATIO && preset) {
                    // Seed the custom fields from the shape already on screen.
                    setCustomRatio({
                      w: String(preset.width),
                      h: String(preset.height),
                    })
                  }
                  setRatioId(v)
                }}
              >
                <SelectTrigger id="ratio" className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATIO_PRESETS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex w-full items-baseline gap-2">
                        {r.label}
                        <span className="text-muted-foreground text-xs">
                          {r.hint}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_RATIO}>Custom…</SelectItem>
                </SelectContent>
              </Select>
              {isCustomRatio ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Input
                    aria-label="Custom ratio width"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    className="w-16"
                    value={customRatio.w}
                    onChange={(e) =>
                      setCustomRatio((r) => ({ ...r, w: e.target.value }))
                    }
                  />
                  <span className="text-muted-foreground text-sm">:</span>
                  <Input
                    aria-label="Custom ratio height"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    className="w-16"
                    value={customRatio.h}
                    onChange={(e) =>
                      setCustomRatio((r) => ({ ...r, h: e.target.value }))
                    }
                  />
                </div>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              Size sets the longest edge — {width} × {height} px here.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm leading-none font-medium select-none">
                Roundness
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {roundedClamped === maxRounded && roundedClamped > 0
                  ? 'circle'
                  : `${roundedClamped}px`}
              </span>
            </div>
            <Slider
              value={[roundedClamped]}
              onValueChange={(v) => setRounded(Array.isArray(v) ? v[0] : v)}
              max={maxRounded}
              step={1}
              aria-label="Roundness"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">Icon</Label>
            <IconDropdown id="icon" value={icon} onValueChange={setIcon} />
            <p className="text-muted-foreground text-xs">
              Any of the 6,000+ free{' '}
              <a
                className="hover:text-foreground underline underline-offset-4 transition-colors"
                href="https://hugeicons.com"
                target="_blank"
                rel="noreferrer"
              >
                HugeIcons
              </a>
              , drawn over the artwork — and it wins when initials are set too.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text">Initials</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="EA"
              maxLength={4}
              disabled={!!icon}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-muted-foreground text-xs">
              {icon
                ? 'An icon is already set — clear it to use initials instead.'
                : 'Optional — rendered on top of the artwork. PNG sets them in the renderer’s own font, so they won’t match the SVG letter for letter.'}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="bg-muted/30 flex h-64 items-center justify-center overflow-hidden rounded-lg border">
            <img
              key={previewSrc}
              src={previewSrc}
              alt={`Avatar for ${effectiveName}`}
              width={displayWidth}
              height={displayHeight}
              style={{ width: displayWidth, height: displayHeight }}
            />
          </div>
          <p className="text-muted-foreground text-center text-xs tabular-nums">
            {width} × {height} px
            {sizeNum > PREVIEW_MAX ? ' — scaled to fit' : ''}
          </p>
          <div className="flex items-center gap-2">
            <code
              className="bg-muted text-muted-foreground min-w-0 flex-1 truncate rounded-md px-3 py-2 text-xs"
              title={url}
            >
              {url}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyUrl}
              aria-label="Copy URL"
            >
              <HugeiconsIcon
                icon={copied ? Tick02Icon : Copy01Icon}
                strokeWidth={2}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              nativeButton={false}
              render={
                <a
                  href={path}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open image in a new tab"
                />
              }
            >
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </CardContent>
      {/* <CardFooter className="border-t flex-col items-start gap-3 [.border-t]:pt-6"> 
        <p className="text-muted-foreground text-xs">Try one of these:</p>
        <div className="flex flex-wrap gap-4">
          {EXAMPLES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setName(n)}
              className="group flex flex-col items-center gap-1.5"
              title={`Use “${n}”`}
            >
              <img
                src={`/${encodeURIComponent(n)}?size=48`}
                alt={`Avatar for ${n}`}
                width={48}
                height={48}
                className="ring-border rounded-full transition group-hover:ring-2"
              />
              <span className="text-muted-foreground group-hover:text-foreground text-xs transition-colors">
                {n}
              </span>
            </button>
          ))}
        </div>
      </CardFooter> */}
    </Card>
  )
}
