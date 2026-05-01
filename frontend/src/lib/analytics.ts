type GtagCommand = 'config' | 'event' | 'js'
type FbqCommand = 'init' | 'track' | 'trackCustom'
type ClarityQueue = ((...args: unknown[]) => void) & {
  q?: unknown[][]
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: GtagCommand, target: string | Date, params?: Record<string, unknown>) => void
    fbq?: (command: FbqCommand, eventName: string, params?: Record<string, unknown>) => void
    _fbq?: unknown
    clarity?: ClarityQueue
  }
}

export function initAnalytics() {
  // Production vendor scripts are injected from analytics.production.js by the Docker build.
}

export function trackPageView(path: string, title = document.title) {
  initAnalytics()

  const pageLocation = `${window.location.origin}${path}`

  window.gtag?.('event', 'page_view', {
    page_location: pageLocation,
    page_path: path,
    page_title: title,
  })

  window.fbq?.('track', 'PageView')
}

export function trackCtaClick(ctaId: 'hero__cta' | 'sticky-cta__btn') {
  initAnalytics()

  window.gtag?.('event', 'cta_click', {
    cta_id: ctaId,
    link_url: '/pricing',
  })

  window.fbq?.('trackCustom', 'CTAClick', {
    cta_id: ctaId,
    link_url: '/pricing',
  })
}
