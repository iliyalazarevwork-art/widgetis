// ===== Plans — single source of truth =====
// Design system: node I13RR (Pencil)
// Prices, colors, icons — canonical. Import this everywhere.

import { Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'

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
  widgetSlugs: string[]
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
      { label: 'Дата доставки', slug: 'delivery-date' },
      { label: 'Безкоштовна доставка', slug: 'free-delivery' },
      { label: 'Бігуча стрічка', slug: 'marquee' },
      { label: 'Хто зараз дивиться', slug: 'live-viewers' },
      { label: '1 сайт' },
      { label: 'Email + Telegram підтримка' },
    ],
    widgetSlugs: ['delivery-date', 'free-delivery', 'marquee', 'live-viewers'],
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
      { label: 'Лічильник залишків', slug: 'purchase-counter' },
      { label: 'Прогрес кошика', slug: 'free-delivery' },
      { label: 'Фотовідгуки', slug: 'photo-reviews' },
      { label: '3 сайти' },
      { label: 'Self-service кастомізація' },
    ],
    widgetSlugs: [
      'delivery-date', 'free-delivery', 'marquee', 'live-viewers',
      'purchase-counter', 'photo-reviews', 'countdown', 'progressive-discount',
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
      { label: 'Кешбек-калькулятор', slug: 'cashback' },
      { label: 'Таймер терміновості', slug: 'countdown' },
      { label: '5 сайтів' },
      { label: 'VIP підтримка' },
      { label: 'Повна кастомізація' },
    ],
    widgetSlugs: [
      'delivery-date', 'free-delivery', 'marquee', 'live-viewers',
      'purchase-counter', 'photo-reviews', 'countdown', 'progressive-discount',
      'cashback', 'one-plus-one', 'bonus', 'snow', 'recent-purchase',
      'spin-wheel', 'quiz', 'live-viewers', 'progressive-discount',
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

export const COMPARISON_ROWS = [
  { feature: 'Кількість віджетів', basic: '4', pro: '8', max: '17' },
  { feature: 'Сайтів', basic: '1', pro: '3', max: '5' },
  { feature: 'Лічильник залишків', basic: false, pro: true, max: true },
  { feature: 'Фотовідгуки', basic: false, pro: true, max: true },
  { feature: 'Кешбек-калькулятор', basic: false, pro: false, max: true },
  { feature: 'Таймер терміновості', basic: false, pro: false, max: true },
  { feature: 'Кастомізація', basic: 'ручна', pro: 'самостійна', max: 'повна' },
  { feature: 'Підтримка', basic: 'Email · TG', pro: 'Email · TG', max: 'VIP' },
] as const

export function getPlan(slug: PlanSlug): PlanDef {
  return PLANS.find(p => p.id === slug)!
}
