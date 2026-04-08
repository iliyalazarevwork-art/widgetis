import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  Code2,
  Users,
  ArrowRight,
  Menu,
  X,
  MessageCircle,
  Mail,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { post, put } from '../api/client'
import './TrialSuccessPage.css'

interface SignupData {
  email: string
  site: string
  platform: string
  plan: 'basic' | 'pro' | 'max'
  billing: string
  phone?: string
  trialEndsAt?: string | null
  siteId?: number | null
  scriptTag?: string | null
}

type NextChoice = 'self' | 'concierge' | null

function siteDisplayHost(site: string): string {
  try {
    return new URL(site).host
  } catch {
    return site.replace(/^https?:\/\//i, '')
  }
}

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

  const scriptTag = data.scriptTag || '<script src="https://widgetis.com/w/loading.js"></script>'
  const siteHost = siteDisplayHost(data.site)

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

  async function handleSavePhone() {
    const normalizedPhone = phone.trim()
    if (!/^[+\d\s\-()]{7,20}$/.test(normalizedPhone)) {
      setPhoneError('Вкажіть коректний номер телефону')
      return
    }

    if (!data) return

    try {
      await put('/profile', { phone: normalizedPhone })
      await post('/profile/support-requests', {
        type: 'install_help',
        site_id: data.siteId ?? null,
        messenger: 'telegram',
        message: `Клієнт обрав допомогу з підключенням після trial signup. Телефон: ${normalizedPhone}`,
      })

      const nextData: SignupData = { ...data, phone: normalizedPhone }
      setData(nextData)
      setPhone(normalizedPhone)
      setPhoneError('')
      setPhoneSaved(true)
      sessionStorage.setItem('wty_trial_signup', JSON.stringify(nextData))
      toast.success('Дякуємо, менеджер отримає заявку')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти номер')
    }
  }

  return (
    <div className="tsuccess tsuccess--mobile">
      <Helmet>
        <title>Тріал активовано — Widgetis</title>
      </Helmet>

      {!choice && (
        <header className="tsuccessm__header">
          <div className="tsuccessm__brand">
            <span className="tsuccessm__mark">W</span>
            <span>WIDGETIS</span>
          </div>
          <button type="button" className="tsuccessm__menu" aria-label="menu">
            <Menu size={16} strokeWidth={2.25} />
          </button>
        </header>
      )}

      <div className="tsuccess__container">
        {!choice && (
          <div className="tsuccessm__hero">
            <div className="tsuccessm__icon-wrap">
              <Check size={36} strokeWidth={2.5} />
            </div>
            <h1 className="tsuccessm__title">Оплата пройшла успішно!</h1>
            <p className="tsuccessm__subtitle">
              Оберіть, як ви хочете встановити віджети на {siteHost}
            </p>
            <p className="tsuccessm__label">Ключовий блок: спосіб підключення</p>
          </div>
        )}

        {!choice ? (
          <div className="tsuccessm__options">
            <button className="tsuccessm__option" onClick={() => setChoice('self')} type="button">
              <div className="tsuccessm__option-left">
                <Code2 size={21} strokeWidth={1.95} className="tsuccessm__option-icon" />
                <div className="tsuccessm__option-copy">
                  <h3>Встановлю сам</h3>
                  <p>Покрокова інструкція — займе 2 хвилини</p>
                </div>
              </div>
              <ArrowRight size={17} strokeWidth={2.4} className="tsuccessm__option-arrow" />
            </button>

            <button className="tsuccessm__option" onClick={() => setChoice('concierge')} type="button">
              <div className="tsuccessm__option-left">
                <Users size={21} strokeWidth={1.95} className="tsuccessm__option-icon" />
                <div className="tsuccessm__option-copy">
                  <h3>З допомогою менеджера</h3>
                  <p>Ми все зробимо за вас</p>
                </div>
              </div>
              <ArrowRight size={17} strokeWidth={2.4} className="tsuccessm__option-arrow" />
            </button>
          </div>
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
                  Ми вже надіслали лист на <strong>{data.email}</strong>. Нижче скрипт та інструкція.
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
                        href={`https://${siteHost}/edit/settings/general`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {siteHost}/edit/settings/general
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
                <X size={14} strokeWidth={2} />
                Змінити варіант
              </button>
              <Link to="/cabinet" className="tsuccess__confirm-cta">
                До кабінету
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}

      </div>

      {!choice && (
        <footer className="tsuccessm__footer">
          <div className="tsuccessm__footer-brand">
            <div className="tsuccessm__footer-logo">
              <span>W</span>
              <span>WIDGETIS</span>
            </div>
            <p>Готові віджети для e-commerce. Збільшуйте конверсію без розробників.</p>
          </div>

          <div className="tsuccessm__footer-cols">
            <div>
              <h4>НАВІГАЦІЯ</h4>
              <a href="/widgets">Віджети</a>
              <a href="/cases">Кейси</a>
              <a href="/contacts">Контакти</a>
            </div>
            <div>
              <h4>ЗВ'ЯЗОК</h4>
              <a href="mailto:hello@widgetis.com">hello@widgetis.com</a>
              <a href="https://t.me/widgetis_support" target="_blank" rel="noreferrer">Telegram</a>
            </div>
          </div>

          <div className="tsuccessm__footer-copy">© 2026 Widgetis. Всі права захищені.</div>
        </footer>
      )}
    </div>
  )
}
