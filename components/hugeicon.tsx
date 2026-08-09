import * as React from 'react'

import {
  ICON_VIEWBOX,
  type IconData,
  iconElementProps,
  iconTransform,
} from '@/utils/hugeicons'

/** The icon's own elements, with the attributes the manifest omits put back. */
function iconElements(data: IconData, color: string) {
  return data.map(([tag, attrs], i) =>
    React.createElement(tag, {
      key: i,
      ...iconElementProps([tag, attrs], color),
    })
  )
}

/**
 * The icon positioned inside a `width`×`height` artboard — what the generated
 * avatar drops on top of the gradient. Returns a `<g>`, so the caller owns the
 * surrounding `<svg>`.
 *
 * This is a plain function rather than a component on purpose, and the avatar
 * route has to keep *calling* it instead of writing `<IconGlyph />`. Satori,
 * which rasterises the PNG output, walks the element tree without ever
 * invoking a function component or a fragment; hand it either one and it
 * silently returns a blank image, gradient and all.
 */
export function iconGlyph({
  data,
  width,
  height,
  color = '#fff',
}: {
  data: IconData
  width: number
  height: number
  color?: string
}) {
  return (
    <g transform={iconTransform(width, height)}>{iconElements(data, color)}</g>
  )
}

/**
 * A standalone icon for the UI, sized and coloured by CSS. Browser-only — see
 * `iconGlyph` for the render path Satori has to cope with.
 */
export function HugeIcon({
  data,
  className,
  ...props
}: { data: IconData } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      fill="none"
      aria-hidden
      className={className}
      {...props}
    >
      {iconElements(data, 'currentColor')}
    </svg>
  )
}
