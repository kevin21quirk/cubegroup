import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cube Group - Payroll Automation Platform',
  description: 'Multi-tenant payroll workflow automation platform developed by AI Bridge Solutions',
  icons: {
    icon: '/cubegroupfav.png',
    shortcut: '/cubegroupfav.png',
    apple: '/cubegroupfav.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // TEMPORARY: ClerkProvider disabled until Clerk is configured
    // <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    // </ClerkProvider>
  )
}
