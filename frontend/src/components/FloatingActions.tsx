import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Send } from 'lucide-react'
import './FloatingActions.css'

const TELEGRAM_URL = 'https://t.me/widgetality'
const SHOW_STICKY_AFTER_PX = 600 // показати sticky CTA після проскролу hero
const SHOW_TELEGRAM_AFTER_PX = 1400 // показати Telegram після 2 блоків

export function FloatingActions() {
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

  return (
    <>
      {/* Telegram floating button — visible after 2 blocks scroll */}
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`tg-float ${stickyVisible ? 'tg-float--raised' : ''} ${!telegramVisible || atBottom ? 'tg-float--hidden' : ''}`}
        aria-label="Написати в Telegram"
      >
        <Send size={22} strokeWidth={2.25} />
        <span className="tg-float__pulse" aria-hidden="true" />
      </a>

      {/* Sticky mobile CTA — visible after scroll past hero */}
      <div className={`sticky-cta ${stickyVisible ? 'sticky-cta--visible' : ''}`}>
        <Link to="/pricing" className="sticky-cta__btn">
          <span>Спробувати</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>
    </>
  )
}
