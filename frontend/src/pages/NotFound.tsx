import { Link } from 'react-router-dom'
import { MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main id="main-content" className="container mx-auto px-4 py-24 text-center max-w-md">
      <div className="w-14 h-14 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
        <MapPin className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        The page you're looking for doesn't exist. It may have been moved or the URL may be incorrect.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Go home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/explore">Explore Map</Link>
        </Button>
      </div>
    </main>
  )
}
