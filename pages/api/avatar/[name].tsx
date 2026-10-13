import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { renderToReadableStream } from 'react-dom/server'
import { iconGlyph } from '../../../components/hugeicon'
import {
  CRITTER_VIEWPORT,
  type CritterArtwork,
  type CritterLayer,
  generateCritter,
} from '../../../utils/critters'
import { parseRounded, resolveDimensions } from '../../../utils/dimensions'
import {
  GLASS_BLUR,
  GLASS_SHAPE_BOX,
  GLASS_VIEWPORT,
  type GlassArtwork,
  type GlassShape,
  generateGlass,
} from '../../../utils/glass'
import { generateGradient } from '../../../utils/gradient'
import { loadIcon } from '../../../utils/hugeicons-server'
import { parseStyle } from '../../../utils/styles'

export const runtime = 'edge'

type Box = { width: number; height: number; rounded: number }

/**
 * The two-tone blend: one linear gradient across the whole shape.
 *
 * Plain functions rather than components, and *called* rather than mounted —
 * see the note on `iconGlyph` for why Satori leaves us no choice.
 */
function gradientBackground(
  palette: { fromColor: string; toColor: string },
  { width, height, rounded }: Box
) {
  return (
    <g>
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.fromColor} />
          <stop offset="100%" stopColor={palette.toColor} />
        </linearGradient>
      </defs>
      <rect
        fill="url(#gradient)"
        x="0"
        y="0"
        width={width}
        height={height}
        rx={rounded}
        ry={rounded}
      />
    </g>
  )
}

/**
 * The glass style: one flat hue with two blurred glyphs screened over it.
 *
 * The shapes are drawn in a 150-unit box, placed in a 100-unit viewport, and
 * scaled here to whatever the request asked for — so the blur, the offsets and
 * the rotations all stay in the proportions DiceBear picked them in, at any
 * size or ratio.
 */
function glassBackground(art: GlassArtwork, { width, height, rounded }: Box) {
  // Cover rather than stretch: a banner gets a wider crop of the same artwork
  // instead of smeared glyphs.
  const scale = Math.max(width, height) / GLASS_VIEWPORT
  const span = GLASS_VIEWPORT * scale

  return (
    <g>
      <defs>
        {/* DiceBear's own filter opens with an feFlood/feBlend pair left over
            from a Figma export, which resolves to the source unchanged — this
            is the blur it amounts to. The region is spelled out in user units
            because the glyphs vary hugely in width, and a percentage box would
            crop the blur off a narrow one like `i`. */}
        <filter
          id="glass-blur"
          x={-57}
          y={-57}
          width={214}
          height={214}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={GLASS_BLUR} />
        </filter>
        <clipPath id="glass-clip">
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx={rounded}
            ry={rounded}
          />
        </clipPath>
      </defs>
      {/* The glyphs are blurred well past the artboard, so the whole style is
          clipped rather than each layer being shaped to fit. */}
      <g clipPath="url(#glass-clip)">
        <rect
          fill={art.background}
          x="0"
          y="0"
          width={width}
          height={height}
        />
        <g
          transform={`translate(${(width - span) / 2} ${(height - span) / 2}) scale(${scale})`}
        >
          {glassShape(art.back)}
          {glassShape(art.front)}
        </g>
      </g>
    </g>
  )
}

/** One blurred glyph, screened over whatever is already under it. */
function glassShape({ path, offsetX, offsetY, rotation }: GlassShape) {
  // The shape box overhangs the viewport on every side; -25 centres it.
  const inset = (GLASS_VIEWPORT - GLASS_SHAPE_BOX) / 2
  const pivot = GLASS_SHAPE_BOX / 2

  return (
    <g style={{ mixBlendMode: 'screen' }} opacity="0.6" filter="url(#glass-blur)">
      <g transform={`translate(${inset} ${inset})`}>
        <path
          d={path}
          fill="#fff"
          transform={`translate(${offsetX} ${offsetY}) rotate(${rotation} ${pivot} ${pivot})`}
        />
      </g>
    </g>
  )
}

/**
 * The critters style: a seeded creature on a pastel backdrop.
 *
 * Contained rather than covered, and sat on the bottom edge: a banner gets
 * more backdrop either side of the same critter, never a critter cropped at
 * the eyes.
 */
function critterBackground(art: CritterArtwork, { width, height, rounded }: Box) {
  const scale = Math.min(width, height) / CRITTER_VIEWPORT
  const span = CRITTER_VIEWPORT * scale

  return (
    <g>
      <defs>
        <clipPath id="critter-clip">
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx={rounded}
            ry={rounded}
          />
        </clipPath>
      </defs>
      {/* The body runs off the bottom edge, so it is clipped with the rest. */}
      <g clipPath="url(#critter-clip)">
        <rect
          fill={art.background}
          x="0"
          y="0"
          width={width}
          height={height}
        />
        <g
          transform={`translate(${(width - span) / 2} ${height - span}) scale(${scale})`}
        >
          {art.layers.map(critterLayer)}
        </g>
      </g>
    </g>
  )
}

function critterLayer(layer: CritterLayer, key: number) {
  switch (layer.kind) {
    case 'path':
      return (
        <path
          key={key}
          d={layer.d}
          fill={layer.fill ?? 'none'}
          stroke={layer.stroke}
          strokeWidth={layer.strokeWidth}
          strokeLinecap={layer.stroke ? 'round' : undefined}
          strokeLinejoin={layer.stroke ? 'round' : undefined}
          opacity={layer.opacity}
        />
      )
    case 'circle':
      return (
        <circle
          key={key}
          cx={layer.cx}
          cy={layer.cy}
          r={layer.r}
          fill={layer.fill}
          opacity={layer.opacity}
        />
      )
    case 'ellipse':
      return (
        <ellipse
          key={key}
          cx={layer.cx}
          cy={layer.cy}
          rx={layer.rx}
          ry={layer.ry}
          fill={layer.fill}
          opacity={layer.opacity}
          // Always a transform, even a no-op one: Satori silently drops an
          // ellipse from the PNG without one.
          transform={`rotate(${layer.rotate ?? 0} ${layer.cx} ${layer.cy})`}
        />
      )
  }
}

export default async function handler(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const name = searchParams.get('name')
  const text = searchParams.get('text')

  const { width, height } = resolveDimensions({
    size: searchParams.get('size'),
    ratio: searchParams.get('ratio'),
    width: searchParams.get('width') ?? searchParams.get('w'),
    height: searchParams.get('height') ?? searchParams.get('h'),
  })
  const rounded = parseRounded(searchParams.get('rounded'), width, height)

  const [username, type] = name?.split('.') || []
  const fileType = type?.includes('svg') ? 'svg' : 'png'

  const seed = username || `${Math.random()}`
  const style = parseStyle(searchParams.get('style'))
  const box = { width, height, rounded }
  const background =
    style === 'glass'
      ? glassBackground(generateGlass(seed), box)
      : style === 'critters'
        ? critterBackground(generateCritter(seed), box)
        : gradientBackground(await generateGradient(seed), box)
  const icon = await loadIcon(req.nextUrl.origin, searchParams.get('icon'))

  // An icon wins when both are set.
  const initials = !icon.data && text ? text : null
  const fontSize = initials
    ? Math.min((width * 0.9) / initials.length, height * 0.9)
    : 0

  // The background, the icon, and — for SVG only — the initials. Satori, which
  // rasterises the PNG, refuses `<text>` nodes outright ("please convert them
  // to <path>"), so the PNG path draws its initials as a layer over this
  // instead, below.
  const artwork = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {background}
        {/* Called, not mounted — see the note on `iconGlyph`. */}
        {icon.data ? iconGlyph({ data: icon.data, width, height }) : null}
        {fileType === 'svg' && initials ? (
          <text
            x="50%"
            y="50%"
            alignmentBaseline="central"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#fff"
            fontFamily="sans-serif"
            fontSize={fontSize}
          >
            {initials}
          </text>
        ) : null}
      </g>
    </svg>
  )

  if (fileType === 'svg') {
    const stream = await renderToReadableStream(artwork)
    return new Response(stream, {
      headers: {
        'Content-Type': 'image/svg+xml',
        // Normally the body is a pure function of the URL and can be pinned for
        // a week. When the icon manifest could not be reached the body is only
        // provisional, so it gets a short window instead — otherwise one
        // blip during a cold start would freeze an icon-less avatar in every
        // cache downstream.
        'Cache-Control': icon.degraded
          ? 'public, max-age=60, stale-while-revalidate=60'
          : 'public, max-age=604800, immutable',
      },
    })
  }

  // Satori lays out text as CSS, not as SVG, so the initials go in a flex box
  // stacked over the artwork rather than in a `<text>` node inside it. The font
  // is whatever `ImageResponse` has embedded, so PNG initials are set in a
  // different face than the browser picks for the SVG's `sans-serif` — the same
  // letters, not the same shapes.
  return new ImageResponse(
    initials ? (
      <div style={{ display: 'flex', position: 'relative', width, height }}>
        {artwork}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize,
            lineHeight: 1,
          }}
        >
          {initials}
        </div>
      </div>
    ) : (
      artwork
    ),
    { width, height }
  )
}
