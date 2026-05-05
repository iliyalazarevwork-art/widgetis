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
import { TAG_PRIORITY } from '../data/widgetTags'

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
    if (!slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
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
      .then((data) => {
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => {
            const ai = TAG_PRIORITY.indexOf(a.slug as never)
            const bi = TAG_PRIORITY.indexOf(b.slug as never)
            return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
          })
          setTags(sorted)
          setLoading(false)
        }
      })
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
