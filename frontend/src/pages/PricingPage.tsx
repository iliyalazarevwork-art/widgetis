import { useEffect, useState } from 'react'
import { Check, Sprout, Zap, Crown, ChevronDown, Send, Minus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { get, post } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import type { Subscription } from '../types'
import './PricingPage.css'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'basic',
    icon: Sprout,
    name: 'Basic',
    pitch: 'Для початку',
    monthlyPrice: 799,
    yearlyPrice: 7990,
    yearlyMonthly: 666,
    widgets: 4,
    sites: 1,
    badge: null,
    highlighted: false,
    features: [
      { label: 'Дата доставки',           slug: 'delivery-date'    },
      { label: 'Безкоштовна доставка',     slug: 'free-delivery'    },
      { label: 'Бігуча стрічка',           slug: 'marquee'          },
      { label: 'Хто зараз дивиться',       slug: 'live-viewers'     },
      { label: '1 сайт'                                              },
      { label: 'Email + Telegram підтримка'                          },
    ],
  },
  {
    id: 'pro',
    icon: Zap,
    name: 'Pro',
    pitch: 'Оптимально',
    monthlyPrice: 1599,
    yearlyPrice: 15990,
    yearlyMonthly: 1333,
    widgets: 8,
    sites: 3,
    badge: 'Обирає 73% клієнтів',
    highlighted: true,
    features: [
      { label: 'Всі 8 віджетів',           slug: '/catalog'         },
      { label: 'Лічильник залишків',        slug: 'purchase-counter' },
      { label: 'Прогрес кошика',            slug: 'free-delivery'    },
      { label: 'Фотовідгуки',              slug: 'photo-reviews'    },
      { label: '3 сайти'                                             },
      { label: 'Self-service кастомізація'                           },
    ],
  },
  {
    id: 'max',
    icon: Crown,
    name: 'Max',
    pitch: 'Все включено',
    monthlyPrice: 2899,
    yearlyPrice: 28990,
    yearlyMonthly: 2416,
    widgets: 17,
    sites: 5,
    badge: null,
    highlighted: false,
    features: [
      { label: 'Всі 17 віджетів',          slug: '/catalog'         },
      { label: 'Кешбек-калькулятор',        slug: 'cashback'         },
      { label: 'Таймер терміновості',       slug: 'countdown'        },
      { label: '5 сайтів'                                            },
      { label: 'VIP підтримка'                                       },
      { label: 'Повна кастомізація'                                  },
    ],
  },
]

const COMPARISON_ROWS = [
  { feature: 'Кількість віджетів',  basic: '4',    pro: '8',          max: '17'   },
  { feature: 'Сайтів',              basic: '1',    pro: '3',          max: '5'    },
  { feature: 'Лічильник залишків',  basic: false,  pro: true,         max: true   },
  { feature: 'Фотовідгуки',         basic: false,  pro: true,         max: true   },
  { feature: 'Кешбек-калькулятор',  basic: false,  pro: false,        max: true   },
  { feature: 'Таймер терміновості', basic: false,  pro: false,        max: true   },
  { feature: 'Кастомізація',        basic: 'ручна', pro: 'самостійна', max: 'повна' },
  { feature: 'Підтримка',           basic: 'Email · TG', pro: 'Email · TG', max: 'VIP' },
]

const FAQ_ITEMS = [
  {
    q: 'Що таке trial і як він працює?',
    a: '7 днів безкоштовного доступу на обраному плані. Після закінчення trial автоматично списується оплата. Можна скасувати в будь-який момент до закінчення пробного періоду.',
  },
  {
    q: 'Чи можна змінити план?',
    a: 'Так, у будь-який час. Апгрейд на вищий план діє одразу, даунгрейд — з наступного платіжного циклу.',
  },
  {
    q: 'Що буде, якщо я відмовлюсь від підписки?',
    a: 'Доступ до віджетів зберігається до кінця оплаченого циклу. Всі Ваші налаштування зберігаються.',
  },
  {
    q: 'Як працює оплата?',
    a: 'Карта Visa або Mastercard через LiqPay. Щомісячне або щорічне автосписання залежно від обраного тарифу.',
  },
  {
    q: 'Чи можна купити 1–2 віджети без підписки?',
    a: 'Зараз доступна тільки підписка. Якщо Вам потрібні 1–2 конкретні віджети — напишіть нам у Telegram @widgetis, обговоримо.',
  },
  {
    q: 'На скількох сайтах можна використовувати?',
    a: 'Basic — 1 сайт, Pro — 3 сайти, Max — 5 сайтів. Потрібно більше — напишіть нам.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CellValue({ value, planId }: { value: boolean | string; planId: string }) {
  if (value === true)
    return <Check size={15} strokeWidth={2.5} className={`pricing__check pricing__check--${planId}`} />
  if (value === false)
    return <Minus size={13} strokeWidth={2} className="pricing__lock" />
  const isNumeric = /^\d+$/.test(value as string)
  return (
    <span
      className={`pricing__cell-text${isNumeric ? ` pricing__cell-text--num pricing__cell-text--num-${planId}` : ''}`}
    >
      {value}
    </span>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`pricing__faq-item ${open ? 'pricing__faq-item--open' : ''}`}>
      <button className="pricing__faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <ChevronDown size={18} strokeWidth={2} className="pricing__faq-chevron" />
      </button>
      {open && <p className="pricing__faq-a">{a}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PLAN_HEADERS = [
  { id: 'basic', label: 'Basic', colorClass: 'pricing__col-basic' },
  { id: 'pro',   label: 'Pro',   colorClass: 'pricing__col-pro'   },
  { id: 'max',   label: 'Max',   colorClass: 'pricing__col-max'   },
] as const

type PlanId = 'basic' | 'pro' | 'max'

const PLAN_ORDER: Record<string, number> = { basic: 0, pro: 1, max: 2 }

export function PricingPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [yearly, setYearly] = useState(true)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return

    // Auth done: no user → no subscription to fetch
    if (!user) {
      setSubLoading(false)
      return
    }

    // Auth done, user exists → fetch subscription
    setSubLoading(true)
    get<{ data: Subscription }>('/profile/subscription')
      .then(res => {
        setSub(res.data)
        setYearly(res.data.billing_period === 'yearly')
      })
      .catch(() => null)
      .finally(() => setSubLoading(false))
  }, [user, authLoading])

  // True while we don't yet know the user's plan state
  const ctaReady = !authLoading && !subLoading

  const currentPlanOrder = sub ? (PLAN_ORDER[sub.plan.slug] ?? -1) : -1

  const handleUpgrade = async (planId: string) => {
    if (upgrading) return
    setUpgrading(planId)
    try {
      await post('/profile/subscription/change', { plan_slug: planId })
      toast.success('План змінено!')
      navigate('/cabinet/plan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
      setUpgrading(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>Тарифи — Widgetis</title>
        <meta name="description" content="Оберіть план Widgetis. 7 днів безкоштовно. Від 799 грн/міс." />
      </Helmet>

      <div className="pricing">

        {/* ── Hero ── */}
        <header className="pricing__hero">
          <h1 className="pricing__hero-title">
            {sub ? 'Підвищити план' : 'Обери свій план'}
          </h1>
          <p className="pricing__hero-sub">
            {sub
              ? `Поточний план: ${sub.plan.name} · ${sub.billing_period === 'yearly' ? 'Рік' : 'Місяць'}`
              : '7 днів безкоштовно. Скасуєш коли захочеш.'}
          </p>
        </header>

        {/* ── Toggle (hidden for subscribers — billing period is locked) ── */}
        {!sub && (
          <div className="pricing__seg" role="group" aria-label="Період оплати">
            <button
              className={`pricing__seg-btn ${!yearly ? 'pricing__seg-btn--active' : ''}`}
              onClick={() => setYearly(false)}
            >
              Місяць
            </button>
            <button
              className={`pricing__seg-btn ${yearly ? 'pricing__seg-btn--active' : ''}`}
              onClick={() => setYearly(true)}
            >
              Рік
              <span className="pricing__seg-save">−17%</span>
            </button>
          </div>
        )}

        {/* ── Plans ── */}
        <div className="pricing__plans">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const price = yearly ? plan.yearlyMonthly : plan.monthlyPrice
            const planOrder = PLAN_ORDER[plan.id] ?? 0
            const isCurrent = sub !== null && sub.plan.slug === plan.id
            const isBelow = sub !== null && planOrder < currentPlanOrder
            const isAbove = sub !== null && planOrder > currentPlanOrder

            return (
              <div
                key={plan.id}
                className={`pricing__card pricing__card--${plan.id} ${plan.highlighted ? 'pricing__card--highlight' : ''} ${(isCurrent || isBelow) ? 'pricing__card--dimmed' : ''}`}
              >
                {plan.badge && !isCurrent && !isBelow && <div className="pricing__badge">{plan.badge}</div>}
                {isCurrent && <div className="pricing__badge pricing__badge--current">Ваш поточний план</div>}

                <div className="pricing__card-top">
                  <div className={`pricing__plan-icon pricing__plan-icon--${plan.id}`}>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="pricing__plan-name">{plan.name}</h2>
                    <p className="pricing__plan-pitch">{plan.pitch}</p>
                  </div>
                </div>

                <div className="pricing__price-block">
                  {yearly && (
                    <span className="pricing__price-old">{plan.monthlyPrice.toLocaleString('uk-UA')}</span>
                  )}
                  <span className="pricing__price">{price.toLocaleString('uk-UA')}</span>
                  <span className="pricing__price-unit">грн/міс</span>
                </div>
                {yearly ? (
                  <div className="pricing__price-yearly-row">
                    <p className="pricing__price-annual">{plan.yearlyPrice.toLocaleString('uk-UA')} грн/рік</p>
                    <span className="pricing__savings">
                      Економія {(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString('uk-UA')} грн
                    </span>
                  </div>
                ) : (
                  <p className="pricing__price-annual pricing__price-annual--placeholder">При річній оплаті — 2 міс у подарунок</p>
                )}

                <p className="pricing__widgets-count">
                  {plan.widgets === 17 ? 'Всі 17 віджетів' : `${plan.widgets} віджети`} · {plan.sites} {plan.sites === 1 ? 'сайт' : 'сайти'}
                </p>

                <ul className="pricing__features">
                  {plan.features.map(f => (
                    <li key={f.label}>
                      <Check size={14} strokeWidth={2.5} className={`pricing__feature-check pricing__feature-check--${plan.id}`} />
                      {f.slug ? (
                        <Link
                          to={f.slug.startsWith('/') ? f.slug : `/widgets/${f.slug}`}
                          className={`pricing__feature-link pricing__feature-link--${plan.id}`}
                        >
                          {f.label}
                        </Link>
                      ) : (
                        f.label
                      )}
                    </li>
                  ))}
                </ul>

                {/* CTA — render only when auth + subscription state is known */}
                {!ctaReady ? (
                  <span className="pricing__cta pricing__cta--skeleton" />
                ) : isCurrent ? (
                  <Link to="/cabinet/plan" className={`pricing__cta pricing__cta--${plan.id} pricing__cta--current`}>
                    Мій план
                  </Link>
                ) : isBelow ? (
                  <span className={`pricing__cta pricing__cta--${plan.id} pricing__cta--disabled`}>
                    Нижчий план
                  </span>
                ) : isAbove ? (
                  <button
                    className={`pricing__cta pricing__cta--${plan.id} ${plan.highlighted ? 'pricing__cta--highlight' : ''}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === plan.id ? 'Змінюємо…' : `Перейти на ${plan.name}`}
                  </button>
                ) : (
                  <Link
                    to={`/signup?plan=${plan.id}&billing=${yearly ? 'yearly' : 'monthly'}`}
                    className={`pricing__cta pricing__cta--${plan.id} ${plan.highlighted ? 'pricing__cta--highlight' : ''}`}
                  >
                    Почати безкоштовно
                  </Link>
                )}
                {ctaReady && !sub && <p className="pricing__trial-note">7 днів безкоштовно</p>}
              </div>
            )
          })}
        </div>

        {/* ── Trust row ── */}
        <div className="pricing__trust">
          <span className="pricing__trust-badge">🔒 7 днів безкоштовно · без автосписання без попередження</span>
          <div className="pricing__payment-logos">
            {['Visa', 'Mastercard', 'Privat24', 'Monobank'].map(name => (
              <span key={name} className="pricing__payment-logo">{name}</span>
            ))}
          </div>
        </div>

        {/* ── Comparison table ── */}
        <div id="compare-plans" className="pricing__compare-wrap">
          <h2 className="pricing__compare-title">Порівняння планів</h2>

          <div className="pricing__clist">
            {/* Header row */}
            <div className="pricing__clist-header">
              <div className="pricing__clist-feature-col" />
              {PLAN_HEADERS.map(p => (
                <div key={p.id} className={`pricing__clist-plan-col ${p.colorClass}`}>{p.label}</div>
              ))}
            </div>

            {COMPARISON_ROWS.map(row => (
              <div key={row.feature} className="pricing__clist-row">
                <span className="pricing__clist-feature">{row.feature}</span>
                {(['basic', 'pro', 'max'] as PlanId[]).map(planId => (
                  <span key={planId} className={`pricing__clist-cell pricing__clist-cell--${planId}`}>
                    <CellValue value={row[planId]} planId={planId} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── A-la-carte teaser ── */}
        <div className="pricing__alacarte">
          <p>Потрібні тільки 1–2 віджети?<br />Напишіть — обговоримо окремо.</p>
          <a href="https://t.me/widgetis" target="_blank" rel="noopener noreferrer" className="pricing__alacarte-btn">
            <Send size={14} strokeWidth={2} />
            Telegram @widgetis
          </a>
        </div>

        {/* ── FAQ ── */}
        <div className="pricing__faq-wrap">
          <h2 className="pricing__faq-title">Часті питання</h2>
          <div className="pricing__faq-list">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="pricing__final-cta">
          <h2 className="pricing__final-cta-title">Готові почати?</h2>
          {ctaReady && (sub ? (
            <Link to="/cabinet/plan" className="pricing__final-cta-btn">
              Переглянути мій план
            </Link>
          ) : (
            <>
              <Link to="/signup?plan=pro" className="pricing__final-cta-btn">
                Почати безкоштовно
              </Link>
              <p className="pricing__final-cta-note">7 днів безкоштовно, без зобов'язань</p>
            </>
          ))}
        </div>

      </div>
    </>
  )
}
