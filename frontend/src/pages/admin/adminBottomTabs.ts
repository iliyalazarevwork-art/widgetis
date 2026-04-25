import { Banknote, Globe, LayoutDashboard, MessageSquare, Receipt, Users, Wand2, type LucideIcon } from 'lucide-react'

export interface AdminBottomTab {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

export const ADMIN_BOTTOM_TABS: readonly AdminBottomTab[] = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Замовлення', icon: Receipt, end: false },
  { to: '/admin/users', label: 'Юзери', icon: Users, end: false },
  { to: '/admin/sites', label: 'Сайти', icon: Globe, end: false },
  { to: '/admin/subscriptions', label: 'Підписки', icon: Banknote, end: false },
  { to: '/admin/configurator', label: 'Конфігур.', icon: Wand2, end: false },
  { to: '/admin/widgets/sms-otp', label: 'SMS OTP', icon: MessageSquare, end: false },
]
