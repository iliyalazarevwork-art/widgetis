import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'
import { SocialIcon } from './SocialIcon'
import './Header.css'

const NAV_LINKS = [
  { to: '/widgets', label: 'Віджети' },
  { to: '/pricing', label: 'Тарифи' },
  { to: '/cases', label: 'Кейси' },
  { to: '/contacts', label: 'Контакти' },
]

const QUICK_CONTACTS = [
  { id: 'telegram', label: 'Telegram', href: 'https://t.me/Lazarev_iLiya',            color: '#26A5E4' },
  { id: 'viber',    label: 'Viber',    href: 'viber://chat?number=%2B380961494747',   color: '#7360F2' },
  { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/380961494747',            color: '#25D366' },
  { id: 'phone',    label: '+380 96 149 47 47', href: 'tel:+380961494747',            color: 'var(--accent)' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHome) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const closeMenu = useCallback(() => setMenuOpen(false), [])

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
            aria-label={onHome ? 'Нагору' : 'Widgetality — на головну'}
          >
            <svg
              className="header__logo-mark"
              viewBox="0 0 120 100"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="22"
                strokeLinejoin="miter"
                strokeLinecap="round"
              />
            </svg>
            <span className="header__logo-text">WIDGETALITY</span>
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
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                className="header__overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                onClick={closeMenu}
              />
              <motion.nav
                ref={drawerRef as React.RefObject<HTMLElement>}
                className="header__drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
              >
                <motion.div
                  className="header__drawer-top"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.3, ease: 'easeOut' }}
                >
                  <Link to="/" className="header__drawer-logo" onClick={closeMenu} aria-label="Widgetality">
                    <svg
                      className="header__drawer-logo-mark"
                      viewBox="0 0 120 100"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="22"
                        strokeLinejoin="miter"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="header__drawer-logo-text">WIDGETALITY</span>
                  </Link>
                  <button
                    className="header__drawer-close"
                    onClick={closeMenu}
                    aria-label="Закрити меню"
                    type="button"
                  >
                    <X size={22} />
                  </button>
                </motion.div>

                <div className="header__drawer-nav">
                  {NAV_LINKS.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <Link to={link.to} className="header__drawer-link" onClick={closeMenu}>
                        {link.label}
                        <span className="header__drawer-link-arrow">→</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="header__drawer-divider" />

                <motion.button
                  className="header__drawer-cta"
                  onClick={closeMenu}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.3, ease: 'easeOut' }}
                >
                  Безкоштовне демо
                </motion.button>

                <motion.div
                  className="header__drawer-contacts"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.3, ease: 'easeOut' }}
                >
                  <p className="header__drawer-contacts-label">Напишіть нам</p>
                  <div className="header__drawer-contacts-grid">
                    {QUICK_CONTACTS.slice(0, 3).map((c) => (
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
                  <a href={QUICK_CONTACTS[3].href} className="header__drawer-phone" onClick={closeMenu}>
                    <SocialIcon id="phone" size={16} />
                    <span>{QUICK_CONTACTS[3].label}</span>
                  </a>
                </motion.div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
