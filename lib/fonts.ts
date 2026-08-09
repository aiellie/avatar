import { Geist } from 'next/font/google'

/**
 * `next/font` has to be called from `_app.tsx`'s module graph — calling it in
 * `_document.tsx` is rejected outright, and importing the result there applies
 * the class without ever emitting the font's CSS.
 */
export const fontSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
