import { useMemo } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  HeartHandshake,
  Layers,
  X,
  Sprout,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { WidgetIcon } from '../components/WidgetIcon'
import { WIDGET_ICON_MAP } from '../components/widgetIconMap'
import { Wrench } from 'lucide-react'
import { PREVIEW_MAP, DETAIL_PREVIEW_MAP } from '../components/WidgetPreviews'
import { WidgetCard } from '../components/WidgetCard'
import { getTagColorClass, type TagSlug } from '../data/widgetTags'
import { useWidget, usePlansWithSlugs, useWidgets } from '../hooks/useWidgets'
import type { ApiPlan, ApiWidget } from '../api/widgets'
import { cases } from '../data/cases'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './WidgetDetailPage.css'

// ─── Plan UI metadata (icon + color — not in API) ─────────────────────────────

const PLAN_UI: Record<string, { icon: LucideIcon; color: string }> = {
  basic: { icon: Sprout, color: '#10B981' },
  pro:   { icon: Zap,    color: '#3B82F6' },
  max:   { icon: Crown,  color: '#A855F7' },
}

const TAG_BENEFITS: Record<TagSlug, { title: string; text: string }[]> = {
  conversion: [
    { title: 'Більше покупок', text: 'Знижує бар\'єр до дії — відвідувач перетворюється на покупця.' },
    { title: 'Менше відмов', text: 'Зменшує сумніви на картці товару в момент прийняття рішення.' },
    { title: 'Працює 24/7', text: 'Продає навіть коли Ви спите — автоматично на кожній сторінці.' },
  ],
  trust: [
    { title: 'Знімає сумніви', text: 'Покупець бачить чітку інформацію — не йде шукати відповіді на форумах.' },
    { title: 'Підвищує довіру', text: 'Прозорі умови роблять магазин більш серйозним в очах покупця.' },
    { title: 'Менше запитань', text: 'Клієнти не питають одне й те саме в підтримку — економія часу.' },
  ],
  'social-proof': [
    { title: 'Живий магазин', text: 'Покупець бачить, що тут є життя — інші теж купують тут.' },
    { title: 'FOMO-ефект', text: 'Страх упустити мотивує зробити покупку швидше, не відкладаючи.' },
    { title: 'Довіра за секунди', text: 'Чужий вибір — найкоротший шлях до свого вибору.' },
  ],
  visual: [
    { title: 'Запамʼятовується', text: 'Магазин виглядає живим і стильним — запамʼятається краще за конкурентів.' },
    { title: 'Створює настрій', text: 'Атмосфера свята або сезону напряму впливає на імпульсні покупки.' },
    { title: 'Брендинг', text: 'Додає характеру магазину — вирізняє серед сірих конкурентів.' },
  ],
  'avg-order': [
    { title: 'Збільшіть чек', text: 'Мотивує клієнта додати ще товар — замовлення виростає природно.' },
    { title: 'Прозора мотивація', text: 'Покупець бачить вигоду і сам тягнеться до неї — без тиску.' },
    { title: 'Кращий ROAS', text: 'Один клієнт приносить більше — маркетинг окупається швидше.' },
  ],
  urgency: [
    { title: 'Швидше рішення', text: 'Людина не відкладає покупку на завтра — приймає рішення зараз.' },
    { title: 'Менше роздумів', text: 'Обмеження в часі або кількості знімає перфекціонізм покупця.' },
    { title: 'Імпульсні покупки', text: 'Конверсія в реальний час росте за рахунок швидших транзакцій.' },
  ],
  loyalty: [
    { title: 'Повертаються', text: 'Покупці мають мотивацію прийти до Вас знову — LTV росте.' },
    { title: 'Економія на рекламі', text: 'Повторні покупки дешевші за залучення нових клієнтів.' },
    { title: 'Залучення', text: 'Система бонусів перетворює разового покупця на фаната.' },
  ],
  engagement: [
    { title: 'Взаємодія', text: 'Клієнт не просто дивиться — він грає, вибирає, взаємодіє з магазином.' },
    { title: 'Емоції', text: 'Позитивний досвід формує прив\'язаність — повертаються за емоцією.' },
    { title: 'Вірусність', text: 'Цікавим досвідом діляться з друзями — трафік приходить сам.' },
  ],
}

const BENEFIT_COLORS = ['#3B82F6', '#10B981', '#F59E0B']
const BENEFIT_ICONS = [Zap, ShieldCheck, HeartHandshake]

const WIDGET_CASE_MAP: Record<string, string[]> = {
  'promo-line': ['ptashkin', 'beni-home', 'ballistic'],
  'delivery-date': ['ptashkin', 'brewco'],
  'cart-goal': ['ptashkin', 'homedetail'],
  'buyer-count': ['kyivfit'],
  'stock-left': ['ballistic'],
  'photo-video-reviews': ['kyivfit'],
  'spin-the-wheel': ['kyivfit'],
  'last-chance-popup': ['homedetail'],
  'progressive-discount': ['homedetail'],
  'one-plus-one': ['beni-home'],
  'promo-auto-apply': ['brewco'],
}

function PlanUpsellCard({ plan, allWidgets }: { plan: ApiPlan; allWidgets: ApiWidget[] }) {
  const ui = PLAN_UI[plan.slug] ?? { icon: Zap, color: '#3B82F6' }
  const PlanIcon = ui.icon

  const includedWidgets = plan.widget_slugs
    .map((s) => allWidgets.find((w) => w.slug === s))
    .filter((w): w is ApiWidget => Boolean(w))
  const shown = includedWidgets.slice(0, 4)
  const extra = Math.max(0, includedWidgets.length - shown.length)
  const slugSet = new Set(plan.widget_slugs)
  const notIncluded = allWidgets.filter((w) => !slugSet.has(w.slug)).slice(0, 2)

  return (
    <div
      className={`widget-page__plan widget-page__plan--${plan.slug}`}
      style={{ ['--p-color' as string]: ui.color }}
    >
      <div className="widget-page__plan-top">
        <div className="widget-page__plan-ico" aria-hidden="true">
          <PlanIcon size={20} strokeWidth={2.25} />
        </div>
        <div className="widget-page__plan-labels">
          <strong className="widget-page__plan-name">{plan.name}</strong>
          <span className="widget-page__plan-meta">{plan.max_widgets} віджетів</span>
        </div>
      </div>
      <div className="widget-page__plan-price">
        {plan.price_monthly.toLocaleString('uk-UA')} ₴/міс
      </div>
      <div className="widget-page__plan-sep" />
      <p className="widget-page__plan-eyebrow">ЩО ВХОДИТЬ</p>
      <ul className="widget-page__plan-list">
        {shown.map((w) => {
          const WIcon = WIDGET_ICON_MAP[w.icon] ?? Wrench
          return (
            <li key={w.slug}>
              <span className="widget-page__plan-list-ico" aria-hidden="true">
                <WIcon size={12} strokeWidth={2} />
              </span>
              <span className="widget-page__plan-list-name">{w.name}</span>
              <Check size={12} strokeWidth={3} className="widget-page__plan-list-check" />
            </li>
          )
        })}
        {extra > 0 && (
          <li className="widget-page__plan-more">+ ще {extra} віджети</li>
        )}
      </ul>
      {notIncluded.length > 0 && (
        <>
          <div className="widget-page__plan-sep widget-page__plan-sep--dim" />
          <ul className="widget-page__plan-list widget-page__plan-list--off">
            {notIncluded.map((w) => {
              const WIcon = WIDGET_ICON_MAP[w.icon] ?? Wrench
              return (
                <li key={w.slug}>
                  <span className="widget-page__plan-list-ico widget-page__plan-list-ico--off" aria-hidden="true">
                    <WIcon size={12} strokeWidth={2} />
                  </span>
                  <span className="widget-page__plan-list-name">{w.name}</span>
                  <X size={12} strokeWidth={3} className="widget-page__plan-list-x" />
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className="widget-page__plan-sep" />
      <Link to="/pricing" className="widget-page__plan-cta">
        <PlanIcon size={15} strokeWidth={2.5} />
        Обрати {plan.name}
      </Link>
    </div>
  )
}

export function WidgetDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { widget, loading, notFound } = useWidget(slug)
  const { plans } = usePlansWithSlugs()
  const { widgets: allWidgets } = useWidgets()

  const relatedWidgets = useMemo(() => {
    if (!widget?.related_slugs) return []
    return widget.related_slugs
      .map((s) => allWidgets.find((w) => w.slug === s))
      .filter((w): w is ApiWidget => Boolean(w))
  }, [widget, allWidgets])

  const usedInCases = useMemo(() => {
    if (!widget) return []
    const ids = WIDGET_CASE_MAP[widget.slug] ?? []
    return ids
      .map((id) => cases.find((c) => c.id === id))
      .filter((c): c is (typeof cases)[number] => Boolean(c))
  }, [widget])

  const containingPlans = useMemo(() => {
    if (!widget) return []
    return plans.filter((p) => p.widget_slugs.includes(widget.slug))
  }, [widget, plans])

  if (notFound) {
    return <Navigate to="/widgets" replace />
  }

  if (loading || !widget) {
    return <div className="widget-page" />
  }

  const tagSlug = widget.tag?.slug as TagSlug | undefined
  const tagColorClass = getTagColorClass(tagSlug)
  const benefits = tagSlug ? (TAG_BENEFITS[tagSlug] ?? TAG_BENEFITS.conversion) : TAG_BENEFITS.conversion
  const PreviewComp = DETAIL_PREVIEW_MAP[widget.slug] ?? PREVIEW_MAP[widget.slug]

  const planPrices = containingPlans.map((p) => Number(p.price_monthly)).filter((n) => Number.isFinite(n))
  const lowestPrice = planPrices.length ? Math.min(...planPrices) : 0
  const highestPrice = planPrices.length ? Math.max(...planPrices) : 0

  return (
    <div className="widget-page">
      <SeoHead
        title={`${widget.name} для Хорошоп — ${BRAND_NAME_UPPER} | Встановлення 3 хв`}
        description={`${widget.description} Встановлення 3 хвилини без програміста на магазин у Хорошоп — збільшує конверсію та середній чек.`}
        keywords={`${widget.name} Хорошоп, ${widget.name} Horoshop, ${widget.tag?.name ?? ''} Хорошоп, віджет ${widget.name} для інтернет-магазину`}
        path={`/widgets/${widget.slug}`}
        type="product"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: widget.name,
            description: widget.description,
            brand: { '@type': 'Brand', name: 'Widgetis' },
            category: widget.tag?.name ?? 'E-commerce widget',
            offers: lowestPrice > 0
              ? {
                  '@type': 'AggregateOffer',
                  priceCurrency: 'UAH',
                  lowPrice: lowestPrice.toString(),
                  highPrice: highestPrice.toString(),
                  offerCount: containingPlans.length.toString(),
                  availability: 'https://schema.org/InStock',
                  url: `https://widgetis.com/widgets/${widget.slug}`,
                }
              : {
                  '@type': 'Offer',
                  priceCurrency: 'UAH',
                  price: '799',
                  availability: 'https://schema.org/InStock',
                  url: `https://widgetis.com/widgets/${widget.slug}`,
                },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: 'https://widgetis.com/' },
              { '@type': 'ListItem', position: 2, name: 'Віджети', item: 'https://widgetis.com/widgets' },
              { '@type': 'ListItem', position: 3, name: widget.name, item: `https://widgetis.com/widgets/${widget.slug}` },
            ],
          },
        ]}
      />

      {/* ── Hero ── */}
      <section className="widget-page__hero">
        <div className="widget-page__hero-bg" aria-hidden="true">
          <div className="widget-page__hero-glow" />
        </div>
        <div className="widget-page__hero-content">
          <nav className="widget-page__breadcrumb" aria-label="breadcrumb">
            <Link to="/widgets" className="widget-page__breadcrumb-link">
              <ArrowLeft size={14} strokeWidth={2.25} />
              Віджети
            </Link>
            <span className="widget-page__breadcrumb-sep">/</span>
            <span className="widget-page__breadcrumb-current">{widget.name}</span>
          </nav>

          <div className="widget-page__hero-grid">
            <div className="widget-page__hero-left">
              <div className="widget-page__icon">
                <WidgetIcon name={widget.icon} size={40} />
              </div>

              <div className="widget-page__badges">
                <span className={`widget-page__tag widget-page__tag--${tagColorClass}`}>
                  {widget.tag?.name ?? ''}
                </span>
                {widget.is_new && <span className="widget-page__new">NEW</span>}
                {widget.is_popular && (
                  <span className="widget-page__popular">
                    <Sparkles size={11} strokeWidth={2.5} />
                    Популярне
                  </span>
                )}
              </div>

              <h1 className="widget-page__title">{widget.name}</h1>
              <p className="widget-page__lede">{widget.description}</p>

              {PreviewComp && (
                <div className="widget-page__anim" aria-label="Живий прев'ю віджета">
                  <div className="widget-page__anim-head">
                    <span className="widget-page__anim-dot widget-page__anim-dot--r" />
                    <span className="widget-page__anim-dot widget-page__anim-dot--y" />
                    <span className="widget-page__anim-dot widget-page__anim-dot--g" />
                    <span className="widget-page__anim-label">Прев'ю в реальному часі</span>
                  </div>
                  <div className="widget-page__anim-stage">
                    <PreviewComp />
                  </div>
                </div>
              )}
            </div>

            <aside className="widget-page__buy">
              <p className="widget-page__buy-sub">Доступний у тарифах</p>
              <div className="widget-page__buy-plans">
                {containingPlans.map((p) => {
                  const ui = PLAN_UI[p.slug] ?? { icon: Zap, color: '#3B82F6' }
                  const PIcon = ui.icon
                  return (
                    <div
                      key={p.id}
                      className="widget-page__buy-plan"
                      style={{ ['--p-color' as string]: ui.color }}
                    >
                      <span className="widget-page__buy-plan-ico" aria-hidden="true">
                        <PIcon size={15} strokeWidth={2.25} />
                      </span>
                      <span className="widget-page__buy-plan-name">{p.name}</span>
                      <span className="widget-page__buy-plan-price">
                        {p.price_monthly.toLocaleString('uk-UA')} ₴/міс
                      </span>
                    </div>
                  )
                })}
              </div>
              <Link to="/pricing" className="widget-page__buy-btn">
                Обрати тариф
              </Link>
              <div className="widget-page__buy-guarantee">
                <ShieldCheck size={13} strokeWidth={2.5} />
                <span>14 днів гарантія повернення</span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="widget-page__benefits">
        <div className="widget-page__container">
          <header className="widget-page__section-head">
            <p className="widget-page__section-eyebrow">Для чого це</p>
            <h2 className="widget-page__section-title">Що дає віджет магазину</h2>
          </header>
          <div className="widget-page__benefits-grid">
            {benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length]
              const color = BENEFIT_COLORS[i % BENEFIT_COLORS.length]
              return (
                <div key={b.title} className="widget-benefit">
                  <div
                    className="widget-benefit__icon"
                    style={{ background: `${color}14`, color }}
                    aria-hidden="true"
                  >
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <h3 className="widget-benefit__title">{b.title}</h3>
                  <p className="widget-benefit__text">{b.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Used in cases ── */}
      {usedInCases.length > 0 && (
        <section className="widget-page__cases">
          <div className="widget-page__container">
            <header className="widget-page__section-head">
              <p className="widget-page__section-eyebrow">Кейси</p>
              <h2 className="widget-page__section-title">Магазини, де вже працює</h2>
            </header>
            <div className="widget-page__cases-grid">
              {usedInCases.map((c) => (
                <a
                  key={c.id}
                  href={c.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="widget-page__case"
                  style={{ ['--c-color' as string]: c.color }}
                >
                  <div className="widget-page__case-avatar" aria-hidden="true">
                    {c.owner.charAt(0)}
                  </div>
                  <div className="widget-page__case-body">
                    <strong className="widget-page__case-owner">{c.owner}</strong>
                    <span className="widget-page__case-domain">{c.store}</span>
                  </div>
                  <div className="widget-page__case-metric">
                    <span className="widget-page__case-metric-value">{c.result.metric}</span>
                    <span className="widget-page__case-metric-period">{c.result.period}</span>
                  </div>
                  <ArrowRight
                    size={14}
                    strokeWidth={2.5}
                    className="widget-page__case-arrow"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Package upsell ── */}
      {containingPlans.length > 0 && (
        <section className="widget-page__upsell">
          <div className="widget-page__container">
            <header className="widget-page__upsell-head">
              <Layers size={20} strokeWidth={2.25} />
              <h2 className="widget-page__section-title">Вигідніше пакетом</h2>
            </header>
            <p className="widget-page__upsell-sub">
              Цей віджет вже входить у пакети. Підключіть один тариф — і отримаєте доступ до всіх
              входячих віджетів.
            </p>
            <div className="widget-page__upsell-list">
              {containingPlans.map((p) => (
                <PlanUpsellCard key={p.id} plan={p} allWidgets={allWidgets} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Related ── */}
      {relatedWidgets.length > 0 && (
        <section className="widget-page__related">
          <div className="widget-page__container">
            <header className="widget-page__section-head">
              <p className="widget-page__section-eyebrow">Схожі віджети</p>
              <h2 className="widget-page__section-title">Розглянь також</h2>
            </header>
            <div className="widget-page__related-grid">
              {relatedWidgets.map((w, i) => (
                <WidgetCard key={w.slug} widget={w} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="widget-page__final">
        <div className="widget-page__container">
          <div className="widget-page__final-card">
            <div className="widget-page__final-badge">
              <ShieldCheck size={13} strokeWidth={2.5} />
              <span>14 днів гарантії без ризику</span>
            </div>
            <h2 className="widget-page__final-title">Підключаємо?</h2>
            <p className="widget-page__final-sub">
              Якщо не сподобається — повертаємо гроші без питань.
            </p>
            <div className="widget-page__final-actions">
              <Link to="/pricing" className="widget-page__final-btn">
                Обрати тариф
              </Link>
              <Link to="/widgets" className="widget-page__final-back">
                Всі віджети
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
