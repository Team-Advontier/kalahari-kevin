// pages/_app.tsx
// This is the main app component for the application.
// It contains the main layout and the main app component.

import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
