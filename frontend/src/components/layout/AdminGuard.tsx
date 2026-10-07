/**
 * AdminGuard
 *
 * Wraps admin-only routes. Shows a loading state while auth is resolving,
 * redirects to /admin/login if the user is unauthenticated, and shows an
 * access-denied message if they are authenticated but not listed in the
 * Firestore `admins` collection.
 *
 * This is a client-side guard. The Firestore rules provide the server-side
 * enforcement layer — this component only controls what is rendered.
 */

import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldOff, Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const authState = useAdminAuth()

  if (authState.status === 'loading') {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" aria-label="Checking authorization…" />
      </div>
    )
  }

  if (authState.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />
  }

  if (authState.status === 'authenticated-not-admin') {
    return (
      <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div
            className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <ShieldOff className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account ({authState.user.email}) is not authorized to access
            the admin area.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut(auth)}
          >
            Sign out
          </Button>
        </div>
      </main>
    )
  }

  // status === 'admin'
  return <>{children}</>
}