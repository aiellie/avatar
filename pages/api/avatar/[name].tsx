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
  // Unlike initials, an icon is plain geometry, so it survives rasterisation
  // into PNG as happily as it does the SVG path.
  const icon = await loadIcon(req.nextUrl.origin, searchParams.get('icon'))

  const avatar = (
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
        {icon.data ? (
          iconGlyph({ data: icon.data, width, height })
        ) : fileType === 'svg' && !!text ? (
          <text
            x="50%"
            y="50%"
            alignmentBaseline="central"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#fff"
            fontFamily="sans-serif"
            fontSize={Math.min((width * 0.9) / text.length, height * 0.9)}
          >
            {text}
          </text>
        ) : null}
      </g>
    </svg>
  )

  if (fileType === 'svg') {
    const stream = await renderToReadableStream(avatar)
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

  return new ImageResponse(avatar, {
    width,
    height,
  })
}
