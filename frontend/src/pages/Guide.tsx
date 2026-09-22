import {
  Accessibility, ArrowUpToLine, ArrowUpDown, PersonStanding,
  Car, Navigation, Volume2, Eye, Info
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface GuideCardProps {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  what: string
  why: string
  lookFor: string[]
  color: string
}

const GUIDE_ITEMS: GuideCardProps[] = [
  {
    Icon: Accessibility,
    title: 'Wheelchair Accessible Entrance',
    color: 'text-blue-600 dark:text-blue-400',
    what: 'An entrance that can be used independently by a person in a wheelchair. This means no steps, a wide enough doorway (typically at least 80cm), and smooth, firm ground surface.',
    why: 'People who use wheelchairs, mobility scooters, or walking frames cannot use standard stepped entrances. Without an accessible entrance, a place is effectively inaccessible to them.',
    lookFor: [
      'Level entry or a ramp leading to the door',
      'Door at least 80cm wide (wider is better)',
      'Door that opens automatically or is easy to push',
      'Smooth, firm, even surface at the entrance',
      'No lips or raised thresholds higher than 1.5cm',
    ],
  },
  {
    Icon: ArrowUpToLine,
    title: 'Ramp',
    color: 'text-green-600 dark:text-green-400',
    what: 'A sloped surface that provides an alternative to steps, allowing wheelchair users and people with limited mobility to move between different levels without climbing stairs.',
    why: 'Even a single step can prevent a wheelchair user from entering a building. Ramps make the difference between access and exclusion.',
    lookFor: [
      'Gentle slope — not too steep (ideally 1:20 ratio or less)',
      'At least 90cm wide to accommodate a wheelchair',
      'Non-slip surface, especially important in rain',
      'Handrails on both sides for people with walking difficulties',
      'Landing space at the top and bottom of the ramp',
    ],
  },
  {
    Icon: ArrowUpDown,
    title: 'Elevator / Lift',
    color: 'text-purple-600 dark:text-purple-400',
    what: 'A vertical transport device that allows people to move between floors without using stairs. In an accessibility context, this means a lift large enough for a wheelchair and at least one companion.',
    why: 'Multi-storey buildings are inaccessible to wheelchair users and people who cannot climb stairs without a working elevator. This is a critical feature for hospitals, universities, and shopping centres.',
    lookFor: [
      'Lift cabin large enough for a wheelchair (minimum 110cm × 140cm)',
      'Buttons reachable from a seated position',
      'Braille or tactile button labels',
      'Audio announcement of floors',
      'Doors that remain open long enough to enter and exit comfortably',
    ],
  },
  {
    Icon: PersonStanding,
    title: 'Accessible Toilet / Restroom',
    color: 'text-orange-600 dark:text-orange-400',
    what: 'A toilet facility designed for use by people with disabilities, including wheelchair users. It requires more space, grab rails, and features not found in standard toilets.',
    why: 'The availability of an accessible toilet is often a deciding factor in whether a person with a disability can visit a place at all. Without one, many people must limit how long they stay or avoid the place entirely.',
    lookFor: [
      'Room large enough to turn a wheelchair (minimum 150cm × 150cm)',
      'Grab rails beside the toilet on at least one side',
      'Toilet at the right height (usually 45–50cm from floor)',
      'Wide door that opens outward or is sliding (minimum 80cm)',
      'Emergency call cord or button near the floor',
    ],
  },
  {
    Icon: Car,
    title: 'Accessible Parking',
    color: 'text-red-600 dark:text-red-400',
    what: 'Designated parking spaces wider than standard spaces, located close to the entrance, reserved for people with mobility disabilities who have a valid disabled parking permit.',
    why: 'Standard parking spaces are too narrow for wheelchair users to exit their vehicle. Accessible spaces provide the extra width needed, and their proximity to entrances reduces the distance that must be walked.',
    lookFor: [
      'Spaces at least 3.6 metres wide (to allow door opening + wheelchair)',
      'Located as close to the entrance as possible',
      'Clearly marked with the international accessibility symbol',
      'Level ground, not on a slope',
      'Direct path to the entrance that is also accessible (no kerbs, even surface)',
    ],
  },
  {
    Icon: Navigation,
    title: 'Tactile Paving',
    color: 'text-yellow-600 dark:text-yellow-500',
    what: 'Specially textured ground surfaces — usually raised dots or ridges — installed to provide navigational guidance and hazard warnings detectable underfoot or with a white cane.',
    why: 'People who are blind or have low vision use tactile paving to navigate safely. Blister patterns warn of hazards (like road crossings), while bar patterns indicate direction of travel.',
    lookFor: [
      'Yellow or bright-coloured textured tiles at pedestrian crossings',
      'Continuous tactile paths from entrance to key destinations inside',
      'Blister (dome) pattern at danger points',
      'Bar (corduroy) pattern indicating direction of safe travel',
      'Consistent installation — gaps break the guidance path',
    ],
  },
  {
    Icon: Volume2,
    title: 'Audio Assistance',
    color: 'text-teal-600 dark:text-teal-400',
    what: 'Systems that provide information through sound rather than only visually. This includes audio announcements in lifts, speaking pedestrian crossings, audio guides, and staff trained to assist visitors with visual impairments.',
    why: 'People who are blind or have low vision rely on audio cues for information that sighted people get visually — such as which floor an elevator is on, or when it is safe to cross a road.',
    lookFor: [
      'Lifts that announce each floor verbally',
      'Pedestrian crossing signals with audible beeping',
      'Staff who can verbally describe wayfinding',
      'Audio guides or described content at cultural sites',
      'Hearing loops (induction loops) at service counters',
    ],
  },
  {
    Icon: Eye,
    title: 'Visual Contrast and Signage',
    color: 'text-indigo-600 dark:text-indigo-400',
    what: 'High-contrast colour schemes, large-print text, and clear signage that help people with low vision navigate a space independently. Good contrast between walls, floors, and key features makes a big difference.',
    why: 'People with low vision (who are not fully blind) can often see better with sufficient contrast and large, clear text. Poor contrast — like grey text on a white wall — makes a space much harder to navigate.',
    lookFor: [
      'High contrast between floor and wall colours',
      'Clear, large-print room signage at eye level',
      'Colour contrast on steps and hazards',
      'Well-lit spaces without deep shadows',
      'Consistent colour coding throughout the building',
    ],
  },
]

export default function Guide() {
  return (
    <main id="main-content" className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">Accessibility Guide</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Understanding accessibility features helps you know what to look for when visiting a place — and what to report when contributing to this platform. Here's what each feature means in plain language.
        </p>

        <div className="mt-5 p-4 border border-border bg-secondary/40 rounded-lg flex items-start gap-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            On this platform, we mark each feature as <strong className="text-foreground">available ✓</strong>, <strong className="text-foreground">not available ✗</strong>, or <strong className="text-foreground">information unavailable ?</strong>. The last one is important — "unknown" is not the same as "no". We never assume a feature is absent just because we have no data.
          </p>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Cards */}
      <div className="space-y-8">
        {GUIDE_ITEMS.map((item) => (
          <GuideCard key={item.title} {...item} />
        ))}
      </div>

      <Separator className="my-10" />

      {/* Footer note */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">Know a place with accessibility features?</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Help others find accessible places by contributing what you know. Every accurate data point makes Chattogram more navigable.
        </p>
        <a
          href="/contribute"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Contribute accessibility information →
        </a>
      </div>
    </main>
  )
}

function GuideCard({ Icon, title, what, why, lookFor, color }: GuideCardProps) {
  return (
    <article className="border border-border rounded-lg overflow-hidden">
      <div className="p-5 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0" aria-hidden="true">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What it means</h3>
          <p className="text-sm text-foreground leading-relaxed">{what}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Why it matters</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{why}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What to look for</h3>
          <ul className="space-y-1.5" role="list">
            {lookFor.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-current ${color}`} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
