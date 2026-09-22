import { Link } from 'react-router-dom'
import { MapPin, Github, ExternalLink } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto" role="contentinfo">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center" aria-hidden="true">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Accessible Chattogram</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Building a more accessible Chattogram through open data and community participation.
            </p>
            <p className="mt-4 text-xs text-muted-foreground border border-border rounded-md px-3 py-2 max-w-sm">
              <strong className="text-foreground">Note:</strong> This is a community-driven project. Accessibility information may change over time. Always verify critical details before visiting a place.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Platform</h2>
            <ul className="flex flex-col gap-2" role="list">
              {[
                { to: '/explore', label: 'Explore Map' },
                { to: '/contribute', label: 'Contribute' },
                { to: '/guide', label: 'Accessibility Guide' },
                { to: '/about', label: 'About' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* External links */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Resources</h2>
            <ul className="flex flex-col gap-2" role="list">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <Github className="w-3.5 h-3.5" aria-hidden="true" />
                  GitHub
                  <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.openstreetmap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  OpenStreetMap
                  <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Accessible Chattogram. Open-source community project.</p>
          <p>Built with Open Data and Community Contributions.</p>
        </div>
      </div>
    </footer>
  )
}
