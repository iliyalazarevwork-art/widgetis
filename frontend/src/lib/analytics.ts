const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID?.trim()
const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim()

type GtagCommand = 'config' | 'event' | 'js'
type FbqCommand = 'init' | 'track' | 'trackCustom'
type MetaPixelQueue = Window['fbq'] & {
  callMethod?: (...args: unknown[]) => void
  loaded?: boolean
  queue: unknown[][]
  version?: string
}
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

let initialized = false

function appendScript(src: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  if (gaMeasurementId) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    } as Window['gtag']
    window.gtag!('js', new Date())
    window.gtag!('config', gaMeasurementId, { send_page_view: false })
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`)
  }

  if (metaPixelId) {
    const fbq = ((...args: unknown[]) => {
      fbq.callMethod
        ? fbq.callMethod(...args)
        : fbq.queue.push(args)
    }) as MetaPixelQueue

    if (!window.fbq) {
      fbq.loaded = true
      fbq.version = '2.0'
      fbq.queue = []
      window.fbq = fbq
      window._fbq = fbq
      appendScript('https://connect.facebook.net/en_US/fbevents.js')
    }

    window.fbq?.('init', metaPixelId)
  }

  if (clarityProjectId) {
    window.clarity = window.clarity || (function clarity(...args: unknown[]) {
      ;(window.clarity!.q = window.clarity!.q || []).push(args)
    } as ClarityQueue)
    appendScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarityProjectId)}`)
  }
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
