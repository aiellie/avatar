import Head from 'next/head'

import { Playground } from '@/components/playground'

export default function Home() {
  return (
    <>
      <Head>
        <title>Avatar — aiellie.dev</title>
        <meta
          name="description"
          content="Generate beautiful gradient avatars for your application."
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      {/* The playground brings its own header, which has to reach the full
          width of the viewport — so no max-width wrapper here. */}
      <main className="flex min-h-screen w-full flex-col p-0">
        <Playground />

       {/* <footer className="text-muted-foreground mt-12 text-center text-sm">
          <a
            className="hover:text-foreground underline underline-offset-4 transition-colors"
            href="https://aiellie.dev"
            target="_blank"
            rel="noreferrer"
          >
            aiellie.dev
          </a>{' '}
          — based on{' '}
          <a
            className="hover:text-foreground underline underline-offset-4 transition-colors"
            href="https://github.com/vercel/avatar"
            target="_blank"
            rel="noreferrer"
          >
            vercel/avatar
          </a>
        </footer> */}
      </main>
    </>
  )
}
