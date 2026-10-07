/**
 * useAdminAuth
 *
 * Returns the current Firebase auth state AND whether the authenticated user
 * is a recognized admin (verified via Firestore `admins/{uid}` document).
 *
 * Authorization model:
 *   - Authentication: Firebase Email/Password sign-in
 *   - Authorization:  Firestore `admins` collection — only UIDs listed there
 *                     are treated as admins. Being logged in is NOT enough.
 *
 * This is a client-side check. The Firestore rules for sensitive collections
 * must also enforce `request.auth != null && exists(/databases/.../admins/$(request.auth.uid))`
 * so that a non-admin authenticated user is still blocked at the database level.
 */

import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export type AdminAuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated-not-admin'; user: User }
  | { status: 'admin'; user: User }

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({ status: 'loading' })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'unauthenticated' })
        return
      }

      // User is authenticated — now check admin authorization
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid))
        if (adminDoc.exists()) {
          setState({ status: 'admin', user })
        } else {
          setState({ status: 'authenticated-not-admin', user })
        }
      } catch {
        // Firestore read failed (e.g. rules denied) — treat as not admin
        setState({ status: 'authenticated-not-admin', user })
      }
    })

    return unsubscribe
  }, [])

  return state
}