import type { CSSProperties } from 'react'
import {
  Megaphone,
  Package,
  ShoppingCart,
  Snowflake,
  Truck,
  Eye,
  Coins,
  Gift,
  Star,
  Hourglass,
  Camera,
  Bell,
  Disc3,
  Puzzle,
  BarChart3,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  package: Package,
  cart: ShoppingCart,
  snowflake: Snowflake,
  truck: Truck,
  eye: Eye,
  coins: Coins,
  gift: Gift,
  star: Star,
  hourglass: Hourglass,
  camera: Camera,
  bell: Bell,
  wheel: Disc3,
  puzzle: Puzzle,
  'bar-chart': BarChart3,
  wrench: Wrench,
}

const ICON_COLORS: Record<string, string> = {
  megaphone: '#7C3AED',
  package: '#059669',
  cart: '#EA580C',
  snowflake: '#38BDF8',
  truck: '#16A34A',
  eye: '#EC4899',
  coins: '#F59E0B',
  gift: '#F43F5E',
  star: '#FBBF24',
  hourglass: '#8B5CF6',
  camera: '#6366F1',
  bell: '#14B8A6',
  wheel: '#F97316',
  puzzle: '#3B82F6',
  'bar-chart': '#22C55E',
  wrench: '#6B7280',
}

interface WidgetIconProps {
  name: string | null | undefined
  size?: number
  className?: string
  style?: CSSProperties
}

export function WidgetIcon({ name, size = 24, className, style }: WidgetIconProps) {
  const key = name && ICON_MAP[name] ? name : 'wrench'
  const IconComponent = ICON_MAP[key]
  const color = ICON_COLORS[key] ?? ICON_COLORS.wrench

  const bgSize = Math.round(size * 1.75)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: bgSize,
        height: bgSize,
        borderRadius: Math.round(bgSize * 0.26),
        backgroundColor: `${color}1f`,
        flexShrink: 0,
        ...style,
      }}
    >
      <IconComponent size={size} color={color} strokeWidth={1.75} />
    </span>
  )
}
