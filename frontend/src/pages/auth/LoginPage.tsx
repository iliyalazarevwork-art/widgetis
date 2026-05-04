import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Send, Lock } from 'lucide-react'
import { SeoHead } from '../../components/SeoHead'
import { post } from '../../api/client'
import { toast } from 'sonner'
import './login-mobile.css'

export default function LoginPage() {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('wty_login_email') || '' } catch { return '' }
  })
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
      <SeoHead title="Вхід — Widgetis" description="Вхід у кабінет Widgetis." path="/login" noindex />
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
                onChange={(e) => {
                  setEmail(e.target.value)
                  try { localStorage.setItem('wty_login_email', e.target.value) } catch { /* quota */ }
                }}
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

          <button
            type="button"
            className="loginm__google-btn"
            onClick={() => {
              const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
              const backendUrl = apiBase ? apiBase.replace(/\/api\/v1\/?$/, '') : ''
              window.location.href = backendUrl + '/auth/google'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Увійти через Google</span>
          </button>
        </form>

        <div className="loginm__split" />

        <p className="loginm__label">СТВОРЕННЯ АКАУНТА</p>
        <div className="loginm__signup-card">
          <p className="loginm__signup-title">Новий користувач?</p>
          <p className="loginm__signup-subtitle">Створіть акаунт через вибір плану та почніть trial.</p>
          <a href="/pricing" className="loginm__signup-link">
            <span>Створити акаунт</span>
            <span className="loginm__signup-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
