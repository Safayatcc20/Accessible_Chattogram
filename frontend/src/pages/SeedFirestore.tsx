/**
 * SeedFirestore.tsx
 *
 * ONE-TIME seed page — migrates the 24 mock places into Firestore.
 *
 * HOW TO RUN:
 *   1.  npm run dev
 *   2.  Open http://localhost:5173/seed in your browser
 *   3.  Click "Run Seed" and wait for all 24 documents to appear as ✓
 *   4.  Once done, this page is no longer needed (but leave the file — it
 *       does nothing unless you visit /seed and click the button)
 *
 * IDEMPOTENT: uses setDoc() with merge:false (full overwrite).
 * Running again will overwrite the same 24 doc IDs — no duplicates.
 *
 * DATA RULES APPLIED:
 *   - doc ID  = place.id  (NOT stored inside document body)
 *   - lastVerified 'YYYY-MM-DD' string → Firestore Timestamp
 *   - lastVerified null               → null (preserved)
 *   - optional fields absent in mock  → stored as null
 *   - boolean | null accessibility    → preserved exactly
 *   - createdAt / updatedAt           → serverTimestamp()
 */

import { useState } from 'react'
import {
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MOCK_PLACES } from '@/data/mockPlaces'
import type { Place } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Convert 'YYYY-MM-DD' string → Firestore Timestamp. null stays null. */
function toTimestamp(dateStr: string | null): Timestamp | null {
  if (!dateStr) return null
  return Timestamp.fromDate(new Date(dateStr + 'T00:00:00Z'))
}

/**
 * Build the exact Firestore document body for a Place.
 * - id is NOT included (used as doc ID by the caller)
 * - optional fields that are undefined in mock data are stored as null
 * - lastVerified is converted to Timestamp | null
 * - createdAt / updatedAt use serverTimestamp()
 */
function buildDocument(place: Place) {
  const a = place.accessibility

  return {
    // ── core ────────────────────────────────────────────────────────────
    name:         place.name,
    category:     place.category,
    address:      place.address,
    area:         place.area,
    description:  place.description  ?? null,
    phone:        place.phone        ?? null,
    website:      place.website      ?? null,
    openingHours: place.openingHours ?? null,

    // ── location ────────────────────────────────────────────────────────
    latitude:  place.latitude,
    longitude: place.longitude,

    // ── runtime display field ───────────────────────────────────────────
    isOpenNow: place.isOpenNow ?? null,

    // ── accessibility (preserve true / false / null exactly) ────────────
    accessibility: {
      wheelchairEntrance: a.wheelchairEntrance,
      ramp:               a.ramp,
      elevator:           a.elevator,
      accessibleToilet:   a.accessibleToilet,
      accessibleParking:  a.accessibleParking,
      tactilePaving:      a.tactilePaving,
      audioAssistance:    a.audioAssistance,
      // optional sub-fields — null when absent
      accessiblePathways: a.accessiblePathways  ?? null,
      doorWidth:          a.doorWidth           ?? null,
      entranceSurface:    a.entranceSurface      ?? null,
      elevatorNotes:      a.elevatorNotes        ?? null,
      restroomNotes:      a.restroomNotes        ?? null,
      parkingDistance:    a.parkingDistance      ?? null,
    },

    // ── verification ────────────────────────────────────────────────────
    verification: {
      status:            place.verification.status,
      // KEY TRANSFORM: string | null → Timestamp | null
      lastVerified:      toTimestamp(place.verification.lastVerified),
      verificationCount: place.verification.verificationCount,
      communityReports:  place.verification.communityReports,
      source:            place.verification.source,
    },

    // ── Firestore-only timestamps (not in Place type) ───────────────────
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

// ─── types ──────────────────────────────────────────────────────────────────

type DocStatus = 'idle' | 'pending' | 'success' | 'error'

interface DocResult {
  id:     string
  name:   string
  status: DocStatus
  error?: string
}

// ─── component ──────────────────────────────────────────────────────────────

export default function SeedFirestore() {
  const [results, setResults] = useState<DocResult[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount   = results.filter(r => r.status === 'error').length

  const updateResult = (id: string, patch: Partial<DocResult>) => {
    setResults(prev =>
      prev.map(r => r.id === id ? { ...r, ...patch } : r)
    )
  }

  const runSeed = async () => {
    if (running) return
    setRunning(true)
    setDone(false)

    // Initialise all rows as pending
    setResults(
      MOCK_PLACES.map(p => ({ id: p.id, name: p.name, status: 'pending' }))
    )

    // Write documents one at a time so the UI updates progressively
    for (const place of MOCK_PLACES) {
      try {
        const docRef  = doc(db, 'places', place.id)
        const payload = buildDocument(place)
        await setDoc(docRef, payload)                    // full overwrite — idempotent
        updateResult(place.id, { status: 'success' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        updateResult(place.id, { status: 'error', error: msg })
        console.error(`[seed] ${place.id} failed:`, err)
      }
    }

    setRunning(false)
    setDone(true)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Firestore Seed — Places Collection
        </h1>
        <p className="text-sm text-muted-foreground">
          Migrates all 24 mock places into Firestore. Safe to run multiple
          times — each run overwrites the same document IDs.
        </p>
      </div>

      {/* Warning banner */}
      <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
        <strong>Development tool.</strong> Only use this page during initial
        setup. Make sure your <code>.env</code> is configured and Firestore
        security rules allow writes (temporarily set to Test Mode or
        authenticated writes).
      </div>

      {/* Action */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={runSeed}
          disabled={running}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {running ? `Writing… (${successCount + errorCount}/${MOCK_PLACES.length})` : 'Run Seed'}
        </button>

        {done && (
          <span className="text-sm font-medium">
            {errorCount === 0
              ? <span className="text-green-700 dark:text-green-400">✓ {successCount} documents written successfully</span>
              : <span className="text-red-600 dark:text-red-400">⚠ {successCount} ok, {errorCount} failed — check console</span>
            }
          </span>
        )}
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left">
                <th className="px-3 py-2 font-medium text-muted-foreground w-16">ID</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Place</th>
                <th className="px-3 py-2 font-medium text-muted-foreground w-24 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/20'}`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-2 text-foreground">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'pending' && <span className="text-muted-foreground">writing…</span>}
                    {r.status === 'success' && <span className="text-green-700 dark:text-green-400 font-medium">✓</span>}
                    {r.status === 'error'   && (
                      <span className="text-red-600 dark:text-red-400" title={r.error}>✗ error</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}