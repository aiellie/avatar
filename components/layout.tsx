import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'

/**
 * Shared chrome for every page. Lives outside `pages/` so Next doesn't route
 * it; `_app.tsx` wraps each page in it. The `<html>`/`<body>` tags and the
 * font variable belong to `_document.tsx` in the Pages Router.
 */
export function Layout({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
