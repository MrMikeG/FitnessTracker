import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pulse — Training Dashboard',
  description: 'Your daily training companion',
  applicationName: 'Pulse Training',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Pulse' },
  formatDetection: { telephone: false }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" suppressHydrationWarning><body>{children}</body></html>
}
