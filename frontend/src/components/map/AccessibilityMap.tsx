import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { categoryLabel, getRelativeDate } from '@/lib/utils'
import { VerificationBadge } from '@/components/verification/VerificationBadge'
import type { Place } from '@/types'

// Fix 3: Use local public/ assets instead of CDN URLs.
// Files are at public/leaflet/*.png, served as /leaflet/*.png at runtime.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

function createMarkerIcon(place: Place): L.DivIcon {
  const status = place.verification.status
  const hasGoodAccess =
    place.accessibility.wheelchairEntrance === true && place.accessibility.ramp === true

  let color = '#64748b' // unverified

  if (status === 'verified' && hasGoodAccess) color = '#1e7e4c' // green
  else if (status === 'verified') color = '#1d4ed8'             // blue
  else if (status === 'community-reported') color = '#b45309'   // amber
  else color = '#64748b'                                         // grey

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

function MapController({ center }: { center?: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true })
    }
  }, [center, map])
  return null
}

interface AccessibilityMapProps {
  places: Place[]
  center?: [number, number]
  zoom?: number
  height?: string
  onPlaceSelect?: (place: Place) => void
}

const CHATTOGRAM_CENTER: [number, number] = [22.3569, 91.8349]

export function AccessibilityMap({
  places,
  center,
  zoom = 12,
  height = '100%',
}: AccessibilityMapProps) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-lg overflow-hidden"
      role="application"
      aria-label="Accessibility map of Chattogram"
    >
      <MapContainer
        center={center ?? CHATTOGRAM_CENTER}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <MapController center={center} />}
        {places.map(place => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createMarkerIcon(place)}
          >
            <Popup maxWidth={260} minWidth={220}>
              <div className="p-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{place.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{categoryLabel(place.category)}</p>
                  </div>
                  <VerificationBadge status={place.verification.status} showIcon={false} />
                </div>
                <p className="text-xs text-gray-500 mb-2">{place.address}</p>
                <div className="text-xs text-gray-500 mb-3">
                  Last verified: {getRelativeDate(place.verification.lastVerified)}
                </div>
                <Link
                  to={`/places/${place.id}`}
                  className="block w-full text-center text-xs font-medium bg-blue-700 text-white rounded px-3 py-1.5 hover:bg-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  View Full Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}