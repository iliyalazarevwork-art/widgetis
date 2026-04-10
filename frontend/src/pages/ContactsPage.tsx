import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Mail, Phone } from 'lucide-react'
import { SocialIcon } from '../components/SocialIcon'
import { useSettings } from '../context/SettingsContext'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './ContactsPage.css'

const MESSENGER_META: Record<string, { name: string; color: string }> = {
  telegram:  { name: 'Telegram',  color: '#26A5E4' },
  viber:     { name: 'Viber',     color: '#7360F2' },
  whatsapp:  { name: 'WhatsApp',  color: '#25D366' },
}

export function ContactsPage() {
  const settings = useSettings()

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, '')}` : ''
  const formatHandle = (id: string, url: string): string => {
    if (id === 'telegram') {
      const match = url.match(/t\.me\/(.+)/)
      return match ? `@${match[1]}` : url
    }
    if (id === 'viber' || id === 'whatsapp') {
      return settings.phone || url.replace(/https?:\/\//, '')
    }
    return url.replace(/https?:\/\//, '')
  }

  const messengers = Object.entries(settings.messengers ?? {})
    .filter(([, url]) => url)
    .map(([id, url]) => ({
      id,
      name: MESSENGER_META[id]?.name ?? id,
      handle: formatHandle(id, url),
      url,
      color: MESSENGER_META[id]?.color ?? '#888',
    }))

  return (
    <div className="contacts-page">
      <Helmet>
        <title>{`Контакти — ${BRAND_NAME_UPPER}`}</title>
        <meta
          name="description"
          content={`Телефон, email і месенджери ${BRAND_NAME_UPPER}. Напишіть у Telegram, Viber або WhatsApp — відповімо протягом 15 хвилин.`}
        />
      </Helmet>

      <section className="contacts-page__hero">
        <div className="contacts-page__hero-bg" aria-hidden="true">
          <div className="contacts-page__hero-glow contacts-page__hero-glow--1" />
          <div className="contacts-page__hero-glow contacts-page__hero-glow--2" />
        </div>
        <div className="contacts-page__hero-content page-hero-stack">
          <Link to="/" className="contacts-page__back page-back-link">
            <ArrowLeft size={16} strokeWidth={2.25} />
            На головну
          </Link>
          <p className="contacts-page__eyebrow page-eyebrow">Контакти</p>
          <h1 className="contacts-page__title">
            Пиши в зручному <span className="contacts-page__title-accent">месенджері</span>
          </h1>
          <p className="contacts-page__subtitle">
            Відповідаємо українською, без ботів. У робочий час — протягом 15 хвилин.
          </p>
        </div>
      </section>

      <section className="contacts-page__content">
        <div className="contacts-page__container">
          {/* ── Primary contacts ── */}
          <div className="contacts-page__primary">
            {settings.phone && (
              <a
                href={phoneHref}
                className="contacts-page__card"
                aria-label="Зателефонувати"
              >
                <div className="contacts-page__card-icon">
                  <Phone size={20} strokeWidth={2} />
                </div>
                <div className="contacts-page__card-body">
                  <span className="contacts-page__card-label">Телефон</span>
                  <strong className="contacts-page__card-value">{settings.phone}</strong>
                  <span className="contacts-page__card-hint">{settings.business_hours || 'Пн–Пт · 10:00–19:00'}</span>
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={2}
                  className="contacts-page__card-arrow"
                />
              </a>
            )}

            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="contacts-page__card"
                aria-label="Написати на пошту"
              >
                <div className="contacts-page__card-icon">
                  <Mail size={20} strokeWidth={2} />
                </div>
                <div className="contacts-page__card-body">
                  <span className="contacts-page__card-label">Email</span>
                  <strong className="contacts-page__card-value">{settings.email}</strong>
                  <span className="contacts-page__card-hint">Відповідаємо у день звернення</span>
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={2}
                  className="contacts-page__card-arrow"
                />
              </a>
            )}

          </div>

          {/* ── Messengers ── */}
          <div className="contacts-page__messengers">
            <h2 className="contacts-page__section-title">Месенджери</h2>
            <p className="contacts-page__section-sub">Клікни — і одразу пиши нам</p>

            <div className="contacts-page__messengers-grid">
              {messengers.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target={m.url.startsWith('http') ? '_blank' : undefined}
                  rel={m.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="contacts-page__messenger"
                  style={{ ['--m-color' as string]: m.color }}
                >
                  <span className="contacts-page__messenger-icon">
                    <SocialIcon id={m.id} size={20} />
                  </span>
                  <div className="contacts-page__messenger-body">
                    <strong className="contacts-page__messenger-name">{m.name}</strong>
                    <span className="contacts-page__messenger-handle">{m.handle}</span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2}
                    className="contacts-page__messenger-arrow"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
