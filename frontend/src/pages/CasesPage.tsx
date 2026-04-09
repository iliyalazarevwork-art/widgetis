import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Star, TrendingUp } from 'lucide-react'
import { BRAND_NAME_UPPER } from '../constants/brand'
import { cases } from '../data/cases'
import './CasesPage.css'

export function CasesPage() {
  return (
    <div className="cases-page">
      <Helmet>
        <title>{`Кейси та результати — ${BRAND_NAME_UPPER}`}</title>
        <meta
          name="description"
          content={`Реальні магазини, реальні результати: +18% середній чек, +24% конверсія, −31% відмов. Кейси клієнтів ${BRAND_NAME_UPPER} з конкретними цифрами.`}
        />
      </Helmet>

      <section className="cases-page__hero">
        <div className="cases-page__hero-bg" aria-hidden="true">
          <div className="cases-page__hero-glow cases-page__hero-glow--1" />
          <div className="cases-page__hero-glow cases-page__hero-glow--2" />
        </div>
        <div className="cases-page__hero-content page-hero-stack">
          <Link to="/" className="cases-page__back page-back-link">
            <ArrowLeft size={16} strokeWidth={2.25} />
            На головну
          </Link>
          <p className="cases-page__eyebrow page-eyebrow">Кейси</p>
          <h1 className="cases-page__title">
            Реальні магазини, <br />
            <span className="cases-page__title-accent">реальні цифри</span>
          </h1>
          <p className="cases-page__subtitle">
            {cases.length} українських магазинів вже використовують віджети. Ось що вийшло.
          </p>
        </div>
      </section>

      <section className="cases-page__content">
        <div className="cases-page__container">
          <div className="cases-page__grid">
            {cases.map((c, i) => (
              <a
                key={c.id}
                href={c.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="case-card"
                style={
                  {
                    animationDelay: `${i * 60}ms`,
                    ['--case-color' as string]: c.color,
                  } as React.CSSProperties
                }
              >
                {/* Browser chrome */}
                <div className="case-card__browser">
                  <div className="case-card__dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="case-card__url">{c.store}</div>
                  <ExternalLink
                    size={13}
                    strokeWidth={2}
                    className="case-card__browser-ext"
                    aria-hidden="true"
                  />
                </div>

                {/* Body */}
                <div className="case-card__body">
                  <header className="case-card__head">
                    <div
                      className="case-card__avatar"
                      aria-hidden="true"
                    >
                      {c.owner.charAt(0)}
                    </div>
                    <div className="case-card__meta">
                      <strong className="case-card__name">{c.owner}</strong>
                      <span className="case-card__desc">{c.description}</span>
                    </div>
                  </header>

                  <div className="case-card__metric">
                    <TrendingUp size={16} strokeWidth={2.25} />
                    <div className="case-card__metric-body">
                      <strong>{c.result.metric}</strong>
                      <span>{c.result.period}</span>
                    </div>
                  </div>

                  <blockquote className="case-card__review">
                    <div className="case-card__stars" aria-label={`${c.review.rating} з 5`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          strokeWidth={0}
                          fill={j < c.review.rating ? '#f5b400' : 'var(--text-ghost)'}
                        />
                      ))}
                    </div>
                    <p className="case-card__review-text">«{c.review.text}»</p>
                  </blockquote>

                  <div className="case-card__widgets">
                    {c.widgets.map((w) => (
                      <span key={w} className="case-card__widget-tag">
                        {w}
                      </span>
                    ))}
                  </div>

                  <div className="case-card__link">
                    <span>Перейти на сайт</span>
                    <ExternalLink size={14} strokeWidth={2.25} />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="cases-page__cta">
            <h3 className="cases-page__cta-title">Хочеш такі ж результати?</h3>
            <p className="cases-page__cta-sub">
              Обери віджети в каталозі — встановлюється за 3 хвилини
            </p>
            <Link to="/widgets" className="cases-page__cta-btn">
              До каталогу
              <ArrowLeft size={14} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
