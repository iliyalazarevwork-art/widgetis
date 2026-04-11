import { useState, useEffect, useCallback } from 'react'
import { X, Lock, ArrowRight } from 'lucide-react'
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import { post } from '../api/client'
import './ConsultationModal.css'
import './InterestModal.css'

export type InterestTarget = 'plan' | 'widget'

function ensureStylesheet(href: string) {
  if (typeof document === 'undefined') return
  if (document.querySelector(`link[data-vendor-css="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-vendor-css', href)
  document.head.appendChild(link)
}

const uaOnly = defaultCountries.filter((country) => parseCountry(country).iso2 === 'ua')

interface InterestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: InterestTarget
  targetId: string | number
  title?: string
  subtitle?: string
}

export function InterestModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  targetId,
  title = 'Залишити заявку',
  subtitle = "Менеджер зв'яжеться з Вами протягом дня",
}: InterestModalProps) {
  useEffect(() => {
    ensureStylesheet('/vendor-css/react-international-phone.css')
  }, [])

  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem('wty_phone') || '' } catch { return '' }
  })
  const [step, setStep] = useState<'form' | 'sending' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    try { localStorage.setItem('wty_phone', value) } catch { /* quota */ }
  }

  const handleClose = useCallback(() => {
    setStep('form')
    setErrorMsg('')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  const phoneDigits = phone.replace(/\D/g, '')
  const isPhoneValid = phoneDigits.length === 12
  const canSubmit = isPhoneValid && step === 'form'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setStep('sending')
    try {
      await post('/lead-requests', {
        type,
        target_id: String(targetId),
        phone,
      })
      onSuccess()
      handleClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Не вдалося відправити. Спробуйте ще раз.')
      setStep('error')
    }
  }

  return (
    <div className="consult-modal__overlay" onClick={handleClose}>
      <div className="consult-modal interest-modal" onClick={(e) => e.stopPropagation()}>
        <button className="consult-modal__close" onClick={handleClose} aria-label="Закрити">
          <X size={20} strokeWidth={2} />
        </button>

        <div className="consult-modal__header">
          <div className="interest-modal__icon">
            <Lock size={24} strokeWidth={2.25} />
          </div>
          <h3 className="consult-modal__title">{title}</h3>
          <p className="consult-modal__subtitle">{subtitle}</p>
        </div>

        <form className="consult-modal__form" onSubmit={handleSubmit}>
          <div className="consult-modal__field">
            <label className="consult-modal__label">
              Номер телефону<span className="req">*</span>
            </label>
            <PhoneInput
              defaultCountry="ua"
              countries={uaOnly}
              hideDropdown
              forceDialCode
              value={phone}
              onChange={handlePhoneChange}
              inputClassName="consult-modal__input"
              className="consult-modal__phone"
            />
          </div>

          {step === 'error' && <div className="consult-modal__error">{errorMsg}</div>}

          <button
            type="submit"
            className="consult-modal__submit interest-modal__submit"
            disabled={!canSubmit}
          >
            {step === 'sending' ? (
              <span className="consult-modal__spinner" />
            ) : (
              <>
                Відправити заявку
                <ArrowRight size={18} strokeWidth={2} />
              </>
            )}
          </button>

          <p className="consult-modal__disclaimer">
            Без спаму. Тільки для зворотного зв'язку.
          </p>
        </form>
      </div>
    </div>
  )
}
