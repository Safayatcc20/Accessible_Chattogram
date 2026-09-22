import { Link } from 'react-router-dom'
import { MapPin, Database, Users, RefreshCw, Github, ArrowRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function About() {
  return (
    <main id="main-content" className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-4">About Accessible Chattogram</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
          A community-driven accessibility data platform designed to make accessibility information easier to discover, verify, and share across Chattogram, Bangladesh.
        </p>
      </div>

      <Separator className="mb-10" />

      {/* Why this exists */}
      <section aria-labelledby="why-heading" className="mb-10">
        <h2 id="why-heading" className="text-xl font-bold text-foreground mb-4">Why this project exists</h2>
        <div className="space-y-4 text-sm text-foreground leading-relaxed">
          <p>
            For people with physical disabilities, visual impairments, or reduced mobility, the decision to visit a new place depends heavily on whether it's physically accessible. In Chattogram — a city of over 4 million people — this information is almost entirely unavailable in a structured, searchable form.
          </p>
          <p>
            People are left to call ahead and hope someone answers, rely on word-of-mouth, or simply discover a barrier when they arrive — sometimes after a long journey. This project exists to change that.
          </p>
          <p>
            Accessible Chattogram collects, structures, and makes available accessibility information for public places across the city. The data comes from the community: people who visit places, check accessibility features, and share what they find.
          </p>
        </div>
      </section>

      {/* How data works */}
      <section aria-labelledby="data-heading" className="mb-10">
        <h2 id="data-heading" className="text-xl font-bold text-foreground mb-6">How the data works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              Icon: Globe,
              title: 'OpenStreetMap integration',
              desc: 'Place locations and basic details are sourced from OpenStreetMap, the world\'s largest open geographic database. OpenStreetMap data is community-edited and freely available for use.',
            },
            {
              Icon: Users,
              title: 'Community verification',
              desc: 'Accessibility information is contributed and verified by community members who visit places in person. More confirmations from different people increases data reliability.',
            },
            {
              Icon: Database,
              title: 'Structured accessibility data',
              desc: 'Rather than free-text reviews, we use a structured format: each feature is marked as available, not available, or information unavailable. This distinction matters — unknown is not the same as absent.',
            },
            {
              Icon: RefreshCw,
              title: 'Data freshness',
              desc: 'Accessibility features change — a ramp gets installed, a lift breaks down, a new accessible toilet opens. We track when data was last verified so users know how fresh the information is.',
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-10" />

      {/* Data principles */}
      <section aria-labelledby="principles-heading" className="mb-10">
        <h2 id="principles-heading" className="text-xl font-bold text-foreground mb-4">Data principles</h2>
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="text-foreground">
            <strong>We never assume absence from missing data.</strong> If we don't have information about whether a ramp exists, we say "information unavailable" — not "no ramp". Incorrect negative information can prevent people from visiting places they could actually access.
          </p>
          <p className="text-muted-foreground">
            Submitted data is reviewed before being published. Community reports increase a place's "verification count", which helps users understand how reliably confirmed the information is.
          </p>
          <p className="text-muted-foreground">
            We recommend verifying critical accessibility details directly with a venue before visiting, especially for medical appointments or other high-stakes visits where an inaccessible entrance would be a serious problem.
          </p>
        </div>
      </section>

      <Separator className="mb-10" />

      {/* Open source */}
      <section aria-labelledby="opensource-heading" className="mb-10">
        <h2 id="opensource-heading" className="text-xl font-bold text-foreground mb-4">Open-source contribution</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          Accessible Chattogram is an open-source project. The codebase, data schema, and infrastructure are available for review, contribution, and reuse. If you're a developer, designer, or researcher who wants to help, contributions are welcome.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4" aria-hidden="true" />
              View on GitHub
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              OpenStreetMap
            </a>
          </Button>
        </div>
      </section>

      <Separator className="mb-10" />

      {/* Tech stack */}
      <section aria-labelledby="tech-heading" className="mb-10">
        <h2 id="tech-heading" className="text-xl font-bold text-foreground mb-4">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui',
            'React Router', 'TanStack Query', 'Leaflet', 'OpenStreetMap',
            'React Hook Form', 'Zod',
          ].map(tech => (
            <span key={tech} className="text-xs border border-border rounded-md px-2.5 py-1 text-muted-foreground bg-secondary/40">
              {tech}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          The backend will be built with FastAPI and PostgreSQL/PostGIS for geospatial queries.
        </p>
      </section>

      {/* CTA */}
      <div className="border border-border rounded-lg p-6 text-center bg-secondary/20">
        <h2 className="text-lg font-semibold text-foreground mb-2">Help build the map</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
          The most valuable contribution is accurate, on-the-ground accessibility information from people who visit these places.
        </p>
        <Button asChild className="gap-2">
          <Link to="/contribute">
            Start contributing
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </main>
  )
}
