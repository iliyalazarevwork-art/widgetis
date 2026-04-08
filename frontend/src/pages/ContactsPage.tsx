import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react'
import { SocialIcon } from '../components/SocialIcon'
import './ContactsPage.css'

const CONTACTS = {
  phone: '+380 96 149 47 47',
  phoneHref: 'tel:+380961494747',
  email: 'hello@widgetality.com',
  emailHref: 'mailto:hello@widgetality.com',
  city: 'Київ, Україна',
  hours: 'Пн–Пт · 10:00–19:00',
}

const MESSENGERS = [
  {
    id: 'telegram',
    name: 'Telegram',
    handle: '@Lazarev_iLiya',
    url: 'https://t.me/Lazarev_iLiya',
    color: '#26A5E4',
  },
  {
    id: 'viber',
    name: 'Viber',
    handle: '+380 96 149 47 47',
    url: 'viber://chat?number=%2B380961494747',
    color: '#7360F2',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    handle: '+380 96 149 47 47',
    url: 'https://wa.me/380961494747',
    color: '#25D366',
  },
]

export function ContactsPage() {
  return (
    <div className="contacts-page">
      <Helmet>
        <title>Контакти — Widgetality</title>
        <meta
          name="description"
          content="Телефон, email і месенджери Widgetality. Напишіть у Telegram, Viber або WhatsApp — відповімо протягом 15 хвилин."
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
            <a
              href={CONTACTS.phoneHref}
              className="contacts-page__card"
              aria-label="Зателефонувати"
            >
              <div className="contacts-page__card-icon">
                <Phone size={20} strokeWidth={2} />
              </div>
              <div className="contacts-page__card-body">
                <span className="contacts-page__card-label">Телефон</span>
                <strong className="contacts-page__card-value">{CONTACTS.phone}</strong>
                <span className="contacts-page__card-hint">{CONTACTS.hours}</span>
              </div>
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="contacts-page__card-arrow"
              />
            </a>

            <a
              href={CONTACTS.emailHref}
              className="contacts-page__card"
              aria-label="Написати на пошту"
            >
              <div className="contacts-page__card-icon">
                <Mail size={20} strokeWidth={2} />
              </div>
              <div className="contacts-page__card-body">
                <span className="contacts-page__card-label">Email</span>
                <strong className="contacts-page__card-value">{CONTACTS.email}</strong>
                <span className="contacts-page__card-hint">Відповідаємо у день звернення</span>
              </div>
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="contacts-page__card-arrow"
              />
            </a>

            <div className="contacts-page__card contacts-page__card--static">
              <div className="contacts-page__card-icon">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div className="contacts-page__card-body">
                <span className="contacts-page__card-label">Де ми</span>
                <strong className="contacts-page__card-value">{CONTACTS.city}</strong>
                <span className="contacts-page__card-hint">Працюємо по всій Україні</span>
              </div>
            </div>
          </div>

          {/* ── Messengers ── */}
          <div className="contacts-page__messengers">
            <h2 className="contacts-page__section-title">Месенджери</h2>
            <p className="contacts-page__section-sub">Клікни — і одразу пиши нам</p>

            <div className="contacts-page__messengers-grid">
              {MESSENGERS.map((m) => (
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
