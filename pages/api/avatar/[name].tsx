import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { renderToReadableStream } from 'react-dom/server'
import { parseRounded, resolveDimensions } from '../../../utils/dimensions'
import { generateGradient } from '../../../utils/gradient'

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
        {fileType === 'svg' && !!text ? (
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
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  }

  return new ImageResponse(avatar, {
    width,
    height,
  })
}
