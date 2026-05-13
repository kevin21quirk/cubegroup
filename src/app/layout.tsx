import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { ClerkProvider } from '@clerk/nextjs'
// import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cube Group - Payroll Automation Platform',
  description: 'Multi-tenant payroll workflow automation platform developed by AI Bridge Solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // TEMPORARY: ClerkProvider and ThemeProvider disabled
    // <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    // </ClerkProvider>
  )
}
