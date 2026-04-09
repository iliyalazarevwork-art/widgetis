import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { post } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import type { User } from '../../types'
import './auth.css'

const OTP_LENGTH = 6

export default function LoginOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const email = (location.state as { email?: string })?.email
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Auto-submit when all digits filled
  const verify = useCallback(async (code: string) => {
    if (!email) return
    setLoading(true)
    try {
      const res = await post<{ token: string; user: User }>('/auth/otp/verify', { email, code })
      login(res.token, res.user)

      navigate(res.user.role === 'admin' ? '/admin' : '/cabinet', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Невірний код')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [email, login, navigate])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    // Auto-submit
    if (next.every((d) => d !== '')) {
      void verify(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = [...digits]
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]!
    }
    setDigits(next)
    if (next.every((d) => d !== '')) {
      void verify(next.join(''))
    } else {
      inputsRef.current[pasted.length]?.focus()
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return
    try {
      await post('/auth/otp/resend', { email })
      setResendTimer(30)
      toast.success('Код надіслано повторно')
    } catch {
      toast.error('Не вдалося надіслати код')
    }
  }

  if (!email) return null
  const isCodeComplete = digits.every((d) => d !== '')

  return (
    <div className="auth-page">
      <div className="auth-page__body">
        <button className="auth-page__back-inline" onClick={() => navigate('/login')}>
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="auth-page__hero">
          <h1 className="auth-page__title">Введіть код</h1>
          <p className="auth-page__subtitle">
            Ми надіслали 6-значний код на <strong>{email}</strong>
          </p>
        </div>

        <form
          className="auth-page__form auth-page__otp-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!isCodeComplete || loading) return
            void verify(digits.join(''))
          }}
        >
          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${d ? 'otp-input--filled' : ''}`}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {loading && <p className="auth-page__status">Перевіряємо код…</p>}

          <button
            type="submit"
            className="auth-btn auth-btn--primary auth-page__otp-submit"
            disabled={!isCodeComplete || loading}
          >
            Відправити
          </button>
        </form>

        <button
          className="auth-page__resend"
          onClick={handleResend}
          disabled={resendTimer > 0}
        >
          {resendTimer > 0
            ? `Надіслати повторно через ${resendTimer}с`
            : 'Надіслати код повторно'}
        </button>
      </div>
    </div>
  )
}
