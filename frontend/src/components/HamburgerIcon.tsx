type Props = {
  size?: number
  color?: string
  strokeWidth?: number
}

export function HamburgerIcon({ size = 20, color = 'currentColor', strokeWidth = 2.5 }: Props) {
  const shortLine = Math.round(size * 0.58)
  const longLine = Math.round(size * 0.82)
  const leftOffset = Math.round((size - longLine) / 2)
  const rightOffset = Math.round((size - shortLine) / 2)
  const topY = Math.round(size * 0.37)
  const bottomY = Math.round(size * 0.66)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <path
        d={`M ${leftOffset} ${topY} H ${leftOffset + longLine}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${rightOffset} ${bottomY} H ${rightOffset + shortLine}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}
