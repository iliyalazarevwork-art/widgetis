import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import './FloatingActions.css'
const SHOW_STICKY_AFTER_PX = 600
const SHOW_TELEGRAM_AFTER_PX = 1400

export function FloatingActions() {
  const { user, isLoading: authLoading } = useAuth()
  const settings = useSettings()
  const telegramUrl = settings.socials?.telegram || settings.messengers?.telegram || ''
  const [stickyVisible, setStickyVisible] = useState(false)
  const [telegramVisible, setTelegramVisible] = useState(false)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const distanceFromBottom = docHeight - (scrollY + viewportHeight)
      const nearBottom = distanceFromBottom < 200

      setStickyVisible(scrollY > SHOW_STICKY_AFTER_PX && !nearBottom)
      setTelegramVisible(scrollY > SHOW_TELEGRAM_AFTER_PX && !nearBottom)
      setAtBottom(nearBottom)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hide sticky CTA for users with an active subscription — it has no meaning for them
  const hasActiveSubscription = !authLoading &&
    user?.subscription_status != null &&
    ['active', 'trial'].includes(user.subscription_status)

  return (
    <>
      {/* Telegram floating button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`tg-float ${stickyVisible ? 'tg-float--raised' : ''} ${!telegramVisible || atBottom ? 'tg-float--hidden' : ''}`}
        aria-label="Написати в Telegram"
      >
        <Send size={22} strokeWidth={2.25} />
        <span className="tg-float__pulse" aria-hidden="true" />
      </a>

      {/* Sticky mobile CTA — hidden for active subscribers */}
      {!hasActiveSubscription && (
        <div className={`sticky-cta ${stickyVisible ? 'sticky-cta--visible' : ''}`}>
          <Link to="/pricing" className="sticky-cta__btn">
            <span>Спробувати</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </>
  )
}
