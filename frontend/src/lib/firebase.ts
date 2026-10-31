import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

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

const emulatorMode = import.meta.env.MODE === 'emulator'
const emulatorOptIn = import.meta.env.VITE_USE_FIRESTORE_EMULATOR
const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
const emulatorPort = import.meta.env.VITE_FIRESTORE_EMULATOR_PORT
const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST
const authEmulatorPort = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT

if (emulatorOptIn !== undefined && emulatorOptIn !== 'true' && emulatorOptIn !== 'false') {
  throw new Error('[firebase] VITE_USE_FIRESTORE_EMULATOR must be exactly "true" or "false".')
}

if (emulatorMode !== (emulatorOptIn === 'true')) {
  throw new Error(
    '[firebase] Emulator mode and VITE_USE_FIRESTORE_EMULATOR must both be enabled together. ' +
    'Use "npm run dev:emulator" for local Firestore Emulator testing.'
  )
}

if (emulatorMode) {
  if (emulatorHost !== '127.0.0.1' || emulatorPort !== '8080') {
    throw new Error('[firebase] Emulator mode requires the configured local Firestore endpoint 127.0.0.1:8080.')
  }
  if (authEmulatorHost !== '127.0.0.1' || authEmulatorPort !== '9099') {
    throw new Error('[firebase] Emulator mode requires the configured local Auth Emulator endpoint 127.0.0.1:9099.')
  }
  if (firebaseConfig.projectId !== 'accessible-chattogram') {
    throw new Error('[firebase] Emulator mode project ID must match the local Emulator project accessible-chattogram.')
  }
} else if (emulatorHost !== undefined || emulatorPort !== undefined || authEmulatorHost !== undefined || authEmulatorPort !== undefined) {
  throw new Error('[firebase] Emulator host/port were set outside Emulator mode; refusing ambiguous configuration.')
}

// ---------------------------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------------------------

export const app: FirebaseApp = initializeApp(firebaseConfig)

// Firestore database instance — used by future service functions in api.ts
export const db: Firestore = getFirestore(app)
export const auth = getAuth(app)

// Connect before exporting db to services. If the local Emulator is unavailable,
// Firestore operations fail against this endpoint; they never fall back to production.
if (emulatorMode) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
