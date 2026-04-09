import { Link } from 'react-router-dom'
import { BRAND_EMAIL, BRAND_NAME, BRAND_TELEGRAM_URL } from '../constants/brand'
import './Footer.css'

export function Footer() {
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
              <h4 className="footer__col-title">Навігація</h4>
              <Link to="/widgets" className="footer__link">Віджети</Link>
              <Link to="/cases" className="footer__link">Кейси</Link>
              <Link to="/contacts" className="footer__link">Контакти</Link>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">Документи</h4>
              <Link to="/legal#offer" className="footer__link">Публічна оферта</Link>
              <Link to="/legal#refund" className="footer__link">Повернення коштів</Link>
              <Link to="/legal#security" className="footer__link">Безпека даних</Link>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">Зв'язок</h4>
              <a href={`mailto:${BRAND_EMAIL}`} className="footer__link">
                {BRAND_EMAIL}
              </a>
              <a
                href={BRAND_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                Telegram
              </a>
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
