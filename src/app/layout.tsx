import type { Metadata } from 'next'
import './globals.css'
    import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'CitasWassap',
  description: 'Intelligent Flow for Modern Salons',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
      <Analytics />
    </html>
  )
}