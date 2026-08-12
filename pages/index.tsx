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

      <main className="flex min-h-screen flex-col items-center p-0">

        <div className=" w-full max-w-4xl">
          <Playground />
        </div>

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
