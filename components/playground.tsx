import * as React from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'

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

const HOST = 'https://avatar.aiellie.dev'
const SIZES = ['32', '64', '120', '240', '512']
const EXAMPLES = ['ellie', 'sophia', 'aiellie', '42', 'next.js']
const PREVIEW_MAX = 208

export function Playground() {
  const [name, setName] = React.useState('ellie')
  const [format, setFormat] = React.useState<'png' | 'svg'>('svg')
  const [size, setSize] = React.useState('120')
  const [rounded, setRounded] = React.useState(0)
  const [text, setText] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const copyResetRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const effectiveName = name.trim() || 'ellie'
  const sizeNum = Number(size)
  const maxRounded = Math.floor(sizeNum / 2)
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

  const params = new URLSearchParams()
  if (sizeNum !== 120) params.set('size', size)
  if (roundedClamped > 0) params.set('rounded', String(roundedClamped))
  if (effectiveFormat === 'svg' && text.trim()) params.set('text', text.trim())
  const query = params.toString()
  const path = `/${encodeURIComponent(effectiveName)}${
    !hasDot && format === 'svg' ? '.svg' : ''
  }${query ? `?${query}` : ''}`
  const url = `${HOST}${path}`

  // Defer the preview so typing stays snappy while images load.
  const previewSrc = React.useDeferredValue(path)
  const displaySize = Math.min(sizeNum, PREVIEW_MAX)

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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Playground</CardTitle>
        <CardDescription>
          Tweak the parameters and grab the URL — no account, no upload, just a
          name.
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
                only the part before it picks the gradient.
              </p>
            ) : null}
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
              <Select
                value={size}
                onValueChange={(v) => {
                  setSize(v)
                  setRounded((r) => Math.min(r, Math.floor(Number(v) / 2)))
                }}
              >
                <SelectTrigger id="size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label asChild>
                <span>Roundness</span>
              </Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {roundedClamped === maxRounded && roundedClamped > 0
                  ? 'circle'
                  : `${roundedClamped}px`}
              </span>
            </div>
            <Slider
              value={[roundedClamped]}
              onValueChange={([v]) => setRounded(v)}
              max={maxRounded}
              step={1}
              aria-label="Roundness"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text">Initials</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="EA"
              maxLength={4}
              disabled={effectiveFormat !== 'svg'}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-muted-foreground text-xs">
              {effectiveFormat === 'svg'
                ? 'Optional — rendered on top of the gradient.'
                : 'Initials are only supported by the SVG format.'}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="bg-muted/30 flex h-64 items-center justify-center overflow-hidden rounded-lg border">
            <img
              key={previewSrc}
              src={previewSrc}
              alt={`Avatar for ${effectiveName}`}
              width={displaySize}
              height={displaySize}
              style={{ width: displaySize, height: displaySize }}
            />
          </div>
          <p className="text-muted-foreground text-center text-xs tabular-nums">
            {sizeNum} × {sizeNum} px{sizeNum > PREVIEW_MAX ? ' — scaled to fit' : ''}
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
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a
                href={path}
                target="_blank"
                rel="noreferrer"
                aria-label="Open image in a new tab"
              >
                <ExternalLink />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t flex-col items-start gap-3 [.border-t]:pt-6">
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
      </CardFooter>
    </Card>
  )
}
