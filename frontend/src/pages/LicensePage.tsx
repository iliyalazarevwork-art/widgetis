import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldOff, CheckCircle, AlertTriangle, Scale, BookOpen } from 'lucide-react'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './LicensePage.css'

const SECTIONS = [
  {
    icon: Scale,
    title: '1. Загальні положення',
    body: 'Платформа Widgetis та всі її віджети є виключною інтелектуальною власністю Widgetis. Весь вихідний код, алгоритми, дизайн та компоненти захищені законом України про авторське право. Усі права захищені.',
  },
  {
    icon: ShieldOff,
    title: '2. Заборонені дії',
    body: 'Суворо заборонено без письмового дозволу Widgetis: копіювати або відтворювати код віджетів; декомпілювати, дизасемблювати або розшифровувати код; модифікувати, адаптувати або створювати похідні твори; продавати, передавати або ліцензувати код третім особам; використовувати код поза платформою Widgetis.',
  },
  {
    icon: CheckCircle,
    title: '3. Дозволене використання',
    body: 'Доступ до віджетів надається виключно в рамках активної підписки на платформі Widgetis. Ліцензія є персональною, невиключною та непередаваною. Ви отримуєте право використовувати встановлені віджети на вашому сайті — але не право на сам код.',
  },
  {
    icon: AlertTriangle,
    title: '4. Відповідальність за порушення',
    body: 'Порушення умов ліцензії тягне за собою негайне анулювання підписки без повернення коштів та може стати підставою для цивільного або кримінального провадження відповідно до законодавства України.',
  },
]

export function LicensePage() {
  return (
    <div className="license-page">
      <SeoHead
        title={`Ліцензійна угода — ${BRAND_NAME_UPPER}`}
        description="Ліцензійна угода widgetis: умови використання віджетів, права інтелектуальної власності, обмеження на копіювання та модифікацію коду."
        path="/license"
      />

      <section className="license-page__hero">
        <div className="license-page__hero-bg" aria-hidden="true">
          <div className="license-page__hero-glow license-page__hero-glow--1" />
          <div className="license-page__hero-glow license-page__hero-glow--2" />
        </div>
        <div className="license-page__hero-content page-hero-stack">
          <Link to="/" className="license-page__back page-back-link">
            <ArrowLeft size={16} strokeWidth={2.25} />
            На головну
          </Link>
          <p className="license-page__eyebrow page-eyebrow">Ліцензія</p>
          <h1 className="license-page__title">
            Умови використання <span className="license-page__title-accent">коду віджетів</span>
          </h1>
          <p className="license-page__subtitle">
            Всі права на код захищені. Нижче — що дозволено і що заборонено.
          </p>
        </div>
      </section>

      <section className="license-page__content">
        <div className="license-page__container">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="license-page__card">
              <div className="license-page__card-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="license-page__card-body">
                <h2 className="license-page__card-title">{title}</h2>
                <p className="license-page__card-text">{body}</p>
              </div>
            </div>
          ))}

          <div className="license-page__legal">
            <div className="license-page__legal-header">
              <BookOpen size={16} strokeWidth={2} />
              <span>Правова основа</span>
            </div>
            <ul className="license-page__legal-list">
              <li>
                <strong>Закон України №2811-IX «Про авторське право і суміжні права»</strong>
                {' '}— захист комп'ютерних програм як об'єктів авторського права.{' '}
                <a
                  href="https://zakon.rada.gov.ua/laws/show/2811-20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="license-page__legal-link"
                >
                  zakon.rada.gov.ua
                </a>
              </li>
              <li>
                <strong>Ст. 176 Кримінального кодексу України</strong>
                {' '}— кримінальна відповідальність за порушення авторського права на програмний код (штраф, виправні роботи або позбавлення волі до 2 років).{' '}
                <a
                  href="https://protocol.ua/ua/kriminalniy_kodeks_ukraini_stattya_176/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="license-page__legal-link"
                >
                  protocol.ua
                </a>
              </li>
              <li>
                <strong>Ст. 432 Цивільного кодексу України</strong>
                {' '}— захист права інтелектуальної власності в судовому порядку, відшкодування збитків та вилучення контрафактних товарів.{' '}
                <a
                  href="https://protocol.ua/ua/tsivilniy_kodeks_ukraini_stattya_432/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="license-page__legal-link"
                >
                  protocol.ua
                </a>
              </li>
            </ul>
          </div>

          <p className="license-page__updated">
            Редакція від 1 квітня 2026 р. &mdash; © {new Date().getFullYear()} {BRAND_NAME_UPPER}. Всі права захищені.
          </p>
        </div>
      </section>
    </div>
  )
}
