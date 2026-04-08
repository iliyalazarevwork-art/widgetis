import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') {
      return
    }

    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1))
      if (element) {
        element.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash, navigationType])

  return null
}
