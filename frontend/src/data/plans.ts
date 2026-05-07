// ===== Plans — single source of truth =====
// Design system: node I13RR (Pencil)
// Prices, colors, icons — canonical. Import this everywhere.

import { Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { WIDGET_UA_NAME } from './widget-names'
import { WidgetSlug } from './widget-slugs'

export type PlanSlug = 'free' | 'pro' | 'max'

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
    id: 'free',
    name: 'Free',
    pitch: 'Для старту',
    icon: Sprout,
    color: '#10B981',
    cssVar: '--green',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: 0,
    widgets: 12,
    sites: 1,
    badge: null,
    highlighted: false,
    features: [
      { label: '12 базових віджетів з лімітами', slug: '/catalog' },
      { label: '1 сайт' },
      { label: 'Тільки українська' },
      { label: 'Telegram-підтримка' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pitch: 'Оптимально',
    icon: Zap,
    color: '#3B82F6',
    cssVar: '--blue',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    yearlyMonthly: 416,
    widgets: 12,
    sites: 3,
    badge: 'Обирає 73% клієнтів',
    highlighted: true,
    features: [
      { label: 'Всі 12 віджетів', slug: '/catalog' },
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
    monthlyPrice: 699,
    yearlyPrice: 6990,
    yearlyMonthly: 583,
    widgets: 20,
    sites: 5,
    badge: null,
    highlighted: false,
    features: [
      { label: 'Всі 20 віджетів', slug: '/catalog' },
      { label: WIDGET_UA_NAME[WidgetSlug.SpinTheWheel], slug: WidgetSlug.SpinTheWheel },
      { label: WIDGET_UA_NAME[WidgetSlug.SmsOtpCheckout], slug: WidgetSlug.SmsOtpCheckout },
      { label: '5 сайтів' },
      { label: 'VIP підтримка' },
      { label: 'Повна кастомізація' },
    ],
  },
]

export const FOUNDING_PRICE_MONTHLY = 299 // ₴ for first 20 customers on Pro

export const PLAN_LANGUAGES: Record<PlanSlug, string[]> = {
  free: ['uk'],
  pro: ['uk', 'en'],
  max: ['uk', 'en', 'ru'],
}

export const PLAN_COLORS: Record<PlanSlug, string> = {
  free: '#10B981',
  pro: '#3B82F6',
  max: '#A855F7',
}

export const PLAN_ICONS: Record<PlanSlug, LucideIcon> = {
  free: Sprout,
  pro: Zap,
  max: Crown,
}

export const SERVICE_COMPARISON_ROWS: ReadonlyArray<{
  feature: string
  free: string
  pro: string
  max: string
}> = [
  { feature: 'Кастомізація', free: 'без кастомізації', pro: 'менеджер за запитом', max: 'персональний менеджер' },
  { feature: 'Підтримка',    free: 'Telegram',           pro: 'Email + Telegram',     max: 'VIP менеджер' },
  { feature: 'Trial',        free: '—',                  pro: '14 днів',              max: '14 днів' },
]

export function getPlan(slug: PlanSlug): PlanDef {
  return PLANS.find(p => p.id === slug)!
}

/**
 * Widget slugs that are only available on the Max plan.
 * Used by WidgetLockModal to block Pro users from enabling them.
 */
export const MAX_ONLY_WIDGETS = [
  'cart-recommender',
  'smart-search',
  'spin-the-wheel',
  'sms-otp-checkout',
  'prize-banner',
  'last-chance-popup',
  'promo-auto-apply',
  'progressive-discount',
  'one-plus-one',
] as const

export type MaxOnlyWidgetSlug = (typeof MAX_ONLY_WIDGETS)[number]
