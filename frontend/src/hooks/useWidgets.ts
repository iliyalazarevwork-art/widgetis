import { useState, useEffect } from 'react'
import {
  fetchWidgets,
  fetchWidget,
  fetchWidgetTags,
  fetchPlansWithSlugs,
  type ApiWidget,
  type ApiWidgetTag,
  type ApiPlan,
} from '../api/widgets'

export function useWidgets(): { widgets: ApiWidget[]; loading: boolean; error: string | null } {
  const [widgets, setWidgets] = useState<ApiWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchWidgets()
      .then((data) => { if (!cancelled) { setWidgets(data); setLoading(false) } })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { widgets, loading, error }
}

export function useWidget(
  slug: string | undefined,
): { widget: ApiWidget | null; loading: boolean; error: string | null; notFound: boolean } {
  const [widget, setWidget] = useState<ApiWidget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setWidget(null)
    setError(null)
    setNotFound(false)
    fetchWidget(slug)
      .then((data) => {
        if (!cancelled) { setWidget(data); setLoading(false) }
      })
      .catch((err: Error & { status?: number }) => {
        if (!cancelled) {
          if (err.status === 404) { setNotFound(true) } else { setError(err.message) }
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [slug])

  return { widget, loading, error, notFound }
}

export function useWidgetTags(): { tags: ApiWidgetTag[]; loading: boolean; error: string | null } {
  const [tags, setTags] = useState<ApiWidgetTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchWidgetTags()
      .then((data) => { if (!cancelled) { setTags(data); setLoading(false) } })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { tags, loading, error }
}

export function usePlansWithSlugs(): { plans: ApiPlan[]; loading: boolean; error: string | null } {
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPlansWithSlugs()
      .then((data) => { if (!cancelled) { setPlans(data); setLoading(false) } })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { plans, loading, error }
}
