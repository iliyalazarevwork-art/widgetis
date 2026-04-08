/* API response types */

export interface User {
  id: number
  name: string | null
  email: string
  phone: string | null
  telegram: string | null
  company: string | null
  avatar_url: string | null
  locale: 'uk' | 'en'
  role: 'admin' | 'customer'
  two_factor_enabled: boolean
  two_factor_method: string | null
  notification_enabled: boolean
  onboarding_completed: boolean
  created_at: string
}

export interface Plan {
  id: number
  slug: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_sites: number
  max_widgets: number
  features: Record<string, unknown>[]
  is_recommended: boolean
}

export interface Subscription {
  id: number
  plan: Plan
  billing_period: 'monthly' | 'yearly'
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due'
  is_trial: boolean
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  cancelled_at: string | null
  days_remaining: number
}

export interface Site {
  id: number
  name: string | null
  domain: string
  url: string
  platform: string
  status: 'pending' | 'active' | 'disconnected'
  script_installed: boolean
  widgets_count: number
  connected_at: string | null
  created_at: string
}

export interface SiteDetail extends Site {
  script: {
    token: string
    script_tag: string
    is_active: boolean
  } | null
  widgets: SiteWidget[]
}

export interface SiteWidget {
  product_id: number
  name: string
  icon: string
  is_enabled: boolean
  config: Record<string, unknown>
}

export interface SiteCreateResponse {
  id: number
  domain: string
  status: 'pending'
  script: {
    token: string
    script_tag: string
    script_url: string
  }
  install_instructions: { step: number; title: string; description: string }[]
}

export interface Payment {
  id: number
  type: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export interface AppNotification {
  id: number
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface DashboardData {
  user: { name: string | null; email: string }
  plan: Plan | null
  subscription_status: string | null
  stats: {
    sites_count: number
    widgets_count: number
  }
  recent_activity: {
    action: string
    description: string
    entity_type: string
    created_at: string
  }[]
}

export interface WidgetAccess {
  available: {
    product_id: number
    slug: string
    name: string
    icon: string
    is_enabled: boolean
  }[]
  locked: {
    product_id: number
    slug: string
    name: string
    icon: string
  }[]
  limits: {
    used: number
    max: number
  }
}

export interface FaqItem {
  id: number
  category: string
  question: string
  answer: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
