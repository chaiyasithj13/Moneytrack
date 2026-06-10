// MoneyTrack — Logo component (path-based, font-independent).
// Renders the Baht Coin logo at any size. Two modes: 'coin' (default) and 'mono'.
//
// Usage:
//   <Logo size={30} />
//   <Logo size={48} mono color="white" />
//
// The ฿ glyph is a vector path so it renders identically across all browsers
// and never depends on a font being loaded.

export default function Logo({ size = 30, mono = false, color, ...rest }) {
  const stroke = color || (mono ? 'currentColor' : '#ffffff')
  const dotColor = mono ? stroke : '#9dffe0'

  if (mono) {
    return (
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none" {...rest}>
        <circle cx="48" cy="48" r="42" fill="none" stroke={stroke} strokeWidth="2"/>
        <circle cx="48" cy="48" r="39" fill="none" stroke={stroke} strokeOpacity="0.32" strokeWidth="1.8" strokeDasharray="3 6" strokeLinecap="round"/>
        <g fill={stroke}>
          <rect x="39.5" y="14" width="3" height="68" rx="1"/>
          <path fillRule="evenodd" d="M 28 22 L 45 22 C 54.5 22 54.5 46 45 46 C 55.5 46 55.5 74 45 74 L 28 74 Z M 34.5 28.5 L 43.5 28.5 C 47.5 28.5 47.5 39.5 43.5 39.5 L 34.5 39.5 Z M 34.5 52.5 L 43.5 52.5 C 48.7 52.5 48.7 67.5 43.5 67.5 L 34.5 67.5 Z"/>
        </g>
        <circle cx="78.7" cy="23.7" r="7.2" fill={dotColor}/>
      </svg>
    )
  }

  // Full color (default). The gradient id is suffixed with a stable hash of size
  // so multiple logos on the same page don't collide.
  const gid = `mt-grad-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" {...rest}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3c8f"/>
          <stop offset="100%" stopColor="#3460c8"/>
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="42" fill={`url(#${gid})`}/>
      <circle cx="48" cy="48" r="39" fill="none" stroke="#ffffff" strokeOpacity="0.26" strokeWidth="1.8" strokeDasharray="3 6" strokeLinecap="round"/>
      <g fill="#ffffff">
        <rect x="39.5" y="14" width="3" height="68" rx="1"/>
        <path fillRule="evenodd" d="M 28 22 L 45 22 C 54.5 22 54.5 46 45 46 C 55.5 46 55.5 74 45 74 L 28 74 Z M 34.5 28.5 L 43.5 28.5 C 47.5 28.5 47.5 39.5 43.5 39.5 L 34.5 39.5 Z M 34.5 52.5 L 43.5 52.5 C 48.7 52.5 48.7 67.5 43.5 67.5 L 34.5 67.5 Z"/>
      </g>
      <circle cx="78.7" cy="23.7" r="7.2" fill="#9dffe0"/>
    </svg>
  )
}
