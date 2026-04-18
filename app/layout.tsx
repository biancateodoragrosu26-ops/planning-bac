import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

const APP_NAME = 'Planning Bac'
const APP_DESCRIPTION = 'Organisation simple des revisions du baccalaureat.'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6efe5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
