/**
 * AdminLogin
 *
 * Firebase Email/Password sign-in page for admin access.
 * After successful sign-in the user is redirected to /admin.
 * The /admin route's own guard verifies Firestore admin authorization
 * before rendering any admin content.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Shield } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Redirect to admin dashboard — the AdminGuard there checks authorization
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      // Firebase auth error codes:
      // auth/invalid-credential, auth/user-not-found, auth/wrong-password
      const code = (err as { code?: string }).code ?? ''
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'     ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.')
      } else {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Admin Sign-in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accessible Chattogram moderation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Admin sign-in form">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                disabled={loading}
                className="mt-1"
                aria-required="true"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="mt-1"
                aria-required="true"
              />
            </div>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>

        {/* Security note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          This page is for authorized administrators only.
        </p>
      </div>
    </main>
  )
}