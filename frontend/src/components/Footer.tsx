import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../constants/brand'
import { useSettings } from '../context/SettingsContext'
import './Footer.css'

interface FooterProps {
  variant?: 'full' | 'compact'
}

export function Footer({ variant = 'full' }: FooterProps) {
  const settings = useSettings()
  const telegramUrl = settings.socials?.telegram || settings.messengers?.telegram || ''

  if (variant === 'compact') {
    return (
      <footer className="footer footer--compact">
        <div className="footer__inner">
          <div className="footer__bottom">
            <span className="footer__copy">&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
            <nav className="footer__compact-links">
              <Link to="/legal#offer" className="footer__link">Оферта</Link>
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="footer__link">{settings.email}</a>
              )}
              {telegramUrl && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="footer__link">Telegram</a>
              )}
            </nav>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-mark">W</span>
              <span className="footer__logo-text">{BRAND_NAME}</span>
            </Link>
            <p className="footer__desc">
              Готові віджети для e-commerce.
              Збільшуйте конверсію без розробників.
            </p>
          </div>

          <nav className="footer__columns">
            <div className="footer__col">
              <h3 className="footer__col-title">Навігація</h3>
              <Link to="/widgets" className="footer__link">Віджети</Link>
              <Link to="/cases" className="footer__link">Кейси</Link>
              <Link to="/contacts" className="footer__link">Контакти</Link>
            </div>

            <div className="footer__col">
              <h3 className="footer__col-title">Документи</h3>
              <Link to="/legal#offer" className="footer__link">Публічна оферта</Link>
              <Link to="/legal#refund" className="footer__link">Повернення коштів</Link>
              <Link to="/legal#security" className="footer__link">Безпека даних</Link>
              <Link to="/license" className="footer__link">Ліцензія</Link>
            </div>

            <div className="footer__col">
              <h3 className="footer__col-title">Зв'язок</h3>
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="footer__link">
                  {settings.email}
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  Telegram
                </a>
              )}
            </div>
          </nav>
        </div>

        <div className="footer__bottom">
          <span className="footer__copy">&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
        </div>
      </div>
    </footer>
  )
}
