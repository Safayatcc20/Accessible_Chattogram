import type { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

interface LayoutProps {
  children: ReactNode
  /**
   * fullHeight: suppresses the footer and makes the content area fill the
   * remaining viewport height. Used by the Explore page which owns its own
   * height to keep the map full-screen.
   */
  fullHeight?: boolean
}

// Fix 15: Layout extracted from App.tsx into its own file
export function Layout({ children, fullHeight = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className={fullHeight ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1'}>
        {/* Fix 10: ErrorBoundary wraps all page content */}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
      {!fullHeight && <Footer />}
      <Toaster />
    </div>
  )
}