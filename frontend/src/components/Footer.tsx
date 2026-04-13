import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../constants/brand'
import { useSettings } from '../context/SettingsContext'
import liqpayLogo from '../assets/logo-liqpay-dark.svg'
import plataLogo from '../assets/logo-plata-dark.svg'
import visaLogo from '../assets/logo-visa-dark.svg'
import mastercardLogo from '../assets/logo-mastercard-dark.svg'
import applePayLogo from '../assets/logo-apple-pay-dark.svg'
import googlePayLogo from '../assets/logo-google-pay-dark.svg'
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
              <Link to="/offer" className="footer__link">Оферта</Link>
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
              <Link to="/offer" className="footer__link">Публічна оферта</Link>
              <Link to="/refund" className="footer__link">Повернення коштів</Link>
              <Link to="/security" className="footer__link">Безпека даних</Link>
              <Link to="/license" className="footer__link">Ліцензія</Link>
            </div>

            <div className="footer__col">
              <h3 className="footer__col-title">Зв'язок</h3>
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="footer__link">
                  {settings.phone}
                </a>
              )}
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
              <span className="footer__col-address">
                вул. Сарми-Соколовського, 58,<br />
                Дніпро, 49000
              </span>
            </div>
          </nav>
        </div>

        <div className="footer__bottom">
          <div className="footer__legal">
            <span className="footer__copy">&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
            <span className="footer__address">
              ФОП Лазарєв Ілля Ігорович · ІПН 3660907893 · вул. Сарми-Соколовського, 58, Дніпро, 49000
            </span>
          </div>
          <div className="footer__payments">
            <div className="footer__pay-group" aria-label="Еквайринг">
              <img
                src={plataLogo}
                alt="plata by mono"
                className="footer__pay-logo footer__pay-logo--wordmark"
              />
              <img
                src={liqpayLogo}
                alt="LiqPay"
                className="footer__pay-logo footer__pay-logo--wordmark"
              />
            </div>
            <span className="footer__pay-sep" aria-hidden="true" />
            <div className="footer__pay-group" aria-label="Способи оплати">
              <img src={visaLogo} alt="Visa" className="footer__pay-logo" />
              <img src={mastercardLogo} alt="Mastercard" className="footer__pay-logo" />
              <img src={applePayLogo} alt="Apple Pay" className="footer__pay-logo" />
              <img src={googlePayLogo} alt="Google Pay" className="footer__pay-logo" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
