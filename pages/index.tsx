import Head from 'next/head'

import { Playground } from '@/components/playground'

const HEADER_AVATARS = ['ellie', 'sophia', 'party', 'edge']

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

      <main className="flex min-h-screen flex-col items-center px-4 py-16 sm:py-20">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight">Avatar</h1>
          <div className="flex -space-x-2">
            {HEADER_AVATARS.map((n) => (
              <img
                key={n}
                src={`/${n}?size=28`}
                alt={`Avatar for ${n}`}
                width={28}
                height={28}
                className="ring-background rounded-full ring-2"
              />
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-4 max-w-md text-center text-lg">
          Generate beautiful gradient avatars for your application. Every name
          gets its own unique gradient.
        </p>
        <code className="bg-muted mt-4 rounded-md px-3 py-1.5 text-sm">
          https://avatar.aiellie.dev/:name
        </code>

        <div className="mt-10 w-full max-w-4xl">
          <Playground />
        </div>

        <footer className="text-muted-foreground mt-12 text-center text-sm">
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
        </footer>
      </main>
    </>
  )
}
