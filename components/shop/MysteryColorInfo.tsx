const MYSTERY_TIERS: { tier: string; name: string; style: React.CSSProperties }[] = [
  { tier: 'Common',     name: 'Glow in the Dark', style: { backgroundColor: '#c8f7c5', boxShadow: '0 0 8px 2px rgba(132, 255, 153, 0.9)' } },
  { tier: 'Rare',       name: 'Rainbow',          style: { background: 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00cc00 50%, #0080ff 67%, #8000ff 83%, #ff00ff 100%)' } },
  { tier: 'Ultra Rare', name: 'Gold',             style: { background: 'linear-gradient(135deg, #8a6d1f 0%, #d4af37 20%, #f9e27a 35%, #b8860b 50%, #f9e27a 65%, #d4af37 80%, #8a6d1f 100%)' } },
]

export default function MysteryColorInfo() {
  return (
    <div className="mt-4 rounded-xl border-2 border-purple/30 bg-purple/5 p-4 space-y-3">
      <p className="text-sm font-bold text-navy">Mystery color — we pick, you discover!</p>
      <p className="text-xs font-semibold text-orange-500">⚠️ Warning: you may not get the color you want.</p>
      <ul className="space-y-2">
        {MYSTERY_TIERS.map(({ tier, name, style }) => (
          <li key={tier} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" style={style} />
            <span className="text-[11px] font-bold uppercase tracking-wide text-navy/50 w-20">{tier}</span>
            <span className="text-sm font-semibold text-navy">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
