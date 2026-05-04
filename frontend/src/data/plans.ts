// ===== Plans — single source of truth =====
// Design system: node I13RR (Pencil)
// Prices, colors, icons — canonical. Import this everywhere.

import { Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { WIDGET_UA_NAME } from './widget-names'
import { WidgetSlug } from './widget-slugs'

export type PlanSlug = 'basic' | 'pro' | 'max'

export interface PlanDef {
  id: PlanSlug
  name: string
  pitch: string
  icon: LucideIcon
  color: string
  cssVar: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyMonthly: number
  widgets: number
  sites: number
  badge: string | null
  highlighted: boolean
  features: Array<{ label: string; slug?: string }>
}

export const PLANS: PlanDef[] = [
  {
    id: 'basic',
    name: 'Basic',
    pitch: 'Для початку',
    icon: Sprout,
    color: '#10B981',
    cssVar: '--green',
    monthlyPrice: 799,
    yearlyPrice: 7990,
    yearlyMonthly: 666,
    widgets: 4,
    sites: 1,
    badge: null,
    highlighted: false,
    features: [
      { label: WIDGET_UA_NAME[WidgetSlug.DeliveryDate], slug: WidgetSlug.DeliveryDate },
      { label: WIDGET_UA_NAME[WidgetSlug.PromoLine], slug: WidgetSlug.PromoLine },
      { label: WIDGET_UA_NAME[WidgetSlug.StickyBuyButton], slug: WidgetSlug.StickyBuyButton },
      { label: WIDGET_UA_NAME[WidgetSlug.TrustBadges], slug: WidgetSlug.TrustBadges },
      { label: '1 сайт' },
      { label: 'Email + Telegram підтримка' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pitch: 'Оптимально',
    icon: Zap,
    color: '#3B82F6',
    cssVar: '--blue',
    monthlyPrice: 1599,
    yearlyPrice: 15990,
    yearlyMonthly: 1333,
    widgets: 8,
    sites: 3,
    badge: 'Обирає 73% клієнтів',
    highlighted: true,
    features: [
      { label: 'Всі 8 віджетів', slug: '/catalog' },
      { label: WIDGET_UA_NAME[WidgetSlug.CartGoal], slug: WidgetSlug.CartGoal },
      { label: WIDGET_UA_NAME[WidgetSlug.BuyerCount], slug: WidgetSlug.BuyerCount },
      { label: WIDGET_UA_NAME[WidgetSlug.PhotoVideoReviews], slug: WidgetSlug.PhotoVideoReviews },
      { label: '3 сайти' },
      { label: 'Self-service кастомізація' },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    pitch: 'Все включено',
    icon: Crown,
    color: '#A855F7',
    cssVar: '--purple',
    monthlyPrice: 2899,
    yearlyPrice: 28990,
    yearlyMonthly: 2416,
    widgets: 17,
    sites: 5,
    badge: null,
    highlighted: false,
    features: [
      { label: 'Всі 17 віджетів', slug: '/catalog' },
      { label: WIDGET_UA_NAME[WidgetSlug.SpinTheWheel], slug: WidgetSlug.SpinTheWheel },
      { label: WIDGET_UA_NAME[WidgetSlug.SmsOtpCheckout], slug: WidgetSlug.SmsOtpCheckout },
      { label: '5 сайтів' },
      { label: 'VIP підтримка' },
      { label: 'Повна кастомізація' },
    ],
  },
]

export const PLAN_COLORS: Record<PlanSlug, string> = {
  basic: '#10B981',
  pro: '#3B82F6',
  max: '#A855F7',
}

export const PLAN_ICONS: Record<PlanSlug, LucideIcon> = {
  basic: Sprout,
  pro: Zap,
  max: Crown,
}

export const SERVICE_COMPARISON_ROWS: ReadonlyArray<{
  feature: string
  basic: string
  pro: string
  max: string
}> = [
  { feature: 'Кастомізація', basic: 'вкл/викл',     pro: 'менеджер за запитом', max: 'персональний менеджер' },
  { feature: 'Підтримка',    basic: 'Email',         pro: 'Email + Telegram',     max: 'VIP менеджер' },
  { feature: 'Trial',        basic: '7 днів',        pro: '14 днів',              max: '14 днів' },
]

export function getPlan(slug: PlanSlug): PlanDef {
  return PLANS.find(p => p.id === slug)!
}
