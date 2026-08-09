import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { Layout } from '@/components/layout'
import { fontSans } from '@/lib/fonts'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* The variable has to sit on :root, not on a wrapper — Base UI
            portals its popovers and selects to <body>, outside the page
            tree, and they still have to resolve the font. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-sans:${fontSans.style.fontFamily};}`,
          }}
        />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
