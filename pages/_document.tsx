import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html
      lang="en"
      dir="ltr"
      // next-themes swaps the `dark` class on <html> before hydration.
      suppressHydrationWarning
    >
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
