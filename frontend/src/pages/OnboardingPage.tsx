import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Puzzle, Code, ArrowRight, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { post } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './onboarding.css'

interface Step {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  stepLabel: string
  whyTitle: string
  whyDesc: string
  btnLabel: string
  btnIcon: React.ReactNode
  btnColor: string
  dotColors: [string, string, string]
}

const STEPS: Step[] = [
  {
    icon: <Globe size={36} strokeWidth={1.75} />,
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.08)',
    title: 'Додайте свій сайт',
    subtitle: 'Вкажіть URL Вашого магазину на Хорошоп — ми автоматично його знайдемо та підключимо',
    stepLabel: 'Крок 1 із 3',
    whyTitle: 'Навіщо це мені?',
    whyDesc: 'Після цього кроку ми автоматично створимо основу інтеграції для вашого магазину.',
    btnLabel: 'Далі',
    btnIcon: <ArrowRight size={16} />,
    btnColor: '#3B82F6',
    dotColors: ['#3B82F6', '#333333', '#333333'],
  },
  {
    icon: <Puzzle size={36} strokeWidth={1.75} />,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.08)',
    title: 'Оберіть віджети',
    subtitle: 'Увімкніть потрібні віджети для Вашого магазину — вони запрацюють миттєво',
    stepLabel: 'Крок 2 із 3',
    whyTitle: 'Навіщо це мені?',
    whyDesc: 'Ви обираєте тільки потрібні модулі, щоб не перевантажувати магазин і швидше запуститися.',
    btnLabel: 'Далі',
    btnIcon: <ArrowRight size={16} />,
    btnColor: '#10B981',
    dotColors: ['#333333', '#10B981', '#333333'],
  },
  {
    icon: <Code size={36} strokeWidth={1.75} />,
    iconColor: '#A855F7',
    iconBg: 'rgba(168,85,247,0.08)',
    title: 'Вставте скрипт',
    subtitle: 'Скопіюйте код і вставте в адмінку Хорошоп. Або напишіть нам — ми допоможемо!',
    stepLabel: 'Крок 3 із 3',
    whyTitle: 'Навіщо це мені?',
    whyDesc: 'Після вставки скрипта віджети запрацюють на сайті клієнтів без додаткового деплою.',
    btnLabel: 'Почати!',
    btnIcon: <Rocket size={16} />,
    btnColor: '#A855F7',
    dotColors: ['#333333', '#333333', '#A855F7'],
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    if (user?.onboarding_completed) {
      navigate('/cabinet', { replace: true })
    }
  }, [navigate, user?.onboarding_completed])

  const current = STEPS[step]!

  const completeOnboarding = async () => {
    if (loading) return
    setLoading(true)
    try {
      await post('/profile/onboarding/complete', {})
      await refreshUser()
      navigate('/cabinet', { replace: true })
    } catch {
      toast.error('Не вдалося завершити онбординг. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      void completeOnboarding()
    }
  }

  const handleSkip = () => {
    void completeOnboarding()
  }

  return (
    <div className="ob">
      <div className="ob__body">

        {/* Icon */}
        <div className="ob__ico-wrap" style={{ background: current.iconBg }}>
          <span style={{ color: current.iconColor }}>{current.icon}</span>
        </div>

        {/* Title */}
        <h1 className="ob__title">{current.title}</h1>

        {/* Subtitle */}
        <p className="ob__subtitle">{current.subtitle}</p>

        {/* Progress row */}
        <div className="ob__progress">
          <span className="ob__step-label" style={{ color: current.btnColor }}>
            {current.stepLabel}
          </span>
          <div className="ob__dots">
            {current.dotColors.map((color, i) => (
              <span
                key={i}
                className="ob__dot"
                style={{
                  background: color,
                  width: color === '#333333' ? 16 : 40,
                }}
              />
            ))}
          </div>
        </div>

        {/* Why card */}
        <div className="ob__why">
          <span className="ob__why-title">{current.whyTitle}</span>
          <span className="ob__why-desc">{current.whyDesc}</span>
        </div>

        {/* CTA button */}
        <button
          className="ob__btn"
          style={{ background: current.btnColor }}
          onClick={handleNext}
          disabled={loading}
        >
          <span>{current.btnLabel}</span>
          {current.btnIcon}
        </button>

        {/* Skip */}
        <button className="ob__skip" onClick={handleSkip} disabled={loading}>
          Пропустити
        </button>

      </div>
    </div>
  )
}
