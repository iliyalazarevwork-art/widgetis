import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Code2,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Mail,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import './TrialSuccessPage.css'

interface SignupData {
  email: string
  site: string
  platform: string
  plan: 'basic' | 'pro' | 'max'
  billing: string
  phone?: string
}

const PLAN_NAMES = { basic: 'Basic', pro: 'Pro', max: 'Max' }

type NextChoice = 'self' | 'concierge' | null

export function TrialSuccessPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<SignupData | null>(null)
  const [choice, setChoice] = useState<NextChoice>(null)
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('wty_trial_signup')
    if (!raw) { navigate('/pricing', { replace: true }); return }
    try {
      const parsed = JSON.parse(raw) as SignupData
      setData(parsed)
      setPhone(parsed.phone ?? '')
      setPhoneSaved(Boolean(parsed.phone))
    }
    catch { navigate('/pricing', { replace: true }) }
  }, [navigate])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [choice])

  useEffect(() => {
    if (choice !== 'concierge') {
      setPhoneError('')
      setPhoneSaved(Boolean(data?.phone))
    }
  }, [choice, data?.phone])

  if (!data) return null

  const scriptTag = '<script src="https://widgetis.com/w/loading.js"></script>'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(scriptTag)
      setCopied(true)
      toast.success('Скрипт скопійовано')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  function handleSavePhone() {
    const normalizedPhone = phone.trim()
    if (!/^[+\d\s\-()]{7,20}$/.test(normalizedPhone)) {
      setPhoneError('Вкажіть коректний номер телефону')
      return
    }

    if (!data) return

    const nextData: SignupData = { ...data, phone: normalizedPhone }
    setData(nextData)
    setPhone(normalizedPhone)
    setPhoneError('')
    setPhoneSaved(true)
    sessionStorage.setItem('wty_trial_signup', JSON.stringify(nextData))
  }

  return (
    <div className="tsuccess">
      <Helmet>
        <title>Тріал активовано — Widgetis</title>
      </Helmet>

      <div className="tsuccess__container">

        {!choice && (
          <div className="tsuccess__hero">
            <div className="tsuccess__icon">
              <CheckCircle2 size={44} strokeWidth={1.75} />
            </div>
            <h1 className="tsuccess__title">
              Тріал <span className="tsuccess__accent">активовано</span>
            </h1>
            <p className="tsuccess__plan">
              План <strong>{PLAN_NAMES[data.plan]}</strong> · 7 днів безкоштовно
            </p>
            <p className="tsuccess__email-note">
              Деталі надіслали на <strong>{data.email}</strong>
            </p>
          </div>
        )}

        {!choice ? (
          <>
            <h2 className="tsuccess__choice-title">Як підключимо магазин?</h2>
            <p className="tsuccess__choice-sub">
              Оберіть варіант — налаштуємо під Вас
            </p>

            <div className="tsuccess__options">

              <button className="tsuccess__option" onClick={() => setChoice('self')} type="button">
                <div className="tsuccess__option-icon">
                  <Code2 size={24} strokeWidth={2} />
                </div>
                <h3 className="tsuccess__option-title">Встановлю сам</h3>
                <p className="tsuccess__option-desc">
                  Отримаєте на пошту JS-скрипт і покрокову інструкцію під {data.platform}. 3 хвилини — і готово.
                </p>
                <ul className="tsuccess__option-list">
                  <li><Mail size={12} strokeWidth={2.25} /><span>Скрипт прийде на пошту за 5 хвилин</span></li>
                  <li><Code2 size={12} strokeWidth={2.25} /><span>Інструкція зі скріншотами</span></li>
                </ul>
                <span className="tsuccess__option-cta">
                  Обрати
                  <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              </button>

              <button
                className="tsuccess__option tsuccess__option--featured"
                onClick={() => setChoice('concierge')}
                type="button"
              >
                <div className="tsuccess__option-badge">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Рекомендовано
                </div>
                <div className="tsuccess__option-icon tsuccess__option-icon--accent">
                  <MessageCircle size={24} strokeWidth={2} />
                </div>
                <h3 className="tsuccess__option-title">Хочу допомогу</h3>
                <p className="tsuccess__option-desc">
                  Наш менеджер напише у Telegram або Viber і разом налаштуємо за 15 хвилин.
                </p>
                <ul className="tsuccess__option-list">
                  <li><MessageCircle size={12} strokeWidth={2.25} /><span>Telegram або Viber — як зручно</span></li>
                  <li><CheckCircle2 size={12} strokeWidth={2.25} /><span>Перевіримо, що все працює</span></li>
                </ul>
                <span className="tsuccess__option-cta">
                  Обрати
                  <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              </button>

            </div>
          </>
        ) : (
          <div className="tsuccess__confirm">
            <div className="tsuccess__confirm-icon">
              {choice === 'self'
                ? <Mail size={30} strokeWidth={1.75} />
                : <MessageCircle size={30} strokeWidth={1.75} />
              }
            </div>

            <h2 className="tsuccess__confirm-title">
              {choice === 'self'
                ? 'Скрипт уже на пошті і тут для копіювання'
                : phoneSaved
                  ? 'Менеджер напише протягом 15 хвилин'
                  : 'Залиште номер телефону для звʼязку'
              }
            </h2>

            <p className="tsuccess__confirm-text">
              {choice === 'self' ? (
                <>
                  Ми вже надіслали лист на <strong>{data.email}</strong>. Перевірте пошту і папку «Спам».
                </>
              ) : (
                phoneSaved ? (
                  <>
                    Менеджер напише у Telegram або Viber або зателефонує на{' '}
                    <strong>{data.phone}</strong> і допоможе встановити на{' '}
                    <strong>{data.site}</strong>. Також підтвердження прийде на{' '}
                    <strong>{data.email}</strong>.
                  </>
                ) : (
                  <>
                    Щоб менеджер звʼязався протягом 15 хвилин, вкажіть ваш номер телефону.
                    Ми оновимо дані акаунта і використаємо його для звʼязку по{' '}
                    <strong>{data.site}</strong>.
                  </>
                )
              )}
            </p>

            {choice === 'concierge' && !phoneSaved && (
              <div className="tsuccess__phone-block">
                <label className="tsuccess__phone-label" htmlFor="trial-success-phone">
                  Номер телефону
                </label>
                <input
                  id="trial-success-phone"
                  className={`tsuccess__phone-input ${phoneError ? 'tsuccess__phone-input--error' : ''}`}
                  type="tel"
                  placeholder="+380 96 123 45 67"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (phoneError) setPhoneError('')
                  }}
                  autoComplete="tel"
                />
                {phoneError && <p className="tsuccess__phone-error">{phoneError}</p>}
                <button className="tsuccess__phone-save" onClick={handleSavePhone} type="button">
                  Підтвердити номер
                </button>
              </div>
            )}

            {choice === 'self' && (
              <>
                <div className="tsuccess__script-block">
                  <label className="tsuccess__script-label">Ваш код для встановлення:</label>
                  <code className="tsuccess__script-code">{scriptTag}</code>
                  <button className="tsuccess__copy-btn" onClick={handleCopy} type="button">
                    {copied ? (
                      <>
                        <Check size={16} strokeWidth={2} />
                        Скопійовано
                      </>
                    ) : (
                      <>
                        <Copy size={16} strokeWidth={1.75} />
                        Скопіювати
                      </>
                    )}
                  </button>
                </div>

                <div className="tsuccess__instruction">
                  <h3 className="tsuccess__instruction-title">Як встановити на {data.site}?</h3>
                  <ol className="tsuccess__steps">
                    <li>
                      Перейдіть до адмін-панелі вашого сайту:{' '}
                      <a
                        href={`https://${data.site}/edit/settings/general`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {data.site}/edit/settings/general
                      </a>
                    </li>
                    <li>
                      Перейдіть: <strong>Налаштування → Скрипти перед тегом &lt;/body&gt;</strong>
                    </li>
                    <li>Вставте скопійований код у це поле</li>
                    <li>
                      Натисніть <strong>«Зберегти»</strong>
                    </li>
                  </ol>
                </div>

                <div className="tsuccess__instruction">
                  <h3 className="tsuccess__instruction-title">Відеоінструкція</h3>
                  <video
                    className="tsuccess__video"
                    controls
                    preload="metadata"
                    playsInline
                    src="/horoshop-guide.mp4"
                  />
                </div>
              </>
            )}

            <div className="tsuccess__confirm-actions">
              <button
                className="tsuccess__confirm-switch"
                onClick={() => setChoice(null)}
                type="button"
              >
                Змінити варіант
              </button>
              <Link to="/admin" className="tsuccess__confirm-cta">
                До кабінету
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
