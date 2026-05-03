import { get } from './client'

export interface ApiWidgetTag {
  slug: string
  name: string
  color: string
  count: number
}

export interface ApiWidget {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  tag: ApiWidgetTag | null
  platform: string
  is_popular: boolean
  is_new: boolean
  related_slugs: string[] | null
}

export interface ApiPlan {
  id: number
  slug: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_sites: number
  max_widgets: number
  features: string[]
  feature_list: string[]
  is_recommended: boolean
  widget_slugs: string[]
}

interface PaginatedResponse<T> {
  data: T[]
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

interface SingleResponse<T> {
  data: T
}

let widgetsCache: Promise<ApiWidget[]> | null = null
let tagsCache: Promise<ApiWidgetTag[]> | null = null
let plansCache: Promise<ApiPlan[]> | null = null
const widgetBySlugCache = new Map<string, Promise<ApiWidget>>()

export function fetchWidgets(): Promise<ApiWidget[]> {
  if (!widgetsCache) {
    widgetsCache = get<PaginatedResponse<ApiWidget>>('/products', { per_page: 50 }).then(
      (res) => res.data,
    )
  }
  return widgetsCache
}

export function fetchWidget(slug: string): Promise<ApiWidget> {
  if (!widgetBySlugCache.has(slug)) {
    widgetBySlugCache.set(
      slug,
      get<SingleResponse<ApiWidget>>(`/products/${slug}`).then((res) => res.data),
    )
  }
  return widgetBySlugCache.get(slug)!
}

export function fetchWidgetTags(): Promise<ApiWidgetTag[]> {
  if (!tagsCache) {
    tagsCache = get<{ data: ApiWidgetTag[] }>('/tags').then((res) => res.data)
  }
  return tagsCache
}

export function fetchPlansWithSlugs(): Promise<ApiPlan[]> {
  if (!plansCache) {
    plansCache = get<SingleResponse<ApiPlan[]> | PaginatedResponse<ApiPlan>>('/plans').then(
      (res) => res.data as ApiPlan[],
    )
  }
  return plansCache
}

export function invalidateCatalogCache(): void {
  widgetsCache = null
  tagsCache = null
  plansCache = null
  widgetBySlugCache.clear()
}
