import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, List, Map, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AccessibilityMap } from '@/components/map/AccessibilityMap'
import { MapLegend } from '@/components/map/MapLegend'
import { FilterPanel } from '@/components/places/FilterPanel'
import { PlaceCard } from '@/components/places/PlaceCard'
import { usePlaces } from '@/hooks/usePlaces'
import type { FilterState } from '@/types'

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  accessibilityFeatures: [],
  verificationStatus: [],
  openNow: false,
  hasContact: false,
  recentlyVerified: false,
}

// Fix 8: proper union type names for view mode
type ViewMode = 'map' | 'list' | 'split'

// Fix 1: 'list' not 'filters'
type MobilePanel = 'map' | 'list'

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  // Fix 1: renamed from 'filters' → 'list'
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('map')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Fix 6: ref for focus management on filter drawer
  const filterDrawerCloseRef = useRef<HTMLButtonElement>(null)
  const filterOpenButtonRef = useRef<HTMLButtonElement>(null)

  // Fix 4: also capture isError
  const { data: places, isLoading, isError } = usePlaces(filters)

  // Apply text search locally
  const filtered = places?.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }) ?? []

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const updateSearch = (q: string) => {
    setSearchQuery(q)
    if (q) setSearchParams({ q })
    else setSearchParams({})
  }

  // Fix 6: Escape key closes filter drawer, focus returns to trigger button
  const openFilterDrawer = useCallback(() => {
    setFilterDrawerOpen(true)
  }, [])

  const closeFilterDrawer = useCallback(() => {
    setFilterDrawerOpen(false)
    // Return focus to the button that opened the drawer
    setTimeout(() => filterOpenButtonRef.current?.focus(), 0)
  }, [])

  // Fix 6: Escape key handler on drawer
  useEffect(() => {
    if (!filterDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFilterDrawer()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filterDrawerOpen, closeFilterDrawer])

  // Fix 6: Move focus into drawer when it opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setTimeout(() => filterDrawerCloseRef.current?.focus(), 0)
    }
  }, [filterDrawerOpen])

  return (
    // Fix 11: 100dvh accounts for mobile browser address bar
    <div className="h-[calc(100dvh-4rem)] flex flex-col" id="main-content">
      {/* Toolbar */}
      <div className="border-b border-border bg-background px-4 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 min-w-48">
          <Input
            value={searchQuery}
            onChange={e => updateSearch(e.target.value)}
            placeholder="Search places, areas..."
            className="h-9 text-sm pr-8"
            aria-label="Filter places by name or area"
          />
          {searchQuery && (
            <button
              onClick={() => updateSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: Filter + Map/List toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            ref={filterOpenButtonRef}
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={openFilterDrawer}
            aria-haspopup="dialog"
            aria-expanded={filterDrawerOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filters
          </Button>

          {/* Fix 8: role="radiogroup" for mutually exclusive panel toggle */}
          <div
            role="radiogroup"
            aria-label="View panel"
            className="flex border border-border rounded-md overflow-hidden"
          >
            <Button
              role="radio"
              aria-checked={mobilePanel === 'map'}
              variant={mobilePanel === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-none px-3"
              onClick={() => setMobilePanel('map')}
              aria-label="Show map"
            >
              <Map className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            {/* Fix 1: was setMobilePanel('filters'), now 'list' */}
            <Button
              role="radio"
              aria-checked={mobilePanel === 'list'}
              variant={mobilePanel === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-none px-3 border-l border-border"
              onClick={() => setMobilePanel('list')}
              aria-label="Show list"
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Desktop: View mode — Fix 8: role="radiogroup" */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Fix 7: aria-live region for result count */}
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading ? 'Loading…' : `${filtered.length} places`}
          </span>
          <div
            role="radiogroup"
            aria-label="Map view mode"
            className="flex border border-border rounded-md overflow-hidden"
          >
            {([['split', 'Split view'], ['map', 'Map only'], ['list', 'List only']] as [ViewMode, string][]).map(([mode, label]) => (
              <Button
                key={mode}
                role="radio"
                aria-checked={viewMode === mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 rounded-none px-3 text-xs border-l border-border first:border-l-0"
                onClick={() => setViewMode(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Filter panel — Desktop */}
        <aside
          className={`hidden lg:flex flex-col border-r border-border bg-background overflow-hidden transition-all ${
            viewMode === 'map' ? 'w-0' : 'w-72'
          }`}
          aria-label="Filter sidebar"
        >
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
          />
        </aside>

        {/* List panel — Desktop */}
        {viewMode !== 'map' && (
          <div className="hidden lg:flex flex-col w-80 border-r border-border bg-background overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Fix 4: error state */}
              {isError ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Failed to load places.</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                </div>
              ) : isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No places match your filters.</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                filtered.map(place => (
                  <PlaceCard key={place.id} place={place} compact />
                ))
              )}
            </div>
          </div>
        )}

        {/* Map — Desktop */}
        {viewMode !== 'list' && (
          <div className="hidden lg:flex flex-1 relative">
            {isError ? (
              <div className="flex-1 flex items-center justify-center bg-secondary/20">
                <div className="text-center flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Map could not be loaded.</p>
                </div>
              </div>
            ) : (
              places && <AccessibilityMap places={filtered} height="100%" />
            )}
            {/* Fix 5: Map legend on Explore page */}
            {!isError && <MapLegend />}
          </div>
        )}

        {/* Mobile: Map or List */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {/* Fix 1: check against 'list' not 'filters' */}
          {mobilePanel === 'map' ? (
            <div className="flex-1 relative">
              {isError ? (
                <div className="flex-1 h-full flex items-center justify-center bg-secondary/20">
                  <div className="text-center flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">Map could not be loaded.</p>
                  </div>
                </div>
              ) : (
                places && <AccessibilityMap places={filtered} height="100%" />
              )}
              {/* Fix 5: legend on mobile map too */}
              {!isError && <MapLegend />}
            </div>
          ) : (
            // Fix 1: this panel is shown when mobilePanel === 'list'
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
              {isError ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Failed to load places.</p>
                </div>
              ) : isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No places match your filters.</p>
                </div>
              ) : (
                filtered.map(place => (
                  <PlaceCard key={place.id} place={place} compact />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fix 6: Mobile filter drawer with dialog role, aria-modal, focus management */}
      {filterDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-drawer-title"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeFilterDrawer}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={closeFilterDrawer}
              resultCount={filtered.length}
              titleId="filter-drawer-title"
              closeRef={filterDrawerCloseRef}
            />
          </div>
        </div>
      )}
    </div>
  )
}