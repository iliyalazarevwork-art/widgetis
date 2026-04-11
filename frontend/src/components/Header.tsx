import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X, UserRound, ArrowRight, Puzzle, CreditCard, Briefcase, Mail } from 'lucide-react'
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'
import { SocialIcon } from './SocialIcon'
import { HamburgerIcon } from './HamburgerIcon'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { BRAND_NAME } from '../constants/brand'
import './Header.css'

const NAV_LINKS = [
  { to: '/widgets', label: 'Віджети', icon: Puzzle },
  { to: '/pricing', label: 'Тарифи', icon: CreditCard },
  { to: '/cases', label: 'Кейси', icon: Briefcase },
  { to: '/contacts', label: 'Контакти', icon: Mail },
]

const MESSENGER_META: Record<string, { label: string; color: string }> = {
  telegram:  { label: 'Telegram',  color: '#26A5E4' },
  viber:     { label: 'Viber',     color: '#7360F2' },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366' },
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'
  const { isAuthenticated } = useAuth()
  const settings = useSettings()

  // Build contacts from backend settings
  const messengerContacts = Object.entries(settings.messengers ?? {})
    .filter(([, href]) => href)
    .map(([id, href]) => ({
      id,
      label: MESSENGER_META[id]?.label ?? id,
      href,
      color: MESSENGER_META[id]?.color ?? 'var(--accent)',
    }))
  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, '')}` : ''

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHome) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const navigate = useNavigate()
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const scrollToDemo = useCallback(() => {
    closeMenu()
    if (onHome) {
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/#demo')
    }
  }, [onHome, navigate, closeMenu])

  const drawerRef = useSwipeDismiss<HTMLElement>({
    direction: 'right',
    onDismiss: closeMenu,
    enabled: menuOpen,
    threshold: 70,
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header__inner">
          <Link
            to="/"
            onClick={handleLogoClick}
            className="header__logo"
            aria-label={onHome ? 'Нагору' : `${BRAND_NAME} — на головну`}
          >
            <img src="/logo.svg" className="header__logo-mark" aria-hidden="true" />
            <span className="header__logo-text">{BRAND_NAME}</span>
          </Link>

          <nav className="header__nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="header__nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            <button className="header__cta">Спробувати</button>
            <button
              className="header__burger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Меню"
            >
              {menuOpen ? <X size={22} /> : <HamburgerIcon size={22} />}
            </button>
          </div>
        </div>
      </header>

      {createPortal(
        <>
          <div
            className={`header__overlay ${menuOpen ? 'header__overlay--open' : ''}`}
            onClick={closeMenu}
            aria-hidden={!menuOpen}
          />
          <nav
            ref={drawerRef as React.RefObject<HTMLElement>}
            className={`header__drawer ${menuOpen ? 'header__drawer--open' : ''}`}
            aria-hidden={!menuOpen}
          >
            <div className="header__drawer-top">
              <Link to="/" className="header__drawer-logo" onClick={closeMenu} aria-label={BRAND_NAME}>
                <img src="/logo.svg" className="header__drawer-logo-mark" aria-hidden="true" />
                <span className="header__drawer-logo-text">{BRAND_NAME}</span>
              </Link>
              <button
                className="header__drawer-close"
                onClick={closeMenu}
                aria-label="Закрити меню"
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            <div className="header__drawer-nav">
              {[
                ...NAV_LINKS,
                ...(isAuthenticated
                  ? [{ to: '/cabinet', label: 'Кабінет', icon: UserRound }]
                  : [{ to: '/cabinet', label: 'Вхід', icon: UserRound }]),
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="header__drawer-link"
                  onClick={closeMenu}
                >
                  <link.icon size={18} className="header__drawer-link-icon" />
                  {link.label}
                  <ArrowRight size={18} strokeWidth={2.5} className="header__drawer-link-arrow" />
                </Link>
              ))}
            </div>

            <div className="header__drawer-divider" />

            <button
              className="header__drawer-cta"
              onClick={scrollToDemo}
              type="button"
            >
              Безкоштовне демо
            </button>

            <div className="header__drawer-contacts">
              <p className="header__drawer-contacts-label">Напишіть нам</p>
              <div className="header__drawer-contacts-grid">
                {messengerContacts.map((c) => (
                  <a
                    key={c.id}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="header__drawer-social"
                    style={{ '--social-color': c.color } as React.CSSProperties}
                    onClick={closeMenu}
                  >
                    <SocialIcon id={c.id} size={18} />
                    <span>{c.label}</span>
                  </a>
                ))}
              </div>
              {settings.phone && (
                <a href={phoneHref} className="header__drawer-phone" onClick={closeMenu}>
                  <SocialIcon id="phone" size={16} />
                  <span>{settings.phone}</span>
                </a>
              )}
            </div>
          </nav>
        </>,
        document.body,
      )}
    </>
  )
}
