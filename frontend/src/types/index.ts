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
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'pending' | null
  created_at: string
}

export interface Plan {
  id: number
  slug: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_sites: number
  max_widgets: number
  features: Record<string, unknown>[]
  is_recommended: boolean
}

export interface Subscription {
  id: number
  plan: Plan
  billing_period: 'monthly' | 'yearly'
  status: 'trial' | 'active' | 'pending' | 'cancelled' | 'expired' | 'past_due'
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
  deployed_script_url: string | null
  user?: { id: number; email: string; name: string | null }
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
  slug: string
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
  provider?: string
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
  next_renewal_at: string | null
  stats: {
    sites_count: number
    widgets_count: number
  }
  recent_activity: {
    source: 'payment' | 'notification' | 'activity'
    status: string
    action: string
    description: string
    title: string
    subtitle: string | null
    entity_type: string | null
    created_at: string
    amount: number | null
    currency: string | null
    provider: string | null
    plan_name: string | null
    is_trial: boolean
    trial_days: number | null
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

export interface AdminDashboardData {
  kpi: {
    users_count: number
    orders_count: number
    orders_this_month: number
    orders_growth_pct: number | null
    active_sites: number
    active_sites_new_week: number
    installed_widgets_count: number
    installed_widgets_new_week: number
    active_subscriptions: number
    revenue: number
    revenue_this_month: number
    revenue_growth_pct: number | null
  }
  recent_orders: {
    id: number
    order_number: string | null
    customer_email: string | null
    plan: string | null
    amount: number
    currency: string | null
    status: string | null
    created_at: string
  }[]
}
