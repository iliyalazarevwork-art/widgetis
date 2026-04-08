import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Send, Lock } from 'lucide-react'
import { post } from '../../api/client'
import { toast } from 'sonner'
import './login-mobile.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return

    setLoading(true)
    try {
      await post('/auth/otp', { email })
      navigate('/login/otp', { state: { email } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка відправки OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginm">
      <header className="loginm__header">
        <span className="loginm__brand">Widgetis</span>
      </header>

      <div className="loginm__body">
        <div className="loginm__hero">
          <Lock size={40} strokeWidth={1.75} className="loginm__lock" />
          <h1 className="loginm__title">Увійти до кабінету</h1>
          <p className="loginm__subtitle">
            Введіть email — ми надішлемо код підтвердження
          </p>
          <p className="loginm__label">ВХІД</p>
        </div>

        <form className="loginm__card" onSubmit={handleSubmit}>
          <label className="loginm__field">
            <span className="loginm__field-label">Email</span>
            <div className="loginm__input-wrap">
              <Mail size={16} strokeWidth={1.85} className="loginm__field-icon" />
              <input
                type="email"
                className="loginm__input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
          </label>

          <button
            type="submit"
            className="loginm__otp-btn"
            disabled={!isValid || loading}
          >
            {loading ? (
              <span>Надсилаємо…</span>
            ) : (
              <>
                <Send size={15} strokeWidth={2.2} />
                <span>Отримати код</span>
              </>
            )}
          </button>

          <div className="loginm__divider">
            <span>або</span>
          </div>

          <button type="button" className="loginm__google-btn" disabled>
            <span className="loginm__google-g">G</span>
            <span>Увійти через Google</span>
          </button>
        </form>

        <div className="loginm__split" />

        <p className="loginm__label">СТВОРЕННЯ АКАУНТА</p>
        <div className="loginm__signup-card">
          <p className="loginm__signup-title">Новий користувач?</p>
          <p className="loginm__signup-subtitle">Створіть акаунт через вибір плану та почніть trial.</p>
          <a href="/signup" className="loginm__signup-link">
            <span>Створити акаунт</span>
            <span className="loginm__signup-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
