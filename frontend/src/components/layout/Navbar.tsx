import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Search, Sun, Moon, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, toggle } = useTheme()
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { to: '/explore', label: 'Explore' },
    { to: '/guide', label: 'Accessibility Guide' },
    { to: '/contribute', label: 'Contribute' },
    { to: '/about', label: 'About' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between gap-4" aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md" aria-label="Accessible Chattogram - Home">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center" aria-hidden="true">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:inline leading-tight">
            Accessible<br />Chattogram
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-1" role="list">
          {navLinks.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2" role="search">
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-48 h-9 text-sm"
                aria-label="Search places"
              />
              <Button type="submit" size="icon" variant="ghost" className="h-9 w-9" aria-label="Submit search">
                <Search className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {/* Add a place */}
          <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link to="/contribute">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add a Place
            </Link>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-border bg-background">
          <ul className="container mx-auto px-4 py-3 flex flex-col gap-1" role="list">
            {navLinks.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'block px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2 pb-1">
              <Button asChild size="sm" className="w-full gap-1.5">
                <Link to="/contribute" onClick={() => setMenuOpen(false)}>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add a Place
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
