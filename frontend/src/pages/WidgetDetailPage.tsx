import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  HeartHandshake,
} from 'lucide-react'
import { WidgetIcon } from '../components/WidgetIcon'
import {
  widgets,
  packages,
  platformConfig,
  tagLabels,
  tierLabels,
  type Tag,
} from '../data/widgets'
import { cases } from '../data/cases'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './WidgetDetailPage.css'

// Generic benefit copy per tag — used as "Для чого це" cards
const TAG_BENEFITS: Record<Tag, { title: string; text: string }[]> = {
  conversion: [
    { title: 'Більше покупок', text: 'Знижує бар\'єр до дії — відвідувач перетворюється на покупця.' },
    { title: 'Менше відмов', text: 'Зменшує сумніви на картці товару в момент прийняття рішення.' },
    { title: 'Працює 24/7', text: 'Продає навіть коли ти спиш — автоматично на кожній сторінці.' },
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
    { title: 'Більший чек', text: 'Мотивує клієнта додати ще товар — замовлення виростає природно.' },
    { title: 'Прозора мотивація', text: 'Покупець бачить вигоду і сам тягнеться до неї — без тиску.' },
    { title: 'Кращий ROAS', text: 'Один клієнт приносить більше — маркетинг окупається швидше.' },
  ],
  urgency: [
    { title: 'Швидше рішення', text: 'Людина не відкладає покупку на завтра — приймає рішення зараз.' },
    { title: 'Менше роздумів', text: 'Обмеження в часі або кількості знімає перфекціонізм покупця.' },
    { title: 'Імпульсні покупки', text: 'Конверсія в реальний час росте за рахунок швидших транзакцій.' },
  ],
  loyalty: [
    { title: 'Повертаються', text: 'Покупці мають мотивацію прийти до тебе знову — LTV росте.' },
    { title: 'Економія на рекламі', text: 'Повторні покупки дешевші за залучення нових клієнтів.' },
    { title: 'Залучення', text: 'Система бонусів перетворює разового покупця на фаната.' },
  ],
  engagement: [
    { title: 'Взаємодія', text: 'Клієнт не просто дивиться — він грає, вибирає, взаємодіє з магазином.' },
    { title: 'Емоції', text: 'Позитивний досвід формує прив\'язаність — повертаються за емоцією.' },
    { title: 'Вірусність', text: 'Цікавим досвідом діляться з друзями — трафік приходить сам.' },
  ],
}

const BENEFIT_ICONS = [Zap, ShieldCheck, HeartHandshake]

export function WidgetDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const widget = useMemo(() => widgets.find((w) => w.id === slug), [slug])

  const relatedWidgets = useMemo(() => {
    if (!widget) return []
    return widgets
      .filter((w) => w.id !== widget.id && w.tag === widget.tag)
      .slice(0, 3)
  }, [widget])

  const usedInCases = useMemo(() => {
    if (!widget) return []
    return cases.filter((c) => c.widgets.some((w) => w.toLowerCase().includes(widget.title.toLowerCase().slice(0, 6))))
  }, [widget])

  const containingPackages = useMemo(() => {
    if (!widget) return []
    return packages.filter((p) => p.widgetIds.includes(widget.id))
  }, [widget])

  if (!widget) {
    return <Navigate to="/widgets" replace />
  }

  const benefits = TAG_BENEFITS[widget.tag]

  return (
    <div className="widget-page">
      <Helmet>
        <title>{`${widget.title} — віджет для магазину | ${BRAND_NAME_UPPER}`}</title>
        <meta name="description" content={widget.description} />
      </Helmet>

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
            <span className="widget-page__breadcrumb-current">{widget.title}</span>
          </nav>

          <div className="widget-page__hero-grid">
            <div className="widget-page__hero-left">
              <div className="widget-page__icon">
                <WidgetIcon name={widget.icon} size={40} />
              </div>

              <div className="widget-page__badges">
                <span className={`widget-page__tag widget-page__tag--${widget.tagColor}`}>
                  {tagLabels[widget.tag]}
                </span>
                <span className="widget-page__tier">{tierLabels[widget.priceTier]}</span>
                {widget.isNew && <span className="widget-page__new">NEW</span>}
                {widget.isPopular && (
                  <span className="widget-page__popular">
                    <Sparkles size={11} strokeWidth={2.5} />
                    Популярне
                  </span>
                )}
              </div>

              <h1 className="widget-page__title">{widget.title}</h1>
              <p className="widget-page__lede">{widget.description}</p>
            </div>

            <aside className="widget-page__buy">
              <p className="widget-page__buy-sub">Доступний у тарифах</p>
              <div className="widget-page__buy-plans">
                {['Pro', 'Max'].map((plan) => (
                  <div key={plan} className="widget-page__buy-plan">
                    <Check size={13} strokeWidth={3} />
                    <span>{plan}</span>
                  </div>
                ))}
              </div>
              <Link to="/pricing" className="widget-page__buy-btn">
                Обрати тариф
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <ul className="widget-page__buy-perks">
                <li>
                  <Check size={13} strokeWidth={3} />
                  <span>Встановлення за 2 хвилини</span>
                </li>
                <li>
                  <Check size={13} strokeWidth={3} />
                  <span>Інструкція для твоєї CMS</span>
                </li>
                <li>
                  <Check size={13} strokeWidth={3} />
                  <span>14 днів гарантія повернення</span>
                </li>
              </ul>
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
              return (
                <div key={b.title} className="widget-benefit">
                  <div className="widget-benefit__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="widget-benefit__title">{b.title}</h3>
                  <p className="widget-benefit__text">{b.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Compatibility ── */}
      <section className="widget-page__compat">
        <div className="widget-page__container">
          <header className="widget-page__section-head">
            <p className="widget-page__section-eyebrow">Сумісність</p>
            <h2 className="widget-page__section-title">Працює з цими платформами</h2>
          </header>
          <div className="widget-page__platforms">
            {platformConfig.map((p) => (
              <span
                key={p.id}
                className={`widget-page__platform ${!p.available ? 'widget-page__platform--soon' : ''}`}
              >
                {p.available ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : (
                  <span className="widget-page__platform-soon-dot" />
                )}
                <span>{p.label}</span>
                {!p.available && <span className="widget-page__platform-soon-label">Скоро</span>}
              </span>
            ))}
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
                    <strong>{c.owner}</strong>
                    <span>{c.result.metric}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Package upsell ── */}
      {containingPackages.length > 0 && (
        <section className="widget-page__upsell">
          <div className="widget-page__container">
            <div className="widget-page__upsell-card">
              <div className="widget-page__upsell-head">
                <Sparkles size={18} strokeWidth={2.5} />
                <h2>Вигідніше пакетом</h2>
              </div>
              <p className="widget-page__upsell-sub">
                Цей віджет вже входить у {containingPackages.length === 1 ? 'пакет' : 'пакети'}:
              </p>
              <div className="widget-page__upsell-list">
                {containingPackages.map((p) => {
                  const discount = Math.round((1 - p.price / p.originalPrice) * 100)
                  return (
                    <div key={p.id} className="widget-page__upsell-item">
                      <div className="widget-page__upsell-item-name">
                        <strong>{p.name}</strong>
                        <span>{p.widgetIds.length} віджетів</span>
                      </div>
                      <div className="widget-page__upsell-item-price">
                        <span className="widget-page__upsell-old">
                          {p.originalPrice.toLocaleString('uk-UA')} грн
                        </span>
                        <strong>{p.price.toLocaleString('uk-UA')} грн</strong>
                        <span className="widget-page__upsell-discount">−{discount}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link to="/pricing" className="widget-page__upsell-cta">
                Обрати тариф
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
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
              {relatedWidgets.map((w) => (
                <Link key={w.id} to={`/widgets/${w.id}`} className="widget-page__related-card">
                  <div className="widget-page__related-icon">
                    <WidgetIcon name={w.icon} size={22} />
                  </div>
                  <div className="widget-page__related-body">
                    <strong>{w.title}</strong>
                    <span>{tagLabels[w.tag]}</span>
                  </div>
                  <ArrowRight
                    size={14}
                    strokeWidth={2.25}
                    className="widget-page__related-arrow"
                  />
                </Link>
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
              <ShieldCheck size={14} strokeWidth={2.25} />
              <span>14 днів гарантії без ризику</span>
            </div>
            <h2 className="widget-page__final-title">Підключаємо?</h2>
            <p className="widget-page__final-sub">
              14 днів гарантія. Якщо не сподобається — повертаємо гроші без питань.
            </p>
            <div className="widget-page__final-actions">
              <Link to="/pricing" className="widget-page__final-btn">
                Обрати тариф
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link to="/widgets" className="widget-page__final-back">
                <ArrowLeft size={13} strokeWidth={2.25} />
                Всі віджети
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
