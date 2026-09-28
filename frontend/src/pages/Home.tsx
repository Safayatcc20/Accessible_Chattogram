import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Map, ArrowRight, ShieldCheck, Users, Database, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AccessibilityMap } from '@/components/map/AccessibilityMap'
import { useStats, usePlaces } from '@/hooks/usePlaces'
import { cn } from '@/lib/utils'

// Mock stats are displayed as demo values — not real verified statistics
const STATS_CONFIG = [
  { key: 'totalPlaces', label: 'Places Mapped', Icon: Map, suffix: '+' },
  { key: 'totalReports', label: 'Community Reports', Icon: Database, suffix: '+' },
  { key: 'verifiedPlaces', label: 'Verified Places', Icon: ShieldCheck, suffix: '+' },
  { key: 'areasCount', label: 'Areas Covered', Icon: TrendingUp, suffix: '+' },
] as const

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: places } = usePlaces()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/explore')
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-background" aria-labelledby="hero-heading">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/8 border border-primary/20 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              Community-driven · Open Data · Chattogram
            </div>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Making Chattogram<br />
              <span className="text-primary">More Accessible</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Find, verify, and share accessibility information about places across Chattogram. Community-driven data you can trust.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8" role="search">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search places, areas, or accessibility features..."
                className="pl-10 pr-28 h-12 text-sm"
                aria-label="Search accessibility map"
              />
              <Button type="submit" size="sm" className="absolute right-1.5 h-9">
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Wheelchair accessible hospital', 'GEC restaurant', 'Accessible toilet', 'Ramp near airport'].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setQuery(q); navigate(`/explore?q=${encodeURIComponent(q)}`) }}
                  className="text-xs text-muted-foreground hover:text-primary bg-secondary rounded-full px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/explore">
                <Map className="w-4 h-4" aria-hidden="true" />
                Explore Accessible Places
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contribute">
                Help Improve the Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Map preview */}
      <section aria-label="Map preview" className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Explore the Map</h2>
              <p className="text-sm text-muted-foreground">{places?.length ?? 0} places mapped across Chattogram</p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/explore">
                Open full map
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden shadow-sm" style={{ height: '380px' }}>
            {places && (
              <AccessibilityMap places={places} height="380px" zoom={12} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <LegendItem color="#1e7e4c" label="Verified — Good Accessibility" />
            <LegendItem color="#1d4ed8" label="Verified" />
            <LegendItem color="#b45309" label="Community Reported" />
            <LegendItem color="#64748b" label="Not Verified" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <h2 id="stats-heading" className="sr-only">Platform statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS_CONFIG.map(({ key, label, Icon, suffix }) => (
              <div key={key} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-foreground mb-1" aria-label={`${stats?.[key]}${suffix} ${label}`}>
                    {stats?.[key].toLocaleString()}{suffix}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-b border-border">
        <div className="container mx-auto px-4 py-14 max-w-4xl">
          <h2 id="how-heading" className="text-2xl font-bold text-foreground mb-2 text-center">How it works</h2>
          <p className="text-muted-foreground text-center mb-10 text-sm">Three ways to make accessibility information more available.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '1',
                title: 'Find places',
                desc: 'Search or explore the map to find accessibility information about hospitals, schools, restaurants, and more across Chattogram.',
                link: '/explore',
                linkLabel: 'Start exploring',
              },
              {
                num: '2',
                title: 'Verify information',
                desc: 'Visited a place? Confirm or correct its accessibility details. Community verification improves data quality over time.',
                link: '/contribute',
                linkLabel: 'Contribute now',
              },
              {
                num: '3',
                title: 'Add missing places',
                desc: "Can't find a place? Submit it with what you know. Even partial information helps other community members.",
                link: '/contribute',
                linkLabel: 'Add a place',
              },
            ].map(step => (
              <div key={step.num} className="border border-border rounded-lg p-5">
                <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mb-4" aria-hidden="true">
                  {step.num}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
                <Link
                  to={step.link}
                  className={cn(
                    'text-sm font-medium text-primary hover:underline inline-flex items-center gap-1',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
                  )}
                >
                  {step.linkLabel}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section aria-labelledby="cta-heading" className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
          <Users className="w-8 h-8 mx-auto mb-4 opacity-80" aria-hidden="true" />
          <h2 id="cta-heading" className="text-2xl font-bold mb-3">Join the community effort</h2>
          <p className="text-primary-foreground/80 mb-6 text-sm leading-relaxed">
            Every contribution — a verified ramp, a confirmed accessible toilet, a corrected address — makes Chattogram more navigable for people with disabilities.
          </p>
          <Button asChild variant="secondary" size="lg">
            <Link to="/contribute">Start Contributing</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}