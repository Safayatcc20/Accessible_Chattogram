export function MapLegend() {
  const items = [
    { color: '#1e7e4c', label: 'Verified — Good Accessibility' },
    { color: '#1d4ed8', label: 'Verified' },
    { color: '#b45309', label: 'Community Reported' },
    { color: '#64748b', label: 'Not Verified' },
  ]

  return (
    <div
      className="absolute bottom-6 left-3 z-[400] bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-sm"
      aria-label="Map marker legend"
    >
      <p className="text-xs font-semibold text-foreground mb-1.5">Legend</p>
      <ul className="flex flex-col gap-1" role="list">
        {items.map(({ color, label }) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}