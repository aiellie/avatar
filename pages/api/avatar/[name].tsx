import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { renderToReadableStream } from 'react-dom/server'
import { iconGlyph } from '../../../components/hugeicon'
import { parseRounded, resolveDimensions } from '../../../utils/dimensions'
import { generateGradient } from '../../../utils/gradient'
import { loadIcon } from '../../../utils/hugeicons-server'

export const runtime = 'edge'

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

  const gradient = await generateGradient(username || `${Math.random()}`)
  const icon = await loadIcon(req.nextUrl.origin, searchParams.get('icon'))

  // An icon wins when both are set.
  const initials = !icon.data && text ? text : null
  const fontSize = initials
    ? Math.min((width * 0.9) / initials.length, height * 0.9)
    : 0

  // The gradient, the icon, and — for SVG only — the initials. Satori, which
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
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradient.fromColor} />
            <stop offset="100%" stopColor={gradient.toColor} />
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
