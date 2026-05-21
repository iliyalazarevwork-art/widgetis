import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Globe, ShoppingCart, Star, Timer, TrendingUp, Zap } from 'lucide-react'
import { trackCtaClick } from '../lib/analytics'
import {
  PreviewCountdown,
  PreviewDelivery,
  PreviewMinOrder,
  PreviewOnePlusOne,
  PreviewPhotoReviews,
  PreviewPurchaseCounter,
  PreviewStock,
  PreviewTrustBadges,
} from './WidgetPreviews'
import './Hero.css'

type HeroSite = {
  domain: string
  Primary: ComponentType
  Secondary: ComponentType
  /** Time to wait on this slide before auto-advancing — must cover the
   * primary widget's full animation cycle so it always finishes on screen. */
  cycleMs: number
}

const SITES: HeroSite[] = [
  {
    domain: 'benihome.com.ua',
    Primary: PreviewPhotoReviews,
    Secondary: PreviewTrustBadges,
    // 4 tiles × 550ms reveal + 2000ms reset = ~4200ms full photo cycle
    cycleMs: 4400,
  },
  {
    domain: 'punisher.com.ua',
    Primary: PreviewMinOrder,
    Secondary: PreviewPurchaseCounter,
    // PurchaseCounter ticks every 3000ms — wait for one bump
    cycleMs: 3200,
  },
  {
    domain: 'ballistic.com.ua',
    Primary: PreviewDelivery,
    Secondary: PreviewStock,
    // Stock decrements every 2500ms
    cycleMs: 3000,
  },
  {
    domain: 'shop.roza.ua',
    Primary: PreviewOnePlusOne,
    Secondary: PreviewCountdown,
    cycleMs: 3500,
  },
]

const faviconUrl = (domain: string) =>
  `https://icons.duckduckgo.com/ip3/${domain}.ico`

const SWIPE_THRESHOLD_PX = 40
// Clone last slide at the start and first slide at the end so the carousel
// can loop seamlessly in both directions; index 1..SITES.length are the
// real slides, 0 is the start-clone (= last real) and SITES.length+1 is the
// end-clone (= first real).
const SLIDER_TRACK = [SITES[SITES.length - 1], ...SITES, SITES[0]]
const FIRST_REAL = 1
const LAST_REAL = SITES.length

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [trackIndex, setTrackIndex] = useState(FIRST_REAL)
  const [animating, setAnimating] = useState(true)
  const [brokenFavicons, setBrokenFavicons] = useState<Set<string>>(new Set())
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  const next = () => {
    setAnimating(true)
    setTrackIndex(i => i + 1)
  }

  const prev = () => {
    setAnimating(true)
    setTrackIndex(i => i - 1)
  }

  // Auto-advance after the current site's primary widget finishes its cycle.
  // Re-runs on every slide change (also when the user swipes), and skips the
  // clone-frames so the snap-back doesn't trigger an extra timer.
  useEffect(() => {
    if (trackIndex < FIRST_REAL || trackIndex > LAST_REAL) return
    const site = SITES[trackIndex - FIRST_REAL]
    const timer = window.setTimeout(next, site.cycleMs)
    return () => window.clearTimeout(timer)
  }, [trackIndex])

  const handleTransitionEnd = () => {
    if (trackIndex > LAST_REAL) {
      // landed on the end-clone — snap to real first without animation
      setAnimating(false)
      setTrackIndex(FIRST_REAL)
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setAnimating(true)),
      )
    } else if (trackIndex < FIRST_REAL) {
      // landed on the start-clone — snap to real last without animation
      setAnimating(false)
      setTrackIndex(LAST_REAL)
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setAnimating(true)),
      )
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartXRef.current
    const dy = e.changedTouches[0].clientY - touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) next()
    else prev()
  }

  return (
    <section ref={heroRef} className={`hero ${visible ? 'hero--visible' : ''}`}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
      </div>

      <div className="hero__wrap">
        <div className="hero__content">
          <div className="hero__title-wrap">
            <h1 className="hero__title">
              <span>20 готових</span>
              <span>віджетів для</span>
              <span className="hero__title-accent">Хорошоп</span>
            </h1>
            <div className="hero__stickers" aria-hidden="true">
              <span className="hero__sticker hero__sticker--rate">
                <Star size={14} fill="#F5B400" strokeWidth={0} />
                <span>4.9</span>
              </span>
              <span className="hero__sticker hero__sticker--grow">
                <TrendingUp size={14} strokeWidth={2.5} />
                <span>+18%</span>
              </span>
              <span className="hero__sticker hero__sticker--pro">
                <Zap size={11} fill="#FFFFFF" strokeWidth={0} />
                <span>Pro</span>
              </span>
              <span className="hero__sticker hero__sticker--cart">
                <ShoppingCart size={11} strokeWidth={2.5} />
                <span>+23</span>
              </span>
              <span className="hero__sticker hero__sticker--time">
                <Timer size={11} strokeWidth={2.5} />
                <span>2 хв</span>
              </span>
            </div>
          </div>
          <div className="hero__pill">
            <span className="hero__pill-text">Подивіться як</span>
            <span className="hero__pill-accent">це працює ↓</span>
          </div>
        </div>

        <div className="hero__three-widgets" aria-label="Міні-версії готових віджетів">
          <div
            className="hero__slider"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="hero__slider-track"
              style={{
                transform: `translateX(-${trackIndex * 100}%)`,
                transition: animating ? 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {SLIDER_TRACK.map((s, i) => {
                const Primary = s.Primary
                const Secondary = s.Secondary
                return (
                  <div className="hero__slide" key={`${s.domain}-${i}`}>
                    <div className="hero__addr-bar">
                      <span className="hero__addr-left">
                        {brokenFavicons.has(s.domain) ? (
                          <span
                            className="hero__addr-favicon hero__addr-favicon--fallback"
                            aria-hidden="true"
                          >
                            <Globe size={11} strokeWidth={2.4} />
                          </span>
                        ) : (
                          <img
                            className="hero__addr-favicon"
                            src={faviconUrl(s.domain)}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            onError={() =>
                              setBrokenFavicons(prev => {
                                if (prev.has(s.domain)) return prev
                                const next = new Set(prev)
                                next.add(s.domain)
                                return next
                              })
                            }
                          />
                        )}
                        <span>{s.domain}</span>
                      </span>
                      <span className="hero__addr-live">
                        <span className="hero__live-dot" />
                        <span>LIVE</span>
                      </span>
                    </div>
                    <div className="hero__widgets">
                      <article className="hero__widget-card hero__widget-card--reviews">
                        <Primary />
                      </article>
                      <article className="hero__widget-card hero__widget-card--pd">
                        <Secondary />
                      </article>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="hero__ctas">
          <Link
            to="/pricing"
            className="hero__cta hero__cta--primary"
            onClick={() => trackCtaClick('hero__cta')}
          >
            Спробувати безкоштовно
          </Link>
          <Link
            to="/demo"
            className="hero__cta hero__cta--secondary"
            onClick={() => trackCtaClick('hero__cta')}
          >
            Демо-магазин
            <ArrowUpRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  )
}
