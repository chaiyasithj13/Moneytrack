// MoneyTrack — Logo component (path-based, font-independent).
// Renders the Ascend mark at any size. Two modes: full color (default) and mono.
//
// Usage:
//   <Logo size={30} />
//   <Logo size={56} mono color="white" />

export default function Logo({ size = 30, mono = false, color, ...rest }) {
  const stroke = color || (mono ? 'currentColor' : '#ffffff')
  const dotColor = mono ? stroke : '#9dffe0'

  if (mono) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...rest}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={stroke} strokeWidth="2"/>
        <path d="M 16 78 L 16 32 L 50 58 L 84 20"
          stroke={stroke} strokeWidth="11"
          strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="84" cy="20" r="8" fill={dotColor}/>
      </svg>
    )
  }

  const gid = `mt-grad-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...rest}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3c8f"/>
          <stop offset="100%" stopColor="#3460c8"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${gid})`}/>
      <path d="M 16 78 L 16 32 L 50 58 L 84 20"
        stroke="#ffffff" strokeWidth="11"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="84" cy="20" r="8" fill="#9dffe0"/>
    </svg>
  )
}
