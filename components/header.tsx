'use client'

import * as React from 'react'
import {
  ArrowDown01Icon,
  ComputerIcon,
  Copy01Icon,
  Download04Icon,
  LinkSquare02Icon,
  MoonEclipseIcon,
  MoreHorizontalIcon,
  Share08Icon,
  Sun03Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Drawn small and stacked next to the title, as a live sample of the output. */
const TITLE_AVATARS = ['ellie', 'sophia', 'party', 'edge']

const LINKS = [
  { label: 'aiellie.dev', href: 'https://aiellie.dev' },
  { label: 'HugeIcons', href: 'https://hugeicons.com' },
  { label: 'vercel/avatar', href: 'https://github.com/vercel/avatar' },
]

/** One entry per format the download button can hand back. */
export type DownloadTarget = {
  format: 'png' | 'svg'
  /** Same-origin path the file comes from — `download` only works from ours. */
  path: string
  /** Suggested filename, extension included. */
  filename: string
  /**
   * False when the name's own extension rules this format out: the API reads
   * the format off the name, so `next.js` can only ever come back as a PNG.
   */
  available: boolean
}

/**
 * The app bar: title and live avatar stack on one side, the controls that act on
 * the whole playground on the other. Sticky, so the URL actions stay reachable
 * however far the settings column has been scrolled.
 */
export function Header({
  examples,
  onExampleSelect,
  shareUrl,
  sharePath,
  downloads,
  className,
}: {
  /** Names offered by the preset picker; the picker is hidden without them. */
  examples?: readonly string[]
  onExampleSelect?: (name: string) => void
  /** Absolute URL of the avatar as currently configured. */
  shareUrl?: string
  /**
   * Same-origin path to the same image. `shareUrl` points at production, which
   * would 404 anywhere else, so opening it uses this instead.
   */
  sharePath?: string
  /** Formats the download button offers, in menu order. */
  downloads?: readonly DownloadTarget[]
  className?: string
}) {
  return (
    <header
      className={cn(
        'bg-background/70 sticky top-0 z-30 w-full border-b backdrop-blur-xl backdrop-saturate-150',
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full items-center gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">  
          <div className="flex -space-x-2">
            {TITLE_AVATARS.map((n) => (
              <img
                key={n}
                src={`/${n}?size=28`}
                alt={`Avatar for ${n}`}
                width={22}
                height={22}
                className="ring-background size-[22px] rounded-full ring-2"
              />
            ))}
          </div>
          <h1 className="font-heading truncate text-base leading-none font-medium">
            Avatars
          </h1>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {examples?.length && onExampleSelect ? (
            <Select
              value={null}
              onValueChange={(v) => {
                if (typeof v === 'string') onExampleSelect(v)
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Load a preset"
                className="hidden w-44 sm:flex"
              >
                <SelectValue placeholder="Load a preset…" />
              </SelectTrigger>
              <SelectContent>
                {examples.map((n) => (
                  <SelectItem key={n} value={n}>
                    <span className="flex w-full items-center gap-2">
                      <img
                        src={`/${encodeURIComponent(n)}?size=40&rounded=full`}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 rounded-full"
                      />
                      {n}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {shareUrl ? <ShareButton url={shareUrl} path={sharePath} /> : null}
          {downloads?.length ? <DownloadButton targets={downloads} /> : null}
          <ThemeToggle />
          <OverflowMenu />
        </div>
      </div>
    </header>
  )
}

/**
 * The URL is the whole product here — every setting is encoded in it — so the
 * popover leads with it, and offers the two wrappers it usually gets pasted
 * into. Only the copies are offered: opening the image already has a button of
 * its own next to the preview.
 */
function ShareButton({ url, path }: { url: string; path?: string }) {
  // Which of the three copy buttons last fired, so only that one ticks.
  const [copied, setCopied] = React.useState<string | null>(null)
  const resetRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  React.useEffect(() => () => clearTimeout(resetRef.current), [])

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      clearTimeout(resetRef.current)
      resetRef.current = setTimeout(() => setCopied(null), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — the field stays selectable.
    }
  }

  return (
    <Popover onOpenChange={(open) => !open && setCopied(null)}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Share this avatar" />
        }
      >
        <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Share this avatar</PopoverTitle>
          <PopoverDescription>
            Every setting rides along in the URL, so anyone who opens it gets
            this exact image.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            aria-label="Avatar URL"
            className="min-w-0 flex-1 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => copy('url', url)}
            aria-label="Copy URL"
          >
            <HugeiconsIcon
              icon={copied === 'url' ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
            />
          </Button>
          {path ? (
            <Button
              variant="outline"
              size="icon-sm"
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
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy('md', `![Avatar](${url})`)}
          >
            <HugeiconsIcon
              icon={copied === 'md' ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
            />
            Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy('html', `<img src="${url}" alt="Avatar" />`)}
          >
            <HugeiconsIcon
              icon={copied === 'html' ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
            />
            HTML
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * A split button: the wide half saves the format the settings are already set
 * to, the caret saves either one outright. Both halves are plain same-origin
 * links, which is all `download` needs to skip the navigation.
 */
function DownloadButton({ targets }: { targets: readonly DownloadTarget[] }) {
  // Callers order the list with the current format first, so this is it.
  const primary = targets.find((t) => t.available) ?? targets[0]

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a
            href={primary.path}
            download={primary.filename}
            aria-label={`Download ${primary.format.toUpperCase()}`}
          />
        }
      >
        <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
        <span className="hidden md:inline">Download</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Pick a download format"
            />
          }
        >
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          {targets.map((target) => (
            <DropdownMenuItem
              key={target.format}
              disabled={!target.available}
              render={
                <a href={target.path} download={target.filename}>
                  {target.format.toUpperCase()}
                </a>
              }
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

/**
 * Mirrors the `d` hotkey wired up in the theme provider. `resolvedTheme` is
 * unknown until the provider has read the DOM, so the icon renders in its light
 * state through the first paint rather than mismatching the server markup.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title="Toggle theme (D)"
    >
      <HugeiconsIcon icon={isDark ? MoonEclipseIcon : Sun03Icon} strokeWidth={2} />
    </Button>
  )
}

function OverflowMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="More options" />
        }
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
      </DropdownMenuTrigger>
      {/* Content is sized to its trigger by default — a 28px icon button. */}
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={(v) => setTheme(String(v))}
        >
          {/* Base UI resolves GroupLabel through context, so it has to sit
              inside the RadioGroup rather than above it. */}
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioItem value="light">
            <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <HugeiconsIcon icon={MoonEclipseIcon} strokeWidth={2} />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {LINKS.map((link) => (
          <DropdownMenuItem
            key={link.href}
            render={
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
