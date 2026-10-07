import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// ---------------------------------------------------------------------------
// Environment variable validation
// All six values are required. A missing variable fails loudly at startup
// rather than producing a confusing runtime error later.
// ---------------------------------------------------------------------------

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

type RequiredVar = typeof REQUIRED_VARS[number]

function getRequiredEnv(key: RequiredVar): string {
  const value = import.meta.env[key] as string | undefined
  if (!value) {
    throw new Error(
      `[firebase] Missing required environment variable: ${key}\n` +
      `Make sure it is defined in your .env file and starts with VITE_.`
    )
  }
  return value
}

// ---------------------------------------------------------------------------
// Firebase configuration — reads from Vite env variables
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey:            getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getRequiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getRequiredEnv('VITE_FIREBASE_APP_ID'),
}

// ---------------------------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------------------------

export const app: FirebaseApp = initializeApp(firebaseConfig)

// Firestore database instance — used by future service functions in api.ts
export const db: Firestore = getFirestore(app)

export const auth = getAuth(app)