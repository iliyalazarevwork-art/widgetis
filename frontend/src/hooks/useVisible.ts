import { useEffect, useRef, useState } from 'react'

/**
 * Returns { ref, active } where active = element is in viewport AND tab is visible.
 * Use `active` to gate setInterval / setTimeout calls so they pause automatically
 * when the user scrolls away or switches tabs.
 */
export function useVisible<T extends Element = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const [tabActive, setTabActive] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const handler = () => setTabActive(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return { ref, active: inView && tabActive }
}
