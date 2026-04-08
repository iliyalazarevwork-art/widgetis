import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info, Copy, CircleCheck, Loader2 } from 'lucide-react'
import { get, post } from '../../api/client'
import { toast } from 'sonner'
import type { SiteCreateResponse } from '../../types'
import './styles/add-site.css'

interface PlatformItem {
  value: string
  label: string
  supported: boolean
}

export default function AddSitePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('horoshop')
  const [platforms, setPlatforms] = useState<PlatformItem[]>([])
  const [creating, setCreating] = useState(false)
  const [siteData, setSiteData] = useState<SiteCreateResponse | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    get<{ data: PlatformItem[] }>('/platforms')
      .then((res) => {
        setPlatforms(res.data)
        const first = res.data.find((p) => p.supported)
        if (first) setPlatform(first.value)
      })
      .catch(() => {})
  }, [])

  const canContinue = url.length > 3

  const handleCreate = async () => {
    if (!canContinue || creating) return
    setCreating(true)
    try {
      const res = await post<{ data: SiteCreateResponse }>('/profile/sites', {
        url,
        platform,
        name: name || undefined,
      })
      setSiteData(res.data)
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося створити сайт')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!siteData) return
    await navigator.clipboard.writeText(siteData.script.script_tag)
    setCopied(true)
    toast.success('Скрипт скопійовано')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (!siteData || verifying) return
    setVerifying(true)
    try {
      const res = await post<{ verified: boolean; message: string }>(
        `/profile/sites/${siteData.id}/verify`
      )
      if (res.verified) {
        toast.success('Скрипт встановлено!')
        navigate('/cabinet/sites')
      } else {
        toast.error(res.message || 'Скрипт не знайдено')
      }
    } catch {
      toast.error('Помилка перевірки')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="add-site">
      <div className="add-site__header">
        <button className="add-site__back" onClick={() => step === 1 ? navigate(-1) : setStep(1)}>
          <ArrowLeft size={18} />
        </button>
        <span className="add-site__header-title">Додати сайт</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="add-site__steps">
        <div className={`add-site__step-bar ${step >= 1 ? 'add-site__step-bar--active' : ''}`} />
        <div className={`add-site__step-bar ${step >= 2 ? 'add-site__step-bar--active' : ''}`} />
      </div>

      {step === 1 ? (
        <div className="add-site__body">
          <div className="add-site__hero">
            <h1 className="add-site__title">Вкажіть ваш сайт</h1>
            <p className="add-site__subtitle">Ми підготуємо скрипт для встановлення</p>
            <span className="add-site__badge">Крок 1 з 2</span>
          </div>

          <div className="add-site__field">
            <label className="add-site__label">Назва сайту</label>
            <input
              className="add-site__input"
              placeholder="Мій магазин"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="add-site__field">
            <label className="add-site__label">URL сайту</label>
            <input
              className="add-site__input"
              placeholder="https://mystore.com.ua"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          <label className="add-site__label">Платформа сайту</label>
          <div className="add-site__platforms">
            {platforms.map((p) => (
              <button
                key={p.value}
                className={`add-site__platform ${platform === p.value ? 'add-site__platform--active' : ''} ${!p.supported ? 'add-site__platform--disabled' : ''}`}
                onClick={() => p.supported && setPlatform(p.value)}
                disabled={!p.supported}
              >
                {p.label}
                {!p.supported && <span className="add-site__platform-soon">Скоро</span>}
              </button>
            ))}
          </div>

          <div className="add-site__info">
            <Info size={16} />
            <span>Після підключення ви отримаєте унікальний скрипт для встановлення</span>
          </div>
        </div>
      ) : (
        <div className="add-site__body">
          <div className="add-site__hero">
            <h1 className="add-site__title">Встановіть скрипт</h1>
            <p className="add-site__subtitle">Вставте код перед закриваючим тегом {'</head>'}</p>
            <span className="add-site__badge">Крок 2 з 2</span>
          </div>

          {siteData && (
            <>
              <div className="add-site__code-card">
                <div className="add-site__code-header">
                  <span>Скрипт</span>
                  <button className="add-site__copy-btn" onClick={handleCopy}>
                    {copied ? <CircleCheck size={14} /> : <Copy size={14} />}
                    {copied ? 'Скопійовано' : 'Копіювати'}
                  </button>
                </div>
                <pre className="add-site__code">{siteData.script.script_tag}</pre>
              </div>

              <div className="add-site__instructions">
                <div className="add-site__instr-header">
                  <span>Інструкція для {platform}</span>
                </div>
                {siteData.install_instructions.map((instr) => (
                  <div key={instr.step} className="add-site__instr-row">
                    <span className="add-site__instr-num">{instr.step}</span>
                    <div className="add-site__instr-text">
                      <span className="add-site__instr-title">{instr.title}</span>
                      <span className="add-site__instr-desc">{instr.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="add-site__actions">
        <button className="add-site__btn-secondary" onClick={() => step === 1 ? navigate(-1) : setStep(1)}>
          Назад
        </button>
        {step === 1 ? (
          <button className="add-site__btn-primary" disabled={!canContinue || creating} onClick={handleCreate}>
            {creating ? 'Створюємо…' : 'Продовжити'}
            {!creating && <ArrowRight size={18} />}
          </button>
        ) : (
          <button className="add-site__btn-primary" onClick={handleVerify} disabled={verifying}>
            {verifying ? <Loader2 size={18} className="spin" /> : <CircleCheck size={18} />}
            {verifying ? 'Перевіряємо…' : 'Перевірити встановлення'}
          </button>
        )}
      </div>
    </div>
  )
}
