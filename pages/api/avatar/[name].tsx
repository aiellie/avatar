import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { renderToReadableStream } from 'react-dom/server'
import { iconGlyph } from '../../../components/hugeicon'
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
import {
  ORB_VIEWPORT,
  type OrbArtwork,
  generateOrb,
} from '../../../utils/orb'
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
 * The orb style: the seed's three colours ramped across the box, organic
 * regions of them poured over it, a sheen at the light end and a shaded rim —
 * a still of the orb the `aiellie/images` playground animates for the same
 * name.
 *
 * Laid out in a 100-unit viewport and scaled to cover the box, like glass, so
 * a banner is a wider crop of one orb rather than a stretched one. All of it
 * is clipped to the box, which is why the one blur below is cropped to the
 * viewport rather than to the shapes: sizing the region to the shapes leaves
 * resvg filtering several times the visible surface at 2048px.
 */
function orbBackground(art: OrbArtwork, { width, height, rounded }: Box) {
  const scale = Math.max(width, height) / ORB_VIEWPORT
  const span = ORB_VIEWPORT * scale
  const radians = (art.ramp.angle * Math.PI) / 180
  // Half a unit vector each way: the ramp crosses the box along `angle`.
  const dx = Math.cos(radians) / 2
  const dy = Math.sin(radians) / 2

  return (
    <g>
      <defs>
        <linearGradient
          id="orb-ramp"
          x1={0.5 - dx}
          y1={0.5 - dy}
          x2={0.5 + dx}
          y2={0.5 + dy}
        >
          <stop offset="0%" stopColor={art.ramp.from} />
          <stop
            offset={`${(art.ramp.midpoint * 100).toFixed(1)}%`}
            stopColor={art.ramp.mid}
          />
          <stop offset="100%" stopColor={art.ramp.to} />
        </linearGradient>
        {/* Both of these ride the element they fill: the sheen lands inside its
            own circle, and the rim follows whatever shape the box is. */}
        <radialGradient id="orb-sheen">
          <stop
            offset="0%"
            stopColor="#fff"
            stopOpacity={art.highlight.opacity}
          />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb-shade">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={art.shade} />
        </radialGradient>
        <filter
          id="orb-soften"
          x={-25}
          y={-25}
          width={150}
          height={150}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={art.blur} />
        </filter>
        <clipPath id="orb-clip">
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
      <g clipPath="url(#orb-clip)">
        <rect
          fill="url(#orb-ramp)"
          x="0"
          y="0"
          width={width}
          height={height}
        />
        <g
          transform={`translate(${(width - span) / 2} ${(height - span) / 2}) scale(${scale})`}
        >
          <g filter="url(#orb-soften)">
            {art.layers.map((layer, index) => (
              <path key={index} d={layer.path} fill={layer.color} />
            ))}
          </g>
          <circle
            cx={art.highlight.x}
            cy={art.highlight.y}
            r={art.highlight.r}
            fill="url(#orb-sheen)"
            style={{ mixBlendMode: 'screen' }}
          />
        </g>
        {/* The rim last, over the artwork, so the whole thing sits in a ball
            rather than each layer being shaded on its own. */}
        <rect
          fill="url(#orb-shade)"
          x="0"
          y="0"
          width={width}
          height={height}
        />
      </g>
    </g>
  )
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
    style === 'orb'
      ? orbBackground(generateOrb(seed), box)
      : style === 'glass'
        ? glassBackground(generateGlass(seed), box)
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
