import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, List, Map, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AccessibilityMap } from '@/components/map/AccessibilityMap'
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

type ViewMode = 'map' | 'list' | 'split'

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [mobilePanel, setMobilePanel] = useState<'map' | 'filters'>('map')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const { data: places, isLoading } = usePlaces(filters)

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col" id="main-content">
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
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => setFilterDrawerOpen(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filters
          </Button>
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button
              variant={mobilePanel === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-none px-3"
              onClick={() => setMobilePanel('map')}
              aria-label="Show map"
              aria-pressed={mobilePanel === 'map'}
            >
              <Map className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant={mobilePanel !== 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 rounded-none px-3 border-l border-border"
              onClick={() => setMobilePanel('filters')}
              aria-label="Show list"
              aria-pressed={mobilePanel !== 'map'}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Desktop: View mode */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} places</span>
          <div className="flex border border-border rounded-md overflow-hidden">
            {([['split', 'Split view'], ['map', 'Map only'], ['list', 'List only']] as [ViewMode, string][]).map(([mode, label]) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 rounded-none px-3 text-xs border-l border-border first:border-l-0"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Filter panel - Desktop */}
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

        {/* List panel - Desktop */}
        {viewMode !== 'map' && (
          <div className="hidden lg:flex flex-col w-80 border-r border-border bg-background overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
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

        {/* Map */}
        {viewMode !== 'list' && (
          <div className="hidden lg:flex flex-1 relative">
            {places && <AccessibilityMap places={filtered} height="100%" />}
          </div>
        )}

        {/* Mobile: Map or List */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {mobilePanel === 'map' ? (
            <div className="flex-1 relative">
              {places && <AccessibilityMap places={filtered} height="100%" />}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
              {isLoading ? (
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

      {/* Mobile filter drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setFilterDrawerOpen(false)}
              resultCount={filtered.length}
            />
          </div>
        </div>
      )}
    </div>
  )
}
