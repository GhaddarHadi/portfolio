import type { Metadata } from 'next'
import { Chivo, Inter, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'

// Display: technical, confident. Body: neutral, legible. Mono: drafting lettering.
const display = Chivo({
  subsets: ['latin'],
  variable: '--font-chivo',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})
const body = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-spline-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Hadi Ghaddar', template: '%s · Hadi Ghaddar' },
  description: 'Utility distribution engineer and software developer.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
