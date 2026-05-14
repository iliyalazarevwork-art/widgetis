import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Zap,
  ShoppingBag,
  Eye,
  Check,
  Plus,
  X,
  ShieldCheck,
  RotateCcw,
  Truck,
  MessageCircle,
  Camera,
  CornerDownRight,
  ChevronRight,
} from 'lucide-react'
import { useVisible } from '../hooks/useVisible'
import './WidgetsShowcase.css'

function useLocalTime() {
  const [time, setTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }, 10_000)
    return () => clearInterval(t)
  }, [])
  return time
}

// ─── Phone animation: MODO store + One-Plus-One widget ────────────────────────

// phase 0: product page (idle, marquee running)
// phase 1: page scrolled down (buy button more prominent)
// phase 2: dim + bottom sheet slides up ("Часто беруть разом")
// phase 3: first item added (green checkmark)
type Phase = 0 | 1 | 2 | 3

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1600,  // scroll gesture
  1: 1460,  // scroll settles + cursor glides to buy button + clicks
  2: 1330,  // sheet opens + cursor from center → "+" → clicks
  3: 320,   // green check flashes on open sheet, then cycle resets
}

function MarqueeItems() {
  return (
    <>
      <span className="wss__ph-mq-item">
        <Sparkles size={9} strokeWidth={2} /> Нова колекція SS26
      </span>
      <span className="wss__ph-mq-sep">·</span>
      <span className="wss__ph-mq-item">FREE доставка від 1500 грн</span>
      <span className="wss__ph-mq-sep">·</span>
      <span className="wss__ph-mq-item wss__ph-mq-item--promo">
        <Zap size={9} strokeWidth={2} /> -15% на все
      </span>
      <span className="wss__ph-mq-sep">·</span>
    </>
  )
}

const trustItems = [
  {
    icon: ShieldCheck,
  },
  {
    icon: RotateCcw,
  },
  {
    icon: Truck,
  },
]

function SlideModo() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const time = useLocalTime()

  return (
    <div className="wss__ph-wrap" ref={ref} data-anim={active ? 'play' : 'pause'}>
      <SlideModoScene key={active ? 'active' : 'inactive'} active={active} time={time} />
    </div>
  )
}

function SlideModoScene({ active, time }: { active: boolean; time: string }) {
  const [phase, setPhase] = useState<Phase>(0)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(
      () => setPhase((p) => ((p + 1) % 4) as Phase),
      PHASE_DURATIONS[phase],
    )
    return () => clearTimeout(t)
  }, [phase, active])

  const scrolled = phase >= 1
  const sheetOpen = phase >= 2
  const itemAdded = phase === 3

  return (
    <div className="wss__ph">
      <div className="wss__ph-frame">
          {/* Volume / power buttons */}
          <div className="wss__ph-btn wss__ph-btn--volu" />
          <div className="wss__ph-btn wss__ph-btn--vold" />
          <div className="wss__ph-btn wss__ph-btn--pwr" />

          {/* ── Screen ── */}
          <div className="wss__ph-screen">

            {/* Main scrollable content */}
            <div
              className="wss__ph-mc"
              style={{ transform: scrolled ? 'translateY(-85px)' : 'translateY(0)' }}
            >
              {/* Status bar */}
              <div className="wss__ph-sb">
                <span className="wss__ph-time">{time}</span>
                <div className="wss__ph-sbr">
                  <span className="wss__ph-bat-pct">100%</span>
                  <div className="wss__ph-bat" />
                </div>
              </div>

              {/* Marquee */}
              <div className="wss__ph-mq">
                <div className="wss__ph-mq-track">
                  <MarqueeItems />
                  <MarqueeItems />
                </div>
              </div>

              {/* Store header */}
              <div className="wss__ph-storeheader">
                <span className="wss__ph-storename">MODO</span>
                <ShoppingBag size={17} color="#fff" strokeWidth={1.5} />
              </div>

              {/* Product image */}
              <div className="wss__ph-prodimg">
                <img src="/showcase/modo-tshirt.png" alt="Футболка Oversized Graphic" loading="lazy" />
              </div>

              {/* Badges */}
              <div className="wss__ph-badges">
                <div className="wss__ph-stock">
                  <span className="wss__ph-stock-dot" />
                  <span>Залишилось 2 шт</span>
                </div>
                <div className="wss__ph-viewers">
                  <Eye size={10} color="#888" strokeWidth={2} />
                  <span>8 дивляться зараз</span>
                </div>
              </div>

              {/* Product info */}
              <div className="wss__ph-pinfo">
                <div className="wss__ph-brand-row">
                  <span className="wss__ph-brand">MODO STUDIO</span>
                  <span className="wss__ph-rating">★ 4.8</span>
                </div>
                <div className="wss__ph-ptitle">Футболка Oversized Graphic</div>
                <div className="wss__ph-pricerow">
                  <span className="wss__ph-price">1 190 грн</span>
                  <span className="wss__ph-price-old">1 490 грн</span>
                </div>
                <div className="wss__ph-sizes">
                  <span className="wss__ph-sz wss__ph-sz--active">M</span>
                  <span className="wss__ph-sz">S</span>
                  <span className="wss__ph-sz">L</span>
                  <span className="wss__ph-sz">XL</span>
                </div>
                <div
                  key={phase >= 1 ? 'hovered' : 'idle'}
                  className={`wss__ph-buybtn${phase === 1 ? ' wss__ph-buybtn--hover' : ''}`}
                >
                  Купити
                </div>
              </div>

              {/* Trust row */}
              <div className="wss__ph-trust">
                {trustItems.map(({ icon: Icon }, index) => (
                  <div key={index} className="wss__ph-trust-card" aria-hidden="true">
                    <div className="wss__ph-trust-icon">
                      <Icon size={13} strokeWidth={2.2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursor */}
            <div key={phase} className={`wss__ph-cursor wss__ph-cursor--p${phase}`}>
              <svg width="26" height="32" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2 L4 24 L12 19 L20 24 Z"
                  fill="white"
                  stroke="#111111"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  transform="rotate(-30 12 15)"
                />
              </svg>
            </div>

            {/* Dim overlay */}
            <div
              className="wss__ph-dim"
              style={{ opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? 'auto' : 'none' }}
            />

            {/* Bottom sheet */}
            <div
              className="wss__ph-sheet"
              style={{ transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)' }}
            >
              <div className="wss__ph-shhandle" />
              <div className="wss__ph-shhead">
                <span className="wss__ph-shtitle">Часто беруть разом</span>
                <X size={15} color="#bbb" strokeWidth={2} />
              </div>
              <div className="wss__ph-shdivider" />

              <div className="wss__ph-shitems">
                {/* Item 1 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-socks.png" alt="Носки" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Носки Cotton White Pack</div>
                    <div className="wss__ph-shprice">149 грн</div>
                  </div>
                  <button
                    key={itemAdded ? 'done' : 'add'}
                    className={`wss__ph-shadd${phase === 2 ? ' wss__ph-shadd--hover' : ''}${itemAdded ? ' wss__ph-shadd--done' : ''}`}
                  >
                    {itemAdded
                      ? <Check size={14} color="#fff" strokeWidth={2.5} />
                      : <Plus size={14} color="#fff" strokeWidth={2.5} />}
                  </button>
                </div>

                <div className="wss__ph-shdivider" />

                {/* Item 2 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-cap.png" alt="Кепка" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Кепка Five Panel Black</div>
                    <div className="wss__ph-shprice">490 грн</div>
                  </div>
                  <button className="wss__ph-shadd">
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="wss__ph-shdivider" />

                {/* Item 3 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-shorts.png" alt="Шорти" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Шорти Cargo Flow Beige</div>
                    <div className="wss__ph-shprice">890 грн</div>
                  </div>
                  <button className="wss__ph-shadd">
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="wss__ph-shcta">
                <div className="wss__ph-shctabtn">Оформити замовлення</div>
              </div>
            </div>

          </div>
      </div>
    </div>
  )
}

// ─── Phone animation: reviews page + form sheet ───────────────────────────────

// phase 0: reviews list idle + (after first submit) carousel rotation animation
// phase 1: page scrolls down, cursor glides to "Написати відгук" and clicks
// phase 2: form sheet slides up, cursor glides to send button
// phase 3: send glows → carousel state mutates for next phase 0 rotation
type ReviewPhase = 0 | 1 | 2 | 3

type Reviewer = {
  initial: string
  name: string
  email: string
  text: string
  avatarMod: string
  date: string
  photos: number
  // Offset into the reviewer's photo pool. Each reviewer's photos are sliced
  // starting from this index so adjacent reviews show different pictures,
  // mimicking a real "вот мой заказ" feed.
  photoStart: number
  // Optional override of the photo pool. Defaults to PHOTO_POOL (product shots).
  // New reviewers use NEW_PHOTO_POOL (on-hanger lifestyle shots) so the feed
  // visibly diversifies as fresh reviews come in.
  pool?: readonly string[]
}

const PHOTO_POOL = ['/showcase/modo-tshirt.png'] as const

const NEW_PHOTO_POOL = [
  '/showcase/modo-review-hanger-1.png',
  '/showcase/modo-review-hanger-2.png',
  '/showcase/modo-review-hanger-3.png',
] as const

const photoAt = (reviewer: Reviewer, i: number) => {
  const pool = reviewer.pool ?? PHOTO_POOL
  return pool[(reviewer.photoStart + i) % pool.length]
}

const INITIAL_TOP: Reviewer = {
  initial: '',
  name: 'Наталя Кравченко',
  email: '',
  text: 'Футболка сіла вільно, тканина щільна і приємна. Фото повністю відповідає товару.',
  avatarMod: 'gray',
  date: '03.06.2025 в 21:24',
  photos: 1,
  photoStart: 0,
}

const INITIAL_BOTTOM: Reviewer = {
  initial: 'О',
  name: 'Оксана Мельник',
  email: '',
  text: 'Брала як базову річ під джинси. Оверсайз виглядає акуратно, шви рівні.',
  avatarMod: 'b',
  date: '01.06.2025 в 18:07',
  photos: 1,
  photoStart: 0,
}

const NEW_REVIEWERS: Reviewer[] = [
  {
    initial: 'І',
    name: 'Ірина Лазаренко',
    email: 'irina.l@gmail.com',
    text: 'Дуже задоволена покупкою! Тканина приємна, посадка ідеальна.',
    avatarMod: 'new',
    date: 'Щойно',
    photos: 2,
    photoStart: 0, // hanger-1, hanger-2
    pool: NEW_PHOTO_POOL,
  },
  {
    initial: 'А',
    name: 'Анна Соколенко',
    email: 'anna.s@gmail.com',
    text: 'Якість тканини відмінна, точно за розміром. Дякую!',
    avatarMod: 'new2',
    date: 'Щойно',
    photos: 3,
    photoStart: 1, // hanger-2, hanger-3, hanger-1
    pool: NEW_PHOTO_POOL,
  },
  {
    initial: 'К',
    name: 'Катерина Дмитренко',
    email: 'kateryna.d@gmail.com',
    text: 'Носиться легко, виглядає круто. Рекомендую!',
    avatarMod: 'new3',
    date: 'Щойно',
    photos: 1,
    photoStart: 2, // hanger-3
    pool: NEW_PHOTO_POOL,
  },
  {
    initial: 'М',
    name: 'Михайло Шевченко',
    email: 'mykhaylo.sh@gmail.com',
    text: 'Чудова футболка, тканина приємна на дотик. Гарна посадка.',
    avatarMod: 'new4',
    date: 'Щойно',
    photos: 2,
    photoStart: 1, // hanger-2, hanger-3
    pool: NEW_PHOTO_POOL,
  },
  {
    initial: 'Б',
    name: 'Богдан Мельник',
    email: 'bohdan.m@gmail.com',
    text: 'Якість на висоті, рекомендую цей магазин. Вдала покупка!',
    avatarMod: 'new5',
    date: 'Щойно',
    photos: 3,
    photoStart: 0, // hanger-1, hanger-2, hanger-3
    pool: NEW_PHOTO_POOL,
  },
]

const REVIEW_PHASE_DURATIONS: Record<ReviewPhase, number> = {
  // Phase 0 must outlast the carousel rotation. Carousel CSS transition is
  // 0.6s with a 0.35s delay, ends at ~0.95s. We teleport the off-screen
  // "below" slot back to "above" at 1.2s, then keep some idle time so the
  // viewer registers the new top review before scrolling resumes.
  0: 1700,
  1: 1100,
  2: 1800,
  3: 500,
}

type SlotPos = 'above' | 'top' | 'bottom' | 'below'

type Slot = {
  reviewer: Reviewer | null
  pos: SlotPos
  noTrans: boolean
}

type SlotTriple = [Slot, Slot, Slot]

const INITIAL_SLOTS: SlotTriple = [
  { reviewer: null, pos: 'above', noTrans: false },
  { reviewer: INITIAL_TOP, pos: 'top', noTrans: false },
  { reviewer: INITIAL_BOTTOM, pos: 'bottom', noTrans: false },
]

function SlideReviews() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const time = useLocalTime()

  return (
    <div className="wss__ph-wrap" ref={ref} data-anim={active ? 'play' : 'pause'}>
      <SlideReviewsScene key={active ? 'active' : 'inactive'} active={active} time={time} />
    </div>
  )
}

function SlideReviewsScene({ active, time }: { active: boolean; time: string }) {
  const [phase, setPhase] = useState<ReviewPhase>(0)
  const [slots, setSlots] = useState<SlotTriple>(INITIAL_SLOTS)
  // Cycle counter — drives which NEW_REVIEWERS entry fills the form and the
  // newly-rising slot. Plain ref so writes don't trigger re-renders.
  const cycleRef = useRef(0)
  const prevPhaseRef = useRef<ReviewPhase>(0)
  // formReviewer is derived state — recomputed on every render. We read
  // cycleRef.current which advances only after a phase-3→0 transition.
  const formReviewer = NEW_REVIEWERS[cycleRef.current % NEW_REVIEWERS.length]

  // Phase ticker
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      setPhase((p) => ((p + 1) % 4) as ReviewPhase)
    }, REVIEW_PHASE_DURATIONS[phase])
    return () => clearTimeout(t)
  }, [phase, active])

  // Carousel rotation: triggered only on phase-3 → phase-0 transitions.
  // The very first phase-0 (initial mount) is skipped — the user sees the
  // two initial reviews before any animation kicks in.
  useEffect(() => {
    const cameFromPhase3 = prevPhaseRef.current === 3
    prevPhaseRef.current = phase

    if (phase !== 0 || !cameFromPhase3) return

    const nextReviewer = NEW_REVIEWERS[cycleRef.current % NEW_REVIEWERS.length]
    cycleRef.current += 1

    // Step 1: animate rotation.
    //   above (empty)  → top (now holds nextReviewer) — slides in from above
    //   top    → bottom — slides down within visible area
    //   bottom → below  — slides off the bottom of the carousel viewport
    setSlots(
      (prev) =>
        prev.map((s) => {
          if (s.pos === 'above') return { reviewer: nextReviewer, pos: 'top', noTrans: false }
          if (s.pos === 'top') return { ...s, pos: 'bottom', noTrans: false }
          if (s.pos === 'bottom') return { ...s, pos: 'below', noTrans: false }
          return s
        }) as SlotTriple,
    )

    // Step 2: once animation has finished, silently teleport the "below"
    // slot back to "above" (with noTrans so the long jump isn't animated),
    // ready to be reused as the next cycle's incoming review.
    let rafId = 0
    const teleportTimer = window.setTimeout(() => {
      setSlots(
        (prev) =>
          prev.map((s) =>
            s.pos === 'below' ? { reviewer: null, pos: 'above', noTrans: true } : s,
          ) as SlotTriple,
      )
      // Re-enable transitions on the next frame so the slide-in animation
      // works next cycle.
      rafId = window.requestAnimationFrame(() => {
        setSlots((prev) => prev.map((s) => ({ ...s, noTrans: false })) as SlotTriple)
      })
    }, 1200)

    return () => {
      window.clearTimeout(teleportTimer)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [phase])

  const scrolled = phase !== 0
  const sheetOpen = phase >= 2
  const sendActive = phase === 3
  const scrollOffset = scrolled ? -400 : 0

  return (
    <div className="wss__ph">
      <div className="wss__ph-frame">
        <div className="wss__ph-btn wss__ph-btn--volu" />
        <div className="wss__ph-btn wss__ph-btn--vold" />
        <div className="wss__ph-btn wss__ph-btn--pwr" />

        <div className="wss__ph-screen wss__ph-screen--wh">

          <div
            className="wss__ph-mc wss__rv-mc"
            style={{ transform: `translateY(${scrollOffset}px)` }}
          >
            <div className="wss__ph-sb wss__rv-sb">
              <span className="wss__ph-time">{time}</span>
              <div className="wss__ph-sbr">
                <span className="wss__ph-bat-pct">100%</span>
                <div className="wss__ph-bat" />
              </div>
            </div>

            <div className="wss__ph-storeheader">
              <span className="wss__ph-storename">MODO</span>
              <MessageCircle size={17} color="#fff" strokeWidth={1.5} />
            </div>

            <div className="wss__rv-page">
              <h3 className="wss__rv-pagetitle">Відгуки покупців</h3>

              <div className="wss__rv-summary">
                <span className="wss__rv-star-main">★</span>
                <span className="wss__rv-score">4.9</span>
                <span className="wss__rv-sep">·</span>
                <span className="wss__rv-count">128 відгуків</span>
              </div>

              {/* Filter chips above the carousel */}
              <div className="wss__rv-filters">
                <span className="wss__rv-chip wss__rv-chip--active">Усі</span>
                <span className="wss__rv-chip">З фото</span>
                <span className="wss__rv-chip">5 ★</span>
                <span className="wss__rv-chip">Корисні</span>
              </div>

              {/* Carousel — three slots cycling through 4 positions */}
              <div className="wss__rv-list">
                {slots.map((slot, idx) => (
                  <ReviewSlot key={SLOT_KEYS[idx]} slot={slot} />
                ))}
              </div>

              <button
                key={phase === 1 ? 'hover' : 'idle'}
                className={`wss__rv-write${phase === 1 ? ' wss__rv-write--hover' : ''}`}
              >
                Написати відгук
              </button>

              {/* All reviews link */}
              <button className="wss__rv-allreviews">
                <span>Дивитися всі 128 відгуків</span>
                <ChevronRight size={12} strokeWidth={2} />
              </button>

              {/* Related products */}
              <div className="wss__rv-related">
                <h4 className="wss__rv-related-title">Можливо, сподобається</h4>
                <div className="wss__rv-related-row">
                  <div className="wss__rv-related-card">
                    <div className="wss__rv-related-img">
                      <img src="/showcase/modo-review-hanger-1.png" alt="" loading="lazy" />
                    </div>
                    <span className="wss__rv-related-name">Футболка Basic White</span>
                    <span className="wss__rv-related-price">990 грн</span>
                  </div>
                  <div className="wss__rv-related-card">
                    <div className="wss__rv-related-img">
                      <img src="/showcase/modo-review-hanger-2.png" alt="" loading="lazy" />
                    </div>
                    <span className="wss__rv-related-name">Футболка Heavy Cotton</span>
                    <span className="wss__rv-related-price">1 290 грн</span>
                  </div>
                  <div className="wss__rv-related-card">
                    <div className="wss__rv-related-img">
                      <img src="/showcase/modo-review-hanger-3.png" alt="" loading="lazy" />
                    </div>
                    <span className="wss__rv-related-name">Футболка Cream Tone</span>
                    <span className="wss__rv-related-price">1 190 грн</span>
                  </div>
                </div>
              </div>

              {/* Store card */}
              <div className="wss__rv-storecard">
                <div className="wss__rv-storecard-logo">M</div>
                <div className="wss__rv-storecard-info">
                  <span className="wss__rv-storecard-title">MODO STUDIO</span>
                  <span className="wss__rv-storecard-desc">Streetwear від українських дизайнерів</span>
                </div>
                <ChevronRight size={14} strokeWidth={2} color="#888" />
              </div>
            </div>
          </div>

          <div key={phase} className={`wss__ph-cursor wss__rv-cursor--p${phase}`}>
            <svg width="26" height="32" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2 L4 24 L12 19 L20 24 Z"
                fill="white"
                stroke="#111111"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                transform="rotate(-30 12 15)"
              />
            </svg>
          </div>

          <div
            className="wss__ph-dim"
            style={{ opacity: sheetOpen ? 1 : 0, pointerEvents: 'none' }}
          />

          <div
            className="wss__ph-sheet wss__rv-sheet"
            style={{ transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)' }}
          >
            <div className="wss__ph-shhandle" />
            <div className="wss__rv-form">
              <div className="wss__rv-form-header">
                <p className="wss__rv-form-title">Новий відгук</p>
                <X size={15} color="#bbb" strokeWidth={2} />
              </div>

              <div className="wss__rv-form-field wss__rv-form-field--filled">
                {formReviewer.name}
              </div>
              <div className="wss__rv-form-field wss__rv-form-field--filled">
                {formReviewer.email}
              </div>
              <div className="wss__rv-form-textarea wss__rv-form-textarea--filled">
                {formReviewer.text}
              </div>

              <div className="wss__rv-form-photos">
                {sheetOpen && (
                  <div className="wss__rv-form-photos-row" key={`photos-${cycleRef.current}`}>
                    {Array.from({ length: formReviewer.photos }).map((_, i) => (
                      <div
                        key={i}
                        className="wss__rv-form-photo"
                        style={{ animationDelay: `${0.25 + i * 0.18}s` }}
                      >
                        <img src={photoAt(formReviewer, i)} alt="" loading="lazy" />
                        <span className="wss__rv-form-photo-remove" aria-hidden="true">
                          <X size={7} color="#fff" strokeWidth={3} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <span className="wss__rv-form-hint">До 5 фото або 1 відео до 30 МБ</span>
              </div>

              <div className="wss__rv-form-rate">
                <span className="wss__rv-form-rate-label">Оцініть товар</span>
                <div className="wss__rv-form-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="wss__rv-form-star wss__rv-form-star--filled">★</span>
                  ))}
                </div>
              </div>

              <div className="wss__rv-form-actions">
                <button
                  className={`wss__rv-form-send${sendActive ? ' wss__rv-form-send--glow' : ''}`}
                >
                  Надіслати
                </button>
                <button className="wss__rv-form-cancel">Скасувати</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const SLOT_KEYS = ['slot-a', 'slot-b', 'slot-c'] as const

function ReviewSlot({ slot }: { slot: Slot }) {
  const { reviewer, pos, noTrans } = slot
  return (
    <div
      className="wss__rv-slot"
      data-pos={pos}
      data-no-trans={noTrans ? 'true' : 'false'}
    >
      {reviewer && (
        <div className="wss__rv-item">
          <div className="wss__rv-meta">
            <div className={`wss__rv-avatar wss__rv-avatar--${reviewer.avatarMod}`}>
              {reviewer.initial}
            </div>
            <div className="wss__rv-info">
              <span className="wss__rv-name">{reviewer.name}</span>
              <span className="wss__rv-date">{reviewer.date}</span>
            </div>
            <span className="wss__rv-irating">★★★★★</span>
          </div>
          <p className="wss__rv-text">{reviewer.text}</p>
          <div className="wss__rv-photos">
            {Array.from({ length: reviewer.photos }).map((_, i) => (
              <div key={i} className="wss__rv-photo">
                <img src={photoAt(reviewer, i)} alt="" loading="lazy" />
                {i === 0 && (
                  <div className="wss__rv-photo-badge">
                    <Camera size={9} strokeWidth={2.2} />
                    <span>Фото від клієнта 1/{reviewer.photos}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="wss__rv-reply">
            <CornerDownRight size={11} strokeWidth={2} />
            <span>Відповісти</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function WidgetsShowcase() {
  return (
    <section className="wss">
      <div className="wss__header">
        <p className="wss__eyebrow">Демонстрація</p>
        <h2 className="wss__title">
          <span className="wss__title-accent">Віджети</span> в дії
        </h2>
        <p className="wss__subtitle">
          Реальні магазини. Живі інтерактивні приклади.
        </p>
      </div>

      <SlideModo />
      <SlideReviews />
    </section>
  )
}
