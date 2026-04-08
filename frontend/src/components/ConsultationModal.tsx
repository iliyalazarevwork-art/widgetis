import { useState, useCallback } from 'react'
import { ArrowRight, CircleCheckBig, X } from 'lucide-react'
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'
import DatePicker, { registerLocale } from 'react-datepicker'
import { uk } from 'date-fns/locale/uk'
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-international-phone/style.css'
import './ConsultationModal.css'

registerLocale('uk', uk)

const uaOnly = defaultCountries.filter((country) => parseCountry(country).iso2 === 'ua')

interface ConsultationModalProps {
  isOpen: boolean
  onClose: () => void
}

const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

export function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  const stableOnClose = useCallback(() => onClose(), [onClose])
  const swipeRef = useSwipeDismiss<HTMLDivElement>({
    direction: 'down',
    onDismiss: stableOnClose,
    enabled: isOpen,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState('')
  const [step, setStep] = useState<'form' | 'sending' | 'success' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const phoneDigits = phone.replace(/\D/g, '')
  const isPhoneValid = phoneDigits.length === 12
  const canSubmit = name.trim().length >= 2 && isPhoneValid && date && time

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setStep('sending')
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          date: date.toISOString().split('T')[0],
          time,
        }),
      })

      if (!res.ok) throw new Error('Помилка сервера')
      setStep('success')
    } catch {
      setErrorMsg('Не вдалося відправити. Спробуйте ще раз або напишіть нам у Telegram.')
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('form')
    setName('')
    setPhone('')
    setDate(null)
    setTime('')
    setErrorMsg('')
    onClose()
  }

  // Filter: only future dates, exclude weekends
  const isWeekday = (d: Date) => {
    const day = d.getDay()
    return day !== 0 && day !== 6
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)

  return (
    <div className="consult-modal__overlay" onClick={handleClose}>
      <div ref={swipeRef} className="consult-modal" onClick={(e) => e.stopPropagation()}>
        <button className="consult-modal__close" onClick={handleClose} aria-label="Закрити">
          <X size={20} strokeWidth={2} />
        </button>

        {step === 'success' ? (
          <div className="consult-modal__success">
            <div className="consult-modal__success-icon">
              <CircleCheckBig size={48} strokeWidth={2.25} />
            </div>
            <h3 className="consult-modal__success-title">Записано!</h3>
            <p className="consult-modal__success-text">
              Ми зв'яжемося з вами{' '}
              <strong>
                {date?.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
              </strong>{' '}
              о <strong>{time}</strong> для безкоштовної консультації.
            </p>
            <button className="consult-modal__success-btn" onClick={handleClose}>
              Чудово
            </button>
          </div>
        ) : (
          <>
            <div className="consult-modal__header">
              <div className="consult-modal__badge">Безкоштовно</div>
              <h3 className="consult-modal__title">Записатися на консультацію</h3>
              <p className="consult-modal__subtitle">
                Допоможемо обрати віджети під ваш магазин — 15 хвилин, без зобов'язань
              </p>
            </div>

            <form className="consult-modal__form" onSubmit={handleSubmit}>
              <div className="consult-modal__field">
                <label className="consult-modal__label">
                  Ваше ім'я<span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="consult-modal__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Іван"
                  required
                />
              </div>

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
                  onChange={setPhone}
                  inputClassName="consult-modal__input"
                  className="consult-modal__phone"
                />
              </div>

              <div className="consult-modal__field">
                <label className="consult-modal__label">
                  Оберіть дату<span className="req">*</span>
                </label>
                <DatePicker
                  selected={date}
                  onChange={(d: Date | null) => setDate(d)}
                  locale="uk"
                  minDate={minDate}
                  filterDate={isWeekday}
                  placeholderText="Натисніть для вибору"
                  className="consult-modal__input"
                  dateFormat="dd MMMM yyyy"
                  calendarClassName="consult-modal__calendar"
                />
              </div>

              {date && (
                <div className="consult-modal__field consult-modal__field--time">
                  <label className="consult-modal__label">
                    Оберіть час<span className="req">*</span>
                  </label>
                  <div className="consult-modal__time-grid">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`consult-modal__time-slot ${time === slot ? 'consult-modal__time-slot--active' : ''}`}
                        onClick={() => setTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'error' && <div className="consult-modal__error">{errorMsg}</div>}

              <button
                type="submit"
                className="consult-modal__submit"
                disabled={!canSubmit || step === 'sending'}
              >
                {step === 'sending' ? (
                  <span className="consult-modal__spinner" />
                ) : (
                  <>
                    Записатися
                    <ArrowRight size={18} strokeWidth={2} />
                  </>
                )}
              </button>

              <p className="consult-modal__disclaimer">
                Безкоштовна 15-хвилинна консультація. Без спаму.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
