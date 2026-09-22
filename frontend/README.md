# Accessible Chattogram

A community-driven accessibility mapping platform for Chattogram, Bangladesh. Find, verify, and share accessibility information about hospitals, universities, restaurants, government offices, and other public places.

> **Demo:** This is a frontend prototype with mock data. The backend (FastAPI + PostgreSQL/PostGIS) is not yet connected.

---

## Features

- 🗺️ **Interactive map** — Leaflet + OpenStreetMap with accessibility markers
- 🔍 **Search & filter** — by place type, accessibility features, verification status
- ♿ **Structured accessibility data** — wheelchair entrance, ramp, elevator, accessible toilet, parking, tactile paving, audio assistance
- ✅ **Verification system** — verified / community-reported / unverified statuses
- 📝 **Contribute form** — React Hook Form + Zod validation
- 📖 **Accessibility guide** — plain-language explanations of each feature
- 🌙 **Dark mode** — persistent theme toggle
- 📱 **Mobile-first** — responsive design, map/list toggle on mobile
- ♿ **WCAG-inspired** — semantic HTML, visible focus states, ARIA labels, keyboard navigation

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| React Router v6 | Routing |
| TanStack Query | Server state / data fetching |
| React Hook Form | Form management |
| Zod | Schema validation |
| Leaflet + React Leaflet | Interactive map |
| OpenStreetMap | Map tiles (free, open) |
| Lucide React | Icons |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# 1. Extract the project folder
# 2. Open terminal in the project root

npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── map/             # AccessibilityMap (Leaflet)
│   ├── places/          # PlaceCard, FilterPanel
│   ├── accessibility/   # AccessibilityStatus, AccessibilitySummary
│   ├── verification/    # VerificationBadge
│   ├── forms/           # (form sub-components)
│   └── ui/              # shadcn/ui base components
│
├── pages/
│   ├── Home.tsx         # Landing page
│   ├── Explore.tsx      # Map + filter page
│   ├── PlaceDetails.tsx # Individual place page
│   ├── Contribute.tsx   # Submit/verify form
│   ├── Guide.tsx        # Accessibility guide
│   ├── About.tsx        # About the project
│   └── NotFound.tsx     # 404 page
│
├── data/
│   └── mockPlaces.ts    # 24 demo places (clearly marked as mock)
│
├── hooks/
│   ├── usePlaces.ts     # TanStack Query hooks
│   ├── useTheme.ts      # Dark/light mode
│   └── use-toast.ts     # Toast notifications
│
├── services/
│   └── api.ts           # API layer (mock → real API later)
│
├── types/
│   └── index.ts         # TypeScript interfaces
│
├── lib/
│   └── utils.ts         # Utilities (cn, formatDate, etc.)
│
└── App.tsx              # Router + layout
```

---

## Replacing Mock Data with a Real API

The `src/services/api.ts` file contains all data-fetching functions. To connect to the FastAPI backend:

1. Replace the `MOCK_PLACES` import with actual `fetch()` calls
2. Update each function's URL (e.g., `GET /api/places`, `GET /api/places/:id`)
3. TanStack Query handles caching, loading states, and error states automatically

The function signatures stay the same — no UI changes needed.

---

## Planned Backend

- **FastAPI** — REST API
- **PostgreSQL + PostGIS** — geospatial queries (bounding box, nearby places)
- **Authentication** — for trusted contributors
- **Review workflow** — submissions reviewed before publishing

---

## Data Notice

The 24 demo places in `src/data/mockPlaces.ts` are **fictional examples for development only**. Their accessibility attributes do not represent real verified information about these locations. Do not use this data to make real-world accessibility decisions.

---

## Contributing

Contributions welcome. Please open an issue or pull request on GitHub.

---

## License

MIT — see LICENSE file.
