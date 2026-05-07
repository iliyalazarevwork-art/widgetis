import { useEffect, useState } from 'react'

export interface FoundingRemaining {
  remaining: number
  total: number
  locked_price_monthly: number
}

export function useFoundingRemaining(): FoundingRemaining | null {
  const [data, setData] = useState<FoundingRemaining | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/founding/remaining')
      .then(r => r.ok ? r.json() : null)
      .then((json: FoundingRemaining | null) => {
        if (!cancelled && json) setData(json)
      })
      .catch(() => { /* silent — pricing page still works without counter */ })
    return () => { cancelled = true }
  }, [])

  return data
}
